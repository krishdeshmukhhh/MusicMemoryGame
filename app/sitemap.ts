import { MetadataRoute } from 'next';
import { PITCH_ARTICLES } from '@/lib/pitch-articles';
import { BPM_ARTICLES } from '@/lib/bpm-articles';
import { articlePath, type ArticleKind } from '@/lib/articles';
import type { ArticleData } from '@/lib/pitch-articles';

const SITE = 'https://pitchd.net';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE,                     lastModified: now, changeFrequency: 'daily',   priority: 1   },
    { url: `${SITE}/bpm`,            lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE}/articles`,       lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE}/bpm/articles`,   lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${SITE}/scoring`,        lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/bpm/scoring`,    lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  const articles = (kind: ArticleKind, all: Record<string, ArticleData>, priority: number): MetadataRoute.Sitemap =>
    Object.entries(all).map(([slug, article]) => ({
      url: `${SITE}${articlePath(kind, slug)}`,
      lastModified: new Date(article.date),
      changeFrequency: 'monthly',
      priority,
    }));

  return [...staticRoutes, ...articles('pitch', PITCH_ARTICLES, 0.7), ...articles('bpm', BPM_ARTICLES, 0.6)];
}
