import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { device_id, date_str, score, player_sequence, initials } = body;

    if (!device_id) {
      return NextResponse.json({ error: 'Missing device_id' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase not configured. Score not saved.");
      return NextResponse.json({ success: true, dummy: true });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Raw Analytics Tracking (Log every single finished game)
    await supabase.from('game_sessions').insert({
       device_id,
       score: score
    });

    // 2. Leaderboard High-Score Upsert
    // Fetch existing score for this device today
    const { data: existing } = await supabase
      .from('scores')
      .select('score')
      .eq('device_id', device_id)
      .eq('date_str', date_str)
      .single();

    if (existing && existing.score >= score) {
       // Ignore this submission for the leaderboard if their old score was better
       return NextResponse.json({ success: true, message: 'Game logged. High score retained.' });
    }

    // Upsert new high score onto the Leaderboard
    const { error: scoreError } = await supabase.from('scores').upsert({
      device_id,
      date_str,
      score,
      player_sequence,
      initials: initials || 'ANON'
    }, { onConflict: 'device_id,date_str' });

    if (scoreError) {
      throw scoreError;
    }

    // 2. Update stats (Implementation stubbed for anonymity)
    const { data: stats } = await supabase.from('user_stats')
      .select('*').eq('device_id', device_id).single();
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
