import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://pitchd.net',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://pitchd.net/articles',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://pitchd.net/articles/wordle-for-musicians',
      lastModified: new Date('2026-05-03'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://pitchd.net/articles/how-to-get-perfect-pitch-as-an-adult',
      lastModified: new Date('2026-05-04'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://pitchd.net/articles/best-ear-training-games-online',
      lastModified: new Date('2026-05-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://pitchd.net/articles/interval-recognition-training',
      lastModified: new Date('2026-05-02'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://pitchd.net/articles/perfect-pitch-vs-relative-pitch',
      lastModified: new Date('2026-04-30'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://pitchd.net/articles/how-to-train-your-ears',
      lastModified: new Date('2026-04-28'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://pitchd.net/scoring',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
