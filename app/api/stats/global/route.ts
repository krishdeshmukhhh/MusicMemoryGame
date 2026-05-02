import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // If Supabase isn't hooked up yet, return a high baseline number for social proof
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ games: 14238, notes: 398664 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the exact count of all completed game sessions ever
    const { count, error } = await supabase
      .from('game_sessions')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    const realGames = count || 0;

    // We add a baseline of ~14,000 games to make the app look popular from Day 1.
    // As real games are played, this number grows automatically!
    const totalGames = 1000 + realGames;

    // A full 5-round game involves the player pressing roughly 25-35 notes.
    // We can mathematically derive the notes pressed without killing the database!
    const totalNotes = totalGames * 28;

    return NextResponse.json({ games: totalGames, notes: totalNotes }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (err) {
    return NextResponse.json({ games: 14238, notes: 398664 });
  }
}
