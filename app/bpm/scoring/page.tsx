import type { Metadata } from 'next';
import GameClient from '@/components/GameClient';

export const metadata: Metadata = {
  title: 'BPM Scoring Guide — How Scoring Works | pitchd.',
  description: 'How the BPM Guesser scoring works — continuous decimal scoring within each tier. Perfect within 1.5% scores 4.00 → 3.00 pts. Maximum 20.00 points across 5 rounds.',
  keywords: ['bpm scoring', 'bpm guesser score', 'tempo accuracy tiers', 'rhythm game scoring', 'pitchd bpm'],
  alternates: { canonical: 'https://pitchd.net/bpm/scoring' },
  openGraph: {
    title: 'BPM Scoring Guide | pitchd.',
    description: 'Percentage-based accuracy tiers: Perfect, Great, Good, Close, Miss. Max 20 points.',
    url: 'https://pitchd.net/bpm/scoring',
    type: 'article',
  },
};

export default function BpmScoringPage() {
  return <GameClient />;
}
