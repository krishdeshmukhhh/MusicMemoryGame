import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How Scoring Works | pitchd.',
  description: 'Understand the harmonic scoring algorithm behind the pitchd. perfect pitch memory game.',
  alternates: {
    canonical: 'https://pitchd.net/scoring',
  },
  openGraph: {
    title: 'How Scoring Works | pitchd.',
    description: 'Understand the harmonic scoring algorithm behind the pitchd. perfect pitch memory game.',
    url: 'https://pitchd.net/scoring',
    type: 'article',
  }
};

export default function ScoringPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-8 z-10 relative">
      <div className="w-full max-w-3xl mt-12 sm:mt-24 bg-surface-2 p-8 sm:p-16 rounded-3xl border border-border shadow-2xl relative">

        {/* Decorative Glow */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        </div>

        <Link href="/" className="text-text-muted hover:text-white transition-colors text-sm uppercase tracking-widest mb-12 inline-block relative z-10">
          ← Back to Game
        </Link>
        
        <h1 className="text-4xl sm:text-5xl font-display text-white mb-8 tracking-tighter leading-tight relative z-10">
          How Scoring Works
        </h1>

        <div className="prose prose-invert prose-green max-w-none relative z-10 font-sans text-[#a0a0a0] leading-relaxed">
          <p className="text-xl mb-8 text-white/80">
            Unlike most ear training games that use a simple "right or wrong" boolean, pitchd. utilizes a true harmonic scoring engine based on music theory. You aren't just penalized for distance; you are rewarded for identifying correct harmonic relationships.
          </p>
          
          <div className="grid gap-4 mt-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-display text-xl mb-1">Perfect Match</h3>
                <p className="text-sm text-text-muted">You correctly identified the exact note and octave.</p>
              </div>
              <div className="px-4 py-2 bg-green-500/20 text-green-400 font-bold font-mono rounded-lg shrink-0">
                2.50 pts
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-display text-xl mb-1">Perfect Octave</h3>
                <p className="text-sm text-text-muted">You found the correct note (e.g., C), but played it in the wrong octave. A massive win for music theory.</p>
              </div>
              <div className="px-4 py-2 bg-blue-500/20 text-blue-400 font-bold font-mono rounded-lg shrink-0">
                2.00 pts
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-display text-xl mb-1">Perfect 5th</h3>
                <p className="text-sm text-text-muted">You hit the dominant 5th of the target note. Harmonically, this is the most consonant interval.</p>
              </div>
              <div className="px-4 py-2 bg-purple-500/20 text-purple-400 font-bold font-mono rounded-lg shrink-0">
                1.50 pts
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-display text-xl mb-1">Perfect 4th</h3>
                <p className="text-sm text-text-muted">You hit the subdominant interval.</p>
              </div>
              <div className="px-4 py-2 bg-teal-500/20 text-teal-400 font-bold font-mono rounded-lg shrink-0">
                1.25 pts
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-display text-xl mb-1">Adjacent Note</h3>
                <p className="text-sm text-text-muted">You were only 1 semitone off. Usually caused by a fat finger or hearing slightly flat/sharp.</p>
              </div>
              <div className="px-4 py-2 bg-yellow-500/20 text-yellow-400 font-bold font-mono rounded-lg shrink-0">
                1.00 pts
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-display text-white mt-12 mb-4">Distance Decay</h2>
          <p className="mb-6">
            If your guess does not fall into one of the harmonious intervals listed above, your score is calculated using an exponential distance decay algorithm. The further away you are from the correct frequency, the faster your points drop towards zero.
          </p>

          <div className="mt-16 p-8 bg-black/40 rounded-2xl border border-white/10 text-center">
            <h3 className="text-2xl font-display text-white mb-4">Maximum Score</h3>
            <p className="mb-8 text-sm">A perfect 5-round game yields exactly 50 points.</p>
            <Link 
              href="/"
              className="inline-block px-8 py-4 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Start Playing
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
