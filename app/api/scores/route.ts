import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { sanitizeDeviceId, sanitizeInitials, validatePitchSubmission } from '@/lib/validate';

// Daily leaderboard submission. The score is recomputed server-side from the
// submitted notes, so the leaderboard cannot be spoofed with a forged total.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const device_id = sanitizeDeviceId(body.device_id);
  if (!device_id) return NextResponse.json({ error: 'Missing device_id' }, { status: 400 });

  const initials = sanitizeInitials(body.initials);
  if (!initials) return NextResponse.json({ error: 'Initials required' }, { status: 400 });

  const submission = validatePitchSubmission(body.date_str, body.rounds);
  if (!submission.ok) return NextResponse.json({ error: submission.error }, { status: 400 });

  const date_str = body.date_str as string;
  const { score, rounds } = submission;

  const supabase = getSupabase();
  if (!supabase) {
    console.warn('Supabase not configured. Score not saved.');
    return NextResponse.json({ success: true, dummy: true, score, percentile: null });
  }

  try {
    // Keep only each device's best score per day.
    const { data: existing, error: readError } = await supabase
      .from('scores')
      .select('score')
      .eq('device_id', device_id)
      .eq('date_str', date_str)
      .maybeSingle();
    if (readError) throw readError;

    if (!existing || Number(existing.score) < score) {
      const { error: scoreError } = await supabase.from('scores').upsert(
        { device_id, date_str, score, player_sequence: rounds, initials },
        { onConflict: 'device_id,date_str' },
      );
      if (scoreError) throw scoreError;
    }

    // Percentile of this run against everyone's best today.
    const [{ count: totalCount }, { count: beatenCount }] = await Promise.all([
      supabase.from('scores').select('*', { count: 'exact', head: true }).eq('date_str', date_str),
      supabase.from('scores').select('*', { count: 'exact', head: true }).eq('date_str', date_str).lt('score', score),
    ]);

    let percentile = 1;
    if (totalCount && totalCount > 1 && beatenCount !== null) {
      percentile = Math.max(1, Math.ceil(100 - (beatenCount / totalCount) * 100));
    }

    return NextResponse.json({ success: true, score, percentile });
  } catch (err) {
    console.error('Score POST error:', err);
    return NextResponse.json({ error: 'Could not save score' }, { status: 500 });
  }
}
