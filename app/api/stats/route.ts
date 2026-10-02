import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const CACHE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' };
// Baseline offsets carried over from before session logging existed.
const PITCH_BASELINE = 1000;
const BPM_BASELINE = 500;

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ games: 14238, notes: 284760, bpmGames: 500 }, { headers: CACHE });
  }

  try {
    const [{ count: pitchCount }, { count: bpmCount }] = await Promise.all([
      supabase.from('game_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('bpm_sessions').select('*', { count: 'exact', head: true }),
    ]);

    const games = PITCH_BASELINE + (pitchCount || 0);
    return NextResponse.json(
      { games, notes: games * 20, bpmGames: BPM_BASELINE + (bpmCount || 0) },
      { headers: CACHE },
    );
  } catch (err) {
    console.error('Stats GET error:', err);
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
