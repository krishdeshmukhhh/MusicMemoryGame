import { NextResponse } from 'next/server';
import { getDailySequence, getDailyDateString } from '@/lib/seed';

export async function GET() {
  const dateStr = getDailyDateString();
  const sequence = getDailySequence(dateStr);
  
  // Client only needs to know today's sequence once they are in 'reveal' phase, 
  // but for a purely client-side game loop, we can just send it immediately,
  // or we can rely on lib/seed directly on the client.
  // The prompt asked for this route, so here it is.
  return NextResponse.json({ date: dateStr, sequence });
}
