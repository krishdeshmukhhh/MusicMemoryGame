"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

const BPM_EASY   = [60, 70, 80, 90, 100, 110, 120];
const BPM_MEDIUM = [72, 85, 96, 108, 116, 128];
const BPM_HARD   = [67, 78, 93, 107, 113, 137, 152];
const ALL_BPMS   = [...BPM_EASY, ...BPM_MEDIUM, ...BPM_HARD];

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

  // Continuous scoring: score interpolates linearly within each tier boundary.
  // At every boundary value the score is exactly integer, so tiers feel fair.
  if (pct <= 1.5) return { label: 'Perfect', emoji: '🟩', points: round2(4 - pct / 1.5),             pct: round2(pct) };
  if (pct <= 4)   return { label: 'Great',   emoji: '🟨', points: round2(3 - (pct - 1.5) / 2.5),     pct: round2(pct) };
  if (pct <= 8)   return { label: 'Good',    emoji: '🟧', points: round2(2 - (pct - 4) / 4),          pct: round2(pct) };
  if (pct <= 15)  return { label: 'Close',   emoji: '🟫', points: round2(1 - (pct - 8) / 7),          pct: round2(pct) };
  return                 { label: 'Miss',    emoji: '🟥', points: 0,                                   pct: round2(pct) };
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

export function useBpmGame() {
  const [phase, setPhase]               = useState<BpmPhase>('idle');
  const [round, setRound]               = useState(1);
  const [targetBpm, setTargetBpm]       = useState(0);
  const [countdown, setCountdown]       = useState(LISTEN_SECONDS);
  const [sliderBpm, setSliderBpm]       = useState(SLIDER_DEFAULT);
  const [results, setResults]           = useState<RoundResult[]>([]);
  const [pulseKey, setPulseKey]         = useState(0);
  const [bpmGamesPlayed, setBpmGamesPlayed] = useState(0);
  const [bpmBest, setBpmBest]           = useState(0);

  const ctxRef           = useRef<AudioContext | null>(null);
  const nextTimeRef      = useRef(0);
  const schedulerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Refs so the visibilitychange handler always sees current values without stale closures
  const phaseRef     = useRef<BpmPhase>('idle');
  phaseRef.current   = phase;
  const sliderBpmRef = useRef(SLIDER_DEFAULT);
  sliderBpmRef.current = sliderBpm;

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

  const startNewRound = useCallback(() => {
    const bpm = ALL_BPMS[Math.floor(Math.random() * ALL_BPMS.length)];
    setTargetBpm(bpm);
    setSliderBpm(SLIDER_DEFAULT);
    setCountdown(LISTEN_SECONDS);
    setPulseKey(0);
    setPhase('listening');
    startMetronome(bpm);

    let remaining = LISTEN_SECONDS;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        stopCountdown();
        stopMetronome(); // effect below restarts at slider BPM
        setPhase('guessing');
      }
    }, 1000);
  }, [startMetronome, stopMetronome, stopCountdown]);

  useEffect(() => {
    try {
      setBpmGamesPlayed(parseInt(localStorage.getItem('bpm_games_played') || '0', 10));
      setBpmBest(parseFloat(localStorage.getItem('bpm_best') || '0'));
    } catch { /* localStorage unavailable */ }
  }, []);

  const startGame = useCallback(() => {
    setRound(1);
    setResults([]);
    startNewRound();
  }, [startNewRound]);

  // Keep metronome in sync with slider while the user is guessing
  useEffect(() => {
    if (phase !== 'guessing') return;
    startMetronome(sliderBpm);
  }, [phase, sliderBpm, startMetronome]);

  const submitGuess = useCallback((guessedBpm: number) => {
    stopMetronome();
    setResults(prev => {
      const result: RoundResult = {
        targetBpm,
        guessedBpm,
        ...scoreGuess(targetBpm, guessedBpm),
        difficulty: getDifficulty(targetBpm),
      };
      const next = [...prev, result];
      if (next.length >= 5) {
        setPhase('final');
        try {
          const total = next.reduce((s, r) => s + r.points, 0);
          const best  = parseFloat(localStorage.getItem('bpm_best') || '0');
          if (total > best) {
            localStorage.setItem('bpm_best', String(total));
            setBpmBest(total);
          }
          const newCount = parseInt(localStorage.getItem('bpm_games_played') || '0', 10) + 1;
          localStorage.setItem('bpm_games_played', String(newCount));
          setBpmGamesPlayed(newCount);
        } catch { /* localStorage unavailable */ }
      } else {
        setPhase('result');
      }
      return next;
    });
  }, [targetBpm, stopMetronome]);

  const nextRound = useCallback(() => {
    setRound(r => r + 1);
    startNewRound();
  }, [startNewRound]);

  const resetGame = useCallback(() => {
    stopMetronome();
    stopCountdown();
    setPhase('idle');
    setRound(1);
    setResults([]);
    setSliderBpm(SLIDER_DEFAULT);
  }, [stopMetronome, stopCountdown]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopMetronome();
        stopCountdown();
        // If mid-listen, skip straight to guessing — they heard what they heard
        if (phaseRef.current === 'listening') setPhase('guessing');
      } else {
        // Tab returned: restart slider metronome if user was mid-guess
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
    bpmGamesPlayed, bpmBest,
    startGame, submitGuess, nextRound, resetGame,
  };
}
