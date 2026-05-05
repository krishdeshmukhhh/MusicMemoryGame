"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Play, Trophy, Calendar, Infinity as InfinityIcon, BarChart2, X, ArrowLeft, BookOpen, Music } from 'lucide-react';
import ParticleField from '@/components/ParticleField';
import Piano from '@/components/Piano';
import ScoreReveal from '@/components/ScoreReveal';
import { engine } from '@/lib/audio';
import { generateRandomSequence, getDailySequenceForRound, getDailyDateString } from '@/lib/seed';

type GameState = 'home' | 'listen' | 'play' | 'reveal' | 'results';
type LeaderboardEntry = { initials: string, score: number, device_id: string, created_at: string };

export default function GameClient() {
  const [gameState, setGameState] = useState<GameState>('home');
  const [playMode, setPlayMode] = useState<'daily' | 'endless' | null>(null);

  // 5-Round State
  const [currentRound, setCurrentRound] = useState(1);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [finalTotal, setFinalTotal] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);

  // Active Round State
  const [correctSequence, setCorrectSequence] = useState<string[]>([]);
  const [playerSequence, setPlayerSequence] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState('');

  const [initials, setInitials] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isPosted, setIsPosted] = useState(false);
  const [showError, setShowError] = useState(false);
  const [percentile, setPercentile] = useState<number | null>(null);
  const [homeView, setHomeView] = useState<'menu' | 'stats' | 'articles' | 'scoring' | 'rank'>('menu');
  const [viewFading, setViewFading] = useState(false);
  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined);
  const cardInnerRef = useRef<HTMLDivElement>(null);

  const VIEW_URL: Record<string, string> = { menu: '/', articles: '/articles', scoring: '/scoring', stats: '/', rank: '/' };

  const switchView = useCallback((target: typeof homeView) => {
    if (target === homeView) return;
    const nextUrl = VIEW_URL[target] ?? '/';
    const currUrl = VIEW_URL[homeView] ?? '/';
    if (nextUrl !== currUrl) history.pushState(null, '', nextUrl);
    setViewFading(true);
    setTimeout(() => {
      setHomeView(target);
      setViewFading(false);
    }, 250);
  }, [homeView]); // eslint-disable-line react-hooks/exhaustive-deps


  const ARTICLES_DATA = [
    {
      slug: 'wordle-for-musicians',
      title: 'The Best Wordle-Like Games for Musicians',
      description: 'Love Wordle? These daily music puzzle games give you the same satisfying loop — but for your ears.',
      date: '2026-05-03',
    },
    {
      slug: 'how-to-get-perfect-pitch-as-an-adult',
      title: 'Can You Get Perfect Pitch as an Adult?',
      description: 'The honest answer about learning absolute pitch after childhood — and what you can realistically achieve.',
      date: '2026-05-04',
    },
    {
      slug: 'best-ear-training-games-online',
      title: 'The Best Free Ear Training Games Online (2026)',
      description: 'A ranked list of the best free ear training games on the web — from daily pitch puzzles to interval drills.',
      date: '2026-05-01',
    },
    {
      slug: 'interval-recognition-training',
      title: "Interval Recognition Training: The Complete Beginner's Guide",
      description: 'Learn to identify all 12 musical intervals by ear using the song association method.',
      date: '2026-05-02',
    },
    {
      slug: 'perfect-pitch-vs-relative-pitch',
      title: 'Perfect Pitch vs. Relative Pitch: What is the difference?',
      description: 'A deep dive into absolute pitch recognition versus interval training, and how to test yourself.',
      date: '2026-04-30',
    },
    {
      slug: 'how-to-train-your-ears',
      title: 'The Ultimate Guide to Ear Training',
      description: 'Can you actually learn perfect pitch as an adult? We look at the science and the best daily routines.',
      date: '2026-04-28',
    },
  ];

  const SCORING_DATA = [
    { name: 'Perfect Match', desc: 'You correctly identified the exact note and octave.', pts: '2.50', badge: 'bg-green-500/20 text-green-400' },
    { name: 'Perfect Octave', desc: 'Correct note, wrong octave. A huge music theory win.', pts: '2.00', badge: 'bg-blue-500/20 text-blue-400' },
    { name: 'Perfect 5th', desc: 'The dominant 5th — the most consonant interval.', pts: '1.50', badge: 'bg-purple-500/20 text-purple-400' },
    { name: 'Perfect 4th', desc: 'You hit the subdominant interval.', pts: '1.25', badge: 'bg-teal-500/20 text-teal-400' },
    { name: 'Adjacent Note', desc: '1 semitone off. Fat finger or slightly flat/sharp.', pts: '1.00', badge: 'bg-yellow-500/20 text-yellow-400' },
  ];
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [globalStats, setGlobalStats] = useState<{games: number, notes: number} | null>(null);
  const [localStats, setLocalStats] = useState<{gamesPlayed: number, maxStreak: number, scoreHistory: number[]} | null>(null);

  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);

  // Measure card content height on every view change for smooth transitions
  useEffect(() => {
    if (!cardInnerRef.current) return;
    const measure = () => {
      const el = cardInnerRef.current;
      if (el) setCardHeight(el.scrollHeight);
    };
    // Measure after the new view has rendered
    const raf = requestAnimationFrame(measure);
    // Also re-measure when images/fonts finish loading
    const timer = setTimeout(measure, 350);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [homeView, leaderboard, localStats, globalStats]);

  useEffect(() => {
    let storedId = localStorage.getItem('pitchd_device_id');
    if (!storedId) {
      storedId = 'anon-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('pitchd_device_id', storedId);
    }
    setDeviceId(storedId);

    const savedInitials = localStorage.getItem('pitchd_initials');
    if (savedInitials) setInitials(savedInitials);

    const savedStreak = localStorage.getItem('pitchd_streak');
    if (savedStreak) setStreak(parseInt(savedStreak, 10));

    const rawStats = localStorage.getItem('pitchd_stats');
    if (rawStats) {
      setLocalStats(JSON.parse(rawStats));
    } else {
      setLocalStats({ gamesPlayed: 0, maxStreak: 0, scoreHistory: [] });
    }

    fetch('/api/stats/global')
      .then(r => r.json())
      .then(data => setGlobalStats(data))
      .catch(() => {});
  }, []);

  // Sync card view when user presses browser back/forward
  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      const view: typeof homeView =
        path === '/articles' ? 'articles' :
        path === '/scoring'  ? 'scoring'  : 'menu';
      setViewFading(true);
      setTimeout(() => {
        setHomeView(view);
        setViewFading(false);
      }, 250);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const fetchLeaderboard = async () => {
    switchView('rank');
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch leaderboard');
      }
      const data = await res.json();
      if (data.top_scores) setLeaderboard(data.top_scores);
    } catch (e) {
      console.error("Leaderboard fetch error:", e);
    }
  };

  const handleStart = async (mode: 'daily' | 'endless') => {
    await engine.init();
    setPlayMode(mode);
    setCurrentRound(1);
    setRoundScores([]);
    setFinalTotal(null);
    setPercentile(null);
    setIsPosting(false);
    setIsPosted(false);

    startRound(1, mode);
  };

  const startRound = (roundNum: number, mode: 'daily' | 'endless') => {
    setPlayerSequence([]);
    const sequence = mode === 'daily'
      ? getDailySequenceForRound(getDailyDateString(), roundNum)
      : generateRandomSequence();

    setCorrectSequence(sequence);
    setGameState('listen');
    playTargetSequence(sequence);
  };

  const playTargetSequence = async (sequence: string[]) => {
    await new Promise(r => setTimeout(r, 600));
    engine.playSequence(
      sequence,
      (idx) => setActiveNoteIdx(idx),
      () => {
        setActiveNoteIdx(null);
        setTimeout(() => setGameState('play'), 1000);
      }
    );
  };

  const handleNoteSelected = (note: string) => {
    if (gameState !== 'play') return;

    setPlayerSequence(prev => {
      const next = [...prev, note];
      if (next.length === 4) {
        setTimeout(() => setGameState('reveal'), 800);
      }
      return next;
    });
  };

  const undoNote = () => {
    if (playerSequence.length > 0) {
      setPlayerSequence(prev => prev.slice(0, -1));
    }
  };

  const handleRevealComplete = useCallback(async (score: number) => {
    const newScores = [...roundScores, score];
    setRoundScores(newScores);

    if (currentRound < 5) {
      setCurrentRound(r => r + 1);
      startRound(currentRound + 1, playMode!);
    } else {
      const total = newScores.reduce((a, b) => a + b, 0);
      const exactTotal = Math.round(total * 100) / 100;
      setFinalTotal(exactTotal);

      let currentStreak = streak;
      if (playMode === 'daily') {
        const lastPlayed = localStorage.getItem('pitchd_last_played');
        const today = new Date().toISOString().split('T')[0];

        if (lastPlayed !== today) {
          const yesterdayDate = new Date();
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const yesterday = yesterdayDate.toISOString().split('T')[0];

          if (lastPlayed === yesterday) {
            currentStreak += 1;
          } else {
            currentStreak = 1;
          }
          setStreak(currentStreak);
          localStorage.setItem('pitchd_streak', currentStreak.toString());
          localStorage.setItem('pitchd_last_played', today);

          // Update Stats
          const rawStats = localStorage.getItem('pitchd_stats');
          const stats = rawStats ? JSON.parse(rawStats) : { gamesPlayed: 0, maxStreak: 0, scoreHistory: [] };
          stats.gamesPlayed += 1;
          stats.maxStreak = Math.max(stats.maxStreak, currentStreak);
          stats.scoreHistory.push(exactTotal);
          localStorage.setItem('pitchd_stats', JSON.stringify(stats));
        }
      }

      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          date_str: new Date().toISOString().split('T')[0],
          score: Math.round(exactTotal),
          player_sequence: playerSequence,
          initials: initials.toUpperCase() || 'NAN'
        })
      }).catch(e => console.error(e));

      setTimeout(() => setGameState('results'), 1000);
    }
  }, [currentRound, deviceId, playerSequence, roundScores, initials]);

  const postScore = async () => {
    if (isPosting || finalTotal === null) return;

    if (initials.trim().length === 0) {
      setShowError(true);
      setTimeout(() => setShowError(false), 500);
      return;
    }

    setIsPosting(true);

    if (initials) {
      localStorage.setItem('pitchd_initials', initials.toUpperCase());
    }

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          date_str: new Date().toISOString().split('T')[0],
          score: finalTotal,
          player_sequence: playerSequence,
          initials: initials.toUpperCase() || 'NAN'
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to post score');
      }

      const data = await res.json();
      if (data.percentile) {
        setPercentile(data.percentile);
      }

      setIsPosting(false);
      setIsPosted(true);
      generateShareText();
    } catch (e) {
      console.error("Score POST error:", e);
      alert(`Submission Failed: ${e instanceof Error ? e.message : 'Database error'}. Ensure schema.sql has been migrated properly in Supabase.`);
      setIsPosting(false);
    }
  };

  const generateShareText = () => {
    const prefix = playMode === 'daily' ? 'Daily pitchd' : 'pitchd — Endless Mode';
    let text = `${prefix} — ${finalTotal?.toFixed(2)} / 50\n`;
    if (percentile) {
      text += `Ranked in the Top ${percentile}% 🏆\n`;
    }
    if (playMode === 'daily' && streak > 1) {
      text += `🔥 ${streak} Day Streak\n`;
    }
    text += `\n`;

    let emojiRow = '';
    roundScores.forEach(score => {
      if (score >= 9.0) emojiRow += '🟩';
      else if (score >= 6.5) emojiRow += '🟨';
      else emojiRow += '🟥';
    });

    text += `${emojiRow}\n\n`;

    const params = new URLSearchParams();
    if (finalTotal !== null) params.set('score', finalTotal.toFixed(2));
    if (percentile) params.set('percentile', percentile.toString());
    if (playMode === 'daily' && streak > 1) params.set('streak', streak.toString());

    text += `https://pitchd.net/share?${params.toString()}`;

    navigator.clipboard.writeText(text);
    alert('Score Posted & Copied to clipboard!');
  };

  const COLORS = [
    { base: '#8b5cf6', dark: '#6d28d9' }, // Purple
    { base: '#3b82f6', dark: '#1d4ed8' }, // Blue
    { base: '#b45309', dark: '#78350f' }, // Brown
    { base: '#22c55e', dark: '#15803d' }, // Green
    { base: '#06b6d4', dark: '#0e7490' }, // Teal
  ];

  const getFinalQuip = (score: number) => {
    if (score >= 48) return "Virtuoso! Absolute perfection.";
    if (score >= 40) return "Phenomenal ear. You belong in a symphony.";
    if (score >= 30) return "Great job! A very solid performance.";
    if (score >= 20) return "Good, not great. Fine dining at Applebee's.";
    return "Did you even turn your speakers on?";
  };

  return (
    <main className="fixed inset-0 flex h-[100dvh] w-full overflow-hidden select-none flex-col items-center justify-center p-4 sm:p-8 z-10 bg-[#050505]">
      <ParticleField state={gameState} />

      {/* Round Indicator Header */}
      {gameState !== 'home' && gameState !== 'results' && (
        <div className="absolute top-8 left-8 text-white font-display tracking-widest uppercase opacity-60">
          Round {currentRound} <span className="text-text-muted">/ 5</span>
        </div>
      )}

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center justify-center min-h-[60vh]">

        {/* State: HOME */}
        {gameState === 'home' && (
          <div className="flex flex-col items-center justify-center w-full px-4 animate-in fade-in zoom-in-95 duration-1000">
            {/* The Main Card */}
            <div
              className={`w-full bg-[#050505] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-[max-width,height] duration-500 ease-in-out ${homeView === 'menu' || homeView === 'stats' || homeView === 'rank' ? 'max-w-[420px]' : 'max-w-[520px]'}`}
              style={cardHeight !== undefined ? { height: cardHeight + 64 } : undefined}
            >
              {/* Internal Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />

              <div ref={cardInnerRef}>
              {/* ── MENU VIEW ── */}
              {homeView === 'menu' && (
                <div key="menu" className="card-view-enter relative z-10 w-full h-full">
                  <h1 className="text-6xl sm:text-[5rem] font-display text-white mb-6 tracking-tighter leading-none">
                    pitchd.
                  </h1>

                  <p className="text-[#a0a0a0] text-sm leading-relaxed mb-4 font-sans pr-6">
                    Most humans don't possess perfect pitch. This is a 5-round acoustic memory game to see exactly how your ears measure up.
                  </p>
                  <p className="text-[#a0a0a0] text-sm leading-relaxed mb-10 font-sans pr-6">
                    We'll play a randomized sequence of notes. Listen closely, then recreate the melody flawlessly.
                  </p>

                  <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4 block">
                    Game Modes
                  </span>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    {/* Daily Button */}
                    <div className="flex flex-col items-center gap-2">
                      <button
                        aria-label="Play Daily Mode"
                        onClick={() => handleStart('daily')}
                        className="size-14 sm:size-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] animate-pulse"
                      >
                        <Calendar className="size-5 sm:size-6 mb-0.5" />
                      </button>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#666]">Daily</span>
                    </div>

                    {/* Endless Button */}
                    <div className="flex flex-col items-center gap-2">
                      <button
                        aria-label="Play Endless Mode"
                        onClick={() => handleStart('endless')}
                        className="size-14 sm:size-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                      >
                        <InfinityIcon className="size-6 sm:size-8 stroke-[1.5]" />
                      </button>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#666]">Endless</span>
                    </div>

                    <div className="h-8 sm:h-10 w-px bg-white/10 mx-1 sm:mx-2 hidden sm:block" />

                    {/* Leaderboard Button */}
                    <div className="flex flex-col items-center gap-2">
                      <button
                        aria-label="View Leaderboard"
                        onClick={fetchLeaderboard}
                        className="size-14 sm:size-16 rounded-full border border-white/20 bg-transparent text-white flex items-center justify-center hover:bg-white/10 transition-colors"
                      >
                        <Trophy className="size-4 sm:size-5" />
                      </button>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#666]">Rank</span>
                    </div>

                    {/* Stats Button */}
                    <div className="flex flex-col items-center gap-2">
                      <button
                        aria-label="View Stats"
                        onClick={() => switchView('stats')}
                        className="size-14 sm:size-16 rounded-full border border-white/20 bg-transparent text-white flex items-center justify-center hover:bg-white/10 transition-colors"
                      >
                        <BarChart2 className="size-4 sm:size-5" />
                      </button>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#666]">Stats</span>
                    </div>
                  </div>

                  {globalStats && (
                    <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-start w-full stats-enter">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-white font-sans text-xs tracking-wide">{globalStats.games.toLocaleString()}</span>
                        <span className="text-[#666] font-sans text-xs">games played worldwide</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-2 w-2 bg-transparent"></span>
                        <span className="text-white font-sans text-xs tracking-wide">{globalStats.notes.toLocaleString()}</span>
                        <span className="text-[#666] font-sans text-xs">notes perfectly pitched</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STATS VIEW ── */}
              {homeView === 'stats' && (
                <div key="stats" className="card-view-enter relative z-10 w-full h-full flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-display text-white tracking-tighter uppercase">Your Stats</h2>
                    <button onClick={() => switchView('menu')} className="text-text-muted hover:text-white transition-colors" aria-label="Back to Menu">
                      <X className="size-5" />
                    </button>
                  </div>
                  
                  {localStats && (
                    <>
                      <div className="grid grid-cols-3 gap-2 mb-10">
                        <div className="flex flex-col items-center">
                          <span className="text-4xl font-display text-white leading-none mb-1">{localStats.gamesPlayed}</span>
                          <span className="text-[10px] text-text-muted uppercase tracking-widest text-center">Played</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-4xl font-display text-white leading-none mb-1">{streak}</span>
                          <span className="text-[10px] text-text-muted uppercase tracking-widest text-center">Current<br/>Streak</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-4xl font-display text-white leading-none mb-1">{localStats.maxStreak}</span>
                          <span className="text-[10px] text-text-muted uppercase tracking-widest text-center">Max<br/>Streak</span>
                        </div>
                      </div>

                      <h3 className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-4 text-center">Score History (Last 10)</h3>
                      {localStats.scoreHistory.length > 0 ? (
                        <div className="flex items-end justify-center gap-2 h-32 border-b border-white/10 pb-2 relative w-full mt-auto">
                          {localStats.scoreHistory.slice(-10).map((score, i) => {
                            const heightPct = Math.max(10, (score / 50) * 100);
                            return (
                              <div key={i} className="flex flex-col items-center justify-end w-8 group">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white/50 mb-1 absolute -top-4">{Math.round(score)}</div>
                                <div 
                                  className="w-full bg-white/20 group-hover:bg-purple-500/80 transition-colors rounded-t-sm"
                                  style={{ height: `${heightPct}%` }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 text-text-muted text-xs uppercase tracking-widest border-b border-white/10 pb-2 mt-auto">
                          No games played yet
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── RANK VIEW ── */}
              {homeView === 'rank' && (
                <div key="rank" className="card-view-enter relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-display text-white tracking-tighter uppercase">Global Rank</h2>
                    <button onClick={() => switchView('menu')} className="text-text-muted hover:text-white transition-colors"><X className="size-5" /></button>
                  </div>
                  <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto hide-scrollbar">
                    {leaderboard.length === 0 ? (
                      <p className="text-text-muted text-center py-8 text-sm">Loading...</p>
                    ) : (
                      leaderboard.map((entry, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-4">
                            <span className="text-white/50 font-display w-6 text-xl">{idx + 1}</span>
                            <span className="text-white font-bold tracking-widest">{entry.initials || 'ANON'}</span>
                          </div>
                          <span className="text-white font-display text-2xl">{Number(entry.score).toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ── ARTICLES VIEW ── */}
              {homeView === 'articles' && (
                <div key="articles" className="card-view-enter relative z-10 w-full">
                  <button onClick={() => switchView('menu')} className="flex items-center gap-2 text-text-muted hover:text-white transition-colors text-xs uppercase tracking-widest mb-8">
                    <ArrowLeft className="size-3.5" /> Back
                  </button>
                  <h2 className="text-3xl sm:text-4xl font-display text-white mb-2 tracking-tighter leading-tight">
                    Ear Training Guides
                  </h2>
                  <p className="text-text-muted text-sm mb-8">Articles on music theory, pitch recognition, and auditory memory.</p>
                  <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto hide-scrollbar">
                    {ARTICLES_DATA.map((article) => (
                      <Link
                        key={article.slug}
                        href={`/articles/${article.slug}`}
                        className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                      >
                        <span className="text-text-muted text-[10px] font-sans tracking-[0.2em] uppercase">{article.date}</span>
                        <h3 className="text-lg font-display text-white group-hover:text-purple-400 transition-colors leading-tight mt-1.5 mb-2">
                          {article.title}
                        </h3>
                        <p className="text-[#a0a0a0] text-sm leading-relaxed">{article.description}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* ── SCORING VIEW ── */}
              {homeView === 'scoring' && (
                <div key="scoring" className="card-view-enter relative z-10 w-full">
                  <button onClick={() => switchView('menu')} className="flex items-center gap-2 text-text-muted hover:text-white transition-colors text-xs uppercase tracking-widest mb-8">
                    <ArrowLeft className="size-3.5" /> Back
                  </button>
                  <h2 className="text-3xl sm:text-4xl font-display text-white mb-2 tracking-tighter leading-tight">
                    How Scoring Works
                  </h2>
                  <p className="text-[#a0a0a0] text-sm leading-relaxed mb-8">
                    pitchd. uses a harmonic scoring engine based on music theory. You're rewarded for identifying correct harmonic relationships.
                  </p>
                  <div className="flex flex-col gap-3">
                    {SCORING_DATA.map((item) => (
                      <div key={item.name} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-white font-display text-base mb-0.5">{item.name}</h3>
                          <p className="text-[11px] text-text-muted leading-relaxed">{item.desc}</p>
                        </div>
                        <div className={`px-3 py-1.5 ${item.badge} font-bold font-mono text-sm rounded-lg shrink-0`}>
                          {item.pts}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-[#666] text-xs text-center">A perfect 5-round game yields exactly <span className="text-white font-bold">50 points</span>.</p>
                  </div>
                </div>
              )}
              </div>

            </div>
          </div>
        )}

        {/* State: LISTEN */}
        {gameState === 'listen' && (
          <div className="flex flex-col items-center gap-12 animate-in fade-in zoom-in duration-700">

            <div className="relative flex flex-col items-center justify-center p-16 rounded-[3rem] border border-white/[0.08] bg-black/40 backdrop-blur-md shadow-2xl">
              <p className="text-sm font-semibold tracking-[0.2em] text-white uppercase mb-16 animate-pulse">
                Listen carefully
              </p>

              <div className="flex gap-6 items-center justify-center h-40">
                {[0, 1, 2, 3].map((idx) => {
                  const isActive = activeNoteIdx === idx;
                  return (
                    <div key={idx} className="relative flex items-center justify-center h-full w-12">
                      {/* Base slot */}
                      <div className={`absolute bottom-0 w-2 rounded-full transition-all duration-[400ms] ${isActive ? 'h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'h-2 bg-white/10'}`} />

                      {/* Active Burst Center */}
                      <div className={`absolute bottom-1/2 w-8 h-8 rounded-full bg-white blur-xl transition-opacity duration-300 ${isActive ? 'opacity-50' : 'opacity-0'}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* State: PLAY */}
        {gameState === 'play' && (
          <div className="flex flex-col items-center w-full animate-in slide-in-from-bottom-12 duration-700">
            <div className="flex items-center justify-between w-full max-w-md mb-12 px-4">
              <div className="flex gap-3">
                {[0, 1, 2, 3].map(idx => (
                  <div
                    key={idx}
                    className={`size-4 rounded-full border border-border transition-colors duration-300 ${playerSequence[idx] ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.6)] border-white' : 'bg-surface-2'}`}
                  />
                ))}
              </div>
              <button
                onClick={undoNote}
                disabled={playerSequence.length === 0}
                className="text-text-muted hover:text-white disabled:opacity-30 disabled:hover:text-text-muted text-sm tracking-widest uppercase"
              >
                Undo
              </button>
            </div>
            <div className="w-full">
              <Piano onNoteSelected={handleNoteSelected} />
            </div>
          </div>
        )}

        {/* State: REVEAL */}
        {gameState === 'reveal' && (
          <div className="w-full flex flex-col items-center gap-4">
            <ScoreReveal
              correctSequence={correctSequence}
              playerSequence={playerSequence}
              onComplete={handleRevealComplete}
            />
          </div>
        )}

        {/* State: RESULTS */}
        {gameState === 'results' && (
          <div className="relative flex flex-col w-full max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-1000">

            <div className="flex flex-col items-center text-center">
              <h2 className="text-text-muted text-sm tracking-[0.3em] uppercase mb-4 font-sans">
                {percentile ? `Top ${percentile}% Today` : 'Performance'}
              </h2>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-[7rem] leading-none font-display text-white tracking-tighter">
                  {finalTotal?.toFixed(2)}
                </span>
                <span className="text-3xl text-text-faint font-display">/ 50</span>
              </div>
              <p className="text-text-muted tracking-widest uppercase text-xs mt-6">{finalTotal !== null ? getFinalQuip(finalTotal) : ''}</p>
            </div>

            {/* Score Grid Minimal */}
            <div className="grid grid-cols-5 gap-px bg-border mt-16 p-px overflow-hidden rounded-sm">
              {roundScores.map((score, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center bg-bg py-8 hover:bg-surface transition-colors cursor-default">
                  <span className="text-text-faint text-[10px] uppercase tracking-widest mb-2 font-sans">R{idx + 1}</span>
                  <span className="text-white font-display text-xl">{score.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Submit Block */}
            <div className={`flex flex-col sm:flex-row gap-2 w-full mt-12 bg-surface-2 border ${showError ? 'border-[var(--color-error)] animate-shake' : 'border-border'} p-2 rounded-full transition-all`}>
              <input
                autoFocus
                type="text"
                placeholder="INT"
                maxLength={3}
                value={initials}
                onChange={(e) => { setInitials(e.target.value); setShowError(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') postScore(); }}
                className="w-full sm:w-24 bg-transparent px-6 py-4 text-center text-white font-sans text-lg focus:outline-none placeholder-text-faint uppercase tracking-[0.2em]"
              />
              <button
                onClick={postScore}
                disabled={isPosting || isPosted}
                className="flex-1 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all py-4 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                {isPosting ? 'Posting...' : isPosted ? 'Score Posted' : 'Submit Score'}
              </button>
            </div>

            <div className="mt-12 flex flex-col gap-3">
              <button
                onClick={() => handleStart('daily')}
                className="text-text-muted hover:text-white text-xs tracking-[0.2em] uppercase transition-colors text-center w-full"
              >
                Play Daily Run
              </button>
              <button
                onClick={() => handleStart('endless')}
                className="text-text-muted hover:text-white text-xs tracking-[0.2em] uppercase transition-colors text-center w-full"
              >
                Play Endless Practice
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Footer Pill (Home Page Only) */}
      {gameState === 'home' && (
        <div className="fixed bottom-6 sm:bottom-8 z-50 flex items-center gap-4 sm:gap-6 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md animate-in slide-in-from-bottom-8 duration-1000 shadow-2xl">
          <button onClick={() => switchView('articles')} className="text-text-muted hover:text-white transition-colors text-[10px] sm:text-xs tracking-widest uppercase">
            Articles
          </button>
          <div className="w-px h-3 bg-white/10" />
          <button onClick={() => switchView('scoring')} className="text-text-muted hover:text-white transition-colors text-[10px] sm:text-xs tracking-widest uppercase">
            Scoring
          </button>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-3">
            <span className="text-text-muted text-[10px] sm:text-xs tracking-widest uppercase hidden sm:inline mr-2">By Krish</span>
            <a href="https://github.com/krishdeshmukhhh" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white transition-colors" aria-label="GitHub">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.8 0-1.4-.5-2.8-1.5-3.8.1-.4.6-2-1-4-1 0-3 1.5-3 1.5-1-.3-2-.3-3-.3s-2 .3-3 .3C6 3.5 3 2 3 2c-1.5 2-1 3.6-.9 4-1 1-1.5 2.4-1.5 3.8 0 5.3 3 6.5 6 6.8-.6.5-1 1.4-1 2.8V22"></path>
                <path d="M9 18c-4.51 2-5-2-7-2"></path>
              </svg>
            </a>
            <a href="https://linkedin.com/in/krish-deshmukh" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white transition-colors" aria-label="LinkedIn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </a>
            <a href="https://instagram.com/krishdevlog" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-white transition-colors" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
