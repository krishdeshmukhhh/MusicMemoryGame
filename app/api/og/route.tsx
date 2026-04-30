import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const score = searchParams.get('score');
    const percentile = searchParams.get('percentile');
    const streak = searchParams.get('streak');

    const hasScore = score !== null && score !== undefined;

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
            backgroundColor: '#0f0e0c', // bg color
            color: '#ffffff',
            fontFamily: 'sans-serif',
            backgroundImage: 'radial-gradient(circle at 50% -20%, #1c1a16 0%, #0f0e0c 100%)',
          }}
        >
          {/* Subtle glowing orb in background */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '600px',
              height: '600px',
              backgroundColor: '#8b5cf6',
              filter: 'blur(200px)',
              opacity: 0.15,
              borderRadius: '50%',
            }}
          />

          <h1
            style={{
              fontSize: '80px',
              fontWeight: 700,
              letterSpacing: '-0.05em',
              marginBottom: '20px',
              color: '#ffffff',
            }}
          >
            pitchd.
          </h1>

          {hasScore ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '120px', fontWeight: 800 }}>{Number(score).toFixed(2)}</span>
                <span style={{ fontSize: '40px', color: '#7a7469' }}>/ 50</span>
              </div>

              <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                {percentile && (
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      padding: '12px 24px',
                      borderRadius: '100px',
                      fontSize: '24px',
                      color: '#e8e4d8',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    🏆 Top {percentile}%
                  </div>
                )}
                {streak && Number(streak) > 1 && (
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      padding: '12px 24px',
                      borderRadius: '100px',
                      fontSize: '24px',
                      color: '#e8e4d8',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    🔥 {streak} Day Streak
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px' }}>
              <p
                style={{
                  fontSize: '40px',
                  color: '#e8e4d8',
                  maxWidth: '800px',
                  textAlign: 'center',
                  lineHeight: 1.4,
                }}
              >
                The Ultimate Perfect Pitch Memory Challenge
              </p>
              <p
                style={{
                  fontSize: '28px',
                  color: '#7a7469',
                  marginTop: '20px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}
              >
                Are your ears perfect?
              </p>
            </div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
