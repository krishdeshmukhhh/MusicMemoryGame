import GameClient from '@/components/GameClient';
import { toArticleIndex } from '@/lib/articles';
import { PITCH_ARTICLES } from '@/lib/pitch-articles';
import { BPM_ARTICLES } from '@/lib/bpm-articles';

// Server wrapper for every game route. Builds the article listings on the server so
// the article bodies never ship in the client bundle.
const PITCH_INDEX = toArticleIndex(PITCH_ARTICLES);
const BPM_INDEX = toArticleIndex(BPM_ARTICLES);

export default function GameShell() {
  return <GameClient pitchArticles={PITCH_INDEX} bpmArticles={BPM_INDEX} />;
}
