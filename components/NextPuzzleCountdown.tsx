"use client";

import { useEffect, useState } from 'react';
import { formatCountdown, msUntilNextDay } from '@/lib/daily';

/** "Next puzzle in 05:12:33" — ticks every second, calls onRollover at local midnight. */
export default function NextPuzzleCountdown({ onRollover }: { onRollover?: () => void }) {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const left = msUntilNextDay();
      setMs(left);
      if (left < 1000) onRollover?.();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [onRollover]);

  return (
    <p className="text-text-muted text-[10px] uppercase tracking-[0.2em]">
      Next puzzle in{' '}
      <span className="text-white font-mono tabular-nums tracking-normal text-xs">{ms === null ? '--:--:--' : formatCountdown(ms)}</span>
    </p>
  );
}
