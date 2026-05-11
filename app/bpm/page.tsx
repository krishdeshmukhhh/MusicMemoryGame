import type { Metadata } from 'next';
import GameClient from '@/components/GameClient';

export const metadata: Metadata = {
  title: 'BPM Guesser — Free Rhythm & Tempo Training Game | pitchd.',
  description: 'Test your sense of rhythm. Listen to a mystery tempo and guess the BPM — can you match it exactly? Free rhythm ear training game, no sign-up needed.',
  keywords: ['bpm game', 'bpm guesser', 'tempo training game', 'rhythm ear training', 'guess the bpm', 'metronome game', 'beat recognition', 'music rhythm game', 'free bpm test', 'pitchd'],
  alternates: { canonical: 'https://pitchd.net/bpm' },
  openGraph: {
    title: 'BPM Guesser | pitchd.',
    description: 'Listen to a mystery tempo and guess the BPM. Free rhythm ear training game — no sign-up needed.',
    url: 'https://pitchd.net/bpm',
    siteName: 'pitchd.',
    type: 'website',
    images: [{ url: 'https://pitchd.net/og.png', width: 1200, height: 630, alt: 'pitchd. BPM Guesser' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BPM Guesser | pitchd.',
    description: 'Can you match the mystery tempo? Free rhythm training game.',
    images: ['https://pitchd.net/og.png'],
  },
};

export default function BpmPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "BPM Guesser — pitchd.",
            "description": "A 5-round rhythm game where you listen to a mystery metronome tempo and guess the BPM using a slider. Score is based on percentage accuracy.",
            "applicationCategory": "Game",
            "genre": ["Rhythm", "Music", "Educational"],
            "operatingSystem": "WebBrowser",
            "url": "https://pitchd.net/bpm",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "featureList": ["5-round tempo guessing game", "Real-time metronome feedback", "Percentage-based scoring", "No sign-up required"]
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does the BPM Guesser work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A metronome plays at a random mystery BPM for a few seconds with a countdown. Once it stops, you drag a slider to set your BPM guess and submit. The game plays 5 rounds and shows your total score. The slider also plays a live metronome at your current guess so you can compare."
                }
              },
              {
                "@type": "Question",
                "name": "How is the BPM Guesser scored?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Scoring is percentage-based relative to the target BPM, with continuous decimal scoring within each tier. Perfect (within 3%) = 4.00–3.00 pts, Great (within 8%) = 3.00–2.00 pts, Good (within 15%) = 2.00–1.00 pts, Close (within 25%) = 1.00–0.00 pts, Miss (beyond 25%) = 0 pts. Maximum score over 5 rounds is 20.00 points."
                }
              },
              {
                "@type": "Question",
                "name": "What BPM range does the game use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The game uses tempos ranging from 60 to 152 BPM across easy (60–120), medium (72–128), and hard (67–152) difficulty tiers. You won't know the difficulty in advance — that's part of the challenge."
                }
              }
            ]
          })
        }}
      />
      <div className="sr-only" aria-hidden="false">
        <h1>BPM Guesser — Free Rhythm & Tempo Training Game</h1>
        <p>
          pitchd.&apos;s BPM Guesser tests your sense of rhythm and tempo recognition. A mystery metronome
          plays for a few seconds — listen carefully, then use a slider to guess the exact BPM.
          The slider plays a live metronome at your current guess so you can compare in real time.
        </p>
        <h2>How to Play</h2>
        <ol>
          <li>Press Play — a metronome clicks at a mystery BPM with a countdown timer.</li>
          <li>After the countdown, use the slider to match the BPM you heard.</li>
          <li>The slider plays the metronome live at your guess — adjust until it sounds right.</li>
          <li>Submit your guess and see your score. Play 5 rounds for a final score.</li>
        </ol>
        <h2>Scoring Tiers</h2>
        <ul>
          <li>Perfect — within 3% of the target BPM — up to 4.00 points</li>
          <li>Great — within 8% — up to 3.00 points</li>
          <li>Good — within 15% — up to 2.00 points</li>
          <li>Close — within 25% — up to 1.00 point</li>
          <li>Miss — beyond 25% — 0 points</li>
        </ul>
        <nav>
          <a href="/bpm/scoring">BPM Scoring Guide</a>
          <a href="/bpm/articles">Rhythm &amp; BPM Training Articles</a>
          <a href="/">Pitch Game</a>
        </nav>
      </div>
      <GameClient />
    </>
  );
}
