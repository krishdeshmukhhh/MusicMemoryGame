// lib/bpm.ts — BPM Guesser rules: tempo pools and scoring. Pure, so it is unit-tested
// and shared by the hook and the share/OG code.

export const BPM_EASY   = [60, 70, 80, 90, 100, 110, 120];
export const BPM_MEDIUM = [72, 85, 96, 108, 116, 128];
export const BPM_HARD   = [67, 78, 93, 107, 113, 137, 152];
export const ALL_BPMS   = [...BPM_EASY, ...BPM_MEDIUM, ...BPM_HARD];

export const BPM_ROUNDS     = 5;
export const BPM_MAX_ROUND  = 4;
export const BPM_MAX_SCORE  = BPM_MAX_ROUND * BPM_ROUNDS; // 20
export const LISTEN_SECONDS = 4;
export const SLIDER_MIN     = 40;
export const SLIDER_MAX     = 200;
export const SLIDER_DEFAULT = 100;

export type Difficulty = 'easy' | 'medium' | 'hard';
export type BpmTier = 'Perfect' | 'Great' | 'Good' | 'Close' | 'Miss';

export const TIER_EMOJI: Record<BpmTier, string> = {
  Perfect: '🟩', Great: '🟨', Good: '🟧', Close: '🟫', Miss: '🟥',
};

export function getDifficulty(bpm: number): Difficulty {
  if (BPM_EASY.includes(bpm)) return 'easy';
  if (BPM_MEDIUM.includes(bpm)) return 'medium';
  return 'hard';
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function scoreGuess(target: number, guess: number): { label: BpmTier; emoji: string; points: number; pct: number } {
  const pct = (Math.abs(target - guess) / target) * 100;
  const result = (label: BpmTier, points: number) => ({ label, emoji: TIER_EMOJI[label], points: round2(points), pct: round2(pct) });

  // Wider tiers — boundaries are clean integers, interpolation is linear within each.
  if (pct <= 3)  return result('Perfect', 4 - pct / 3);
  if (pct <= 8)  return result('Great',   3 - (pct - 3) / 5);
  if (pct <= 15) return result('Good',    2 - (pct - 8) / 7);
  if (pct <= 25) return result('Close',   1 - (pct - 15) / 10);
  return result('Miss', 0);
}

/** Average BPM from tap timestamps (ms), clamped to the slider range. Null until 2 taps. */
export function bpmFromTaps(taps: number[]): number | null {
  if (taps.length < 2) return null;
  const avg = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
  if (avg <= 0) return null;
  return Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, Math.round(60000 / avg)));
}
