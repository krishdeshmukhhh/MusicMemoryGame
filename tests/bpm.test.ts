import { describe, it, expect } from 'vitest';
import { scoreGuess, getDifficulty, bpmFromTaps, ALL_BPMS, SLIDER_MIN, SLIDER_MAX } from '@/lib/bpm';

describe('scoreGuess', () => {
  it('hits the clean tier boundaries at 100 BPM', () => {
    expect(scoreGuess(100, 100)).toMatchObject({ label: 'Perfect', points: 4 });
    expect(scoreGuess(100, 103)).toMatchObject({ label: 'Perfect', points: 3 });
    expect(scoreGuess(100, 108)).toMatchObject({ label: 'Great', points: 2 });
    expect(scoreGuess(100, 115)).toMatchObject({ label: 'Good', points: 1 });
    expect(scoreGuess(100, 125)).toMatchObject({ label: 'Close', points: 0 });
    expect(scoreGuess(100, 126)).toMatchObject({ label: 'Miss', points: 0 });
  });

  it('is symmetric around the target and scales by percentage', () => {
    expect(scoreGuess(100, 95).points).toBe(scoreGuess(100, 105).points);
    expect(scoreGuess(60, 63).points).toBe(scoreGuess(120, 126).points);
  });

  it('never increases as the guess moves away (monotone, continuous)', () => {
    let prev = scoreGuess(120, 120).points;
    for (let g = 121; g <= 200; g++) {
      const p = scoreGuess(120, g).points;
      expect(p).toBeLessThanOrEqual(prev);
      expect(prev - p).toBeLessThan(0.5); // no cliffs between tiers
      prev = p;
    }
  });
});

describe('getDifficulty', () => {
  it('classifies every pooled tempo', () => {
    expect(getDifficulty(60)).toBe('easy');
    expect(getDifficulty(72)).toBe('medium');
    expect(getDifficulty(152)).toBe('hard');
    ALL_BPMS.forEach(b => expect(['easy', 'medium', 'hard']).toContain(getDifficulty(b)));
  });
});

describe('bpmFromTaps', () => {
  it('needs two taps', () => {
    expect(bpmFromTaps([])).toBeNull();
    expect(bpmFromTaps([1000])).toBeNull();
  });
  it('averages the intervals', () => {
    expect(bpmFromTaps([0, 500, 1000, 1500])).toBe(120);
    expect(bpmFromTaps([0, 480, 1020])).toBe(118); // avg 510ms
  });
  it('clamps to the slider range', () => {
    expect(bpmFromTaps([0, 5000])).toBe(SLIDER_MIN);
    expect(bpmFromTaps([0, 50])).toBe(SLIDER_MAX);
  });
});
