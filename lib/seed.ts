// lib/seed.ts
export const NOTES = [
  'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4',
  'C5', 'Db5', 'D5', 'Eb5', 'E5'
];

// Simple Mulberry32 PRNG (Archived for Daily Mode)
function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function getDailyDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function stringToSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for(let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return h;
}

export function getDailySequence(dateStr: string = getDailyDateString()): string[] {
  const seed = stringToSeed(dateStr);
  const random = mulberry32(seed);

  const sequence: string[] = [];
  for (let i = 0; i < 4; i++) {
    const index = Math.floor(random() * NOTES.length);
    sequence.push(NOTES[index]);
  }
  return sequence;
}

export function generateRandomSequence(): string[] {
  const sequence: string[] = [];
  for (let i = 0; i < 4; i++) {
    const index = Math.floor(Math.random() * NOTES.length);
    sequence.push(NOTES[index]);
  }
  return sequence;
}

export function scoreNote(playerNote: string, correctNote: string): number {
  const dist = Math.abs(NOTES.indexOf(playerNote) - NOTES.indexOf(correctNote));
  // 4 notes per round -> max 10 points per round = 2.5 points per note max.
  // Use exponential decay to give granular decimal scores based on distance
  const score = 2.5 * Math.pow(0.8, dist);
  return score;
}
