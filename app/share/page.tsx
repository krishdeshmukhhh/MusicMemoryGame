import type { Metadata } from 'next';
import Link from 'next/link';
import { decodeGrid, CELL_COLOR, SITE_URL, type GameKind } from '@/lib/share';

// Landing page for shared results. It must render real HTML (not redirect) so that
// Discord/iMessage/X crawlers read the per-result OG image, and so friends who tap
// the link land on a "can you beat it?" challenge rather than a cold homepage.

type SearchParams = { [key: string]: string | string[] | undefined };
type Props = { searchParams: Promise<SearchParams> };

const str = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined);

function parse(sp: SearchParams) {
  const game: GameKind = str(sp.game) === 'bpm' ? 'bpm' : 'pitch';
  const max = game === 'bpm' ? 20 : 50;
  const raw = Number(str(sp.score));
  const score = str(sp.score) !== undefined && Number.isFinite(raw) ? Math.min(Math.max(raw, 0), max) : null;
  const n = Number(str(sp.n)) || null;
  const percentile = Number(str(sp.percentile)) || null;
  const streak = Number(str(sp.streak)) || null;
  const gridStr = str(sp.grid) ?? null;
  const grid = decodeGrid(gridStr, game);
  return { game, max, score, n, percentile, streak, gridStr: grid ? gridStr : null, grid };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const r = parse(await searchParams);
  const name = r.game === 'bpm' ? 'bpm.' : 'pitchd';

  const og = new URLSearchParams({ game: r.game });
  if (r.score !== null) og.set('score', r.score.toFixed(2));
  if (r.gridStr) og.set('grid', r.gridStr);
  if (r.n) og.set('n', String(r.n));
  if (r.percentile) og.set('percentile', String(r.percentile));
  if (r.streak) og.set('streak', String(r.streak));
  const ogUrl = `${SITE_URL}/api/og?${og.toString()}`;

  const title = r.score !== null
    ? { absolute: `${name}${r.n ? ` #${r.n}` : ''}: ${r.score.toFixed(2)}/${r.max} — can you beat it?` }
    : { absolute: 'pitchd. — can you beat my score?' };
  const description = r.game === 'bpm'
    ? 'Listen to a mystery tempo and guess the BPM. Free daily rhythm game — no sign-up.'
    : 'Hear 4 notes, play them back on a piano. Free daily pitch memory game — no sign-up.';

  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: { title: title.absolute, description, images: [{ url: ogUrl, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: title.absolute, description, images: [ogUrl] },
  };
}

export default async function SharePage({ searchParams }: Props) {
  const r = parse(await searchParams);
  const isBpm = r.game === 'bpm';
  const href = isBpm ? '/bpm' : '/';

  return (
    <main className="min-h-[100dvh] w-full flex items-center justify-center p-4 bg-[#050505]">
      <div className="w-full max-w-[420px] bg-[#050505] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
        <div className={`absolute top-0 right-0 w-64 h-64 ${isBpm ? 'bg-orange-500/10' : 'bg-purple-500/10'} rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3`} />

        <p className="text-text-muted text-[10px] uppercase tracking-[0.3em] mb-3 relative">
          {r.score !== null ? 'A friend challenged you' : 'You’ve been challenged'}
        </p>
        <h1 className="text-5xl font-display text-white tracking-tighter leading-none mb-6 relative">
          {isBpm ? 'bpm.' : 'pitchd.'}{r.n ? <span className="text-text-muted"> #{r.n}</span> : null}
        </h1>

        {r.score !== null && (
          <div className="flex items-baseline justify-center gap-2 mb-6 relative">
            <span className="text-[5rem] leading-none font-display text-white tracking-tighter">{r.score.toFixed(2)}</span>
            <span className="text-2xl text-text-faint font-display">/ {r.max}</span>
          </div>
        )}

        {r.grid && (
          <div className="flex flex-col items-center gap-1.5 mb-6 relative" aria-hidden="true">
            {r.grid.map((row, i) => (
              <div key={i} className="flex gap-1.5">
                {row.map((c, j) => (
                  <span key={j} className="size-6 rounded-md" style={{ backgroundColor: CELL_COLOR[c] }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {(r.percentile || (r.streak && r.streak > 1)) && (
          <p className="text-text-muted text-xs tracking-widest uppercase mb-6 relative">
            {r.percentile ? `🏆 Top ${r.percentile}%` : ''}
            {r.percentile && r.streak && r.streak > 1 ? ' · ' : ''}
            {r.streak && r.streak > 1 ? `🔥 ${r.streak} day streak` : ''}
          </p>
        )}

        <p className="text-[#a0a0a0] text-sm leading-relaxed mb-8 relative">
          {isBpm
            ? 'A metronome plays a mystery tempo for 4 seconds. Tap or slide to match it. 5 rounds, about a minute.'
            : 'Hear 4 notes. Play them back on the piano. 5 rounds, about two minutes. Everyone gets the same puzzle today.'}
        </p>

        <Link
          href={href}
          className="block w-full py-4 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm relative"
        >
          {r.score !== null ? 'Beat this score' : 'Play today’s puzzle'}
        </Link>
        <Link
          href={isBpm ? '/' : '/bpm'}
          className="block mt-4 text-text-muted hover:text-white text-[10px] tracking-[0.2em] uppercase transition-colors relative"
        >
          Or try {isBpm ? 'the pitch game' : 'the BPM Guesser'}
        </Link>
      </div>
    </main>
  );
}
