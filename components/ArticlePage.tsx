import type { Metadata } from 'next';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { articlePath, toArticleIndex, type ArticleData, type ArticleKind } from '@/lib/articles';
import { PITCH_ARTICLES } from '@/lib/pitch-articles';
import { BPM_ARTICLES } from '@/lib/bpm-articles';

// Standalone, server-rendered article page shared by /articles/[slug] and /bpm/articles/[slug].

const SITE = 'https://pitchd.net';

const CONFIG = {
  pitch: {
    articles: PITCH_ARTICLES,
    section: 'Articles',
    sectionUrl: `${SITE}/articles`,
    backLabel: 'Back to Articles',
    backHref: '/articles',
    glow: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    hover: 'group-hover:text-purple-400',
    ctaBlurb: 'Stop reading about it and actually test your auditory memory right now against the rest of the world.',
    ctaLabel: 'Play pitchd. Now',
    ctaHref: '/',
    keywords: ['ear training', 'perfect pitch', 'music theory', 'pitch recognition', 'pitchd'],
    crumbs: [{ name: 'Articles', item: `${SITE}/articles` }],
  },
  bpm: {
    articles: BPM_ARTICLES,
    section: 'BPM Guides',
    sectionUrl: `${SITE}/bpm/articles`,
    backLabel: 'Back to BPM Guides',
    backHref: '/bpm/articles',
    glow: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    hover: 'group-hover:text-orange-400',
    ctaBlurb: 'Stop reading about it — test your sense of rhythm against real BPMs right now.',
    ctaLabel: 'Play BPM Guesser',
    ctaHref: '/bpm',
    keywords: ['bpm training', 'tempo ear training', 'rhythm recognition', 'metronome practice', 'beat recognition', 'pitchd'],
    crumbs: [{ name: 'BPM Guesser', item: `${SITE}/bpm` }, { name: 'BPM Guides', item: `${SITE}/bpm/articles` }],
  },
} as const;

export function getArticle(kind: ArticleKind, slug: string): ArticleData | undefined {
  return (CONFIG[kind].articles as Record<string, ArticleData>)[slug];
}

export function articleSlugs(kind: ArticleKind) {
  return Object.keys(CONFIG[kind].articles).map(slug => ({ slug }));
}

function ogImage(kind: ArticleKind, title: string) {
  const q = new URLSearchParams({ title });
  if (kind === 'bpm') q.set('game', 'bpm');
  return `${SITE}/api/og?${q.toString()}`;
}

export function articleMetadata(kind: ArticleKind, slug: string): Metadata {
  const article = getArticle(kind, slug);
  if (!article) return { title: 'Article Not Found' };
  const url = `${SITE}${articlePath(kind, slug)}`;
  const image = ogImage(kind, article.title);

  return {
    title: article.title,
    description: article.description,
    keywords: [...CONFIG[kind].keywords],
    alternates: { canonical: url },
    openGraph: {
      title: `${article.title} | pitchd.`,
      description: article.description,
      url,
      type: 'article',
      publishedTime: article.date,
      modifiedTime: article.date,
      images: [{ url: image, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: [image],
    },
  };
}

export default function ArticlePage({ kind, slug, article }: { kind: ArticleKind; slug: string; article: ArticleData }) {
  const c = CONFIG[kind];
  const url = `${SITE}${articlePath(kind, slug)}`;
  const related = toArticleIndex(c.articles as Record<string, ArticleData>).filter(a => a.slug !== slug).slice(0, 3);

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
            "author": { "@type": "Organization", "name": "pitchd", "url": SITE },
            "publisher": {
              "@type": "Organization",
              "name": "pitchd",
              "url": SITE,
              "logo": { "@type": "ImageObject", "url": `${SITE}/icon.png` }
            },
            "mainEntityOfPage": { "@type": "WebPage", "@id": url },
            "image": ogImage(kind, article.title),
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
              { name: 'Home', item: SITE },
              ...c.crumbs,
              { name: article.title, item: url },
            ].map((crumb, i) => ({ "@type": "ListItem", "position": i + 1, ...crumb })),
          })
        }}
      />

      <article className="w-full max-w-3xl mt-12 sm:mt-24 bg-surface-2 p-8 sm:p-16 rounded-3xl border border-border shadow-2xl relative">

        {/* Decorative Glow — clipped by its own container so card overflow-hidden isn't needed */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className={`absolute top-0 right-0 w-64 h-64 ${c.glow} rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3`} />
        </div>

        <BackButton label={c.backLabel} fallback={c.backHref} />

        <time dateTime={article.date} className="block text-text-muted text-[10px] font-sans tracking-[0.2em] uppercase mb-4 relative z-10">{article.date}</time>

        <h1 className="text-4xl sm:text-5xl font-display text-white mb-8 tracking-tighter leading-tight relative z-10">
          {article.title}
        </h1>

        <div className="max-w-none relative z-10 font-sans text-[#a0a0a0] leading-relaxed">
          <p className="text-xl mb-8 text-white/80">{article.description}</p>

          {article.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-2xl font-display text-white mt-12 mb-4">{section.heading}</h2>
              <p className="mb-6">{section.body}</p>
            </section>
          ))}

          <div className={`mt-16 p-8 bg-black/40 rounded-2xl border ${c.border} text-center`}>
            <h3 className="text-2xl font-display text-white mb-4">{article.cta}</h3>
            <p className="mb-8 text-sm">{c.ctaBlurb}</p>
            <Link
              href={c.ctaHref}
              className="inline-block px-8 py-4 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm"
            >
              {c.ctaLabel}
            </Link>
          </div>

          {related.length > 0 && (
            <nav aria-label="Related articles" className="mt-12 pt-8 border-t border-white/10">
              <h3 className="text-lg font-display text-white mb-6 tracking-tight">Related Articles</h3>
              <div className="flex flex-col gap-4">
                {related.map(a => (
                  <Link
                    key={a.slug}
                    href={articlePath(kind, a.slug)}
                    className="group block p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-[10px] text-text-muted tracking-[0.2em] uppercase">{a.date}</span>
                    <h4 className={`text-base font-display text-white ${c.hover} transition-colors leading-tight mt-1`}>{a.title}</h4>
                    <p className="text-xs text-[#a0a0a0] mt-1 leading-relaxed line-clamp-2">{a.description}</p>
                  </Link>
                ))}
              </div>
              <Link href={c.backHref} className="inline-block mt-6 text-text-muted hover:text-white text-xs uppercase tracking-widest transition-colors">
                All {c.section} →
              </Link>
            </nav>
          )}
        </div>
      </article>
    </main>
  );
}
