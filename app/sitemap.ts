import { MetadataRoute } from 'next';
import { PITCH_ARTICLES } from '@/lib/pitch-articles';
import { BPM_ARTICLES } from '@/lib/bpm-articles';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: 'https://pitchd.net',             lastModified: new Date(), changeFrequency: 'daily',   priority: 1   },
    { url: 'https://pitchd.net/bpm',         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: 'https://pitchd.net/articles',    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: 'https://pitchd.net/bpm/articles',lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: 'https://pitchd.net/scoring',     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://pitchd.net/bpm/scoring', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  const pitchArticles: MetadataRoute.Sitemap = Object.entries(PITCH_ARTICLES).map(([slug, article]) => ({
    url: `https://pitchd.net/articles/${slug}`,
    lastModified: new Date(article.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const bpmArticles: MetadataRoute.Sitemap = Object.entries(BPM_ARTICLES).map(([slug, article]) => ({
    url: `https://pitchd.net/bpm/articles/${slug}`,
    lastModified: new Date(article.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...pitchArticles, ...bpmArticles];
}
