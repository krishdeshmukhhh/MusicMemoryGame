import { Metadata } from 'next';
import Link from 'next/link';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // In a real app, you would fetch the article data from a CMS or local MDX files here.
  const { slug } = await params;
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `${title} | pitchd. Articles`,
    description: `Read our comprehensive guide on ${title} and test your ear on pitchd.net.`,
    alternates: {
      canonical: `https://pitchd.net/articles/${slug}`,
    },
    openGraph: {
      title: `${title} | pitchd.`,
      description: `Read our comprehensive guide on ${title} and test your ear on pitchd.net.`,
      url: `https://pitchd.net/articles/${slug}`,
      type: 'article',
    }
  };
}

export default async function ArticleContentPage({ params }: Props) {
  const { slug } = await params;
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-8 z-10 relative">
      <div className="w-full max-w-3xl mt-12 sm:mt-24 bg-surface-2 p-8 sm:p-16 rounded-3xl border border-border shadow-2xl relative overflow-hidden">
        
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />

        <Link href="/articles" className="text-text-muted hover:text-white transition-colors text-sm uppercase tracking-widest mb-12 inline-block relative z-10">
          ← Back to Articles
        </Link>
        
        <h1 className="text-4xl sm:text-5xl font-display text-white mb-8 tracking-tighter leading-tight relative z-10">
          {title}
        </h1>

        <div className="prose prose-invert prose-purple max-w-none relative z-10 font-sans text-[#a0a0a0] leading-relaxed">
          <p className="text-xl mb-8 text-white/80">
            Welcome to our deep dive on {title.toLowerCase()}. Whether you are a seasoned musician or just starting your journey into ear training, understanding pitch recognition is a fascinating endeavor.
          </p>
          
          <h2 className="text-2xl font-display text-white mt-12 mb-4">The Science of Hearing</h2>
          <p className="mb-6">
            The human ear is incredibly adept at recognizing frequencies, but assigning absolute values to those frequencies without a reference point is rare. This is known as absolute pitch, or perfect pitch.
          </p>
          
          <h2 className="text-2xl font-display text-white mt-12 mb-4">Can You Learn It?</h2>
          <p className="mb-6">
            While cognitive scientists debate whether true perfect pitch can be learned in adulthood, relative pitch—the ability to identify intervals—can absolutely be mastered with practice. 
          </p>

          <div className="mt-16 p-8 bg-black/40 rounded-2xl border border-purple-500/20 text-center">
            <h3 className="text-2xl font-display text-white mb-4">Put Your Ears to the Test</h3>
            <p className="mb-8 text-sm">Stop reading about it and actually test your auditory memory right now against the rest of the world.</p>
            <Link 
              href="/"
              className="inline-block px-8 py-4 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm"
            >
              Play pitchd. Now
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
