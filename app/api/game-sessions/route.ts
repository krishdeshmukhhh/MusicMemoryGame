import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { sanitizeDeviceId, sanitizePitchScore } from '@/lib/validate';

// Logs every completed pitch game (daily and endless) for the global play count.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const device_id = sanitizeDeviceId(body.device_id);
    const score = sanitizePitchScore(body.score);
    if (!device_id || score === null) return NextResponse.json({ ok: false }, { status: 400 });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ ok: true });

    const { error } = await supabase.from('game_sessions').insert({ device_id, score });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Game session POST error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
