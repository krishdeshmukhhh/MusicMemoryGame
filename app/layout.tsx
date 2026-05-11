import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://pitchd.net'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: "pitchd. | Free Daily Perfect Pitch & Ear Training Game",
    template: "%s | pitchd."
  },
  description: "Two free daily ear training games: recreate 4-note sequences on a piano to test your pitch memory, or match mystery tempos in the BPM Guesser. Rank globally — no sign-up needed.",
  keywords: ["perfect pitch test", "ear training game", "free ear training", "daily music puzzle", "pitch memory game", "interval recognition game", "music theory game", "relative pitch training", "perfect pitch", "auditory memory", "wordle for musicians", "bpm game", "bpm guesser", "tempo training", "beat recognition", "rhythm ear training", "pitchd"],
  authors: [{ name: "pitchd team" }],
  creator: "pitchd",
  publisher: "pitchd",
  openGraph: {
    title: "pitchd. | Free Daily Ear Training Game",
    description: "Free daily ear training — pitch memory game and BPM Guesser. Recreate note sequences, match mystery tempos, rank globally. No sign-up needed.",
    url: "https://pitchd.net",
    siteName: "pitchd.",
    locale: "en_US",
    type: "website",
    images: [{
      url: "https://pitchd.net/og.png",
      width: 1200,
      height: 630,
      alt: "pitchd. Gameplay Interface"
    }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@pitchd",
    creator: "@pitchd",
    title: "pitchd. | Free Daily Ear Training Game",
    description: "Can you land in the Top 1%? Recreate the 5-note melody, rank globally. Free ear training game.",
    images: ["https://pitchd.net/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    }
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    title: 'pitchd.',
    statusBarStyle: 'black-translucent',
    capable: true,
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'theme-color': '#000000',
  },
};

import { Analytics } from "@vercel/analytics/next"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "pitchd.",
              "url": "https://pitchd.net",
              "description": "Free daily ear training and BPM games. Test your pitch memory and rhythm recognition — no sign-up needed.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://pitchd.net/articles?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "pitchd.",
              "url": "https://pitchd.net",
              "logo": "https://pitchd.net/icon.png",
              "sameAs": []
            })
          }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
