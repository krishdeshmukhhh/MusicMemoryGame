import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { isPlausibleDailyDate } from '@/lib/daily';

export const dynamic = 'force-dynamic';

// Top 10 for one daily puzzle. The client passes its local date (?date=YYYY-MM-DD)
// so the board matches the puzzle the player actually saw.
export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get('date');
  const date = isPlausibleDailyDate(requested) ? requested! : new Date().toISOString().slice(0, 10);

  const supabase = getSupabase();
  if (!supabase) {
    // Placeholder data so the UI can be developed without Supabase.
    return NextResponse.json({
      date,
      top_scores: [
        { initials: 'HDK', score: 49.21 },
        { initials: 'ALX', score: 45.10 },
        { initials: 'SAM', score: 42.02 },
        { initials: 'JON', score: 38.50 },
        { initials: 'DOE', score: 34.00 },
      ],
    });
  }

  try {
    const { data, error } = await supabase
      .from('scores')
      .select('initials, score')
      .eq('date_str', date)
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10);
    if (error) throw error;

    return NextResponse.json(
      { date, top_scores: data },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } },
    );
  } catch (err) {
    console.error('Leaderboard GET error:', err);
    return NextResponse.json({ date, top_scores: [] }, { status: 500 });
  }
}
