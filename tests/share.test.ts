import { describe, it, expect } from 'vitest';
import { encodePitchGrid, encodeBpmGrid, decodeGrid, gridToEmoji, buildShareText, buildShareUrl } from '@/lib/share';

const ROUNDS = [
  { correct: ['C4', 'E4', 'G4', 'C5'], player: ['C4', 'E4', 'G4', 'C5'] }, // gggg
  { correct: ['C4', 'C4', 'C4', 'C4'], player: ['C5', 'G4', 'D4', 'C4'] }, // bgr… → b y r g
];

describe('grid encoding', () => {
  it('encodes pitch rounds per note', () => {
    expect(encodePitchGrid(ROUNDS)).toBe('gggg-byrg');
  });

  it('encodes BPM rounds per tier', () => {
    expect(encodeBpmGrid([{ label: 'Perfect' }, { label: 'Great' }, { label: 'Good' }, { label: 'Close' }, { label: 'Miss' }])).toBe('gyonr');
  });

  it('round-trips and renders emoji', () => {
    const rows = decodeGrid('gggg-byrg', 'pitch')!;
    expect(gridToEmoji(rows)).toBe('🟩🟩🟩🟩\n🟦🟨🟥🟩');
    expect(gridToEmoji(decodeGrid('gyonr', 'bpm')!)).toBe('🟩🟨🟧🟫🟥');
  });

  it('rejects untrusted/malformed grids from URLs', () => {
    expect(decodeGrid('<script>', 'pitch')).toBeNull();
    expect(decodeGrid('ggg', 'pitch')).toBeNull();
    expect(decodeGrid('gggg-gggg-gggg-gggg-gggg-gggg', 'pitch')).toBeNull();
    expect(decodeGrid('gggggg', 'bpm')).toBeNull();
    expect(decodeGrid('b', 'bpm')).toBeNull();
    expect(decodeGrid(null, 'bpm')).toBeNull();
  });
});

describe('share text', () => {
  it('builds a Wordle-style daily pitch share', () => {
    const text = buildShareText({
      game: 'pitch', score: 38.5, dateStr: '2026-10-02', daily: true,
      grid: 'gggg-byrg', percentile: 12, streak: 4,
    });
    expect(text).toBe([
      'pitchd #188 — 38.50/50',
      '🏆 Top 12% today',
      '🔥 4 day streak',
      '',
      '🟩🟩🟩🟩',
      '🟦🟨🟥🟩',
      '',
      'https://pitchd.net/share?game=pitch&score=38.50&grid=gggg-byrg&n=188&percentile=12&streak=4',
    ].join('\n'));
  });

  it('builds a practice BPM share without puzzle number or streak', () => {
    const text = buildShareText({ game: 'bpm', score: 15.234, dateStr: '2026-10-02', daily: false, grid: 'ggyor', streak: 9 });
    expect(text).toBe('bpm. practice — 15.23/20\n\n🟩🟩🟨🟧🟥\n\nhttps://pitchd.net/share?game=bpm&score=15.23&grid=ggyor');
  });

  it('omits a 1-day streak from the link', () => {
    expect(buildShareUrl({ game: 'pitch', score: 10, dateStr: '2026-10-02', daily: true, grid: 'gggg', streak: 1 }))
      .not.toContain('streak');
  });
});
