import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How Scoring Works — Harmonic Scoring Explained | pitchd.',
  description: 'Understand the harmonic scoring algorithm behind pitchd. — partial credit for perfect octaves, 5ths, and 4ths. A perfect game is 50 points.',
  keywords: ['pitchd scoring', 'ear training scoring', 'harmonic scoring', 'perfect pitch game scoring', 'pitch game points'],
  alternates: {
    canonical: 'https://pitchd.net/scoring',
  },
  openGraph: {
    title: 'How Scoring Works | pitchd.',
    description: 'Harmonic scoring: partial credit for octaves, perfect 5ths, 4ths. Max 50 points across 5 rounds.',
    url: 'https://pitchd.net/scoring',
    type: 'article',
  }
};

export default function ScoringPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-8 z-10 relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How is the pitchd. score calculated?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Each of the 5 rounds is worth up to 10 points (4 notes × 2.5 pts each). Partial credit is given for harmonically related notes: Perfect Match = 2.50 pts, Perfect Octave = 2.00 pts, Perfect 5th = 1.50 pts, Perfect 4th = 1.25 pts, Adjacent semitone = 1.00 pt. Beyond these, an exponential distance decay applies. A flawless game yields exactly 50 points."
                }
              },
              {
                "@type": "Question",
                "name": "What counts as a perfect match in pitchd.?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A perfect match means you identified the exact note and octave — for example, playing C4 when the target was C4. This earns the maximum 2.50 points for that note."
                }
              },
              {
                "@type": "Question",
                "name": "Why does pitchd. give partial credit for octaves and fifths?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Because those intervals represent genuine harmonic intelligence. Identifying the right note in the wrong octave, or landing on the dominant fifth, demonstrates real musical ear skill. Most ear training games use binary scoring; pitchd.'s harmonic engine rewards musically meaningful guesses."
                }
              }
            ]
          })
        }}
      />
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
