import { Metadata } from 'next';
import GameShell from '@/components/GameShell';
import { PITCH_ARTICLES } from '@/lib/pitch-articles';
import { toArticleIndex } from '@/lib/articles';

export const metadata: Metadata = {
  title: 'Ear Training & Perfect Pitch Guides',
  description: 'In-depth guides on perfect pitch, relative pitch, interval recognition, and daily ear training routines. Free articles from pitchd.',
  keywords: ['ear training guides', 'perfect pitch articles', 'interval recognition guide', 'relative pitch training', 'music theory articles', 'pitchd'],
  alternates: {
    canonical: 'https://pitchd.net/articles',
  },
  openGraph: {
    title: 'Ear Training Guides | pitchd.',
    description: 'In-depth guides on perfect pitch, relative pitch, interval recognition, and daily ear training routines.',
    url: 'https://pitchd.net/articles',
    type: 'website',
    images: [{ url: 'https://pitchd.net/api/og?title=Ear+Training+%26+Perfect+Pitch+Guides&kicker=Articles', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ear Training Guides | pitchd.',
    description: 'Perfect pitch, interval recognition, and ear training — free articles.',
    images: ['https://pitchd.net/api/og?title=Ear+Training+%26+Perfect+Pitch+Guides&kicker=Articles'],
  },
};

const ARTICLES = toArticleIndex(PITCH_ARTICLES);

export default function ArticlesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Ear Training Guides",
            "description": "In-depth articles on perfect pitch, ear training, and music theory.",
            "url": "https://pitchd.net/articles",
            "itemListElement": ARTICLES.map((a, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "url": `https://pitchd.net/articles/${a.slug}`,
              "name": a.title,
            }))
          })
        }}
      />
      <GameShell />
    </>
  );
}
