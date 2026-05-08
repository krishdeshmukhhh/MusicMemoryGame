import { Metadata } from 'next';
import GameClient from '@/components/GameClient';

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
  },
};

export default function ScoringPage() {
  return (
    <>
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
      <GameClient />
    </>
  );
}
