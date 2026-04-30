import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://pitchd.app'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: "pitchd. | The Ultimate Perfect Pitch Memory Game",
    template: "%s | pitchd."
  },
  description: "Test your ears against the world in this 5-round acoustic memory game. Listen, memorize, and flawlessly recreate the melodies. Are you in the Top 1% today?",
  keywords: ["perfect pitch", "ear training", "music theory game", "tone.js", "auditory memory", "relative pitch", "daily music puzzle", "pitchd"],
  authors: [{ name: "pitchd team" }],
  creator: "pitchd",
  publisher: "pitchd",
  openGraph: {
    title: "pitchd. | Perfect Pitch Memory Game",
    description: "Listen, memorize, and perfectly recreate the 5-round sequence. Do you have perfect pitch?",
    url: "https://pitchd.app",
    siteName: "pitchd.",
    locale: "en_US",
    type: "website",
    images: [{
      url: "https://pitchd.app/og.png",
      width: 1200,
      height: 630,
      alt: "pitchd. Gameplay Interface"
    }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@pitchd",
    creator: "@pitchd",
    title: "pitchd. | Are your ears perfect?",
    description: "Beat the daily 5-round acoustic memory challenge.",
    images: ["https://pitchd.app/og.png"],
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
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎵</text></svg>',
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
};

import { Analytics } from "@vercel/analytics/next"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-[100dvh] antialiased">
      <body className="h-full flex flex-col overflow-hidden select-none">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
