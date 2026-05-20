import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BackButton from '@/components/BackButton';
import { PITCH_ARTICLES as ARTICLES } from '@/lib/pitch-articles';

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return Object.keys(ARTICLES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) return { title: 'Article Not Found | pitchd.' };

  return {
    title: `${article.title} | pitchd. Articles`,
    description: article.description,
    keywords: ['ear training', 'perfect pitch', 'music theory', 'pitch recognition', 'pitchd', article.title.split(' ').slice(0, 4).join(' ').toLowerCase()],
    alternates: {
      canonical: `https://pitchd.net/articles/${slug}`,
    },
    openGraph: {
      title: `${article.title} | pitchd.`,
      description: article.description,
      url: `https://pitchd.net/articles/${slug}`,
      type: 'article',
      publishedTime: article.date,
      modifiedTime: article.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: ['https://pitchd.net/og.png'],
    },
  };
}

export default async function ArticleContentPage({ params }: Props) {
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
            "mainEntityOfPage": { "@type": "WebPage", "@id": `https://pitchd.net/articles/${slug}` },
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
              { "@type": "ListItem", "position": 2, "name": "Articles", "item": "https://pitchd.net/articles" },
              { "@type": "ListItem", "position": 3, "name": article.title, "item": `https://pitchd.net/articles/${slug}` },
            ]
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": article.sections.map(section => ({
              "@type": "Question",
              "name": section.heading,
              "acceptedAnswer": { "@type": "Answer", "text": section.body },
            })),
          })
        }}
      />

      <div className="w-full max-w-3xl mt-12 sm:mt-24 bg-surface-2 p-8 sm:p-16 rounded-3xl border border-border shadow-2xl relative">

        {/* Decorative Glow — clipped by its own container so card overflow-hidden isn't needed */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        </div>

        <BackButton label="Back to Articles" fallback="/articles" />

        <span className="block text-text-muted text-[10px] font-sans tracking-[0.2em] uppercase mb-4 relative z-10">{article.date}</span>

        <h1 className="text-4xl sm:text-5xl font-display text-white mb-8 tracking-tighter leading-tight relative z-10">
          {article.title}
        </h1>

        <div className="prose prose-invert prose-purple max-w-none relative z-10 font-sans text-[#a0a0a0] leading-relaxed">
          <p className="text-xl mb-8 text-white/80">
            {article.description}
          </p>

          {article.sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-2xl font-display text-white mt-12 mb-4">{section.heading}</h2>
              <p className="mb-6">{section.body}</p>
            </div>
          ))}

          <div className="mt-16 p-8 bg-black/40 rounded-2xl border border-purple-500/20 text-center">
            <h3 className="text-2xl font-display text-white mb-4">{article.cta}</h3>
            <p className="mb-8 text-sm">Stop reading about it and actually test your auditory memory right now against the rest of the world.</p>
            <Link
              href="/"
              className="inline-block px-8 py-4 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm"
            >
              Play pitchd. Now
            </Link>
          </div>

          {(() => {
            const related = Object.entries(ARTICLES)
              .filter(([s]) => s !== slug)
              .sort((a, b) => new Date(b[1].date).getTime() - new Date(a[1].date).getTime())
              .slice(0, 3);
            if (related.length === 0) return null;
            return (
              <div className="mt-12 pt-8 border-t border-white/10">
                <h3 className="text-lg font-display text-white mb-6 tracking-tight">Related Articles</h3>
                <div className="flex flex-col gap-4">
                  {related.map(([s, a]) => (
                    <Link
                      key={s}
                      href={`/articles/${s}`}
                      className="group block p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-[10px] text-text-muted tracking-[0.2em] uppercase">{a.date}</span>
                      <h4 className="text-base font-display text-white group-hover:text-purple-400 transition-colors leading-tight mt-1">{a.title}</h4>
                      <p className="text-xs text-[#a0a0a0] mt-1 leading-relaxed line-clamp-2">{a.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </main>
  );
}
