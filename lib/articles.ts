// lib/articles.ts — lightweight article index + lazy content loader.
// Article bodies (~200 KB of text) live in lib/pitch-articles.ts and lib/bpm-articles.ts.
// Server components build the index with `toArticleIndex()` and pass it to GameClient
// as props; the client only downloads a body when the player opens that article.

import type { ArticleData } from './pitch-articles';

export type { ArticleData };
export type ArticleKind = 'pitch' | 'bpm';
export type ArticleMeta = { slug: string; title: string; description: string; date: string };

/** Newest first. */
export function toArticleIndex(articles: Record<string, ArticleData>): ArticleMeta[] {
  return Object.entries(articles)
    .map(([slug, a]) => ({ slug, title: a.title, description: a.description, date: a.date }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function articlePath(kind: ArticleKind, slug: string): string {
  return kind === 'bpm' ? `/bpm/articles/${slug}` : `/articles/${slug}`;
}

export async function loadArticle(kind: ArticleKind, slug: string): Promise<ArticleData | null> {
  const lib = kind === 'bpm'
    ? (await import('./bpm-articles')).BPM_ARTICLES
    : (await import('./pitch-articles')).PITCH_ARTICLES;
  return lib[slug] ?? null;
}
