import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learn Perfect Pitch | Ear Training Guides by pitchd.',
  description: 'Master your relative pitch, learn how to test for perfect pitch, and train your ears with our comprehensive guides.',
  alternates: {
    canonical: 'https://pitchd.net/articles',
  },
};

const ARTICLES = [
  {
    slug: 'perfect-pitch-vs-relative-pitch',
    title: 'Perfect Pitch vs. Relative Pitch: What is the difference?',
    description: 'A deep dive into absolute pitch recognition versus interval training, and how to test yourself.',
    date: '2026-04-30',
  },
  {
    slug: 'how-to-train-your-ears',
    title: 'The Ultimate Guide to Ear Training',
    description: 'Can you actually learn perfect pitch as an adult? We look at the science and the best daily routines.',
    date: '2026-04-28',
  },
];

export default function ArticlesPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-8 z-10 relative">
      <div className="w-full max-w-3xl mt-12 sm:mt-24">
        
        <Link href="/" className="text-text-muted hover:text-white transition-colors text-sm uppercase tracking-widest mb-12 inline-block">
          ← Back to Game
        </Link>
        
        <h1 className="text-5xl font-display text-white mb-6 tracking-tighter">
          Ear Training Guides
        </h1>
        <p className="text-text-muted text-lg mb-12">
          Read our latest articles on music theory, pitch recognition, and auditory memory.
        </p>
        
        <div className="flex flex-col gap-6">
          {ARTICLES.map((article) => (
            <Link 
              key={article.slug} 
              href={`/articles/${article.slug}`}
              className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-display text-white group-hover:text-purple-400 transition-colors">
                  {article.title}
                </h2>
                <span className="text-text-muted text-sm font-sans tracking-widest">{article.date}</span>
              </div>
              <p className="text-[#a0a0a0] leading-relaxed">
                {article.description}
              </p>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
