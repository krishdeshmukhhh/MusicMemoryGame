'use client';

import { useState } from 'react';
import GameClient from '@/components/GameClient';
import BpmGame from '@/components/BpmGame';

export default function AppShell() {
  const [activeGame, setActiveGame] = useState<'pitch' | 'bpm'>('pitch');

  return (
    <>
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
        <button
          onClick={() => setActiveGame('pitch')}
          className={`px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${
            activeGame === 'pitch'
              ? 'bg-white text-black shadow-sm'
              : 'text-text-muted hover:text-white'
          }`}
        >
          Pitch
        </button>
        <button
          onClick={() => setActiveGame('bpm')}
          className={`px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${
            activeGame === 'bpm'
              ? 'bg-white text-black shadow-sm'
              : 'text-text-muted hover:text-white'
          }`}
        >
          BPM
        </button>
      </div>

      {activeGame === 'pitch' ? <GameClient /> : <BpmGame />}
    </>
  );
}
