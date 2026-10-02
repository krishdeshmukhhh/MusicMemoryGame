// lib/daily.ts — calendar helpers shared by both games, the API routes and share links.
// Every "date string" is a YYYY-MM-DD in the *player's local* calendar, so the daily
// puzzle rolls over at local midnight and streaks never depend on the UTC offset.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Day #1 of the daily puzzle (used for the Wordle-style "pitchd #123" number). */
export const PUZZLE_EPOCH = '2026-03-29';

const pad = (n: number) => String(n).padStart(2, '0');

export function getDailyDateString(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isDateString(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const t = Date.parse(`${s}T00:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === s;
}

// Calendar arithmetic is done in UTC so DST transitions can never skip or repeat a day.
const dateStringToUtcMs = (s: string) => Date.parse(`${s}T00:00:00Z`);
const utcMsToDateString = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function getPreviousDateString(dateStr: string): string {
  return utcMsToDateString(dateStringToUtcMs(dateStr) - DAY_MS);
}

export function getPuzzleNumber(dateStr: string): number {
  return Math.round((dateStringToUtcMs(dateStr) - dateStringToUtcMs(PUZZLE_EPOCH)) / DAY_MS) + 1;
}

/** Milliseconds until the next local midnight — drives the "next puzzle in" countdown. */
export function msUntilNextDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/**
 * True when `dateStr` is "today" somewhere on Earth (UTC−12 … UTC+14).
 * The server uses this to reject daily submissions for past or future puzzles
 * without needing to know the player's timezone.
 */
export function isPlausibleDailyDate(dateStr: unknown, nowMs: number = Date.now()): boolean {
  if (!isDateString(dateStr)) return false;
  const earliest = utcMsToDateString(nowMs - 12 * 60 * 60 * 1000);
  const latest = utcMsToDateString(nowMs + 14 * 60 * 60 * 1000);
  return dateStr >= earliest && dateStr <= latest;
}

/** Streak after completing today's daily. Replaying the same day never double-counts. */
export function nextStreak(lastPlayed: string | null, today: string, current: number): number {
  if (lastPlayed === today) return Math.max(current, 1);
  if (lastPlayed === getPreviousDateString(today)) return current + 1;
  return 1;
}

/** Streak to *display*: a streak whose last play is older than yesterday has lapsed. */
export function liveStreak(lastPlayed: string | null, today: string, stored: number): number {
  if (lastPlayed === today || lastPlayed === getPreviousDateString(today)) return stored;
  return 0;
}
