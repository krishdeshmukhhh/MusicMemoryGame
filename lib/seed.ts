// lib/seed.ts — note pool, deterministic daily sequences, and pitch scoring.
// Shared by the client (gameplay) and the server (score verification), so the
// two can never disagree about what a round was worth.

export { getDailyDateString } from './daily';

export const NOTES = [
  'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4',
  'C5', 'Db5', 'D5', 'Eb5', 'E5'
];

export const NOTES_PER_ROUND = 4;
export const ROUNDS_PER_GAME = 5;
export const MAX_NOTE_SCORE = 2.5;
export const MAX_GAME_SCORE = MAX_NOTE_SCORE * NOTES_PER_ROUND * ROUNDS_PER_GAME; // 50

// Mulberry32 PRNG
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function stringToSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for(let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return h;
}

export function getDailySequenceForRound(dateStr: string, round: number): string[] {
  // Hash the round number directly into the deterministic date string
  const random = mulberry32(stringToSeed(`${dateStr}-R${round}`));
  return Array.from({ length: NOTES_PER_ROUND }, () => NOTES[Math.floor(random() * NOTES.length)]);
}

export function getDailySequences(dateStr: string): string[][] {
  return Array.from({ length: ROUNDS_PER_GAME }, (_, i) => getDailySequenceForRound(dateStr, i + 1));
}

export function getDailyBpmSequence(dateStr: string, allBpms: number[]): number[] {
  return Array.from({ length: ROUNDS_PER_GAME }, (_, i) => {
    const random = mulberry32(stringToSeed(`${dateStr}-bpm-R${i + 1}`));
    return allBpms[Math.floor(random() * allBpms.length)];
  });
}

export function generateRandomSequence(): string[] {
  return Array.from({ length: NOTES_PER_ROUND }, () => NOTES[Math.floor(Math.random() * NOTES.length)]);
}

export function scoreNote(playerNote: string, correctNote: string): number {
  const dist = Math.abs(NOTES.indexOf(playerNote) - NOTES.indexOf(correctNote));

  if (dist === 0) return 2.5;         // Perfect match
  if (dist === 12) return 2.0;        // Correct note, wrong octave! (Huge music theory win)
  if (dist === 7) return 1.5;         // Perfect 5th
  if (dist === 5) return 1.25;        // Perfect 4th
  if (dist === 1) return 1.0;         // 1 semitone off (fat finger or slightly flat/sharp)

  // For everything else, harsh decay
  return Math.max(0, 2.5 * Math.pow(0.5, dist));
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Round score, rounded to 2dp exactly as shown on the reveal screen. */
export function scoreRound(player: string[], correct: string[]): number {
  return round2(correct.reduce((sum, note, i) => sum + scoreNote(player[i], note), 0));
}

/** Game total from per-round (already rounded) scores. */
export function totalScore(roundScores: number[]): number {
  return round2(roundScores.reduce((a, b) => a + b, 0));
}

export type NoteGrade = 'perfect' | 'octave' | 'close' | 'miss';

/** Coarse per-note grade used for the share grid. */
export function gradeNote(playerNote: string, correctNote: string): NoteGrade {
  const pts = scoreNote(playerNote, correctNote);
  if (pts === 2.5) return 'perfect';
  if (pts === 2.0) return 'octave';
  if (pts >= 1.0) return 'close';
  return 'miss';
}
