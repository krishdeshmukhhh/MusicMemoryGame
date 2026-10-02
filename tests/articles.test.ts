import { describe, it, expect } from 'vitest';
import { toArticleIndex, articlePath } from '@/lib/articles';
import { PITCH_ARTICLES } from '@/lib/pitch-articles';
import { BPM_ARTICLES } from '@/lib/bpm-articles';
import { isDateString } from '@/lib/daily';

describe.each([
  ['pitch', PITCH_ARTICLES],
  ['bpm', BPM_ARTICLES],
] as const)('%s articles', (kind, articles) => {
  const entries = Object.entries(articles);

  it('every article is complete', () => {
    expect(entries.length).toBeGreaterThan(0);
    for (const [slug, a] of entries) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(a.title.length, slug).toBeGreaterThan(10);
      expect(a.description.length, slug).toBeGreaterThan(40);
      expect(a.description.length, `${slug} meta description too long for SERPs`).toBeLessThanOrEqual(200);
      expect(isDateString(a.date), slug).toBe(true);
      expect(a.cta.length, slug).toBeGreaterThan(0);
      expect(a.sections.length, slug).toBeGreaterThanOrEqual(5);
      expect(a.sections.length, slug).toBeLessThanOrEqual(8);
      a.sections.forEach(s => {
        expect(s.heading.length, slug).toBeGreaterThan(0);
        expect(s.body.length, slug).toBeGreaterThan(100);
      });
    }
  });

  it('index is newest-first and lists every article once', () => {
    const index = toArticleIndex(articles);
    expect(index.map(a => a.slug).sort()).toEqual(Object.keys(articles).sort());
    for (let i = 1; i < index.length; i++) expect(index[i - 1].date >= index[i].date).toBe(true);
  });

  it('builds the right URL', () => {
    expect(articlePath(kind, 'x')).toBe(kind === 'bpm' ? '/bpm/articles/x' : '/articles/x');
  });
});

it('no slug collides across the two article sets', () => {
  const pitch = new Set(Object.keys(PITCH_ARTICLES));
  expect(Object.keys(BPM_ARTICLES).filter(s => pitch.has(s))).toEqual([]);
});
