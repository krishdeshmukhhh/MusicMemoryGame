'use client';

import ParticleField from '@/components/ParticleField';
import { useBpmGame } from '@/hooks/useBpmGame';

const DIFFICULTY_BADGE = {
  easy:   'bg-green-500/20 text-green-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  hard:   'bg-red-500/20 text-red-400',
};

const SCORE_COLOR = {
  Perfect: 'text-green-400',
  Great:   'text-yellow-400',
  Good:    'text-orange-400',
  Miss:    'text-red-400',
};

export default function BpmGame() {
  const {
    phase, round, countdown, sliderBpm, setSliderBpm,
    results, pulseKey, sliderMin, sliderMax,
    startGame, submitGuess, nextRound, resetGame,
  } = useBpmGame();

  const totalScore = results.reduce((s, r) => s + r.points, 0);
  const emojiRow   = results.map(r => r.emoji).join('');
  const lastResult = results[results.length - 1];

  const copyShare = () => {
    const text = `bpm. — ${totalScore} / 20\n${emojiRow}\n\nhttps://pitchd.net`;
    navigator.clipboard.writeText(text).catch(() => {});
    alert('Copied to clipboard!');
  };

  return (
    <main className="fixed inset-0 flex h-[100dvh] w-full overflow-hidden select-none flex-col items-center justify-center p-4 sm:p-8 z-10 bg-bg">
      <ParticleField state={phase === 'listening' ? 'listen' : 'home'} />

      {/* Round indicator — top left */}
      {(phase === 'listening' || phase === 'guessing') && (
        <div className="absolute top-8 left-8 text-white font-display tracking-widest uppercase opacity-60">
          Round {round} <span className="text-text-muted">/ 5</span>
        </div>
      )}

      {/* Countdown — top right */}
      {phase === 'listening' && (
        <div className="absolute top-6 right-8 flex flex-col items-end">
          <span className="text-[3rem] font-display text-white leading-none tracking-tighter">
            {countdown}
          </span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-text-muted mt-0.5">sec</span>
        </div>
      )}

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center justify-center min-h-[60vh]">

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center justify-center w-full px-4 animate-in fade-in zoom-in-95 duration-1000">
            <div className="w-full max-w-[420px] bg-[#050505] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
              <div className="relative z-10">
                <h1 className="text-6xl sm:text-[5rem] font-display text-white mb-6 tracking-tighter leading-none">
                  bpm.
                </h1>
                <p className="text-[#a0a0a0] text-sm leading-relaxed mb-4 font-sans pr-6">
                  A metronome plays at a mystery tempo for a few seconds. Listen carefully, then use the slider to match the BPM you heard.
                </p>
                <p className="text-[#a0a0a0] text-sm leading-relaxed mb-10 font-sans pr-6">
                  Difficulty is revealed after each round. 5 rounds — max 20 points.
                </p>

                <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4 block">
                  Scoring
                </span>
                <div className="flex flex-col gap-2.5 mb-10">
                  {([
                    { range: '±2 BPM',  label: 'Perfect', color: 'text-green-400'  },
                    { range: '±5 BPM',  label: 'Great',   color: 'text-yellow-400' },
                    { range: '±10 BPM', label: 'Good',    color: 'text-orange-400' },
                    { range: 'Outside', label: 'Miss',    color: 'text-red-400'    },
                  ] as const).map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-[#666] text-xs font-sans">{s.range}</span>
                      <span className={`text-xs font-bold uppercase tracking-widest ${s.color}`}>{s.label}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={startGame}
                  className="w-full py-4 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm"
                >
                  Start Game
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── LISTENING ── */}
        {phase === 'listening' && (
          <div className="flex flex-col items-center gap-16 animate-in fade-in zoom-in duration-700">
            <p className="text-sm font-semibold tracking-[0.2em] text-white uppercase animate-pulse">
              Listen carefully
            </p>

            {/* Beat pulse visualization */}
            <div className="relative flex items-center justify-center p-16 rounded-[3rem] border border-white/[0.08] bg-black/40 backdrop-blur-md shadow-2xl">
              {/* Outer expanding ring on each beat */}
              <span
                key={pulseKey}
                className="absolute rounded-full border border-white/20 pointer-events-none"
                style={{
                  inset: 0,
                  animation: 'bpm-ring 0.55s ease-out both',
                }}
              />
              {/* Inner pulse dot */}
              <span
                key={`dot-${pulseKey}`}
                className="size-6 rounded-full bg-white pointer-events-none"
                style={{ animation: 'beat-dot 0.3s ease-out both' }}
              />
            </div>

            <p className="text-text-muted text-xs tracking-widest uppercase">
              remember the tempo
            </p>
          </div>
        )}

        {/* ── GUESSING ── */}
        {phase === 'guessing' && (
          <div className="flex flex-col items-center gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full max-w-sm">

            <div className="text-center">
              <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-3">
                What was the BPM?
              </p>
              <span className="text-[7rem] leading-none font-display text-white tracking-tighter tabular-nums">
                {sliderBpm}
              </span>
              <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] mt-1">BPM</p>
            </div>

            {/* Slider */}
            <div className="w-full flex flex-col gap-3">
              <input
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={1}
                value={sliderBpm}
                onChange={e => setSliderBpm(Number(e.target.value))}
                className="w-full accent-white h-1 cursor-pointer"
              />
              <div className="flex justify-between">
                <span className="text-text-faint text-[10px] font-sans">{sliderMin}</span>
                <span className="text-text-faint text-[10px] font-sans">{sliderMax}</span>
              </div>
            </div>

            <button
              onClick={() => submitGuess(sliderBpm)}
              className="w-full py-4 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm"
            >
              Lock In
            </button>
          </div>
        )}

        {/* ── RESULT (per-round) ── */}
        {phase === 'result' && lastResult && (
          <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full max-w-sm">

            <div className="text-center">
              <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-2 block">
                Round {results.length} of 5
              </span>
              <span className={`text-5xl font-display tracking-tighter ${SCORE_COLOR[lastResult.label as keyof typeof SCORE_COLOR] ?? 'text-white'}`}>
                {lastResult.label}
              </span>
            </div>

            <div className="w-full bg-[#050505] border border-white/10 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.02] rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-1">Actual</span>
                    <span className="text-4xl font-display text-white tracking-tighter">{lastResult.targetBpm}</span>
                    <span className="text-[10px] text-text-muted uppercase tracking-[0.15em] mt-0.5">BPM</span>
                  </div>
                  <span className="text-text-faint font-display text-3xl mb-3">vs</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-1">Your Guess</span>
                    <span className="text-4xl font-display text-white tracking-tighter">{lastResult.guessedBpm}</span>
                    <span className="text-[10px] text-text-muted uppercase tracking-[0.15em] mt-0.5">BPM</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-5">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-text-muted uppercase tracking-[0.2em]">Difficulty</span>
                    <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg w-fit ${DIFFICULTY_BADGE[lastResult.difficulty]}`}>
                      {lastResult.difficulty}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-text-muted uppercase tracking-[0.2em]">Points</span>
                    <span className="text-white font-display text-2xl">
                      {lastResult.points} <span className="text-text-faint text-sm">/ 4</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Running score grid */}
            <div className="grid grid-cols-5 gap-px bg-border overflow-hidden rounded-sm w-full">
              {results.map((r, i) => (
                <div key={i} className="flex flex-col items-center bg-bg py-4 hover:bg-surface transition-colors cursor-default gap-0.5">
                  <span className="text-text-faint text-[9px] uppercase tracking-widest">R{i + 1}</span>
                  <span className="text-base">{r.emoji}</span>
                  <span className="text-white font-display text-sm">{r.points}</span>
                </div>
              ))}
              {Array.from({ length: 5 - results.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex flex-col items-center bg-bg py-4 cursor-default gap-0.5">
                  <span className="text-text-faint text-[9px] uppercase tracking-widest">R{results.length + i + 1}</span>
                  <span className="text-text-faint font-display text-sm mt-0.5">—</span>
                </div>
              ))}
            </div>

            <button
              onClick={nextRound}
              className="px-10 py-3 rounded-full border border-border text-white hover:bg-white hover:text-black transition-all tracking-widest uppercase text-xs"
            >
              Round {results.length + 1}
            </button>
          </div>
        )}

        {/* ── FINAL ── */}
        {phase === 'final' && (
          <div className="relative flex flex-col w-full max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col items-center text-center mb-10">
              <h2 className="text-text-muted text-sm tracking-[0.3em] uppercase mb-4 font-sans">
                BPM Challenge
              </h2>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-[7rem] leading-none font-display text-white tracking-tighter">
                  {totalScore}
                </span>
                <span className="text-3xl text-text-faint font-display">/ 20</span>
              </div>
              <p className="text-text-muted tracking-[0.3em] uppercase text-xs mt-4 font-sans">
                {emojiRow}
              </p>
            </div>

            <div className="grid grid-cols-5 gap-px bg-border p-px overflow-hidden rounded-sm">
              {results.map((r, i) => (
                <div key={i} className="flex flex-col items-center bg-bg py-6 hover:bg-surface transition-colors cursor-default gap-1">
                  <span className="text-text-faint text-[9px] uppercase tracking-widest">R{i + 1}</span>
                  <span className="text-xl">{r.emoji}</span>
                  <span className="text-white font-display text-base">{r.targetBpm}</span>
                  <span className="text-text-muted text-[10px]">↳ {r.guessedBpm}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-10">
              <button
                onClick={copyShare}
                className="flex-1 py-4 rounded-full border border-border text-white hover:bg-white hover:text-black transition-all tracking-widest uppercase text-xs"
              >
                Share
              </button>
              <button
                onClick={resetGame}
                className="flex-1 py-4 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-xs"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
