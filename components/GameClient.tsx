"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Play, Trophy, BarChart2, X, ArrowLeft, BookOpen, Music } from 'lucide-react';
import BpmGame from '@/components/BpmGame';
import ParticleField from '@/components/ParticleField';
import Piano from '@/components/Piano';
import ScoreReveal from '@/components/ScoreReveal';
import ToastContainer, { showToast } from '@/components/Toast';
import { engine } from '@/lib/audio';
import { generateRandomSequence, getDailySequenceForRound, getDailyDateString } from '@/lib/seed';
import { useBpmGame } from '@/hooks/useBpmGame';
import { PITCH_ARTICLES } from '@/lib/pitch-articles';
import { BPM_ARTICLES } from '@/lib/bpm-articles';

type GameState = 'home' | 'listen' | 'play' | 'reveal' | 'results';
type LeaderboardEntry = { initials: string, score: number, device_id: string, created_at: string };
type HomeView = 'menu' | 'stats' | 'articles' | 'scoring' | 'rank' | 'bpm-home' | 'bpm-articles' | 'bpm-scoring' | 'bpm-stats' | 'article' | 'bpm-article';

const VIEW_META: Partial<Record<HomeView, { title: string; description: string }>> = {
  menu:         { title: 'pitchd. | Free Daily Perfect Pitch & Ear Training Game', description: 'Two free daily ear training games: recreate 4-note sequences on a piano to test your pitch memory, or match mystery tempos in the BPM Guesser. Rank globally — no sign-up needed.' },
  articles:     { title: 'Ear Training Articles | pitchd.', description: 'Guides on perfect pitch, interval recognition, relative pitch, and daily ear training routines — for musicians of all levels.' },
  scoring:      { title: 'How Scoring Works | pitchd.', description: 'How the pitchd. harmonic scoring engine awards points — from exact pitch matches to interval near-misses. Max 50 points across 5 rounds.' },
  rank:         { title: 'Global Leaderboard | pitchd.', description: 'See the top pitch recognition scores from players worldwide. Where do you rank today?' },
  'bpm-home':   { title: 'BPM Guesser | Free Daily Tempo Training | pitchd.', description: 'Listen to a mystery tempo and guess the BPM. Free daily rhythm ear training game. No sign-up needed.' },
  'bpm-articles':{ title: 'BPM & Rhythm Guides | pitchd.', description: 'Articles on tempo training, beat recognition, BPM ranges by genre, and rhythmic ear development.' },
  'bpm-scoring':{ title: 'BPM Scoring Guide | pitchd.', description: 'How the BPM Guesser scoring tiers work — from Perfect (≤3% off) to Miss (>25% off). Max 20 points across 5 rounds.' },
  'bpm-stats':  { title: 'Your BPM Stats | pitchd.', description: 'Track your BPM Guesser performance, best score, and daily streak.' },
  stats:        { title: 'Your Pitch Stats | pitchd.', description: 'Track your pitch game performance, score history, and daily streak.' },
};

function pathnameToView(p: string): HomeView {
  if (p === '/bpm')          return 'bpm-home';
  if (p === '/bpm/articles') return 'bpm-articles';
  if (p === '/bpm/scoring')  return 'bpm-scoring';
  if (p === '/articles')     return 'articles';
  if (p === '/scoring')      return 'scoring';
  return 'menu';
}

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
  const [activeArticleSlug, setActiveArticleSlug] = useState<string | null>(null);
  const [selectedPitchMode, setSelectedPitchMode] = useState<'daily' | 'endless'>('daily');
  const [showKeymap, setShowKeymap] = useState(false);

  // usePathname is SSR-aware — use it to seed the correct initial view so
  // server and client render the same content and hydration succeeds.
  const pathname = usePathname();
  const [homeView, setHomeView] = useState<HomeView>(() => pathnameToView(pathname));
  const [viewFading, setViewFading] = useState(false);
  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined);
  const cardInnerRef = useRef<HTMLDivElement>(null);

  const {
    phase: bpmPhase, round: bpmRound, countdown: bpmCountdown,
    sliderBpm, setSliderBpm, results: bpmResults, pulseKey: bpmPulseKey,
    sliderMin, sliderMax, bpmGamesPlayed, bpmBest, bpmScoreHistory, bpmStreak, bpmDailyPlayed,
    hasReplayed, isReplaying, isNewBpmBest, replayTempo,
    isPlaying: bpmIsPlaying, setIsPlaying: setBpmIsPlaying,
    startGame: startBpmGame, submitGuess: submitBpmGuess, nextRound: nextBpmRound, resetGame: resetBpmGame,
  } = useBpmGame();

  const VIEW_URL: Record<string, string> = { menu: '/', articles: '/articles', scoring: '/scoring', stats: '/', rank: '/', 'bpm-home': '/bpm', 'bpm-articles': '/bpm/articles', 'bpm-scoring': '/bpm/scoring', 'bpm-stats': '/bpm' };

  const switchView = useCallback((target: typeof homeView) => {
    if (target === homeView) return;
    const nextUrl = VIEW_URL[target];
    const currUrl = VIEW_URL[homeView] ?? '/';
    if (nextUrl && nextUrl !== currUrl) history.pushState(null, '', nextUrl);
    setViewFading(true);
    setTimeout(() => {
      setHomeView(target);
      setViewFading(false);
    }, 250);
  }, [homeView]); // eslint-disable-line react-hooks/exhaustive-deps

  const openArticle = useCallback((slug: string, type: 'pitch' | 'bpm') => {
    setActiveArticleSlug(slug);
    setViewFading(true);
    setTimeout(() => {
      setHomeView(type === 'bpm' ? 'bpm-article' : 'article');
      setViewFading(false);
    }, 250);
  }, []);


  const ARTICLES_DATA = [
    { slug: 'relative-pitch-exercises',           title: 'Relative Pitch Exercises: The 6 Best Drills for Developing Your Ear', description: 'Relative pitch is the most practical ear training skill you can build. These six exercises will develop it faster than passive listening or theory study alone.', date: '2026-05-19' },
    { slug: 'how-to-harmonize-by-ear',            title: 'How to Harmonize by Ear: A Step-by-Step Guide', description: 'Harmonizing by ear is a learnable skill — not a gift. Here\'s exactly how to develop the ability to add harmony to any melody in real time.', date: '2026-05-17' },
    { slug: 'solfege-ear-training',               title: 'Solfège Ear Training: How Do-Re-Mi Actually Works', description: 'Solfège is more than a singing warm-up — it\'s one of the most powerful tools for developing relative pitch and harmonic understanding.', date: '2026-05-18' },
    { slug: 'how-to-read-sheet-music-by-ear',     title: 'How to Read Sheet Music by Ear: Audiation and Inner Hearing', description: 'Truly reading music means hearing it in your head before you play it. Here\'s how to develop audiation.', date: '2026-05-16' },
    { slug: 'ear-training-exercises-for-beginners', title: 'Ear Training Exercises for Beginners: Where to Start', description: 'If you\'re new to ear training, these exercises build the foundation for everything else — intervals, chords, and melody recognition.', date: '2026-05-14' },
    { slug: 'how-to-improve-musical-memory',      title: 'How to Improve Your Musical Memory', description: 'Musical memory is a trainable skill that underpins sight-reading, improvisation, and ear training. Here\'s how to systematically strengthen it.', date: '2026-05-12' },
    { slug: 'ear-training-for-guitar-players',    title: 'Ear Training for Guitar Players: The Essential Guide', description: 'Guitar-specific ear training unlocks improvisation, transcription, and the ability to play anything you can hear.', date: '2026-05-10' },
    { slug: 'how-to-identify-chords-by-ear',      title: 'How to Identify Chords by Ear', description: 'Chord recognition is one of the most practical ear training skills you can develop. Here\'s how to start hearing harmony clearly.', date: '2026-05-08' },
    { slug: 'why-cant-i-sing-in-tune',            title: "Why Can't I Sing in Tune? The Real Reasons and How to Fix Them", description: "Most people who can't sing in tune are not tone-deaf. Here's what's actually going wrong — and how pitch training can help.", date: '2026-05-06' },
    { slug: 'how-to-get-perfect-pitch-as-an-adult', title: 'Can You Get Perfect Pitch as an Adult?', description: 'The honest answer about learning absolute pitch after childhood — and what you can realistically achieve.', date: '2026-05-04' },
    { slug: 'wordle-for-musicians',               title: 'The Best Wordle-Like Games for Musicians', description: 'Love Wordle? These daily music puzzle games give you the same satisfying loop — but for your ears.', date: '2026-05-03' },
    { slug: 'interval-recognition-training',      title: "Interval Recognition Training: The Complete Beginner's Guide", description: 'Learn to identify all 12 musical intervals by ear using the song association method.', date: '2026-05-02' },
    { slug: 'best-ear-training-games-online',     title: 'The Best Free Ear Training Games Online (2026)', description: 'A ranked list of the best free ear training games on the web — from daily pitch puzzles to interval drills.', date: '2026-05-01' },
    { slug: 'perfect-pitch-vs-relative-pitch',    title: 'Perfect Pitch vs. Relative Pitch: What is the difference?', description: 'A deep dive into absolute pitch recognition versus interval training, and how to test yourself.', date: '2026-04-30' },
    { slug: 'how-to-train-your-ears',             title: 'The Ultimate Guide to Ear Training', description: 'Can you actually learn perfect pitch as an adult? We look at the science and the best daily routines.', date: '2026-04-28' },
  ];

  const BPM_SCORING_DATA_UPDATED = [
    { range: '≤ 3% off',  label: 'Perfect', pts: '4.00', badge: 'bg-green-500/20 text-green-400',   desc: 'Score: 4.00 → 3.00. Dead on — your internal clock is elite.' },
    { range: '≤ 8% off',  label: 'Great',   pts: '3.00', badge: 'bg-yellow-500/20 text-yellow-400', desc: 'Score: 3.00 → 2.00. Very close — a trained ear.' },
    { range: '≤ 15% off', label: 'Good',    pts: '2.00', badge: 'bg-orange-500/20 text-orange-400', desc: 'Score: 2.00 → 1.00. In the ballpark — keep practicing.' },
    { range: '≤ 25% off', label: 'Close',   pts: '1.00', badge: 'bg-stone-500/20 text-stone-400',   desc: 'Score: 1.00 → 0.00. Audible difference, but you felt the groove.' },
    { range: '> 25% off', label: 'Miss',    pts: '0.00', badge: 'bg-red-500/20 text-red-400',       desc: 'Score: 0.00. Too far off — listen for the pulse.' },
  ];

  const BPM_ARTICLES_DATA = [
    { slug: 'ear-training-for-producers',              title: 'Ear Training for Producers: What to Practice and Why', description: "Music producers need a different kind of ear training than classical musicians. Here's what to focus on and how to build it fast.", date: '2026-05-18' },
    { slug: 'how-to-transcribe-music-by-ear',          title: 'How to Transcribe Music by Ear: A Complete Beginner\'s Guide', description: 'Transcribing music by ear is the most powerful ear training exercise you can do. Here\'s how to start.', date: '2026-05-16' },
    { slug: 'what-is-a-good-bpm-for-music-production', title: 'What Is a Good BPM for Music Production?', description: "Choosing the right tempo is one of the most important production decisions you'll make. Here's how to think about BPM.", date: '2026-05-14' },
    { slug: 'how-djs-count-bpm',                       title: 'How DJs Count BPM: Beatmatching and Tempo Recognition Explained', description: 'Professional DJs develop exceptional BPM awareness through daily practice. Here\'s how they do it.', date: '2026-05-12' },
    { slug: 'best-bpm-for-studying',                   title: 'The Best BPM for Studying: Does Music Tempo Affect Focus?', description: 'Research on music and cognitive performance reveals the ideal tempo ranges for concentration and deep work.', date: '2026-05-10' },
    { slug: 'how-to-improve-rhythm',                   title: 'How to Improve Your Sense of Rhythm: 6 Evidence-Based Methods', description: 'Rhythm is trainable at any age. Here are six scientifically-backed methods for a stronger rhythmic sense.', date: '2026-05-08' },
    { slug: 'tempo-vs-bpm-difference',                 title: 'Tempo vs. BPM: What\'s the Difference?', description: 'Tempo and BPM are often used interchangeably, but they are not exactly the same thing. Here\'s what sets them apart.', date: '2026-05-19' },
    { slug: 'what-bpm-is-good-for-running',            title: 'What BPM Is Good for Running? The Science of Running Cadence', description: 'Research shows that music tempo directly affects running pace and endurance. Here\'s how to find the ideal BPM.', date: '2026-05-17' },
    { slug: 'how-to-count-bpm-by-ear',                 title: 'How to Count BPM by Ear: A Step-by-Step Method', description: 'A practical guide to estimating a song\'s tempo without tools — using tapping, counting, and your internal clock.', date: '2026-05-15' },
    { slug: 'how-to-find-bpm-of-a-song',               title: 'How to Find the BPM of Any Song', description: 'Three reliable methods for finding a song\'s BPM — from tap tempo tools to software analysis and ear estimation.', date: '2026-05-13' },
    { slug: 'common-bpm-ranges-by-genre',              title: 'Common BPM Ranges by Genre: From Ambient to Drum and Bass', description: 'Every genre has a typical tempo range that defines its energy. Here\'s a complete breakdown of BPM ranges.', date: '2026-05-11' },
    { slug: 'what-is-bpm-in-music',                    title: 'What Is BPM in Music? A Complete Guide to Tempo', description: 'BPM stands for beats per minute — the fundamental unit of musical tempo. Here\'s everything you need to know.', date: '2026-05-09' },
    { slug: 'metronome-practice-internal-clock',       title: 'Metronome Practice: Building a Reliable Internal Clock', description: "Most musicians use the metronome wrong. Here's how to use it to develop an internal sense of tempo that lasts.", date: '2026-05-07' },
    { slug: 'science-of-groove',                       title: 'The Science of Groove: Why Tempo Perception Varies', description: 'Explore why some people naturally feel BPM better and what neuroscience tells us about rhythmic entrainment.', date: '2026-05-06' },
    { slug: 'how-to-train-your-tempo-ear',             title: 'How to Train Your Tempo Ear', description: 'Internalize BPM and beat recognition with techniques used by professional drummers and producers.', date: '2026-05-05' },
  ];

  const BPM_SCORING_DATA = BPM_SCORING_DATA_UPDATED;

  const SCORING_DATA = [
    { name: 'Perfect Match', desc: 'You correctly identified the exact note and octave.', pts: '2.50', badge: 'bg-green-500/20 text-green-400' },
    { name: 'Perfect Octave', desc: 'Correct note, wrong octave. A huge music theory win.', pts: '2.00', badge: 'bg-blue-500/20 text-blue-400' },
    { name: 'Perfect 5th', desc: 'The dominant 5th — the most consonant interval.', pts: '1.50', badge: 'bg-purple-500/20 text-purple-400' },
    { name: 'Perfect 4th', desc: 'You hit the subdominant interval.', pts: '1.25', badge: 'bg-teal-500/20 text-teal-400' },
    { name: 'Adjacent Note', desc: '1 semitone off. Fat finger or slightly flat/sharp.', pts: '1.00', badge: 'bg-yellow-500/20 text-yellow-400' },
  ];
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [globalStats, setGlobalStats] = useState<{games: number, notes: number} | null>(null);
  const [bpmGlobalStats, setBpmGlobalStats] = useState<{games: number} | null>(null);
  const [localStats, setLocalStats] = useState<{gamesPlayed: number, maxStreak: number, scoreHistory: number[]} | null>(null);

  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);

  // Measure card content height — ResizeObserver catches any content change
  // (view switches, BPM phase changes, tap mode toggle, Reset button appearing, etc.)
  useEffect(() => {
    const el = cardInnerRef.current;
    if (!el) return;
    const measure = () => setCardHeight(el.scrollHeight);
    const raf = requestAnimationFrame(measure);
    const timer = setTimeout(measure, 350); // fonts/images
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

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

    fetch('/api/stats')
      .then(r => r.json())
      .then(data => {
        setGlobalStats({ games: data.games, notes: data.notes });
        setBpmGlobalStats({ games: data.bpmGames });
      })
      .catch(() => {});
  }, []);

  // Sync card view when user presses browser back/forward
  useEffect(() => {
    const onPop = () => {
      const view = pathnameToView(window.location.pathname);
      setViewFading(true);
      setTimeout(() => {
        setHomeView(view);
        setViewFading(false);
      }, 250);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Sync document title and meta description with the active view for in-SPA navigation
  useEffect(() => {
    let title: string;
    let description: string;

    if (homeView === 'article' && activeArticleSlug && PITCH_ARTICLES[activeArticleSlug]) {
      const a = PITCH_ARTICLES[activeArticleSlug];
      title = `${a.title} | pitchd.`;
      description = a.description;
    } else if (homeView === 'bpm-article' && activeArticleSlug && BPM_ARTICLES[activeArticleSlug]) {
      const a = BPM_ARTICLES[activeArticleSlug];
      title = `${a.title} | pitchd.`;
      description = a.description;
    } else {
      const meta = VIEW_META[homeView];
      title = meta?.title ?? 'pitchd. | Free Daily Ear Training Game';
      description = meta?.description ?? '';
    }

    document.title = title;
    const descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (descEl) descEl.setAttribute('content', description);
  }, [homeView, activeArticleSlug]);

  // Reset BPM game when navigating away from the BPM view
  useEffect(() => {
    if (homeView !== 'bpm-home') resetBpmGame();
  }, [homeView]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-submit BPM session to Supabase when a game ends
  useEffect(() => {
    if (bpmPhase !== 'final' || bpmResults.length < 5) return;
    const total = bpmResults.reduce((s, r) => s + r.points, 0);
    fetch('/api/bpm-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, total_score: Math.round(total * 100) / 100 }),
    }).catch(() => {});
  }, [bpmPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLeaderboard = async () => {
    switchView('rank');
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.top_scores) setLeaderboard(data.top_scores);
      else showToast('Leaderboard unavailable', 'error');
    } catch {
      showToast('Leaderboard unavailable', 'error');
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
      showToast('Submission failed — try again', 'error');
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
    showToast('Score copied to clipboard!');
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
              className={`w-full bg-[#050505] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-[max-width,height] duration-500 ease-in-out ${homeView === 'menu' || homeView === 'stats' || homeView === 'rank' || homeView === 'bpm-home' ? 'max-w-[420px]' : 'max-w-[520px]'}`}
              style={cardHeight !== undefined ? { height: cardHeight + 64 } : undefined}
            >
              {/* Internal Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />

              {/* BPM countdown — top-right of card, only during listening */}
              {homeView === 'bpm-home' && bpmPhase === 'listening' && (
                <div className="absolute top-5 right-7 flex flex-col items-end z-20 pointer-events-none">
                  <span className="text-4xl font-display text-white leading-none tracking-tighter">{bpmCountdown}</span>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-text-muted mt-0.5">sec</span>
                </div>
              )}

              <div ref={cardInnerRef}>
              {/* ── MENU VIEW ── */}
              {homeView === 'menu' && (
                <div key="menu" className="card-view-enter relative z-10 w-full h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-6xl sm:text-[5rem] font-display text-white tracking-tighter leading-none">
                      pitchd.
                    </h1>
                    <div className="flex items-center gap-2">
                      <button onClick={fetchLeaderboard} className="text-text-muted hover:text-white transition-colors" aria-label="Leaderboard">
                        <Trophy className="size-4" />
                      </button>
                      <button onClick={() => switchView('stats')} className="text-text-muted hover:text-white transition-colors" aria-label="Stats">
                        <BarChart2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[#a0a0a0] text-sm leading-relaxed mb-4 font-sans pr-6">
                    Most humans don't possess perfect pitch. This is a 5-round acoustic memory game to see exactly how your ears measure up.
                  </p>
                  <p className="text-[#a0a0a0] text-sm leading-relaxed mb-6 font-sans pr-6">
                    We'll play a randomized sequence of notes. Listen closely, then recreate the melody flawlessly.
                  </p>

                  <div className="relative flex w-fit p-1 rounded-full bg-white/5 border border-white/10 mb-6">
                    <div
                      className="absolute top-1 bottom-1 rounded-full bg-white shadow-sm pointer-events-none transition-transform duration-200 ease-in-out"
                      style={{ left: '4px', width: 'calc(50% - 4px)', transform: selectedPitchMode === 'endless' ? 'translateX(100%)' : 'translateX(0)' }}
                    />
                    <button
                      onClick={() => setSelectedPitchMode('daily')}
                      className={`relative z-10 min-w-[80px] px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold text-center transition-colors duration-150 ${selectedPitchMode === 'daily' ? 'text-black' : 'text-text-muted hover:text-white'}`}
                    >Daily {streak > 0 ? `🔥${streak}` : ''}</button>
                    <button
                      onClick={() => setSelectedPitchMode('endless')}
                      className={`relative z-10 min-w-[80px] px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold text-center transition-colors duration-150 ${selectedPitchMode === 'endless' ? 'text-black' : 'text-text-muted hover:text-white'}`}
                    >Endless</button>
                  </div>

                  <button
                    onClick={() => handleStart(selectedPitchMode)}
                    className="w-full py-4 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm"
                  >
                    Start {selectedPitchMode === 'daily' ? 'Daily' : 'Game'}
                  </button>

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
                      <button
                        key={article.slug}
                        onClick={() => openArticle(article.slug, 'pitch')}
                        className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group text-left w-full"
                      >
                        <span className="text-text-muted text-[10px] font-sans tracking-[0.2em] uppercase">{article.date}</span>
                        <h3 className="text-lg font-display text-white group-hover:text-purple-400 transition-colors leading-tight mt-1.5 mb-2">
                          {article.title}
                        </h3>
                        <p className="text-[#a0a0a0] text-sm leading-relaxed">{article.description}</p>
                      </button>
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
              {/* ── BPM HOME ── */}
              {homeView === 'bpm-home' && (
                <BpmGame
                  phase={bpmPhase}
                  round={bpmRound}
                  countdown={bpmCountdown}
                  sliderBpm={sliderBpm}
                  setSliderBpm={setSliderBpm}
                  results={bpmResults}
                  pulseKey={bpmPulseKey}
                  sliderMin={sliderMin}
                  sliderMax={sliderMax}
                  bpmGamesPlayed={bpmGamesPlayed}
                  bpmBest={bpmBest}
                  bpmScoreHistory={bpmScoreHistory}
                  bpmStreak={bpmStreak}
                  bpmDailyPlayed={bpmDailyPlayed}
                  hasReplayed={hasReplayed}
                  isReplaying={isReplaying}
                  isNewBpmBest={isNewBpmBest}
                  isPlaying={bpmIsPlaying}
                  setIsPlaying={setBpmIsPlaying}
                  replayTempo={replayTempo}
                  startGame={startBpmGame}
                  submitGuess={submitBpmGuess}
                  nextRound={nextBpmRound}
                  resetGame={resetBpmGame}
                  bpmGlobalStats={bpmGlobalStats}
                  switchView={switchView}
                />
              )}

              {/* ── BPM ARTICLES ── */}
              {homeView === 'bpm-articles' && (
                <div key="bpm-articles" className="card-view-enter relative z-10 w-full">
                  <button onClick={() => switchView('bpm-home')} className="flex items-center gap-2 text-text-muted hover:text-white transition-colors text-xs uppercase tracking-widest mb-8">
                    <ArrowLeft className="size-3.5" /> Back
                  </button>
                  <h2 className="text-3xl sm:text-4xl font-display text-white mb-2 tracking-tighter leading-tight">Rhythm & BPM Guides</h2>
                  <p className="text-text-muted text-sm mb-8">Articles on tempo training, beat recognition, and rhythmic ear development.</p>
                  <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto hide-scrollbar">
                    {BPM_ARTICLES_DATA.map((article) => (
                      <button
                        key={article.slug}
                        onClick={() => openArticle(article.slug, 'bpm')}
                        className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group text-left w-full"
                      >
                        <span className="text-text-muted text-[10px] font-sans tracking-[0.2em] uppercase">{article.date}</span>
                        <h3 className="text-lg font-display text-white group-hover:text-orange-400 transition-colors leading-tight mt-1.5 mb-2">{article.title}</h3>
                        <p className="text-[#a0a0a0] text-sm leading-relaxed">{article.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── BPM SCORING ── */}
              {homeView === 'bpm-scoring' && (
                <div key="bpm-scoring" className="card-view-enter relative z-10 w-full">
                  <button onClick={() => switchView('bpm-home')} className="flex items-center gap-2 text-text-muted hover:text-white transition-colors text-xs uppercase tracking-widest mb-8">
                    <ArrowLeft className="size-3.5" /> Back
                  </button>
                  <h2 className="text-3xl sm:text-4xl font-display text-white mb-2 tracking-tighter leading-tight">BPM Scoring</h2>
                  <p className="text-[#a0a0a0] text-sm leading-relaxed mb-8">
                    After listening to the metronome, you drag a slider to your BPM guess. Your score depends on how close you get.
                  </p>
                  <div className="flex flex-col gap-3">
                    {BPM_SCORING_DATA.map(item => (
                      <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-white font-display text-base mb-0.5">{item.label}</h3>
                          <p className="text-[11px] text-text-muted leading-relaxed">{item.desc}</p>
                        </div>
                        <div className={`px-3 py-1.5 ${item.badge} font-bold font-mono text-sm rounded-lg shrink-0`}>{item.pts} pts</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-[#666] text-xs text-center">A perfect 5-round BPM game yields exactly <span className="text-white font-bold">20 points</span>.</p>
                  </div>
                </div>
              )}

              {/* ── BPM STATS ── */}
              {homeView === 'bpm-stats' && (
                <div key="bpm-stats" className="card-view-enter relative z-10 w-full flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-display text-white tracking-tighter uppercase">BPM Stats</h2>
                    <button onClick={() => switchView('bpm-home')} className="text-text-muted hover:text-white transition-colors"><X className="size-5" /></button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-10">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-display text-white leading-none mb-1">{bpmGamesPlayed}</span>
                      <span className="text-[10px] text-text-muted uppercase tracking-widest text-center">Played</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-display text-white leading-none mb-1">{bpmBest > 0 ? bpmBest.toFixed(1) : '—'}</span>
                      <span className="text-[10px] text-text-muted uppercase tracking-widest text-center">Best</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-display text-white leading-none mb-1">{bpmStreak}</span>
                      <span className="text-[10px] text-text-muted uppercase tracking-widest text-center">Daily<br/>Streak</span>
                    </div>
                  </div>

                  <h3 className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-4 text-center">Score History (Last 10)</h3>
                  {bpmScoreHistory.length > 0 ? (
                    <div className="flex items-end justify-center gap-2 h-32 border-b border-white/10 pb-2 relative w-full mt-auto">
                      {bpmScoreHistory.slice(-10).map((score, i) => {
                        const heightPct = Math.max(10, (score / 20) * 100);
                        return (
                          <div key={i} className="flex flex-col items-center justify-end w-8 group">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white/50 mb-1 absolute -top-4">{score.toFixed(1)}</div>
                            <div className="w-full bg-white/20 group-hover:bg-orange-500/80 transition-colors rounded-t-sm" style={{ height: `${heightPct}%` }} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-text-muted text-xs uppercase tracking-widest border-b border-white/10 pb-2 mt-auto">
                      No games played yet
                    </div>
                  )}
                </div>
              )}

              {/* ── PITCH ARTICLE DETAIL ── */}
              {homeView === 'article' && activeArticleSlug && PITCH_ARTICLES[activeArticleSlug] && (() => {
                const article = PITCH_ARTICLES[activeArticleSlug];
                return (
                  <div key={`article-${activeArticleSlug}`} className="card-view-enter relative z-10 w-full">
                    <button onClick={() => switchView('articles')} className="flex items-center gap-2 text-text-muted hover:text-white transition-colors text-xs uppercase tracking-widest mb-8">
                      <ArrowLeft className="size-3.5" /> Back to Articles
                    </button>
                    <span className="text-text-muted text-[10px] font-sans tracking-[0.2em] uppercase mb-3 block">{article.date}</span>
                    <h2 className="text-2xl sm:text-3xl font-display text-white mb-6 tracking-tighter leading-tight">{article.title}</h2>
                    <div className="max-h-[52vh] overflow-y-auto hide-scrollbar pr-1">
                      <p className="text-white/70 text-sm leading-relaxed mb-6">{article.description}</p>
                      {article.sections.map((section, i) => (
                        <div key={i} className="mb-5">
                          <h3 className="text-base font-display text-white mb-2">{section.heading}</h3>
                          <p className="text-[#a0a0a0] text-sm leading-relaxed">{section.body}</p>
                        </div>
                      ))}
                      <div className="mt-8 mb-2 p-6 bg-black/40 rounded-2xl border border-purple-500/20 text-center">
                        <p className="text-sm text-white/70 mb-4">{article.cta}</p>
                        <button
                          onClick={() => switchView('menu')}
                          className="px-6 py-3 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 transition-all text-xs"
                        >
                          Play pitchd.
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── BPM ARTICLE DETAIL ── */}
              {homeView === 'bpm-article' && activeArticleSlug && BPM_ARTICLES[activeArticleSlug] && (() => {
                const article = BPM_ARTICLES[activeArticleSlug];
                return (
                  <div key={`bpm-article-${activeArticleSlug}`} className="card-view-enter relative z-10 w-full">
                    <button onClick={() => switchView('bpm-articles')} className="flex items-center gap-2 text-text-muted hover:text-white transition-colors text-xs uppercase tracking-widest mb-8">
                      <ArrowLeft className="size-3.5" /> Back to BPM Guides
                    </button>
                    <span className="text-text-muted text-[10px] font-sans tracking-[0.2em] uppercase mb-3 block">{article.date}</span>
                    <h2 className="text-2xl sm:text-3xl font-display text-white mb-6 tracking-tighter leading-tight">{article.title}</h2>
                    <div className="max-h-[52vh] overflow-y-auto hide-scrollbar pr-1">
                      <p className="text-white/70 text-sm leading-relaxed mb-6">{article.description}</p>
                      {article.sections.map((section, i) => (
                        <div key={i} className="mb-5">
                          <h3 className="text-base font-display text-white mb-2">{section.heading}</h3>
                          <p className="text-[#a0a0a0] text-sm leading-relaxed">{section.body}</p>
                        </div>
                      ))}
                      <div className="mt-8 mb-2 p-6 bg-black/40 rounded-2xl border border-orange-500/20 text-center">
                        <p className="text-sm text-white/70 mb-4">{article.cta}</p>
                        <button
                          onClick={() => switchView('bpm-home')}
                          className="px-6 py-3 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 transition-all text-xs"
                        >
                          Play BPM Guesser
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

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
              <div className="flex items-center gap-3">
                <div className="relative hidden sm:block">
                  <button
                    onMouseEnter={() => setShowKeymap(true)}
                    onMouseLeave={() => setShowKeymap(false)}
                    className="text-text-muted hover:text-white transition-colors"
                    aria-label="Keyboard shortcuts"
                  >
                    <Music className="size-4" />
                  </button>
                  {showKeymap && (
                    <div className="absolute bottom-8 right-0 bg-[#111] border border-white/10 rounded-xl p-3 text-[10px] text-text-muted font-mono whitespace-nowrap z-50 shadow-2xl">
                      <div className="text-white/50 uppercase tracking-widest mb-2 text-[9px]">Keyboard</div>
                      <div>a w s e d f t g y h u j k o l p ;</div>
                      <div className="text-white/30 mt-1">C  D♭ D E♭ E F G♭ G A♭ A B♭ B C D♭ D E♭ E</div>
                    </div>
                  )}
                </div>
                <button
                  onClick={undoNote}
                  disabled={playerSequence.length === 0}
                  className="text-text-muted hover:text-white disabled:opacity-30 disabled:hover:text-text-muted text-sm tracking-widest uppercase"
                >
                  Undo
                </button>
              </div>
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

      {/* Top Mode Switcher (Home Page Only) */}
      {gameState === 'home' && (homeView !== 'bpm-home' || bpmPhase === 'idle') && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-700">
          <div className="relative flex p-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
            <div
              className="absolute top-1.5 bottom-1.5 rounded-full bg-white shadow-sm pointer-events-none transition-transform duration-200 ease-in-out"
              style={{ left: '6px', width: 'calc(50% - 6px)', transform: homeView.startsWith('bpm') ? 'translateX(100%)' : 'translateX(0)' }}
            />
            <button
              onClick={() => switchView('menu')}
              className={`relative z-10 w-[64px] py-2 text-[10px] uppercase tracking-[0.2em] font-bold text-center transition-colors duration-150 ${!homeView.startsWith('bpm') ? 'text-black' : 'text-text-muted hover:text-white'}`}
            >Pitch</button>
            <button
              onClick={() => switchView('bpm-home')}
              className={`relative z-10 w-[64px] py-2 text-[10px] uppercase tracking-[0.2em] font-bold text-center transition-colors duration-150 ${homeView.startsWith('bpm') ? 'text-black' : 'text-text-muted hover:text-white'}`}
            >BPM</button>
          </div>
        </div>
      )}

      <ToastContainer />

      {/* Footer Pill (Home Page Only) */}
      {gameState === 'home' && (homeView !== 'bpm-home' || bpmPhase === 'idle') && (
        <div className="fixed bottom-6 sm:bottom-8 z-50 flex items-center gap-4 sm:gap-6 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md animate-in slide-in-from-bottom-8 duration-1000 shadow-2xl">
          <button
            onClick={() => switchView(homeView.startsWith('bpm') ? 'bpm-articles' : 'articles')}
            className="text-text-muted hover:text-white transition-colors text-[10px] sm:text-xs tracking-widest uppercase"
          >
            Articles
          </button>
          <div className="w-px h-3 bg-white/10" />
          <button
            onClick={() => switchView(homeView.startsWith('bpm') ? 'bpm-scoring' : 'scoring')}
            className="text-text-muted hover:text-white transition-colors text-[10px] sm:text-xs tracking-widest uppercase"
          >
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
