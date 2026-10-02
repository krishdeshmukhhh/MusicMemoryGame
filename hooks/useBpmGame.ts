"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { getDailyBpmSequence } from '@/lib/seed';
import { getDailyDateString, liveStreak, nextStreak } from '@/lib/daily';
import {
  ALL_BPMS, BPM_ROUNDS, LISTEN_SECONDS, SLIDER_MIN, SLIDER_MAX, SLIDER_DEFAULT,
  getDifficulty, scoreGuess, type BpmTier, type Difficulty,
} from '@/lib/bpm';
import { encodeBpmGrid } from '@/lib/share';

export type RoundResult = {
  targetBpm: number;
  guessedBpm: number;
  label: BpmTier;
  emoji: string;
  points: number;
  pct: number;
  difficulty: Difficulty;
};

export type BpmPhase = 'idle' | 'listening' | 'guessing' | 'result' | 'final';
export type BpmMode  = 'practice' | 'daily';
export type BpmDailyResult = { date: string; total: number; grid: string };

const randomBpm = () => ALL_BPMS[Math.floor(Math.random() * ALL_BPMS.length)];

function readDailyResult(today: string): BpmDailyResult | null {
  try {
    const parsed = JSON.parse(localStorage.getItem('bpm_daily_result') || 'null');
    return parsed && parsed.date === today ? parsed : null;
  } catch {
    return null;
  }
}

export function useBpmGame() {
  const [phase, setPhase]                     = useState<BpmPhase>('idle');
  const [mode, setMode]                       = useState<BpmMode>('practice');
  const [round, setRound]                     = useState(1);
  const [targetBpm, setTargetBpm]             = useState(0);
  const [countdown, setCountdown]             = useState(LISTEN_SECONDS);
  const [sliderBpm, setSliderBpm]             = useState(SLIDER_DEFAULT);
  const [results, setResults]                 = useState<RoundResult[]>([]);
  const [pulseKey, setPulseKey]               = useState(0);
  const [bpmGamesPlayed, setBpmGamesPlayed]   = useState(0);
  const [bpmBest, setBpmBest]                 = useState(0);
  const [bpmScoreHistory, setBpmScoreHistory] = useState<number[]>([]);
  const [bpmStreak, setBpmStreak]             = useState(0);
  const [bpmDailyResult, setBpmDailyResult]   = useState<BpmDailyResult | null>(null);
  const [bpmDailyPlayed, setBpmDailyPlayed]   = useState(false);
  const [hasReplayed, setHasReplayed]         = useState(false);
  const [isReplaying, setIsReplaying]         = useState(false);
  const [isNewBpmBest, setIsNewBpmBest]       = useState(false);
  const [isPlaying, setIsPlaying]             = useState(false);

  const ctxRef           = useRef<AudioContext | null>(null);
  const nextTimeRef      = useRef(0);
  const schedulerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const replayTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dailySequenceRef = useRef<number[]>([]);
  const modeRef          = useRef<BpmMode>('practice');
  const resultsRef       = useRef<RoundResult[]>([]);

  // Latest-value refs for timers/listeners. Synced after commit (never during render).
  const phaseRef     = useRef<BpmPhase>('idle');
  const sliderBpmRef = useRef(SLIDER_DEFAULT);
  const targetBpmRef = useRef(0);
  const roundRef     = useRef(1);
  const isPlayingRef = useRef(false);
  useEffect(() => {
    phaseRef.current     = phase;
    sliderBpmRef.current = sliderBpm;
    targetBpmRef.current = targetBpm;
    roundRef.current     = round;
    isPlayingRef.current = isPlaying;
  });

  // ── Audio helpers ──────────────────────────────────────────────────────────
  const createClick = (ctx: AudioContext, time: number) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.start(time);
    osc.stop(time + 0.05);
  };

  const stopMetronome = useCallback(() => {
    if (schedulerRef.current) {
      clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
    pulseTimeoutsRef.current.forEach(t => clearTimeout(t));
    pulseTimeoutsRef.current = [];
  }, []);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startMetronome = useCallback((bpm: number) => {
    stopMetronome();
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const beatSec = 60 / bpm;
    nextTimeRef.current = ctx.currentTime + 0.1;

    const schedule = () => {
      while (nextTimeRef.current < ctx.currentTime + 0.15) {
        createClick(ctx, nextTimeRef.current);
        const delay = Math.max(0, (nextTimeRef.current - ctx.currentTime) * 1000);
        const t = setTimeout(() => setPulseKey(k => k + 1), delay);
        pulseTimeoutsRef.current.push(t);
        nextTimeRef.current += beatSec;
      }
    };

    schedulerRef.current = setInterval(schedule, 25);
  }, [stopMetronome]);

  // ── Round lifecycle ────────────────────────────────────────────────────────
  const startNewRound = useCallback((bpm: number) => {
    stopCountdown();
    setTargetBpm(bpm);
    setSliderBpm(SLIDER_DEFAULT);
    setCountdown(LISTEN_SECONDS);
    setPulseKey(0);
    setHasReplayed(false);
    setIsReplaying(false);
    setIsPlaying(false);
    setPhase('listening');
    startMetronome(bpm);

    let remaining = LISTEN_SECONDS;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        stopCountdown();
        stopMetronome();
        setPhase('guessing');
      }
    }, 1000);
  }, [startMetronome, stopMetronome, stopCountdown]);

  const replayTempo = useCallback(() => {
    if (hasReplayed) return;
    setHasReplayed(true);
    setIsReplaying(true);
    startMetronome(targetBpmRef.current);
    replayTimerRef.current = setTimeout(() => {
      setIsReplaying(false);
      stopMetronome();
      if (phaseRef.current === 'guessing' && isPlayingRef.current) startMetronome(sliderBpmRef.current);
    }, 2000);
  }, [hasReplayed, startMetronome, stopMetronome]);

  const startGame = useCallback((gameMode: BpmMode = 'practice') => {
    modeRef.current = gameMode;
    setMode(gameMode);
    setRound(1);
    resultsRef.current = [];
    setResults([]);
    setIsNewBpmBest(false);

    let bpm: number;
    if (gameMode === 'daily') {
      dailySequenceRef.current = getDailyBpmSequence(getDailyDateString(), ALL_BPMS);
      bpm = dailySequenceRef.current[0];
    } else {
      bpm = randomBpm();
    }
    startNewRound(bpm);
  }, [startNewRound]);

  // Keep metronome in sync with slider while guessing (skip during target replay)
  useEffect(() => {
    if (phase !== 'guessing' || isReplaying) return;
    if (isPlaying) {
      startMetronome(sliderBpm);
    } else {
      stopMetronome();
    }
  }, [phase, sliderBpm, startMetronome, stopMetronome, isReplaying, isPlaying]);

  const recordFinishedGame = useCallback((all: RoundResult[]) => {
    try {
      const total = Math.round(all.reduce((s, r) => s + r.points, 0) * 100) / 100;

      const best = parseFloat(localStorage.getItem('bpm_best') || '0');
      if (total > best) {
        localStorage.setItem('bpm_best', String(total));
        setBpmBest(total);
        setIsNewBpmBest(true);
      }

      const newCount = parseInt(localStorage.getItem('bpm_games_played') || '0', 10) + 1;
      localStorage.setItem('bpm_games_played', String(newCount));
      setBpmGamesPlayed(newCount);

      const history = JSON.parse(localStorage.getItem('bpm_score_history') || '[]') as number[];
      history.push(total);
      localStorage.setItem('bpm_score_history', JSON.stringify(history.slice(-100)));
      setBpmScoreHistory(history);

      if (modeRef.current === 'daily') {
        const today = getDailyDateString();
        const lastDailyDate = localStorage.getItem('bpm_last_daily_date');
        if (lastDailyDate !== today) {
          const cur = parseInt(localStorage.getItem('bpm_daily_streak') || '0', 10);
          const newStreak = nextStreak(lastDailyDate, today, cur);
          localStorage.setItem('bpm_daily_streak', String(newStreak));
          localStorage.setItem('bpm_last_daily_date', today);
          setBpmStreak(newStreak);

          const dailyResult: BpmDailyResult = { date: today, total, grid: encodeBpmGrid(all) };
          localStorage.setItem('bpm_daily_result', JSON.stringify(dailyResult));
          setBpmDailyResult(dailyResult);
          setBpmDailyPlayed(true);
        }
      }
    } catch { /* localStorage unavailable */ }
  }, []);

  const submitGuess = useCallback((guessedBpm: number) => {
    if (phaseRef.current !== 'guessing') return; // ignore double-taps on Lock In
    phaseRef.current = 'result';
    stopMetronome();
    const currentTarget = targetBpmRef.current;
    const result: RoundResult = {
      targetBpm: currentTarget,
      guessedBpm,
      ...scoreGuess(currentTarget, guessedBpm),
      difficulty: getDifficulty(currentTarget),
    };
    const next = [...resultsRef.current, result];
    resultsRef.current = next;
    setResults(next);
    if (next.length >= BPM_ROUNDS) {
      setPhase('final');
      recordFinishedGame(next);
    } else {
      setPhase('result');
    }
  }, [stopMetronome, recordFinishedGame]);

  const nextRound = useCallback(() => {
    const nextRoundNum = roundRef.current + 1;
    setRound(nextRoundNum);
    const bpm = modeRef.current === 'daily'
      ? (dailySequenceRef.current[nextRoundNum - 1] ?? randomBpm())
      : randomBpm();
    startNewRound(bpm);
  }, [startNewRound]);

  const resetGame = useCallback(() => {
    stopMetronome();
    stopCountdown();
    if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    setPhase('idle');
    setRound(1);
    resultsRef.current = [];
    setResults([]);
    setSliderBpm(SLIDER_DEFAULT);
    setIsNewBpmBest(false);
    setHasReplayed(false);
    setIsReplaying(false);
    setIsPlaying(false);
  }, [stopMetronome, stopCountdown]);

  // ── localStorage hydration ─────────────────────────────────────────────────
  // Runs after mount on purpose: reading localStorage during render would make the
  // server and client HTML differ and break hydration.
  useEffect(() => {
    try {
      /* eslint-disable react-hooks/set-state-in-effect */
      const today = getDailyDateString();
      const lastDaily = localStorage.getItem('bpm_last_daily_date');
      setBpmGamesPlayed(parseInt(localStorage.getItem('bpm_games_played') || '0', 10));
      setBpmBest(parseFloat(localStorage.getItem('bpm_best') || '0'));
      setBpmScoreHistory(JSON.parse(localStorage.getItem('bpm_score_history') || '[]'));
      setBpmStreak(liveStreak(lastDaily, today, parseInt(localStorage.getItem('bpm_daily_streak') || '0', 10)));
      setBpmDailyPlayed(lastDaily === today);
      setBpmDailyResult(readDailyResult(today));
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch { /* localStorage unavailable */ }
  }, []);

  // ── Tab-switch: mute audio, skip to guessing if mid-listen ──────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopMetronome();
        stopCountdown();
        if (phaseRef.current === 'listening') setPhase('guessing');
      } else {
        if (phaseRef.current === 'guessing' && isPlayingRef.current) startMetronome(sliderBpmRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [stopMetronome, stopCountdown, startMetronome]);

  useEffect(() => () => {
    stopMetronome();
    stopCountdown();
    if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
  }, [stopMetronome, stopCountdown]);

  return {
    phase, mode, round, targetBpm, countdown, sliderBpm, setSliderBpm,
    results, pulseKey, sliderMin: SLIDER_MIN, sliderMax: SLIDER_MAX,
    bpmGamesPlayed, bpmBest, bpmScoreHistory, bpmStreak, bpmDailyPlayed, bpmDailyResult,
    hasReplayed, isReplaying, isNewBpmBest,
    isPlaying, setIsPlaying,
    replayTempo,
    startGame, submitGuess, nextRound, resetGame,
  };
}
