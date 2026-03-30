import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Use placeholder data if Supabase isn't hooked up locally
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        top_scores: [
          { initials: 'HDK', score: 49.21, device_id: '1', created_at: new Date().toISOString() },
          { initials: 'ALX', score: 45.10, device_id: '2', created_at: new Date().toISOString() },
          { initials: 'SAM', score: 42.02, device_id: '3', created_at: new Date().toISOString() },
          { initials: 'JON', score: 38.50, device_id: '4', created_at: new Date().toISOString() },
          { initials: 'DOE', score: 34.00, device_id: '5', created_at: new Date().toISOString() }
        ]
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('scores')
      .select('device_id, score, initials, created_at')
      .order('score', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ top_scores: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
