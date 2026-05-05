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

      {/* FAQ JSON-LD — enables rich results in Google Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is pitchd.?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "pitchd. is a free daily ear training game. Each day, a new 5-note melody is generated and every player worldwide hears the same sequence. Listen to the notes, then recreate them on the on-screen piano. Your score is ranked on a global leaderboard."
                }
              },
              {
                "@type": "Question",
                "name": "Do I need perfect pitch to play pitchd.?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No. pitchd. is designed for all skill levels. The harmonic scoring engine rewards relative pitch as well as perfect pitch — so if you land on a note that is a perfect fifth or octave away from the target, you still earn partial credit. It's a great ear training tool for beginners and advanced musicians alike."
                }
              },
              {
                "@type": "Question",
                "name": "Is pitchd. free?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, pitchd. is completely free to play. No sign-up or account is required. Just open the site and start playing."
                }
              },
              {
                "@type": "Question",
                "name": "What is the difference between Daily Mode and Endless Mode?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Daily Mode gives every player the same 5-round sequence once per day, with results ranked on a global leaderboard. Endless Mode lets you practice unlimited rounds at any time, with no leaderboard scoring — perfect for building your ear training skills."
                }
              },
              {
                "@type": "Question",
                "name": "How is the score calculated in pitchd.?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Each of the 5 rounds is worth up to 10 points. A perfect match scores 2.5 points per note (4 notes per round). Partial credit is awarded for musically close guesses: a perfect octave scores 2.0 pts, a perfect fifth 1.5 pts, a perfect fourth 1.25 pts, and an adjacent semitone 1.0 pt. A flawless game totals 50 points."
                }
              },
              {
                "@type": "Question",
                "name": "Can ear training improve my perfect pitch?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Daily ear training can significantly improve your pitch recognition. While true absolute pitch is largely developed in early childhood, consistent practice with tools like pitchd. builds strong relative pitch and pitch memory — skills that make you a better musician at any level."
                }
              }
            ]
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
          <a href="/articles/wordle-for-musicians">The Best Wordle-Like Games for Musicians</a>
          <a href="/articles/how-to-get-perfect-pitch-as-an-adult">Can You Get Perfect Pitch as an Adult?</a>
          <a href="/articles/best-ear-training-games-online">The Best Free Ear Training Games Online</a>
          <a href="/articles/interval-recognition-training">Interval Recognition Training: Beginner&apos;s Guide</a>
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
