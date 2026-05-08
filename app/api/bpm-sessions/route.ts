import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ ok: true });
    }

    const { device_id, total_score } = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase
      .from('bpm_sessions')
      .insert({ device_id, total_score });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('BPM session POST error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
