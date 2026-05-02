import GameClient from '@/components/GameClient';

export default function Page() {
  return (
    <>
      {/* JSON-LD Structured Data — rendered server-side for crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoGame",
            "name": "pitchd.",
            "description": "A 5-round acoustic memory game to test your perfect pitch. Compete in the verified daily run or endless practice mode.",
            "genre": ["Musical", "Puzzle", "Educational"],
            "playMode": "SinglePlayer",
            "applicationCategory": "Game",
            "operatingSystem": "WebBrowser",
            "url": "https://pitchd.net",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          })
        }}
      />

      {/* Semantic HTML visible to crawlers and screen readers, hidden visually */}
      <div className="sr-only" aria-hidden="false">
        <h1>pitchd. — The Ultimate Perfect Pitch Memory Game</h1>
        <p>
          Most humans don&apos;t possess perfect pitch. pitchd. is a free, 5-round acoustic
          memory game that tests exactly how your ears measure up. Listen to a randomized
          sequence of piano notes, then recreate the melody flawlessly. Compete in the
          verified daily challenge or practice endlessly in endless mode.
        </p>
        <h2>Game Modes</h2>
        <ul>
          <li>Daily Challenge — A new verified sequence every day. Compete on the global leaderboard.</li>
          <li>Endless Practice — Unlimited rounds to sharpen your ear training skills.</li>
        </ul>
        <h2>How Scoring Works</h2>
        <p>
          Unlike most ear training games, pitchd. uses a harmonic scoring engine rooted in
          music theory. You earn points for Perfect Matches (2.50 pts), Perfect Octaves (2.00 pts),
          Perfect 5ths (1.50 pts), Perfect 4ths (1.25 pts), and Adjacent Notes (1.00 pts).
          A perfect 5-round game yields exactly 50 points.
        </p>
        <h2>Ear Training Articles</h2>
        <nav>
          <a href="/articles/perfect-pitch-vs-relative-pitch">Perfect Pitch vs. Relative Pitch</a>
          <a href="/articles/how-to-train-your-ears">The Ultimate Guide to Ear Training</a>
        </nav>
        <nav aria-label="External links">
          <a href="/scoring">Scoring Details</a>
          <a href="/articles">All Articles</a>
        </nav>
      </div>

      {/* Interactive Game — Client Component */}
      <GameClient />
    </>
  );
}
