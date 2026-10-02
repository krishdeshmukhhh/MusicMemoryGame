import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/og'],
      disallow: ['/api/', '/share'],
    },
    sitemap: 'https://pitchd.net/sitemap.xml',
  };
}
