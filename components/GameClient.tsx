"use client";

import { useState, useEffect, useCallback, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { track } from '@vercel/analytics';
import { Trophy, BarChart2, X, ArrowLeft, Music, Share2 } from 'lucide-react';
import BpmGame from '@/components/BpmGame';
import Piano from '@/components/Piano';
import ScoreReveal from '@/components/ScoreReveal';
import NextPuzzleCountdown from '@/components/NextPuzzleCountdown';
import ToastContainer, { showToast } from '@/components/Toast';
import { engine } from '@/lib/audio';
import { generateRandomSequence, getDailySequenceForRound, scoreRound, totalScore, gradeNote, ROUNDS_PER_GAME, NOTES_PER_ROUND } from '@/lib/seed';
import { getDailyDateString, getPuzzleNumber, liveStreak, nextStreak } from '@/lib/daily';
import { buildShareText, encodePitchGrid, shareResult, CELL_COLOR, type ShareOutcome } from '@/lib/share';
import { articlePath, loadArticle, type ArticleData, type ArticleKind, type ArticleMeta } from '@/lib/articles';
import { useBpmGame } from '@/hooks/useBpmGame';

// three.js is ~600 KB — load the decorative background after hydration, off the critical path.
const ParticleField = dynamic(() => import('@/components/ParticleField'), { ssr: false });

type GameState = 'home' | 'listen' | 'play' | 'reveal' | 'results';
type PlayMode = 'daily' | 'endless';
type LeaderboardEntry = { initials: string | null; score: number };
type RoundRecord = { correct: string[]; player: string[] };
type PitchDailyResult = { date: string; total: number; grid: string; percentile?: number | null };
export type HomeView = 'menu' | 'stats' | 'articles' | 'scoring' | 'rank' | 'bpm-home' | 'bpm-articles' | 'bpm-scoring' | 'bpm-stats' | 'article' | 'bpm-article';

const VIEW_META: Partial<Record<HomeView, { title: string; description: string }>> = {
  menu:          { title: 'pitchd. | Free Daily Pitch Memory Game & Ear Training', description: 'Two free daily ear training games: recreate 4-note sequences on a piano to test your pitch memory, or match mystery tempos in the BPM Guesser. Rank globally — no sign-up needed.' },
  articles:      { title: 'Ear Training & Perfect Pitch Guides | pitchd.', description: 'Guides on perfect pitch, interval recognition, relative pitch, and daily ear training routines — for musicians of all levels.' },
  scoring:       { title: 'How Scoring Works — Harmonic Scoring Explained | pitchd.', description: 'How the pitchd. harmonic scoring engine awards points — from exact pitch matches to interval near-misses. Max 50 points across 5 rounds.' },
  rank:          { title: 'Daily Leaderboard | pitchd.', description: 'See today’s top pitch memory scores from players worldwide. Where do you rank?' },
  'bpm-home':    { title: 'BPM Guesser — Free Rhythm & Tempo Training Game | pitchd.', description: 'Listen to a mystery tempo and guess the BPM. Free daily rhythm ear training game. No sign-up needed.' },
  'bpm-articles':{ title: 'Rhythm & BPM Training Guides | pitchd.', description: 'Articles on tempo training, beat recognition, BPM ranges by genre, and rhythmic ear development.' },
  'bpm-scoring': { title: 'BPM Scoring Guide — How Scoring Works | pitchd.', description: 'How the BPM Guesser scoring tiers work — from Perfect (≤3% off) to Miss (>25% off). Max 20 points across 5 rounds.' },
  'bpm-stats':   { title: 'Your BPM Stats | pitchd.', description: 'Track your BPM Guesser performance, best score, and daily streak.' },
  stats:         { title: 'Your Pitch Stats | pitchd.', description: 'Track your pitch game performance, score history, and daily streak.' },
};

// URL each view pushes to history. Article views push their own /articles/<slug> URL.
const VIEW_URL: Partial<Record<HomeView, string>> = {
  menu: '/', articles: '/articles', scoring: '/scoring', stats: '/', rank: '/',
  'bpm-home': '/bpm', 'bpm-articles': '/bpm/articles', 'bpm-scoring': '/bpm/scoring', 'bpm-stats': '/bpm',
};

function parsePath(p: string): { view: HomeView; slug: string | null } {
  const path = p.length > 1 ? p.replace(/\/$/, '') : p;
  if (path === '/bpm')          return { view: 'bpm-home', slug: null };
  if (path === '/bpm/articles') return { view: 'bpm-articles', slug: null };
  if (path === '/bpm/scoring')  return { view: 'bpm-scoring', slug: null };
  if (path === '/articles')     return { view: 'articles', slug: null };
  if (path === '/scoring')      return { view: 'scoring', slug: null };
  const bpmArticle = path.match(/^\/bpm\/articles\/([\w-]+)$/);
  if (bpmArticle) return { view: 'bpm-article', slug: bpmArticle[1] };
  const article = path.match(/^\/articles\/([\w-]+)$/);
  if (article) return { view: 'article', slug: article[1] };
  return { view: 'menu', slug: null };
}

const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const SHARE_TOAST: Record<ShareOutcome, string | null> = {
  shared: null,
  copied: 'Result copied — paste it anywhere!',
  failed: 'Couldn’t share — try again',
  cancelled: null,
};

const SCORING_DATA = [
  { name: 'Perfect Match', desc: 'You correctly identified the exact note and octave.', pts: '2.50', badge: 'bg-green-500/20 text-green-400' },
  { name: 'Perfect Octave', desc: 'Correct note, wrong octave. A huge music theory win.', pts: '2.00', badge: 'bg-blue-500/20 text-blue-400' },
  { name: 'Perfect 5th', desc: 'The dominant 5th — the most consonant interval.', pts: '1.50', badge: 'bg-purple-500/20 text-purple-400' },
  { name: 'Perfect 4th', desc: 'You hit the subdominant interval.', pts: '1.25', badge: 'bg-teal-500/20 text-teal-400' },
  { name: 'Adjacent Note', desc: '1 semitone off. Fat finger or slightly flat/sharp.', pts: '1.00', badge: 'bg-yellow-500/20 text-yellow-400' },
];

const BPM_SCORING_DATA = [
  { range: '≤ 3% off',  label: 'Perfect', pts: '4.00', badge: 'bg-green-500/20 text-green-400',   desc: 'Score: 4.00 → 3.00. Dead on — your internal clock is elite.' },
  { range: '≤ 8% off',  label: 'Great',   pts: '3.00', badge: 'bg-yellow-500/20 text-yellow-400', desc: 'Score: 3.00 → 2.00. Very close — a trained ear.' },
  { range: '≤ 15% off', label: 'Good',    pts: '2.00', badge: 'bg-orange-500/20 text-orange-400', desc: 'Score: 2.00 → 1.00. In the ballpark — keep practicing.' },
  { range: '≤ 25% off', label: 'Close',   pts: '1.00', badge: 'bg-stone-500/20 text-stone-400',   desc: 'Score: 1.00 → 0.00. Audible difference, but you felt the groove.' },
  { range: '> 25% off', label: 'Miss',    pts: '0.00', badge: 'bg-red-500/20 text-red-400',       desc: 'Score: 0.00. Too far off — listen for the pulse.' },
];

const getFinalQuip = (score: number) => {
  if (score >= 48) return "Virtuoso! Absolute perfection.";
  if (score >= 40) return "Phenomenal ear. You belong in a symphony.";
  if (score >= 30) return "Great job! A very solid performance.";
  if (score >= 20) return "Good, not great. Fine dining at Applebee's.";
  return "Did you even turn your speakers on?";
};

/** Plain left-click → handle in-app; modified/middle clicks keep native link behaviour. */
const isPlainClick = (e: ReactMouseEvent) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);

type Props = { pitchArticles: ArticleMeta[]; bpmArticles: ArticleMeta[] };

export default function GameClient({ pitchArticles, bpmArticles }: Props) {
  const [gameState, setGameState] = useState<GameState>('home');
  const [playMode, setPlayMode] = useState<PlayMode | null>(null);
  const [playDate, setPlayDate] = useState('');

  // 5-Round State
  const [currentRound, setCurrentRound] = useState(1);
  const [rounds, setRounds] = useState<RoundRecord[]>([]);
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
  const [selectedPitchMode, setSelectedPitchMode] = useState<PlayMode>('daily');
  const [showKeymap, setShowKeymap] = useState(false);
  const [pitchDailyDone, setPitchDailyDone] = useState(false);
  const [pitchDailyResult, setPitchDailyResult] = useState<PitchDailyResult | null>(null);

  // usePathname is SSR-aware — use it to seed the correct initial view so
  // server and client render the same content and hydration succeeds.
  const pathname = usePathname();
  const [homeView, setHomeView] = useState<HomeView>(() => parsePath(pathname).view);
  const [activeArticle, setActiveArticle] = useState<{ kind: ArticleKind; slug: string; data: ArticleData | null } | null>(null);
  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined);
  const cardInnerRef = useRef<HTMLDivElement>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [globalStats, setGlobalStats] = useState<{games: number, notes: number} | null>(null);
  const [bpmGlobalStats, setBpmGlobalStats] = useState<{games: number} | null>(null);
  const [localStats, setLocalStats] = useState<{gamesPlayed: number, maxStreak: number, scoreHistory: number[]} | null>(null);
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);

  const bpm = useBpmGame();
  const { phase: bpmPhase, results: bpmResults, resetGame: resetBpmGame } = bpm;

  // ── View switching (crossfade + URL sync; never router.push) ─────────────
  const fadeTo = useCallback((apply: () => void) => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(apply, 250);
  }, []);

  const switchView = useCallback((target: HomeView) => {
    if (target === homeView) return;
    const nextUrl = VIEW_URL[target];
    if (nextUrl && nextUrl !== window.location.pathname) history.pushState(null, '', nextUrl);
    fadeTo(() => setHomeView(target));
  }, [homeView, fadeTo]);

  const showArticle = useCallback((kind: ArticleKind, slug: string) => {
    setActiveArticle({ kind, slug, data: null });
    fadeTo(() => setHomeView(kind === 'bpm' ? 'bpm-article' : 'article'));
    loadArticle(kind, slug).then(data => {
      setActiveArticle(curr => (curr && curr.slug === slug ? { ...curr, data } : curr));
    }).catch(() => showToast('Couldn’t load article', 'error'));
  }, [fadeTo]);

  const openArticle = useCallback((e: ReactMouseEvent, kind: ArticleKind, slug: string) => {
    if (!isPlainClick(e)) return; // let new-tab / copy-link work natively
    e.preventDefault();
    history.pushState(null, '', articlePath(kind, slug));
    showArticle(kind, slug);
    track('article_open', { kind, slug });
  }, [showArticle]);

  // Measure card content height — ResizeObserver catches any content change
  // (view switches, BPM phase changes, tap mode toggle, Reset button appearing, etc.)
  const isHome = gameState === 'home';
  useEffect(() => {
    const el = cardInnerRef.current;
    if (!isHome || !el) return;
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
  }, [isHome]);

  const refreshDailyState = useCallback(() => {
    const today = getDailyDateString();
    const lastPlayed = localStorage.getItem('pitchd_last_played');
    setStreak(liveStreak(lastPlayed, today, parseInt(localStorage.getItem('pitchd_streak') || '0', 10)));
    setPitchDailyDone(lastPlayed === today);
    const result = readJSON<PitchDailyResult | null>('pitchd_daily_result', null);
    setPitchDailyResult(result && result.date === today ? result : null);
  }, []);

  useEffect(() => {
    try {
      let storedId = localStorage.getItem('pitchd_device_id');
      if (!storedId) {
        storedId = 'anon-' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('pitchd_device_id', storedId);
      }
      setDeviceId(storedId);

      const savedInitials = localStorage.getItem('pitchd_initials');
      if (savedInitials) setInitials(savedInitials);

      refreshDailyState();
      setLocalStats(readJSON('pitchd_stats', { gamesPlayed: 0, maxStreak: 0, scoreHistory: [] }));
    } catch { /* localStorage unavailable (private mode) — game still works */ }

    fetch('/api/stats')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => {
        setGlobalStats({ games: data.games, notes: data.notes });
        setBpmGlobalStats({ games: data.bpmGames });
      })
      .catch(() => {});
  }, [refreshDailyState]);

  // Warm the Tone.js download during idle time once the player is on the pitch side.
  useEffect(() => {
    if (homeView.startsWith('bpm')) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    const run = () => { engine.preload().catch(() => {}); };
    if (w.requestIdleCallback) w.requestIdleCallback(run);
    else setTimeout(run, 1500);
  }, [homeView]);

  // Sync card view when user presses browser back/forward
  useEffect(() => {
    const onPop = () => {
      const { view, slug } = parsePath(window.location.pathname);
      if (slug && (view === 'article' || view === 'bpm-article')) {
        showArticle(view === 'bpm-article' ? 'bpm' : 'pitch', slug);
      } else {
        fadeTo(() => setHomeView(view));
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [fadeTo, showArticle]);

  // Sync document title and meta description with the active view for in-SPA navigation
  useEffect(() => {
    let title: string;
    let description: string;
    const isArticleView = homeView === 'article' || homeView === 'bpm-article';
    if (isArticleView && activeArticle?.data) {
      title = `${activeArticle.data.title} | pitchd.`;
      description = activeArticle.data.description;
    } else {
      const meta = VIEW_META[homeView];
      title = meta?.title ?? 'pitchd. | Free Daily Ear Training Game';
      description = meta?.description ?? '';
    }
    document.title = title;
    const descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (descEl && description) descEl.setAttribute('content', description);
  }, [homeView, activeArticle]);

  // Reset BPM game when navigating away from the BPM view
  useEffect(() => {
    if (homeView !== 'bpm-home') resetBpmGame();
  }, [homeView, resetBpmGame]);

  // Auto-submit BPM session to Supabase when a game ends
  useEffect(() => {
    if (bpmPhase !== 'final' || bpmResults.length < 5) return;
    const total = Math.round(bpmResults.reduce((s, r) => s + r.points, 0) * 100) / 100;
    track('game_complete', { game: 'bpm', mode: bpm.mode, score: total });
    fetch('/api/bpm-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, total_score: total }),
    }).catch(() => {});
  }, [bpmPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLeaderboard = async () => {
    switchView('rank');
    setLeaderboard(null);
    try {
      const res = await fetch(`/api/leaderboard?date=${getDailyDateString()}`);
      const data = await res.json();
      setLeaderboard(Array.isArray(data.top_scores) ? data.top_scores : []);
      if (!res.ok) showToast('Leaderboard unavailable', 'error');
    } catch {
      setLeaderboard([]);
      showToast('Leaderboard unavailable', 'error');
    }
  };

  // ── Pitch game flow ──────────────────────────────────────────────────────
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

  const startRound = (roundNum: number, mode: PlayMode, date: string) => {
    setPlayerSequence([]);
    const sequence = mode === 'daily' ? getDailySequenceForRound(date, roundNum) : generateRandomSequence();
    setCorrectSequence(sequence);
    setGameState('listen');
    playTargetSequence(sequence);
  };

  const handleStart = async (mode: PlayMode) => {
    const date = getDailyDateString();
    if (mode === 'daily' && localStorage.getItem('pitchd_last_played') === date) {
      refreshDailyState();
      setGameState('home');
      return;
    }
    try {
      await engine.init();
    } catch {
      showToast('Audio couldn’t start — tap again', 'error');
      return;
    }
    track('game_start', { game: 'pitch', mode });
    // Lock the puzzle date at start so a game that crosses midnight stays on one puzzle.
    setPlayDate(date);
    setPlayMode(mode);
    setCurrentRound(1);
    setRounds([]);
    setFinalTotal(null);
    setPercentile(null);
    setIsPosting(false);
    setIsPosted(false);
    startRound(1, mode, date);
  };

  const handleNoteSelected = useCallback((note: string) => {
    if (gameState !== 'play') return;
    setPlayerSequence(prev => {
      if (prev.length >= NOTES_PER_ROUND) return prev;
      const next = [...prev, note];
      if (next.length === NOTES_PER_ROUND) {
        setTimeout(() => setGameState('reveal'), 800);
      }
      return next;
    });
  }, [gameState]);

  const undoNote = useCallback(() => {
    setPlayerSequence(prev => (prev.length > 0 && prev.length < NOTES_PER_ROUND ? prev.slice(0, -1) : prev));
  }, []);

  // Backspace = undo during play
  useEffect(() => {
    if (gameState !== 'play') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Backspace') undoNote(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState, undoNote]);

  const finishGame = (allRounds: RoundRecord[]) => {
    const exactTotal = totalScore(allRounds.map(r => scoreRound(r.player, r.correct)));
    setFinalTotal(exactTotal);

    if (playMode === 'daily') {
      try {
        const lastPlayed = localStorage.getItem('pitchd_last_played');
        if (lastPlayed !== playDate) {
          const currentStreak = nextStreak(lastPlayed, playDate, parseInt(localStorage.getItem('pitchd_streak') || '0', 10));
          setStreak(currentStreak);
          localStorage.setItem('pitchd_streak', currentStreak.toString());
          localStorage.setItem('pitchd_last_played', playDate);

          const stats = readJSON('pitchd_stats', { gamesPlayed: 0, maxStreak: 0, scoreHistory: [] as number[] });
          stats.gamesPlayed += 1;
          stats.maxStreak = Math.max(stats.maxStreak, currentStreak);
          stats.scoreHistory = [...stats.scoreHistory, exactTotal].slice(-100);
          localStorage.setItem('pitchd_stats', JSON.stringify(stats));
          setLocalStats(stats);

          const result: PitchDailyResult = { date: playDate, total: exactTotal, grid: encodePitchGrid(allRounds) };
          localStorage.setItem('pitchd_daily_result', JSON.stringify(result));
          setPitchDailyResult(result);
          setPitchDailyDone(true);
        }
      } catch { /* localStorage unavailable */ }
    }

    track('game_complete', { game: 'pitch', mode: playMode ?? 'endless', score: exactTotal });
    fetch('/api/game-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, score: exactTotal }),
    }).catch(() => {});

    setTimeout(() => setGameState('results'), 1000);
  };

  const handleRevealComplete = () => {
    const newRounds = [...rounds, { correct: correctSequence, player: playerSequence }];
    setRounds(newRounds);
    if (currentRound < ROUNDS_PER_GAME) {
      setCurrentRound(currentRound + 1);
      startRound(currentRound + 1, playMode!, playDate);
    } else {
      finishGame(newRounds);
    }
  };

  const postScore = async () => {
    if (isPosting || isPosted || finalTotal === null || playMode !== 'daily') return;

    const clean = initials.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length === 0) {
      setShowError(true);
      setTimeout(() => setShowError(false), 500);
      return;
    }

    setIsPosting(true);
    try { localStorage.setItem('pitchd_initials', clean); } catch { /* ignore */ }

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          date_str: playDate,
          rounds: rounds.map(r => r.player),
          initials: clean,
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to post score');

      if (data.percentile) {
        setPercentile(data.percentile);
        const stored = readJSON<PitchDailyResult | null>('pitchd_daily_result', null);
        if (stored && stored.date === playDate) {
          const updated = { ...stored, percentile: data.percentile };
          localStorage.setItem('pitchd_daily_result', JSON.stringify(updated));
          setPitchDailyResult(updated);
        }
      }
      setIsPosted(true);
      track('score_submit', { game: 'pitch', score: finalTotal });
      showToast(data.percentile ? `Posted — top ${data.percentile}% today!` : 'Score posted!');
    } catch (e) {
      console.error("Score POST error:", e);
      showToast(e instanceof Error && e.message !== 'Failed to post score' ? e.message : 'Submission failed — try again', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const share = async (text: string, source: string) => {
    const outcome = await shareResult(text);
    const msg = SHARE_TOAST[outcome];
    if (msg) showToast(msg, outcome === 'failed' ? 'error' : 'success');
    if (outcome === 'shared' || outcome === 'copied') track('share', { game: 'pitch', source, method: outcome });
  };

  const shareCurrentGame = () => {
    if (finalTotal === null) return;
    share(buildShareText({
      game: 'pitch',
      score: finalTotal,
      dateStr: playDate,
      daily: playMode === 'daily',
      grid: encodePitchGrid(rounds),
      percentile: playMode === 'daily' ? percentile : null,
      streak,
    }), 'results');
  };

  const shareTodaysDaily = () => {
    if (!pitchDailyResult) return;
    share(buildShareText({
      game: 'pitch',
      score: pitchDailyResult.total,
      dateStr: pitchDailyResult.date,
      daily: true,
      grid: pitchDailyResult.grid,
      percentile: pitchDailyResult.percentile,
      streak,
    }), 'menu');
  };

  const backToMenu = () => {
    setGameState('home');
    if (homeView !== 'menu') switchView('menu');
  };

  const today = getDailyDateString();

  const renderArticleList = (articles: ArticleMeta[], kind: ArticleKind) => (
    <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto hide-scrollbar">
      {articles.map((article) => (
        <a
          key={article.slug}
          href={articlePath(kind, article.slug)}
          onClick={(e) => openArticle(e, kind, article.slug)}
          className="block p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group text-left w-full"
        >
          <span className="text-text-muted text-[10px] font-sans tracking-[0.2em] uppercase">{article.date}</span>
          <h3 className={`text-lg font-display text-white ${kind === 'bpm' ? 'group-hover:text-orange-400' : 'group-hover:text-purple-400'} transition-colors leading-tight mt-1.5 mb-2`}>
            {article.title}
          </h3>
          <p className="text-[#a0a0a0] text-sm leading-relaxed">{article.description}</p>
        </a>
      ))}
    </div>
  );

  const renderArticle = (kind: ArticleKind) => {
    if (!activeArticle || activeArticle.kind !== kind) return null;
    const article = activeArticle.data;
    const isBpm = kind === 'bpm';
    return (
      <div key={`${kind}-article-${activeArticle.slug}`} className="card-view-enter relative z-10 w-full">
        <button onClick={() => switchView(isBpm ? 'bpm-articles' : 'articles')} className="flex items-center gap-2 text-text-muted hover:text-white transition-colors text-xs uppercase tracking-widest mb-8">
          <ArrowLeft className="size-3.5" /> {isBpm ? 'Back to BPM Guides' : 'Back to Articles'}
        </button>
        {!article ? (
          <p className="text-text-muted text-sm py-12 text-center">Loading…</p>
        ) : (
          <>
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
              <div className={`mt-8 mb-2 p-6 bg-black/40 rounded-2xl border ${isBpm ? 'border-orange-500/20' : 'border-purple-500/20'} text-center`}>
                <p className="text-sm text-white/70 mb-4">{article.cta}</p>
                <button
                  onClick={() => switchView(isBpm ? 'bpm-home' : 'menu')}
                  className="px-6 py-3 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 transition-all text-xs"
                >
                  {isBpm ? 'Play BPM Guesser' : 'Play pitchd.'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
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
                  <span className="text-4xl font-display text-white leading-none tracking-tighter">{bpm.countdown}</span>
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
                    Most humans don&apos;t possess perfect pitch. This is a 5-round acoustic memory game to see exactly how your ears measure up.
                  </p>
                  <p className="text-[#a0a0a0] text-sm leading-relaxed mb-6 font-sans pr-6">
                    We&apos;ll play a randomized sequence of notes. Listen closely, then recreate the melody flawlessly.
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

                  {selectedPitchMode === 'daily' && pitchDailyDone ? (
                    <div className="w-full rounded-2xl border border-white/10 p-5 flex flex-col items-center gap-3 text-center">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">pitchd #{getPuzzleNumber(today)} complete</span>
                      {pitchDailyResult && (
                        <span className="font-display text-white text-4xl leading-none tracking-tighter">
                          {pitchDailyResult.total.toFixed(2)} <span className="text-text-faint text-lg">/ 50</span>
                        </span>
                      )}
                      <NextPuzzleCountdown onRollover={refreshDailyState} />
                      <div className="flex gap-2 w-full mt-1">
                        {pitchDailyResult && (
                          <button
                            onClick={shareTodaysDaily}
                            className="flex-1 py-3 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-xs flex items-center justify-center gap-2"
                          ><Share2 className="size-3.5" /> Share</button>
                        )}
                        <button
                          onClick={() => setSelectedPitchMode('endless')}
                          className="flex-1 py-3 rounded-full border border-white/20 text-white text-xs tracking-widest uppercase hover:bg-white/10 transition-all"
                        >Play Endless</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStart(selectedPitchMode)}
                      className="w-full py-4 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm"
                    >
                      Start {selectedPitchMode === 'daily' ? 'Daily' : 'Game'}
                    </button>
                  )}

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
                        <span className="text-[#666] font-sans text-xs">notes played</span>
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
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-display text-white tracking-tighter uppercase">Today&apos;s Top 10</h2>
                    <button onClick={() => switchView('menu')} className="text-text-muted hover:text-white transition-colors" aria-label="Back to Menu"><X className="size-5" /></button>
                  </div>
                  <p className="text-text-muted text-[10px] uppercase tracking-[0.2em] mb-6">pitchd #{getPuzzleNumber(today)}</p>
                  <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto hide-scrollbar">
                    {leaderboard === null ? (
                      <p className="text-text-muted text-center py-8 text-sm">Loading...</p>
                    ) : leaderboard.length === 0 ? (
                      <div className="text-center py-8 flex flex-col items-center gap-4">
                        <p className="text-text-muted text-sm">No scores yet today — be the first.</p>
                        {!pitchDailyDone && (
                          <button onClick={() => { setSelectedPitchMode('daily'); switchView('menu'); }} className="px-6 py-3 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 transition-all text-xs">
                            Play the Daily
                          </button>
                        )}
                      </div>
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
                  {renderArticleList(pitchArticles, 'pitch')}
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
                    pitchd. uses a harmonic scoring engine based on music theory. You&apos;re rewarded for identifying correct harmonic relationships.
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
                  game={bpm}
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
                  <h2 className="text-3xl sm:text-4xl font-display text-white mb-2 tracking-tighter leading-tight">Rhythm &amp; BPM Guides</h2>
                  <p className="text-text-muted text-sm mb-8">Articles on tempo training, beat recognition, and rhythmic ear development.</p>
                  {renderArticleList(bpmArticles, 'bpm')}
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
                    After listening to the metronome, tap along or drag the slider to your BPM guess. Your score depends on how close you get.
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
                    <button onClick={() => switchView('bpm-home')} className="text-text-muted hover:text-white transition-colors" aria-label="Back to BPM"><X className="size-5" /></button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-10">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-display text-white leading-none mb-1">{bpm.bpmGamesPlayed}</span>
                      <span className="text-[10px] text-text-muted uppercase tracking-widest text-center">Played</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-display text-white leading-none mb-1">{bpm.bpmBest > 0 ? bpm.bpmBest.toFixed(1) : '—'}</span>
                      <span className="text-[10px] text-text-muted uppercase tracking-widest text-center">Best</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-display text-white leading-none mb-1">{bpm.bpmStreak}</span>
                      <span className="text-[10px] text-text-muted uppercase tracking-widest text-center">Daily<br/>Streak</span>
                    </div>
                  </div>

                  <h3 className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-4 text-center">Score History (Last 10)</h3>
                  {bpm.bpmScoreHistory.length > 0 ? (
                    <div className="flex items-end justify-center gap-2 h-32 border-b border-white/10 pb-2 relative w-full mt-auto">
                      {bpm.bpmScoreHistory.slice(-10).map((score, i) => {
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

              {/* ── ARTICLE DETAIL (pitch / BPM) ── */}
              {homeView === 'article' && renderArticle('pitch')}
              {homeView === 'bpm-article' && renderArticle('bpm')}

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
                    onFocus={() => setShowKeymap(true)}
                    onBlur={() => setShowKeymap(false)}
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
                      <div className="text-white/30 mt-2">⌫ undo</div>
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
              isLastRound={currentRound === ROUNDS_PER_GAME}
              onComplete={handleRevealComplete}
            />
          </div>
        )}

        {/* State: RESULTS */}
        {gameState === 'results' && (
          <div className="relative flex flex-col w-full max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-1000">

            <div className="flex flex-col items-center text-center">
              <h2 className="text-text-muted text-sm tracking-[0.3em] uppercase mb-4 font-sans">
                {percentile ? `Top ${percentile}% Today` : playMode === 'daily' ? `pitchd #${getPuzzleNumber(playDate)}` : 'Endless Practice'}
              </h2>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-[7rem] leading-none font-display text-white tracking-tighter">
                  {finalTotal?.toFixed(2)}
                </span>
                <span className="text-3xl text-text-faint font-display">/ 50</span>
              </div>
              <p className="text-text-muted tracking-widest uppercase text-xs mt-6">{finalTotal !== null ? getFinalQuip(finalTotal) : ''}</p>
            </div>

            {/* Per-round scores with per-note share-grid colours */}
            <div className="grid grid-cols-5 gap-px bg-border mt-12 p-px overflow-hidden rounded-sm">
              {rounds.map((r, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center bg-bg py-6 hover:bg-surface transition-colors cursor-default">
                  <span className="text-text-faint text-[10px] uppercase tracking-widest mb-2 font-sans">R{idx + 1}</span>
                  <span className="text-white font-display text-xl">{scoreRound(r.player, r.correct).toFixed(2)}</span>
                  <div className="flex gap-1 mt-2" aria-hidden="true">
                    {r.correct.map((note, i) => {
                      const code = { perfect: 'g', octave: 'b', close: 'y', miss: 'r' }[gradeNote(r.player[i], note)];
                      return <span key={i} className="size-2 rounded-[2px]" style={{ backgroundColor: CELL_COLOR[code] }} />;
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Block — daily only; endless scores are practice */}
            {playMode === 'daily' ? (
              <div className={`flex flex-col sm:flex-row gap-2 w-full mt-10 bg-surface-2 border ${showError ? 'border-[var(--color-error)] animate-shake' : 'border-border'} p-2 rounded-full transition-all`}>
                <input
                  autoFocus
                  type="text"
                  placeholder="INT"
                  maxLength={3}
                  value={initials}
                  disabled={isPosted}
                  aria-label="Your initials for the leaderboard"
                  onChange={(e) => { setInitials(e.target.value.toUpperCase().replace(/[^A-Za-z0-9]/g, '')); setShowError(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') postScore(); }}
                  className="w-full sm:w-24 bg-transparent px-6 py-4 text-center text-white font-sans text-lg focus:outline-none placeholder-text-faint uppercase tracking-[0.2em] disabled:opacity-60"
                />
                <button
                  onClick={postScore}
                  disabled={isPosting || isPosted}
                  className="flex-1 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all py-4 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  {isPosting ? 'Posting...' : isPosted ? 'Score Posted' : 'Submit to Leaderboard'}
                </button>
              </div>
            ) : (
              <p className="mt-10 text-center text-text-muted text-xs tracking-widest uppercase">
                Endless scores aren&apos;t ranked — play the Daily to get on the board.
              </p>
            )}

            <button
              onClick={shareCurrentGame}
              className="mt-4 w-full py-4 rounded-full border border-white/20 text-white font-semibold tracking-widest uppercase hover:bg-white hover:text-black active:scale-[0.98] transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <Share2 className="size-4" /> Share Result
            </button>

            {playMode === 'daily' && <div className="mt-6 flex justify-center"><NextPuzzleCountdown /></div>}

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => handleStart('endless')}
                className="text-text-muted hover:text-white text-xs tracking-[0.2em] uppercase transition-colors text-center w-full"
              >
                Play Endless Practice
              </button>
              <button
                onClick={backToMenu}
                className="text-text-muted hover:text-white text-xs tracking-[0.2em] uppercase transition-colors text-center w-full"
              >
                Back to Menu
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
          <a
            href={homeView.startsWith('bpm') ? '/bpm/articles' : '/articles'}
            onClick={(e) => { if (!isPlainClick(e)) return; e.preventDefault(); switchView(homeView.startsWith('bpm') ? 'bpm-articles' : 'articles'); }}
            className="text-text-muted hover:text-white transition-colors text-[10px] sm:text-xs tracking-widest uppercase"
          >
            Articles
          </a>
          <div className="w-px h-3 bg-white/10" />
          <a
            href={homeView.startsWith('bpm') ? '/bpm/scoring' : '/scoring'}
            onClick={(e) => { if (!isPlainClick(e)) return; e.preventDefault(); switchView(homeView.startsWith('bpm') ? 'bpm-scoring' : 'scoring'); }}
            className="text-text-muted hover:text-white transition-colors text-[10px] sm:text-xs tracking-widest uppercase"
          >
            Scoring
          </a>
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
