import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ games: 0 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { count, error } = await supabase
      .from('bpm_sessions')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return NextResponse.json({ games: 500 + (count || 0 ) }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    console.error('BPM global stats error:', err);
    return NextResponse.json({ games: 0 });
  }
}
