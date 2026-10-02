import { describe, it, expect } from 'vitest';
import {
  NOTES, MAX_GAME_SCORE, scoreNote, scoreRound, totalScore, gradeNote,
  getDailySequenceForRound, getDailySequences, getDailyBpmSequence,
} from '@/lib/seed';
import { ALL_BPMS } from '@/lib/bpm';

describe('scoreNote', () => {
  it('awards the harmonic special cases', () => {
    expect(scoreNote('C4', 'C4')).toBe(2.5);   // exact
    expect(scoreNote('C5', 'C4')).toBe(2.0);   // octave
    expect(scoreNote('G4', 'C4')).toBe(1.5);   // perfect 5th
    expect(scoreNote('F4', 'C4')).toBe(1.25);  // perfect 4th
    expect(scoreNote('Db4', 'C4')).toBe(1.0);  // semitone
  });

  it('is symmetric', () => {
    for (const a of NOTES) for (const b of NOTES) {
      expect(scoreNote(a, b)).toBe(scoreNote(b, a));
    }
  });

  it('decays exponentially for other distances', () => {
    expect(scoreNote('D4', 'C4')).toBeCloseTo(2.5 * 0.25);  // 2 semitones
    expect(scoreNote('Eb4', 'C4')).toBeCloseTo(2.5 * 0.125); // 3 semitones
    expect(scoreNote('E5', 'C4')).toBeGreaterThanOrEqual(0); // 16 semitones
  });
});

describe('round + game scoring', () => {
  it('a perfect game is exactly 50', () => {
    const rounds = getDailySequences('2026-10-02');
    expect(totalScore(rounds.map(r => scoreRound(r, r)))).toBe(MAX_GAME_SCORE);
  });

  it('rounds each round to 2dp before summing (matches the reveal screen)', () => {
    // 4 notes 3 semitones off = 4 × 0.3125 = 1.25
    expect(scoreRound(['Eb4', 'Eb4', 'Eb4', 'Eb4'], ['C4', 'C4', 'C4', 'C4'])).toBe(1.25);
    // 2 semitones = 0.625 each → 2.5
    expect(scoreRound(['D4', 'D4', 'D4', 'D4'], ['C4', 'C4', 'C4', 'C4'])).toBe(2.5);
    expect(totalScore([1.005, 2.004])).toBe(3.01);
  });
});

describe('gradeNote', () => {
  it('maps scores to share-grid grades', () => {
    expect(gradeNote('C4', 'C4')).toBe('perfect');
    expect(gradeNote('C5', 'C4')).toBe('octave');
    expect(gradeNote('G4', 'C4')).toBe('close');
    expect(gradeNote('Db4', 'C4')).toBe('close');
    expect(gradeNote('D4', 'C4')).toBe('miss');
  });
});

describe('daily determinism', () => {
  it('same date → same sequence for every player', () => {
    expect(getDailySequenceForRound('2026-10-02', 3)).toEqual(getDailySequenceForRound('2026-10-02', 3));
    expect(getDailyBpmSequence('2026-10-02', ALL_BPMS)).toEqual(getDailyBpmSequence('2026-10-02', ALL_BPMS));
  });

  it('different dates/rounds differ (overwhelmingly)', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 28; d++) {
      seen.add(getDailySequenceForRound(`2026-02-${String(d).padStart(2, '0')}`, 1).join());
    }
    expect(seen.size).toBeGreaterThan(25);
  });

  it('only produces notes from the pool and BPMs from the pools', () => {
    for (const round of getDailySequences('2026-12-31')) {
      expect(round).toHaveLength(4);
      round.forEach(n => expect(NOTES).toContain(n));
    }
    getDailyBpmSequence('2026-12-31', ALL_BPMS).forEach(b => expect(ALL_BPMS).toContain(b));
  });

  it('is stable across releases (values captured from the original implementation)', () => {
    // If this fails, every player's daily puzzle and the server-side verification changed.
    expect(getDailySequenceForRound('2026-04-01', 1)).toEqual(['E4', 'G4', 'D4', 'F4']);
    expect(getDailyBpmSequence('2026-04-01', ALL_BPMS)).toEqual([70, 107, 128, 107, 85]);
  });
});
