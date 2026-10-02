import type { Metadata } from 'next';
import GameShell from '@/components/GameShell';
import { BPM_ARTICLES } from '@/lib/bpm-articles';
import { toArticleIndex } from '@/lib/articles';

const OG_IMAGE = 'https://pitchd.net/api/og?game=bpm&title=Rhythm+%26+BPM+Training+Guides&kicker=Articles';

export const metadata: Metadata = {
  title: 'Rhythm & BPM Training Guides',
  description: 'Articles on tempo training, beat recognition, BPM ear development, and how to improve your sense of rhythm.',
  keywords: ['bpm training', 'tempo ear training', 'rhythm guides', 'beat recognition articles', 'how to improve bpm recognition', 'pitchd'],
  alternates: { canonical: 'https://pitchd.net/bpm/articles' },
  openGraph: {
    title: 'Rhythm & BPM Guides | pitchd.',
    description: 'Articles on tempo training, beat recognition, and rhythmic ear development.',
    url: 'https://pitchd.net/bpm/articles',
    type: 'website',
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rhythm & BPM Guides | pitchd.',
    description: 'Tempo training, beat recognition, and BPM guides — free articles.',
    images: [OG_IMAGE],
  },
};

const ARTICLES = toArticleIndex(BPM_ARTICLES);

export default function BpmArticlesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Rhythm & BPM Training Guides",
            "description": "Articles on tempo training, beat recognition, and rhythmic ear development.",
            "url": "https://pitchd.net/bpm/articles",
            "itemListElement": ARTICLES.map((a, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "url": `https://pitchd.net/bpm/articles/${a.slug}`,
              "name": a.title,
            }))
          })
        }}
      />
      <GameShell />
    </>
  );
}
