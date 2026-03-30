import { NextResponse } from 'next/server';
import { getDailySequenceForRound, getDailyDateString } from '@/lib/seed';

export async function GET() {
  const dateStr = getDailyDateString();
  const sequence: string[][] = [];
  
  for (let i = 1; i <= 5; i++) {
     sequence.push(getDailySequenceForRound(dateStr, i));
  }
  
  return NextResponse.json({ date: dateStr, sequence });
}
