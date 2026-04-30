"use client";

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

type Stats = {
  gamesPlayed: number;
  maxStreak: number;
  scoreHistory: number[];
};

export default function StatsModal({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    const rawStats = localStorage.getItem('pitchd_stats');
    if (rawStats) {
      setStats(JSON.parse(rawStats));
    } else {
      setStats({ gamesPlayed: 0, maxStreak: 0, scoreHistory: [] });
    }
    const streak = localStorage.getItem('pitchd_streak');
    if (streak) setCurrentStreak(parseInt(streak, 10));
  }, []);

  if (!stats) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#12110e] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
          aria-label="Close Stats"
        >
          <X className="size-6" />
        </button>

        <h2 className="text-2xl font-display text-white tracking-tighter mb-8 text-center uppercase">Statistics</h2>

        {/* Number Grid */}
        <div className="grid grid-cols-3 gap-2 mb-10">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-display text-white leading-none mb-1">{stats.gamesPlayed}</span>
            <span className="text-[10px] text-text-muted uppercase tracking-widest text-center">Played</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-display text-white leading-none mb-1">{currentStreak}</span>
            <span className="text-[10px] text-text-muted uppercase tracking-widest text-center">Current<br/>Streak</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-display text-white leading-none mb-1">{stats.maxStreak}</span>
            <span className="text-[10px] text-text-muted uppercase tracking-widest text-center">Max<br/>Streak</span>
          </div>
        </div>

        {/* Score History Graph */}
        <h3 className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-4 text-center">Score History (Last 10)</h3>
        {stats.scoreHistory.length > 0 ? (
          <div className="flex items-end justify-center gap-2 h-32 border-b border-white/10 pb-2 relative">
            {stats.scoreHistory.slice(-10).map((score, i) => {
              // Normalize score height (max 50)
              const heightPct = Math.max(10, (score / 50) * 100);
              return (
                <div key={i} className="flex flex-col items-center justify-end w-8 group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white/50 mb-1 absolute -top-4">{Math.round(score)}</div>
                  <div 
                    className="w-full bg-white/20 group-hover:bg-purple-500/80 transition-colors rounded-t-sm"
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-text-muted text-xs uppercase tracking-widest border-b border-white/10 pb-2">
            No games played yet
          </div>
        )}
      </div>
    </div>
  );
}
