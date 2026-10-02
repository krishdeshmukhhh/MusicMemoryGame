// lib/validate.ts — server-side input validation for the API routes.
// The leaderboard score is never trusted from the client: it is recomputed from the
// submitted notes against the deterministic daily sequence.

import { NOTES, NOTES_PER_ROUND, ROUNDS_PER_GAME, MAX_GAME_SCORE, getDailySequences, scoreRound, totalScore } from './seed';
import { isPlausibleDailyDate } from './daily';
import { BPM_MAX_SCORE } from './bpm';

export function sanitizeDeviceId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const id = raw.trim();
  return /^[A-Za-z0-9_-]{4,64}$/.test(id) ? id : null;
}

/** Up to 3 uppercase letters/digits; anything else is stripped. */
export function sanitizeInitials(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
  return clean.length > 0 ? clean : null;
}

export function sanitizeScore(raw: unknown, max: number): number | null {
  const n = typeof raw === 'number' ? raw : Number.NaN;
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  return Math.round(n * 100) / 100;
}

export const sanitizePitchScore = (raw: unknown) => sanitizeScore(raw, MAX_GAME_SCORE);
export const sanitizeBpmScore = (raw: unknown) => sanitizeScore(raw, BPM_MAX_SCORE);

export type PitchSubmission =
  | { ok: true; score: number; rounds: string[][] }
  | { ok: false; error: string };

export function validatePitchSubmission(dateStr: unknown, rounds: unknown, nowMs: number = Date.now()): PitchSubmission {
  if (!isPlausibleDailyDate(dateStr, nowMs)) {
    return { ok: false, error: 'This daily puzzle is not open for submissions.' };
  }
  const valid =
    Array.isArray(rounds) &&
    rounds.length === ROUNDS_PER_GAME &&
    rounds.every(r => Array.isArray(r) && r.length === NOTES_PER_ROUND && r.every(n => typeof n === 'string' && NOTES.includes(n)));
  if (!valid) return { ok: false, error: 'Malformed submission.' };

  const typedRounds = rounds as string[][];
  const answers = getDailySequences(dateStr as string);
  const score = totalScore(typedRounds.map((player, i) => scoreRound(player, answers[i])));
  return { ok: true, score, rounds: typedRounds };
}
