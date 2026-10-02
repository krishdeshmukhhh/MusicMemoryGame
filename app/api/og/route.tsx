import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { decodeGrid, CELL_COLOR, type GameKind } from '@/lib/share';

export const runtime = 'edge';

// Three card variants, all 1200×630:
//   ?game=pitch|bpm&score=..&grid=..&n=..&percentile=..&streak=..   → result card (share links)
//   ?title=..&game=pitch|bpm&kicker=..                              → article / page card
//   (no params)                                                     → generic brand card
const ACCENT: Record<GameKind, string> = { pitch: '#8b5cf6', bpm: '#f97316' };

const pill = {
  background: 'rgba(255,255,255,0.1)',
  padding: '12px 24px',
  borderRadius: '100px',
  fontSize: '24px',
  color: '#e8e4d8',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
};

export async function GET(request: NextRequest) {
  try {
    const p = new URL(request.url).searchParams;
    const game: GameKind = p.get('game') === 'bpm' ? 'bpm' : 'pitch';
    const accent = ACCENT[game];
    const brand = game === 'bpm' ? 'bpm.' : 'pitchd.';
    const max = game === 'bpm' ? 20 : 50;

    const rawScore = Number(p.get('score'));
    const score = p.get('score') !== null && Number.isFinite(rawScore) ? Math.min(Math.max(rawScore, 0), max) : null;
    const percentile = Number(p.get('percentile')) || null;
    const streak = Number(p.get('streak')) || null;
    const n = Number(p.get('n')) || null;
    const grid = decodeGrid(p.get('grid'), game);
    const title = p.get('title')?.slice(0, 120) ?? null;
    const kicker = p.get('kicker')?.slice(0, 40) ?? null;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f0e0c',
            color: '#ffffff',
            fontFamily: 'sans-serif',
            backgroundImage: 'radial-gradient(circle at 50% -20%, #1c1a16 0%, #0f0e0c 100%)',
            padding: '60px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '15px',
              left: '300px',
              width: '600px',
              height: '600px',
              backgroundColor: accent,
              filter: 'blur(200px)',
              opacity: 0.18,
              borderRadius: '50%',
            }}
          />

          {score !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '72px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '56px', fontWeight: 700, letterSpacing: '-0.05em' }}>
                  {`${brand}${n ? ` #${n}` : ''}`}
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '8px' }}>
                  <span style={{ fontSize: '140px', fontWeight: 800, letterSpacing: '-0.04em' }}>{score.toFixed(2)}</span>
                  <span style={{ fontSize: '44px', color: '#7a7469' }}>{`/ ${max}`}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  {percentile && <div style={pill}>{`🏆 Top ${percentile}%`}</div>}
                  {streak && streak > 1 && <div style={pill}>{`🔥 ${streak} day streak`}</div>}
                </div>
                <span style={{ fontSize: '30px', color: '#e8e4d8', marginTop: '36px' }}>Can you beat it? → pitchd.net</span>
              </div>

              {grid && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {grid.map((row, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px' }}>
                      {row.map((c, j) => (
                        <div
                          key={j}
                          style={{
                            width: game === 'bpm' ? '72px' : '60px',
                            height: game === 'bpm' ? '72px' : '60px',
                            borderRadius: '12px',
                            backgroundColor: CELL_COLOR[c] ?? '#333',
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : title ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
              <span style={{ fontSize: '26px', color: accent, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                {kicker ?? (game === 'bpm' ? 'Rhythm & BPM Guide' : 'Ear Training Guide')}
              </span>
              <span style={{ fontSize: title.length > 60 ? '60px' : '72px', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', marginTop: '24px' }}>
                {title}
              </span>
              <span style={{ fontSize: '36px', fontWeight: 700, marginTop: '48px', letterSpacing: '-0.04em' }}>pitchd.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '96px', fontWeight: 700, letterSpacing: '-0.05em' }}>{brand}</span>
              <p style={{ fontSize: '40px', color: '#e8e4d8', textAlign: 'center', lineHeight: 1.4, marginTop: '24px' }}>
                {game === 'bpm' ? 'Can you guess the tempo?' : 'The daily pitch memory challenge'}
              </p>
              <p style={{ fontSize: '28px', color: '#7a7469', marginTop: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Free · No sign-up · New puzzle daily
              </p>
            </div>
          )}
        </div>
      ),
      { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=86400, immutable' } },
    );
  } catch (e) {
    console.error('OG image error:', e instanceof Error ? e.message : e);
    return new Response('Failed to generate the image', { status: 500 });
  }
}
