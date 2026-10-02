import { describe, it, expect } from 'vitest';
import {
  getDailyDateString, getPreviousDateString, getPuzzleNumber, msUntilNextDay, formatCountdown,
  isDateString, isPlausibleDailyDate, nextStreak, liveStreak, PUZZLE_EPOCH,
} from '@/lib/daily';

describe('date strings', () => {
  it('formats the local calendar date', () => {
    expect(getDailyDateString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(getDailyDateString(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
  });

  it('validates YYYY-MM-DD strictly', () => {
    expect(isDateString('2026-10-02')).toBe(true);
    expect(isDateString('2026-02-30')).toBe(false);
    expect(isDateString('2026-1-02')).toBe(false);
    expect(isDateString(20261002)).toBe(false);
    expect(isDateString("2026-10-02'; drop table scores;--")).toBe(false);
  });

  it('steps back across month, year and leap-day boundaries', () => {
    expect(getPreviousDateString('2026-03-01')).toBe('2026-02-28');
    expect(getPreviousDateString('2028-03-01')).toBe('2028-02-29');
    expect(getPreviousDateString('2027-01-01')).toBe('2026-12-31');
    // US DST start/end — calendar arithmetic must not skip or repeat
    expect(getPreviousDateString('2026-03-09')).toBe('2026-03-08');
    expect(getPreviousDateString('2026-11-02')).toBe('2026-11-01');
  });
});

describe('puzzle number', () => {
  it('is 1 on the epoch and increments daily', () => {
    expect(getPuzzleNumber(PUZZLE_EPOCH)).toBe(1);
    expect(getPuzzleNumber('2026-03-30')).toBe(2);
    expect(getPuzzleNumber('2026-10-02')).toBe(188);
  });
});

describe('countdown', () => {
  it('counts to local midnight', () => {
    expect(msUntilNextDay(new Date(2026, 9, 2, 23, 59, 30))).toBe(30_000);
    expect(msUntilNextDay(new Date(2026, 9, 2, 0, 0, 0))).toBe(24 * 3600_000);
  });

  it('formats hh:mm:ss and never goes negative', () => {
    expect(formatCountdown(3_723_000)).toBe('01:02:03');
    expect(formatCountdown(-5)).toBe('00:00:00');
  });
});

describe('isPlausibleDailyDate', () => {
  const now = Date.parse('2026-10-02T12:00:00Z');
  it('accepts every date that is "today" somewhere on Earth', () => {
    expect(isPlausibleDailyDate('2026-10-02', now)).toBe(true);
    expect(isPlausibleDailyDate('2026-10-01', Date.parse('2026-10-02T11:00:00Z'))).toBe(true); // UTC-12
    expect(isPlausibleDailyDate('2026-10-03', Date.parse('2026-10-02T10:00:00Z'))).toBe(true); // UTC+14
  });
  it('rejects past/future puzzles and garbage', () => {
    expect(isPlausibleDailyDate('2026-09-30', now)).toBe(false);
    expect(isPlausibleDailyDate('2026-10-04', now)).toBe(false);
    expect(isPlausibleDailyDate('yesterday', now)).toBe(false);
    expect(isPlausibleDailyDate(undefined, now)).toBe(false);
  });
});

describe('streaks', () => {
  it('extends on consecutive days, resets after a gap', () => {
    expect(nextStreak('2026-10-01', '2026-10-02', 4)).toBe(5);
    expect(nextStreak('2026-09-29', '2026-10-02', 4)).toBe(1);
    expect(nextStreak(null, '2026-10-02', 0)).toBe(1);
  });
  it('replaying the same day never double-counts', () => {
    expect(nextStreak('2026-10-02', '2026-10-02', 5)).toBe(5);
  });
  it('a lapsed streak displays as 0', () => {
    expect(liveStreak('2026-10-01', '2026-10-02', 7)).toBe(7);
    expect(liveStreak('2026-10-02', '2026-10-02', 7)).toBe(7);
    expect(liveStreak('2026-09-20', '2026-10-02', 7)).toBe(0);
    expect(liveStreak(null, '2026-10-02', 3)).toBe(0);
  });
});
