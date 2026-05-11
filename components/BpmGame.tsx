"use client";

import { useRef, useState } from 'react';
import { BarChart2, X } from 'lucide-react';
import { showToast } from '@/components/Toast';
import type { BpmPhase, BpmMode, RoundResult } from '@/hooks/useBpmGame';

type HomeView = 'menu' | 'stats' | 'articles' | 'scoring' | 'rank' | 'bpm-home' | 'bpm-articles' | 'bpm-scoring' | 'bpm-stats' | 'article' | 'bpm-article';

type Props = {
  phase: BpmPhase;
  round: number;
  countdown: number;
  sliderBpm: number;
  setSliderBpm: (n: number) => void;
  results: RoundResult[];
  pulseKey: number;
  sliderMin: number;
  sliderMax: number;
  bpmGamesPlayed: number;
  bpmBest: number;
  bpmScoreHistory: number[];
  bpmStreak: number;
  bpmDailyPlayed: boolean;
  hasReplayed: boolean;
  isReplaying: boolean;
  isNewBpmBest: boolean;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  replayTempo: () => void;
  startGame: (mode: BpmMode) => void;
  submitGuess: (bpm: number) => void;
  nextRound: () => void;
  resetGame: () => void;
  bpmGlobalStats: { games: number } | null;
  switchView: (target: HomeView) => void;
};

export default function BpmGame({
  phase, round, countdown, sliderBpm, setSliderBpm,
  results, pulseKey, sliderMin, sliderMax,
  bpmGamesPlayed, bpmBest, bpmScoreHistory, bpmStreak, bpmDailyPlayed,
  hasReplayed, isReplaying, isNewBpmBest,
  isPlaying, setIsPlaying,
  replayTempo, startGame, submitGuess, nextRound, resetGame,
  bpmGlobalStats, switchView,
}: Props) {
  const [selectedMode, setSelectedMode] = useState<BpmMode>('daily');
  const [tapInputMode, setTapInputMode] = useState<'slider' | 'tap'>('slider');
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const tapResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scoreColor = { Perfect: 'text-green-400', Great: 'text-yellow-400', Good: 'text-orange-400', Close: 'text-stone-400', Miss: 'text-red-400' };
  const diffBadge  = { easy: 'bg-green-500/20 text-green-400', medium: 'bg-yellow-500/20 text-yellow-400', hard: 'bg-red-500/20 text-red-400' };

  return (
    <div key={`bpm-${phase}-${results.length}`} className="card-view-enter relative z-10 w-full">

      {/* Idle */}
      {phase === 'idle' && (
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-6xl sm:text-[5rem] font-display text-white tracking-tighter leading-none">bpm.</h1>
            <div className="flex items-center gap-2">
              <button onClick={() => switchView('bpm-stats')} className="text-text-muted hover:text-white transition-colors" aria-label="BPM Stats">
                <BarChart2 className="size-4" />
              </button>
              <button onClick={() => switchView('menu')} className="text-text-muted hover:text-white transition-colors" aria-label="Back">
                <X className="size-5" />
              </button>
            </div>
          </div>
          <p className="text-[#a0a0a0] text-sm leading-relaxed mb-4 font-sans pr-6">
            A metronome plays at a mystery tempo for a few seconds. Listen carefully, then match the BPM you heard.
          </p>
          <p className="text-[#a0a0a0] text-sm leading-relaxed mb-6 font-sans pr-6">
            5 rounds — max 20 points.
          </p>

          <div className="relative flex w-fit p-1 rounded-full bg-white/5 border border-white/10 mb-6">
            <div
              className="absolute top-1 bottom-1 rounded-full bg-white shadow-sm pointer-events-none transition-transform duration-200 ease-in-out"
              style={{ left: '4px', width: 'calc(50% - 4px)', transform: selectedMode === 'practice' ? 'translateX(100%)' : 'translateX(0)' }}
            />
            <button
              onClick={() => setSelectedMode('daily')}
              className={`relative z-10 min-w-[80px] px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold text-center transition-colors duration-150 ${selectedMode === 'daily' ? 'text-black' : 'text-text-muted hover:text-white'}`}
            >Daily {bpmStreak > 0 ? `🔥${bpmStreak}` : ''}</button>
            <button
              onClick={() => setSelectedMode('practice')}
              className={`relative z-10 min-w-[80px] px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold text-center transition-colors duration-150 ${selectedMode === 'practice' ? 'text-black' : 'text-text-muted hover:text-white'}`}
            >Practice</button>
          </div>

          {selectedMode === 'daily' && bpmDailyPlayed ? (
            <div className="w-full py-4 rounded-full border border-white/10 text-center text-text-muted text-xs tracking-widest uppercase">
              Today&apos;s challenge complete — come back tomorrow
            </div>
          ) : (
            <button
              onClick={() => startGame(selectedMode)}
              className="w-full py-4 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm"
            >
              Start {selectedMode === 'daily' ? 'Daily' : 'Game'}
            </button>
          )}

          {(bpmGlobalStats || bpmBest > 0) && (
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-start w-full stats-enter">
              {bpmGlobalStats && (
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                  </span>
                  <span className="text-white font-sans text-xs tracking-wide">{bpmGlobalStats.games.toLocaleString()}</span>
                  <span className="text-[#666] font-sans text-xs">games played worldwide</span>
                </div>
              )}
              {bpmBest > 0 && (
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2 w-2 bg-transparent" />
                  <span className="text-white font-sans text-xs tracking-wide">{bpmBest.toFixed(2)}</span>
                  <span className="text-[#666] font-sans text-xs">personal best</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Listening */}
      {phase === 'listening' && (
        <div className="flex flex-col items-center gap-10 py-4">
          <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em] animate-pulse">Listen carefully</p>
          <div className="relative flex items-center justify-center w-40 h-40">
            <span
              key={pulseKey}
              className="absolute inset-0 rounded-full border border-white/25 pointer-events-none"
              style={{ animation: 'bpm-ring 0.55s ease-out both' }}
            />
            <span
              key={`dot-${pulseKey}`}
              className="size-5 rounded-full bg-white pointer-events-none"
              style={{ animation: 'beat-dot 0.25s ease-out both' }}
            />
          </div>
          <p className="text-text-muted text-[10px] uppercase tracking-widest">remember the tempo</p>
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-faint">Round {round} of 5</span>
        </div>
      )}

      {/* Guessing */}
      {phase === 'guessing' && (
        <div className="flex flex-col items-center gap-6">
          <div className="text-center w-full">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted block mb-2">What was the BPM?</span>
            <span className="text-[6rem] leading-none font-display text-white tracking-tighter tabular-nums">{sliderBpm}</span>
            <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] mt-1">BPM</p>
          </div>

          <div className="relative flex w-full p-1 rounded-full bg-white/5 border border-white/10">
            <div
              className="absolute top-1 bottom-1 rounded-full bg-white shadow-sm pointer-events-none transition-transform duration-200 ease-in-out"
              style={{ left: '4px', width: 'calc(50% - 4px)', transform: tapInputMode === 'tap' ? 'translateX(100%)' : 'translateX(0)' }}
            />
            <button
              onClick={() => setTapInputMode('slider')}
              className={`relative z-10 flex-1 py-1 text-[10px] uppercase tracking-widest font-bold text-center transition-colors duration-150 ${tapInputMode === 'slider' ? 'text-black' : 'text-text-muted hover:text-white'}`}
            >Slider</button>
            <button
              onClick={() => { setTapInputMode('tap'); setTapTimes([]); }}
              className={`relative z-10 flex-1 py-1 text-[10px] uppercase tracking-widest font-bold text-center transition-colors duration-150 ${tapInputMode === 'tap' ? 'text-black' : 'text-text-muted hover:text-white'}`}
            >Tap</button>
          </div>

          {tapInputMode === 'slider' ? (
            <div className="w-full flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSliderBpm(Math.max(sliderMin, sliderBpm - 1))}
                  disabled={isReplaying}
                  className="w-8 h-8 shrink-0 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-base leading-none"
                  aria-label="Decrease BPM"
                >−</button>
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={1}
                  value={sliderBpm}
                  onChange={e => setSliderBpm(Number(e.target.value))}
                  disabled={isReplaying}
                  className="flex-1 accent-white h-1 cursor-pointer disabled:opacity-40"
                />
                <button
                  onClick={() => setSliderBpm(Math.min(sliderMax, sliderBpm + 1))}
                  disabled={isReplaying}
                  className="w-8 h-8 shrink-0 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-base leading-none"
                  aria-label="Increase BPM"
                >+</button>
              </div>
              <div className="flex justify-between px-11">
                <span className="text-text-faint text-[10px]">{sliderMin}</span>
                <span className="text-text-faint text-[10px]">{sliderMax}</span>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-3">
              <button
                onPointerDown={() => {
                  const now = Date.now();
                  const updated = [...tapTimes, now];
                  setTapTimes(updated);
                  if (updated.length >= 2) {
                    const diffs = updated.slice(1).map((t, i) => t - updated[i]);
                    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
                    setSliderBpm(Math.max(sliderMin, Math.min(sliderMax, Math.round(60000 / avg))));
                  }
                  if (tapResetTimerRef.current) clearTimeout(tapResetTimerRef.current);
                  tapResetTimerRef.current = setTimeout(() => setTapTimes([]), 2000);
                }}
                className="w-full py-8 rounded-2xl border-2 border-white/20 hover:border-white/50 active:bg-white/10 transition-all text-white font-display text-lg tracking-widest uppercase select-none"
              >
                {tapTimes.length === 0 ? 'Tap to the beat' : tapTimes.length === 1 ? 'Keep tapping…' : `${tapTimes.length} taps`}
              </button>
              {tapTimes.length > 0 && (
                <button onClick={() => setTapTimes([])} className="text-text-muted text-[10px] uppercase tracking-widest hover:text-white transition-colors">Reset</button>
              )}
            </div>
          )}

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={isReplaying}
            className="w-full py-3 rounded-full border border-white/20 text-white text-xs tracking-widest uppercase hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>

          <div className="flex gap-2 w-full">
            <button
              onClick={replayTempo}
              disabled={hasReplayed || isReplaying}
              className="flex-1 py-3 rounded-full border border-white/20 text-white text-xs tracking-widest uppercase hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isReplaying ? 'Playing…' : hasReplayed ? 'Replayed' : 'Replay (1×)'}
            </button>
            <button
              onClick={() => submitGuess(sliderBpm)}
              className="flex-1 py-3 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm"
            >
              Lock In
            </button>
          </div>
        </div>
      )}

      {/* Round Result */}
      {phase === 'result' && (() => {
        const last = results[results.length - 1];
        if (!last) return null;
        return (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-1 block">Round {results.length} of 5</span>
              <span className={`text-4xl font-display tracking-tighter ${scoreColor[last.label as keyof typeof scoreColor] ?? 'text-white'}`}>{last.label}</span>
            </div>
            <div className="flex justify-between items-end border border-white/5 rounded-2xl p-5">
              <div>
                <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] block mb-1">Actual</span>
                <span className="text-3xl font-display text-white">{last.targetBpm} <span className="text-text-faint text-base">bpm</span></span>
              </div>
              <span className="text-text-faint font-display text-2xl mb-1">vs</span>
              <div className="text-right">
                <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] block mb-1">Your Guess</span>
                <span className="text-3xl font-display text-white">{last.guessedBpm} <span className="text-text-faint text-base">bpm</span></span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${diffBadge[last.difficulty]} self-start`}>{last.difficulty}</span>
                <span className="text-text-faint text-[10px] tracking-widest">{last.pct.toFixed(1)}% off</span>
              </div>
              <span className="text-white font-display text-xl">{last.points.toFixed(2)} <span className="text-text-faint text-sm">/ 4.00</span></span>
            </div>
            <div className="grid grid-cols-5 gap-px bg-border overflow-hidden rounded-sm">
              {results.map((r, i) => (
                <div key={i} className="flex flex-col items-center bg-bg py-3 gap-0.5">
                  <span className="text-text-faint text-[9px] uppercase tracking-widest">R{i + 1}</span>
                  <span>{r.emoji}</span>
                  <span className="text-white font-display text-xs">{r.points.toFixed(2)}</span>
                </div>
              ))}
              {Array.from({ length: 5 - results.length }).map((_, i) => (
                <div key={`e${i}`} className="flex flex-col items-center bg-bg py-3 gap-0.5">
                  <span className="text-text-faint text-[9px] uppercase tracking-widest">R{results.length + i + 1}</span>
                  <span className="text-text-faint text-xs">—</span>
                </div>
              ))}
            </div>
            <button onClick={nextRound} className="w-full py-3 rounded-full border border-border text-white hover:bg-white hover:text-black transition-all tracking-widest uppercase text-xs">
              Round {results.length + 1}
            </button>
          </div>
        );
      })()}

      {/* Final */}
      {phase === 'final' && (
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <span className="text-[10px] text-text-muted uppercase tracking-[0.3em] block mb-3">BPM Challenge</span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-[5rem] leading-none font-display text-white tracking-tighter">{results.reduce((s, r) => s + r.points, 0).toFixed(2)}</span>
              <span className="text-2xl text-text-faint font-display">/ 20.00</span>
            </div>
            <p className="text-text-muted text-xs tracking-[0.3em] mt-2">{results.map(r => r.emoji).join('')}</p>
            {isNewBpmBest && (
              <p className="text-orange-400 text-xs tracking-widest uppercase mt-2 font-bold">🎉 New Personal Best!</p>
            )}
            {bpmStreak > 1 && (
              <p className="text-text-muted text-xs tracking-widest mt-1">🔥 {bpmStreak} day streak</p>
            )}
          </div>
          <div className="grid grid-cols-5 gap-px bg-border p-px overflow-hidden rounded-sm">
            {results.map((r, i) => (
              <div key={i} className="flex flex-col items-center bg-bg py-4 gap-1 cursor-default hover:bg-surface transition-colors">
                <span className="text-text-faint text-[9px] uppercase tracking-widest">R{i + 1}</span>
                <span className="text-lg">{r.emoji}</span>
                <span className="text-white font-display text-sm">{r.targetBpm}</span>
                <span className="text-text-muted text-[10px]">↳{r.guessedBpm}</span>
                <span className="text-white font-display text-[10px]">{r.points.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const total = results.reduce((s, r) => s + r.points, 0).toFixed(2);
                const text = `bpm. — ${total} / 20.00\n${results.map(r => r.emoji).join('')}\n\nhttps://pitchd.net`;
                navigator.clipboard.writeText(text).catch(() => {});
                showToast('Copied!');
              }}
              className="flex-1 py-3 rounded-full border border-border text-white hover:bg-white hover:text-black transition-all tracking-widest uppercase text-xs"
            >Share</button>
            <button
              onClick={resetGame}
              className="flex-1 py-3 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-xs"
            >Again</button>
          </div>
        </div>
      )}
    </div>
  );
}
