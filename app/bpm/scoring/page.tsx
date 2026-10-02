import type { Metadata } from 'next';
import GameShell from '@/components/GameShell';

export const metadata: Metadata = {
  title: 'BPM Scoring Guide — How Scoring Works',
  description: 'How the BPM Guesser scoring works — continuous decimal scoring within each tier. Perfect (within 3%) scores 4.00 → 3.00 pts, Great (8%), Good (15%), Close (25%). Maximum 20.00 points across 5 rounds.',
  keywords: ['bpm scoring', 'bpm guesser score', 'tempo accuracy tiers', 'rhythm game scoring', 'pitchd bpm'],
  alternates: { canonical: 'https://pitchd.net/bpm/scoring' },
  openGraph: {
    title: 'BPM Scoring Guide | pitchd.',
    description: 'Percentage-based accuracy tiers: Perfect, Great, Good, Close, Miss. Max 20 points.',
    url: 'https://pitchd.net/bpm/scoring',
    type: 'article',
    images: [{ url: 'https://pitchd.net/api/og?game=bpm&title=BPM+Scoring+Guide&kicker=How+scoring+works', width: 1200, height: 630 }],
  },
};

export default function BpmScoringPage() {
  return <GameShell />;
}
