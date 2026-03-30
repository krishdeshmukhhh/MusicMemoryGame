"use client";

import { useState, useEffect, useCallback } from 'react';
import { Play, Trophy } from 'lucide-react';
import ParticleField from '@/components/ParticleField';
import Piano from '@/components/Piano';
import ScoreReveal from '@/components/ScoreReveal';
import { engine } from '@/lib/audio';
import { generateRandomSequence } from '@/lib/seed';

type GameState = 'home' | 'listen' | 'play' | 'reveal' | 'results';
type LeaderboardEntry = { initials: string, score: number, device_id: string, created_at: string };

export default function Page() {
  const [gameState, setGameState] = useState<GameState>('home');

  // 5-Round State
  const [currentRound, setCurrentRound] = useState(1);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [finalTotal, setFinalTotal] = useState<number | null>(null);

  // Active Round State
  const [correctSequence, setCorrectSequence] = useState<string[]>([]);
  const [playerSequence, setPlayerSequence] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState('');

  const [initials, setInitials] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);

  useEffect(() => {
    let storedId = localStorage.getItem('pitchd_device_id');
    if (!storedId) {
      storedId = 'anon-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('pitchd_device_id', storedId);
    }
    setDeviceId(storedId);

    const savedInitials = localStorage.getItem('pitchd_initials');
    if (savedInitials) setInitials(savedInitials);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.top_scores) setLeaderboard(data.top_scores);
      setShowLeaderboard(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStart = async () => {
    await engine.init();
    setCurrentRound(1);
    setRoundScores([]);
    setFinalTotal(null);
    setIsPosting(false);
    setShowLeaderboard(false);
    startRound();
  };

  const startRound = () => {
    setPlayerSequence([]);
    const sequence = generateRandomSequence();
    setCorrectSequence(sequence);
    setGameState('listen');
    playTargetSequence(sequence);
  };

  const playTargetSequence = async (sequence: string[]) => {
    await new Promise(r => setTimeout(r, 600));
    engine.playSequence(
      sequence,
      (idx) => setActiveNoteIdx(idx),
      () => {
        setActiveNoteIdx(null);
        setTimeout(() => setGameState('play'), 1000);
      }
    );
  };

  const handleNoteSelected = (note: string) => {
    if (gameState !== 'play') return;

    setPlayerSequence(prev => {
      const next = [...prev, note];
      if (next.length === 4) {
        setTimeout(() => setGameState('reveal'), 800);
      }
      return next;
    });
  };

  const undoNote = () => {
    if (playerSequence.length > 0) {
      setPlayerSequence(prev => prev.slice(0, -1));
    }
  };

  const handleRevealComplete = useCallback(async (score: number) => {
    const newScores = [...roundScores, score];
    setRoundScores(newScores);

    if (currentRound < 5) {
      setCurrentRound(r => r + 1);
      startRound();
    } else {
      const total = newScores.reduce((a, b) => a + b, 0);
      const exactTotal = Math.round(total * 100) / 100;
      setFinalTotal(exactTotal);

      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          date_str: new Date().toISOString().split('T')[0],
          score: Math.round(exactTotal),
          player_sequence: playerSequence,
          initials: initials.toUpperCase() || 'NAN'
        })
      }).catch(e => console.error(e));

      setTimeout(() => setGameState('results'), 1000);
    }
  }, [currentRound, deviceId, playerSequence, roundScores, initials]);

  const postScore = async () => {
    if (isPosting || finalTotal === null) return;
    setIsPosting(true);

    if (initials) {
      localStorage.setItem('pitchd_initials', initials.toUpperCase());
    }

    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          date_str: new Date().toISOString().split('T')[0],
          score: finalTotal,
          player_sequence: playerSequence,
          initials: initials.toUpperCase() || 'NAN'
        })
      });
      generateShareText();
    } catch (e) {
      console.error(e);
      setIsPosting(false);
    }
  };

  const generateShareText = () => {
    let text = `pitchd — 5 Round Sum\n`;
    text += `Score: ${finalTotal?.toFixed(2)}/50\n`;
    text += `https://pitchd.app`;
    navigator.clipboard.writeText(text);
    alert('Score Posted & Copied to clipboard!');
  };

  const COLORS = [
    { base: '#8b5cf6', dark: '#6d28d9' }, // Purple
    { base: '#3b82f6', dark: '#1d4ed8' }, // Blue
    { base: '#b45309', dark: '#78350f' }, // Brown
    { base: '#22c55e', dark: '#15803d' }, // Green
    { base: '#06b6d4', dark: '#0e7490' }, // Teal
  ];

  const getFinalQuip = (score: number) => {
    if (score >= 48) return "Virtuoso! Absolute perfection.";
    if (score >= 40) return "Phenomenal ear. You belong in a symphony.";
    if (score >= 30) return "Great job! A very solid performance.";
    if (score >= 20) return "Good, not great. Fine dining at Applebee's.";
    return "Did you even turn your speakers on?";
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 z-10">
      <ParticleField state={gameState} />

      {/* Round Indicator Header */}
      {gameState !== 'home' && gameState !== 'results' && !showLeaderboard && (
        <div className="absolute top-8 left-8 text-white font-display tracking-widest uppercase opacity-60">
          Round {currentRound} <span className="text-text-muted">/ 5</span>
        </div>
      )}

      {/* Leaderboard Overlay */}
      {showLeaderboard && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
              <h2 className="text-2xl font-display text-white tracking-widest uppercase">Global Rank</h2>
              <button onClick={() => setShowLeaderboard(false)} className="text-text-muted hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1L13 13M1 13L13 1" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
              {leaderboard.length === 0 ? (
                <p className="text-text-muted text-center py-8">No scores yet. Be the first!</p>
              ) : (
                leaderboard.map((entry, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-white/50 font-display w-6 text-xl">{idx + 1}</span>
                      <span className="text-white font-bold tracking-widest">{entry.initials || 'ANON'}</span>
                    </div>
                    <span className="text-white font-display text-2xl">{Number(entry.score).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center justify-center min-h-[60vh]">

        {/* State: HOME */}
        {gameState === 'home' && (
          <div className="flex flex-col items-center justify-center w-full px-4 animate-in fade-in zoom-in-95 duration-1000">
            {/* The Main Card */}
            <div className="w-full max-w-[420px] bg-[#050505] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               {/* Internal Glow */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />

               <h1 className="text-6xl sm:text-[5rem] font-display text-white mb-6 tracking-tighter relative z-10 leading-none">
                 pitchd.
               </h1>
               
               <p className="text-[#a0a0a0] text-sm leading-relaxed mb-4 relative z-10 font-sans pr-6">
                 Most humans don't possess perfect pitch. This is a 5-round acoustic memory game to see exactly how your ears measure up.
               </p>
               <p className="text-[#a0a0a0] text-sm leading-relaxed mb-10 relative z-10 font-sans pr-6">
                 We'll play a randomized sequence of notes. Listen closely, then recreate the melody flawlessly.
               </p>

               <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4 block relative z-10">
                 Game Modes
               </span>

               <div className="flex items-center gap-4 relative z-10">
                  {/* Play Button */}
                  <div className="flex flex-col items-center gap-2">
                    <button 
                      onClick={handleStart}
                      className="size-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                      <Play className="size-6 fill-current ml-1" />
                    </button>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#666]">Play</span>
                  </div>

                  {/* Leaderboard Button */}
                  <div className="flex flex-col items-center gap-2">
                    <button 
                      onClick={fetchLeaderboard}
                      className="size-16 rounded-full border border-white/20 bg-transparent text-white flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <Trophy className="size-5" />
                    </button>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#666]">Rank</span>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* State: LISTEN */}
        {gameState === 'listen' && (
          <div className="flex flex-col items-center gap-12 animate-in fade-in zoom-in duration-700">

            <div className="relative flex flex-col items-center justify-center p-16 rounded-[3rem] border border-white/[0.08] bg-black/40 backdrop-blur-md shadow-2xl">
              <p className="text-sm font-semibold tracking-[0.2em] text-white uppercase mb-16 animate-pulse">
                Listen carefully
              </p>

              <div className="flex gap-6 items-center justify-center h-40">
                {[0, 1, 2, 3].map((idx) => {
                  const isActive = activeNoteIdx === idx;
                  return (
                    <div key={idx} className="relative flex items-center justify-center h-full w-12">
                      {/* Base slot */}
                      <div className={`absolute bottom-0 w-2 rounded-full transition-all duration-[400ms] ${isActive ? 'h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'h-2 bg-white/10'}`} />

                      {/* Active Burst Center */}
                      <div className={`absolute bottom-1/2 w-8 h-8 rounded-full bg-white blur-xl transition-opacity duration-300 ${isActive ? 'opacity-50' : 'opacity-0'}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* State: PLAY */}
        {gameState === 'play' && (
          <div className="flex flex-col items-center w-full animate-in slide-in-from-bottom-12 duration-700">
            <div className="flex items-center justify-between w-full max-w-md mb-12 px-4">
              <div className="flex gap-3">
                {[0, 1, 2, 3].map(idx => (
                  <div
                    key={idx}
                    className={`size-4 rounded-full border border-border transition-colors duration-300 ${playerSequence[idx] ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.6)] border-white' : 'bg-surface-2'}`}
                  />
                ))}
              </div>
              <button
                onClick={undoNote}
                disabled={playerSequence.length === 0}
                className="text-text-muted hover:text-white disabled:opacity-30 disabled:hover:text-text-muted text-sm tracking-widest uppercase"
              >
                Undo
              </button>
            </div>
            <div className="w-full">
              <Piano onNoteSelected={handleNoteSelected} />
            </div>
          </div>
        )}

        {/* State: REVEAL */}
        {gameState === 'reveal' && (
          <div className="w-full flex flex-col items-center gap-4">
            <ScoreReveal
              correctSequence={correctSequence}
              playerSequence={playerSequence}
              onComplete={handleRevealComplete}
            />
          </div>
        )}

        {/* State: RESULTS */}
        {gameState === 'results' && (
          <div className="relative flex flex-col w-full max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-1000">
            
            <div className="flex flex-col items-center text-center">
              <h2 className="text-text-muted text-sm tracking-[0.3em] uppercase mb-4 font-sans">Performance</h2>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-[7rem] leading-none font-display text-white tracking-tighter">
                  {finalTotal?.toFixed(2)}
                </span>
                <span className="text-3xl text-text-faint font-display">/ 50</span>
              </div>
              <p className="text-text-muted tracking-widest uppercase text-xs mt-6">{finalTotal !== null ? getFinalQuip(finalTotal) : ''}</p>
            </div>

            {/* Score Grid Minimal */}
            <div className="grid grid-cols-5 gap-px bg-border mt-16 p-px overflow-hidden rounded-sm">
              {roundScores.map((score, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center bg-bg py-8 hover:bg-surface transition-colors cursor-default">
                  <span className="text-text-faint text-[10px] uppercase tracking-widest mb-2 font-sans">R{idx + 1}</span>
                  <span className="text-white font-display text-xl">{score.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Submit Block */}
            <div className="flex flex-col sm:flex-row gap-2 w-full mt-12 bg-surface-2 border border-border p-2 rounded-full">
              <input
                type="text"
                placeholder="INT"
                maxLength={3}
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
                className="w-full sm:w-24 bg-transparent px-6 py-4 text-center text-white font-sans text-lg focus:outline-none placeholder-text-faint uppercase tracking-[0.2em]"
              />
              <button
                onClick={postScore}
                disabled={isPosting}
                className="flex-1 rounded-full bg-white text-black font-semibold tracking-widest uppercase hover:bg-neutral-200 active:scale-[0.98] transition-all py-4 disabled:opacity-50 text-xs sm:text-sm"
              >
                {isPosting ? 'Posting...' : 'Submit Score'}
              </button>
            </div>
            
            <button 
              onClick={() => handleStart()}
              className="mt-12 text-text-muted hover:text-white text-xs tracking-[0.2em] uppercase transition-colors text-center w-full"
            >
              Play Again
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
