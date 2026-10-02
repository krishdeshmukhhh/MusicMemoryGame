import { describe, it, expect } from 'vitest';
import { validatePitchSubmission, sanitizeInitials, sanitizeDeviceId, sanitizePitchScore, sanitizeBpmScore } from '@/lib/validate';
import { getDailySequences, NOTES } from '@/lib/seed';

const DATE = '2026-10-02';
const NOW = Date.parse('2026-10-02T15:00:00Z');

describe('validatePitchSubmission', () => {
  it('recomputes the score from the real daily answers', () => {
    const perfect = getDailySequences(DATE);
    expect(validatePitchSubmission(DATE, perfect, NOW)).toEqual({ ok: true, score: 50, rounds: perfect });
  });

  it('cannot be tricked into a higher score than the notes earn', () => {
    const answers = getDailySequences(DATE);
    // shift every note: guaranteed not to be a perfect game
    const wrong = answers.map(r => r.map(n => NOTES[(NOTES.indexOf(n) + 3) % NOTES.length]));
    const res = validatePitchSubmission(DATE, wrong, NOW);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.score).toBeLessThan(50);
  });

  it('rejects stale or future puzzles', () => {
    const answersOld = getDailySequences('2026-09-01');
    expect(validatePitchSubmission('2026-09-01', answersOld, NOW).ok).toBe(false);
    expect(validatePitchSubmission('2026-10-05', getDailySequences('2026-10-05'), NOW).ok).toBe(false);
  });

  it('rejects malformed payloads', () => {
    const good = getDailySequences(DATE);
    expect(validatePitchSubmission(DATE, good.slice(0, 4), NOW).ok).toBe(false);
    expect(validatePitchSubmission(DATE, [...good.slice(0, 4), ['C4', 'C4', 'C4']], NOW).ok).toBe(false);
    expect(validatePitchSubmission(DATE, [...good.slice(0, 4), ['C4', 'C4', 'C4', 'X9']], NOW).ok).toBe(false);
    expect(validatePitchSubmission(DATE, 'gggg', NOW).ok).toBe(false);
    expect(validatePitchSubmission(DATE, null, NOW).ok).toBe(false);
  });
});

describe('sanitizers', () => {
  it('initials: uppercase alphanumerics, max 3', () => {
    expect(sanitizeInitials('kd')).toBe('KD');
    expect(sanitizeInitials('a.b-c!d')).toBe('ABC');
    expect(sanitizeInitials('<script>')).toBe('SCR');
    expect(sanitizeInitials('  ')).toBeNull();
    expect(sanitizeInitials(42)).toBeNull();
  });

  it('device ids', () => {
    expect(sanitizeDeviceId('anon-k3j2h4g5f6')).toBe('anon-k3j2h4g5f6');
    expect(sanitizeDeviceId('x')).toBeNull();
    expect(sanitizeDeviceId('a'.repeat(65))).toBeNull();
    expect(sanitizeDeviceId("anon'; --")).toBeNull();
    expect(sanitizeDeviceId(undefined)).toBeNull();
  });

  it('scores are bounded per game', () => {
    expect(sanitizePitchScore(38.456)).toBe(38.46);
    expect(sanitizePitchScore(50.01)).toBeNull();
    expect(sanitizePitchScore(-1)).toBeNull();
    expect(sanitizePitchScore('40')).toBeNull();
    expect(sanitizeBpmScore(20)).toBe(20);
    expect(sanitizeBpmScore(21)).toBeNull();
    expect(sanitizeBpmScore(Number.NaN)).toBeNull();
  });
});
