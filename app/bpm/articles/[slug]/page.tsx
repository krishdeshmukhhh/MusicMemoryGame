import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BackButton from '@/components/BackButton';
import { BPM_ARTICLES as ARTICLES } from '@/lib/bpm-articles';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(ARTICLES).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) return { title: 'Article Not Found | pitchd.' };

  return {
    title: `${article.title} | pitchd. BPM Guides`,
    description: article.description,
    keywords: ['bpm training', 'tempo ear training', 'rhythm recognition', 'metronome practice', 'beat recognition', 'pitchd'],
    alternates: { canonical: `https://pitchd.net/bpm/articles/${slug}` },
    openGraph: {
      title: `${article.title} | pitchd.`,
      description: article.description,
      url: `https://pitchd.net/bpm/articles/${slug}`,
      type: 'article',
      publishedTime: article.date,
      modifiedTime: article.date,
      images: [{ url: 'https://pitchd.net/og.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: ['https://pitchd.net/og.png'],
    },
  };
}

export default async function BpmArticleContentPage({ params }: Props) {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) notFound();

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-8 z-10 relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": article.description,
            "datePublished": article.date,
            "dateModified": article.date,
            "author": { "@type": "Organization", "name": "pitchd", "url": "https://pitchd.net" },
            "publisher": {
              "@type": "Organization",
              "name": "pitchd",
              "url": "https://pitchd.net",
              "logo": { "@type": "ImageObject", "url": "https://pitchd.net/icon.png" }
            },
            "mainEntityOfPage": { "@type": "WebPage", "@id": `https://pitchd.net/bpm/articles/${slug}` },
            "image": "https://pitchd.net/og.png",
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://pitchd.net" },
              { "@type": "ListItem", "position": 2, "name": "BPM Guesser", "item": "https://pitchd.net/bpm" },
              { "@type": "ListItem", "position": 3, "name": "BPM Guides", "item": "https://pitchd.net/bpm/articles" },
              { "@type": "ListItem", "position": 4, "name": article.title, "item": `https://pitchd.net/bpm/articles/${slug}` },
            ]
          })
        }}
      />

      <div className="w-full max-w-3xl mt-12 sm:mt-24 bg-surface-2 p-8 sm:p-16 rounded-3xl border border-border shadow-2xl relative">
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        </div>

        <BackButton label="Back to BPM Guides" fallback="/bpm/articles" />

        <span className="block text-text-muted text-[10px] font-sans tracking-[0.2em] uppercase mb-4 relative z-10">{article.date}</span>

        <h1 className="text-4xl sm:text-5xl font-display text-white mb-8 tracking-tighter leading-tight relative z-10">
          {article.title}
        </h1>

        <div className="prose prose-invert prose-orange max-w-none relative z-10 font-sans text-[#a0a0a0] leading-relaxed">
          <p className="text-xl mb-8 text-white/80">{article.description}</p>

          {article.sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-2xl font-display text-white mt-12 mb-4">{section.heading}</h2>
              <p className="mb-6">{section.body}</p>
            </div>
          ))}

          <div className="mt-16 p-8 bg-black/40 rounded-2xl border border-orange-500/20 text-center">
            <h3 className="text-2xl font-display text-white mb-4">{article.cta}</h3>
            <p className="mb-8 text-sm">Stop reading about it — test your sense of rhythm against real BPMs right now.</p>
            <Link
              href="/bpm"
              className="inline-block px-8 py-4 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm"
            >
              Play BPM Guesser
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
