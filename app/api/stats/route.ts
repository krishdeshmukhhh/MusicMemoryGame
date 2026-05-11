import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { games: 14238, notes: 398664, bpmGames: 500 },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const [{ count: pitchCount }, { count: bpmCount }] = await Promise.all([
    supabase.from('game_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('bpm_sessions').select('*', { count: 'exact', head: true }),
  ]);

  const totalGames = 1000 + (pitchCount || 0);

  return NextResponse.json(
    {
      games: totalGames,
      notes: totalGames * 20,
      bpmGames: 500 + (bpmCount || 0),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
  );
}
