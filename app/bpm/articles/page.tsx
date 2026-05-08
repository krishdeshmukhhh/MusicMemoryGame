import type { Metadata } from 'next';
import GameClient from '@/components/GameClient';

export const metadata: Metadata = {
  title: 'Rhythm & BPM Training Guides | pitchd.',
  description: 'Articles on tempo training, beat recognition, BPM ear development, and how to improve your sense of rhythm.',
  keywords: ['bpm training', 'tempo ear training', 'rhythm guides', 'beat recognition articles', 'how to improve bpm recognition', 'pitchd'],
  alternates: { canonical: 'https://pitchd.net/bpm/articles' },
  openGraph: {
    title: 'Rhythm & BPM Guides | pitchd.',
    description: 'Articles on tempo training, beat recognition, and rhythmic ear development.',
    url: 'https://pitchd.net/bpm/articles',
    type: 'website',
  },
};

export default function BpmArticlesPage() {
  return <GameClient />;
}
