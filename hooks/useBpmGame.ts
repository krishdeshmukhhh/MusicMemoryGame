"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { getDailyDateString, getDailyBpmSequence } from '@/lib/seed';

const BPM_EASY   = [60, 70, 80, 90, 100, 110, 120];
const BPM_MEDIUM = [72, 85, 96, 108, 116, 128];
const BPM_HARD   = [67, 78, 93, 107, 113, 137, 152];
export const ALL_BPMS = [...BPM_EASY, ...BPM_MEDIUM, ...BPM_HARD];

const LISTEN_SECONDS = 4;
const SLIDER_MIN     = 40;
const SLIDER_MAX     = 200;
const SLIDER_DEFAULT = 100;

function getDifficulty(bpm: number): 'easy' | 'medium' | 'hard' {
  if ((BPM_EASY as number[]).includes(bpm)) return 'easy';
  if ((BPM_MEDIUM as number[]).includes(bpm)) return 'medium';
  return 'hard';
}

function scoreGuess(target: number, guess: number) {
  const pct = (Math.abs(target - guess) / target) * 100;
  const round2 = (n: number) => Math.round(n * 100) / 100;

  // Wider tiers — boundaries are clean integers, interpolation is linear within each.
  if (pct <= 3)  return { label: 'Perfect', emoji: '🟩', points: round2(4 - pct / 3),              pct: round2(pct) };
  if (pct <= 8)  return { label: 'Great',   emoji: '🟨', points: round2(3 - (pct - 3) / 5),        pct: round2(pct) };
  if (pct <= 15) return { label: 'Good',    emoji: '🟧', points: round2(2 - (pct - 8) / 7),        pct: round2(pct) };
  if (pct <= 25) return { label: 'Close',   emoji: '🟫', points: round2(1 - (pct - 15) / 10),      pct: round2(pct) };
  return               { label: 'Miss',    emoji: '🟥', points: 0,                                 pct: round2(pct) };
}

export type RoundResult = {
  targetBpm: number;
  guessedBpm: number;
  label: string;
  emoji: string;
  points: number;
  pct: number;
  difficulty: 'easy' | 'medium' | 'hard';
};

export type BpmPhase = 'idle' | 'listening' | 'guessing' | 'result' | 'final';
export type BpmMode  = 'practice' | 'daily';

export function useBpmGame() {
  const [phase, setPhase]                     = useState<BpmPhase>('idle');
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
  const [bpmDailyPlayed, setBpmDailyPlayed]   = useState(false);
  const [hasReplayed, setHasReplayed]         = useState(false);
  const [isReplaying, setIsReplaying]         = useState(false);
  const [isNewBpmBest, setIsNewBpmBest]       = useState(false);

  const ctxRef           = useRef<AudioContext | null>(null);
  const nextTimeRef      = useRef(0);
  const schedulerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dailySequenceRef = useRef<number[]>([]);
  const modeRef          = useRef<BpmMode>('practice');
  const roundRef         = useRef(1);

  // Refs for stable access in callbacks/effects
  const phaseRef     = useRef<BpmPhase>('idle');
  phaseRef.current   = phase;
  const sliderBpmRef = useRef(SLIDER_DEFAULT);
  sliderBpmRef.current = sliderBpm;
  const targetBpmRef = useRef(0);
  targetBpmRef.current = targetBpm;
  roundRef.current   = round;

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
    setTargetBpm(bpm);
    setSliderBpm(SLIDER_DEFAULT);
    setCountdown(LISTEN_SECONDS);
    setPulseKey(0);
    setHasReplayed(false);
    setIsReplaying(false);
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
    setTimeout(() => {
      setIsReplaying(false);
      stopMetronome();
      if (phaseRef.current === 'guessing') startMetronome(sliderBpmRef.current);
    }, 2000);
  }, [hasReplayed, startMetronome, stopMetronome]);

  const startGame = useCallback((gameMode: BpmMode = 'practice') => {
    modeRef.current = gameMode;
    setRound(1);
    setResults([]);
    setIsNewBpmBest(false);

    let bpm: number;
    if (gameMode === 'daily') {
      const dateStr = getDailyDateString();
      dailySequenceRef.current = getDailyBpmSequence(dateStr, ALL_BPMS);
      bpm = dailySequenceRef.current[0];
    } else {
      bpm = ALL_BPMS[Math.floor(Math.random() * ALL_BPMS.length)];
    }
    startNewRound(bpm);
  }, [startNewRound]);

  // Keep metronome in sync with slider while guessing (skip during target replay)
  useEffect(() => {
    if (phase !== 'guessing' || isReplaying) return;
    startMetronome(sliderBpm);
  }, [phase, sliderBpm, startMetronome, isReplaying]);

  const submitGuess = useCallback((guessedBpm: number) => {
    stopMetronome();
    const currentTarget = targetBpmRef.current;
    setResults(prev => {
      const result: RoundResult = {
        targetBpm: currentTarget,
        guessedBpm,
        ...scoreGuess(currentTarget, guessedBpm),
        difficulty: getDifficulty(currentTarget),
      };
      const next = [...prev, result];

      if (next.length >= 5) {
        setPhase('final');
        try {
          const total        = next.reduce((s, r) => s + r.points, 0);
          const roundedTotal = Math.round(total * 100) / 100;

          const best = parseFloat(localStorage.getItem('bpm_best') || '0');
          if (roundedTotal > best) {
            localStorage.setItem('bpm_best', String(roundedTotal));
            setBpmBest(roundedTotal);
            setIsNewBpmBest(true);
          }

          const newCount = parseInt(localStorage.getItem('bpm_games_played') || '0', 10) + 1;
          localStorage.setItem('bpm_games_played', String(newCount));
          setBpmGamesPlayed(newCount);

          const history = JSON.parse(localStorage.getItem('bpm_score_history') || '[]') as number[];
          history.push(roundedTotal);
          localStorage.setItem('bpm_score_history', JSON.stringify(history));
          setBpmScoreHistory(history);

          if (modeRef.current === 'daily') {
            const today         = getDailyDateString();
            const lastDailyDate = localStorage.getItem('bpm_last_daily_date');
            if (lastDailyDate !== today) {
              const yd = new Date();
              yd.setDate(yd.getDate() - 1);
              const yesterday = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;
              const cur     = parseInt(localStorage.getItem('bpm_daily_streak') || '0', 10);
              const newStrk = lastDailyDate === yesterday ? cur + 1 : 1;
              localStorage.setItem('bpm_daily_streak', String(newStrk));
              localStorage.setItem('bpm_last_daily_date', today);
              setBpmStreak(newStrk);
              setBpmDailyPlayed(true);
            }
          }
        } catch { /* localStorage unavailable */ }
      } else {
        setPhase('result');
      }
      return next;
    });
  }, [stopMetronome]);

  const nextRound = useCallback(() => {
    const nextRoundNum = roundRef.current + 1;
    setRound(nextRoundNum);
    const bpm = modeRef.current === 'daily'
      ? (dailySequenceRef.current[nextRoundNum - 1] ?? ALL_BPMS[Math.floor(Math.random() * ALL_BPMS.length)])
      : ALL_BPMS[Math.floor(Math.random() * ALL_BPMS.length)];
    startNewRound(bpm);
  }, [startNewRound]);

  const resetGame = useCallback(() => {
    stopMetronome();
    stopCountdown();
    setPhase('idle');
    setRound(1);
    setResults([]);
    setSliderBpm(SLIDER_DEFAULT);
    setIsNewBpmBest(false);
    setHasReplayed(false);
    setIsReplaying(false);
  }, [stopMetronome, stopCountdown]);

  // ── localStorage hydration ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      setBpmGamesPlayed(parseInt(localStorage.getItem('bpm_games_played') || '0', 10));
      setBpmBest(parseFloat(localStorage.getItem('bpm_best') || '0'));
      setBpmScoreHistory(JSON.parse(localStorage.getItem('bpm_score_history') || '[]'));
      setBpmStreak(parseInt(localStorage.getItem('bpm_daily_streak') || '0', 10));
      setBpmDailyPlayed(localStorage.getItem('bpm_last_daily_date') === getDailyDateString());
    } catch { /* localStorage unavailable */ }
  }, []);

  // ── Tab-switch: stop metronome, skip to guessing if mid-listen ────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopMetronome();
        stopCountdown();
        if (phaseRef.current === 'listening') setPhase('guessing');
      } else {
        if (phaseRef.current === 'guessing') startMetronome(sliderBpmRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [stopMetronome, stopCountdown, startMetronome]);

  useEffect(() => () => {
    stopMetronome();
    stopCountdown();
  }, [stopMetronome, stopCountdown]);

  return {
    phase, round, targetBpm, countdown, sliderBpm, setSliderBpm,
    results, pulseKey, sliderMin: SLIDER_MIN, sliderMax: SLIDER_MAX,
    bpmGamesPlayed, bpmBest, bpmScoreHistory, bpmStreak, bpmDailyPlayed,
    hasReplayed, isReplaying, isNewBpmBest,
    replayTempo,
    startGame, submitGuess, nextRound, resetGame,
  };
}
