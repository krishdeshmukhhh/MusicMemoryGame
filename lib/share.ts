// lib/share.ts — share text + share-link encoding for both games, and the
// native-share/clipboard helper. The compact `grid` string travels in /share URLs
// and is decoded by the share landing page and /api/og.

import { gradeNote, type NoteGrade } from './seed';
import { getPuzzleNumber } from './daily';
import type { BpmTier } from './bpm';

export const SITE_URL = 'https://pitchd.net';

export type GameKind = 'pitch' | 'bpm';

// One letter per cell. Pitch: per note. BPM: per round.
const PITCH_CODES: Record<NoteGrade, string> = { perfect: 'g', octave: 'b', close: 'y', miss: 'r' };
const BPM_CODES: Record<BpmTier, string> = { Perfect: 'g', Great: 'y', Good: 'o', Close: 'n', Miss: 'r' };

export const CELL_EMOJI: Record<string, string> = { g: '🟩', b: '🟦', y: '🟨', o: '🟧', n: '🟫', r: '🟥' };
export const CELL_COLOR: Record<string, string> = {
  g: '#22c55e', b: '#3b82f6', y: '#eab308', o: '#f97316', n: '#78716c', r: '#ef4444',
};

/** Pitch grid: 5 rows of 4 cells, rows joined with '-' (e.g. "ggyb-gggg-…"). */
export function encodePitchGrid(rounds: { player: string[]; correct: string[] }[]): string {
  return rounds
    .map(r => r.correct.map((note, i) => PITCH_CODES[gradeNote(r.player[i], note)]).join(''))
    .join('-');
}

/** BPM grid: one cell per round (e.g. "gyonr"). */
export function encodeBpmGrid(results: { label: string }[]): string {
  return results.map(r => BPM_CODES[r.label as BpmTier] ?? 'r').join('');
}

/** Parse an untrusted grid string from a URL; returns rows of cell codes or null. */
export function decodeGrid(grid: string | null | undefined, game: GameKind): string[][] | null {
  if (!grid) return null;
  if (game === 'pitch') {
    if (!/^[gbyr]{4}(-[gbyr]{4}){0,4}$/.test(grid)) return null;
    return grid.split('-').map(row => row.split(''));
  }
  if (!/^[gyonr]{1,5}$/.test(grid)) return null;
  return [grid.split('')];
}

export function gridToEmoji(rows: string[][]): string {
  return rows.map(row => row.map(c => CELL_EMOJI[c] ?? '⬛').join('')).join('\n');
}

export type ShareParams = {
  game: GameKind;
  score: number;
  dateStr: string;
  daily: boolean;
  grid: string;
  percentile?: number | null;
  streak?: number;
};

export function buildShareUrl(p: ShareParams): string {
  const q = new URLSearchParams();
  q.set('game', p.game);
  q.set('score', p.score.toFixed(2));
  q.set('grid', p.grid);
  if (p.daily) q.set('n', String(getPuzzleNumber(p.dateStr)));
  if (p.percentile) q.set('percentile', String(p.percentile));
  if (p.daily && p.streak && p.streak > 1) q.set('streak', String(p.streak));
  return `${SITE_URL}/share?${q.toString()}`;
}

export function buildShareText(p: ShareParams): string {
  const max = p.game === 'pitch' ? 50 : 20;
  const name = p.game === 'pitch' ? 'pitchd' : 'bpm.';
  const header = p.daily
    ? `${name} #${getPuzzleNumber(p.dateStr)} — ${p.score.toFixed(2)}/${max}`
    : `${name} practice — ${p.score.toFixed(2)}/${max}`;

  const lines = [header];
  if (p.percentile) lines.push(`🏆 Top ${p.percentile}% today`);
  if (p.daily && p.streak && p.streak > 1) lines.push(`🔥 ${p.streak} day streak`);

  const rows = decodeGrid(p.grid, p.game);
  if (rows) lines.push('', gridToEmoji(rows));

  lines.push('', buildShareUrl(p));
  return lines.join('\n');
}

export type ShareOutcome = 'shared' | 'copied' | 'failed' | 'cancelled';

/**
 * Native share sheet on touch devices (where it reaches Messages/WhatsApp/IG),
 * clipboard everywhere else. Never throws.
 */
export async function shareResult(text: string): Promise<ShareOutcome> {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

  if (nav?.share && isTouch) {
    try {
      await nav.share({ text });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // fall through to clipboard
    }
  }
  try {
    await nav!.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
