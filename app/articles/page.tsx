import { Metadata } from 'next';
import GameClient from '@/components/GameClient';

export const metadata: Metadata = {
  title: 'Ear Training & Perfect Pitch Guides | pitchd. Articles',
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
    images: [{ url: 'https://pitchd.net/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ear Training Guides | pitchd.',
    description: 'Perfect pitch, interval recognition, and ear training — free articles.',
    images: ['https://pitchd.net/og.png'],
  },
};

const ARTICLES = [
  { slug: 'wordle-for-musicians',                  title: 'The Best Wordle-Like Games for Musicians' },
  { slug: 'how-to-get-perfect-pitch-as-an-adult',  title: 'Can You Get Perfect Pitch as an Adult? What Science Says' },
  { slug: 'best-ear-training-games-online',        title: 'The Best Free Ear Training Games Online (2026)' },
  { slug: 'interval-recognition-training',         title: "Interval Recognition Training: The Complete Beginner's Guide" },
  { slug: 'perfect-pitch-vs-relative-pitch',       title: 'Perfect Pitch vs. Relative Pitch: What is the difference?' },
  { slug: 'how-to-train-your-ears',               title: 'The Ultimate Guide to Ear Training' },
];

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
      <GameClient />
    </>
  );
}
