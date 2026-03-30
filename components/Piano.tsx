"use client";

import { useEffect, useRef, useState } from 'react';
import { engine } from '@/lib/audio';
import gsap from 'gsap';

export const KEYS = [
  { note: 'C4', type: 'white' },
  { note: 'Db4', type: 'black' },
  { note: 'D4', type: 'white' },
  { note: 'Eb4', type: 'black' },
  { note: 'E4', type: 'white' },
  { note: 'F4', type: 'white' },
  { note: 'Gb4', type: 'black' },
  { note: 'G4', type: 'white' },
  { note: 'Ab4', type: 'black' },
  { note: 'A4', type: 'white' },
  { note: 'Bb4', type: 'black' },
  { note: 'B4', type: 'white' },
  { note: 'C5', type: 'white' },
  { note: 'Db5', type: 'black' },
  { note: 'D5', type: 'white' },
  { note: 'Eb5', type: 'black' },
  { note: 'E5', type: 'white' }
];

export default function Piano({ 
  onNoteSelected, 
  disabled = false,
  highlightedNotes = [] 
}: { 
  onNoteSelected?: (note: string) => void,
  disabled?: boolean,
  highlightedNotes?: { note: string, color: 'blue' | 'red' | 'green' | 'yellow' }[]
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyPress = (note: string, element: HTMLElement) => {
    if (disabled) return;
    
    // Play audio
    engine.playNote(note);
    
    if (onNoteSelected) onNoteSelected(note);

    // Rip effect + bounce
    gsap.fromTo(element, 
      { scaleY: 0.94 }, 
      { scaleY: 1, duration: 0.3, ease: 'back.out(2)', transformOrigin: 'top' }
    );
  };

  return (
    <div 
      ref={containerRef}
      className="relative flex justify-center w-full max-w-3xl mx-auto overflow-x-auto hide-scrollbar px-4 pb-12 pt-4 select-none"
    >
      <div className="relative flex">
        {KEYS.map((k, i) => {
          const isWhite = k.type === 'white';
          const highlight = highlightedNotes.find(h => h.note === k.note);
          
          let highlightClass = '';
          if (highlight?.color === 'blue') highlightClass = 'ring-2 ring-blue-400 ring-inset shadow-[0_0_25px_rgba(96,165,250,0.6)] z-20 after:absolute after:inset-0 after:bg-blue-400/45 after:content-[""]';
          if (highlight?.color === 'red') highlightClass = 'ring-2 ring-red-500 ring-inset shadow-[0_0_20px_rgba(239,68,68,0.6)] z-20 after:absolute after:inset-0 after:bg-red-500/45 after:content-[""]';
          if (highlight?.color === 'yellow') highlightClass = 'ring-2 ring-yellow-400 ring-inset shadow-[0_0_20px_rgba(250,204,21,0.6)] z-20 after:absolute after:inset-0 after:bg-yellow-400/45 after:content-[""]';
          if (highlight?.color === 'green') highlightClass = 'ring-2 ring-green-500 ring-inset shadow-[0_0_20px_rgba(34,197,94,0.6)] z-20 after:absolute after:inset-0 after:bg-green-500/45 after:content-[""]';

          if (isWhite) {
            return (
              <button
                key={k.note}
                data-note={k.note}
                onPointerDown={(e) => handleKeyPress(k.note, e.currentTarget)}
                style={{
                  width: 'min(48px, 11vw)',
                  height: 'min(160px, 40vw)'
                }}
                className={`flex-shrink-0 bg-[#f2ece0] hover:bg-[#fffaf2] active:bg-primary/30 active:scale-y-[0.98] origin-top rounded-b-md mx-[1px] relative cursor-pointer shadow-sm border border-black/10 transition-colors overflow-hidden ${highlightClass}`}
                aria-label={k.note}
              />
            );
          } else {
            // Black keys are absolute positioned relative to the previous white key gap
            // A simple way is to wrap the black key in a zero-width wrapper
            return (
              <div key={k.note} className="w-0 z-10 relative">
                <button
                  data-note={k.note}
                  onPointerDown={(e) => handleKeyPress(k.note, e.currentTarget)}
                  style={{
                    width: 'min(28px, 6vw)',
                    height: 'min(100px, 25vw)',
                    left: 'calc(-0.5 * min(28px, 6vw))',
                  }}
                  className={`absolute top-0 bg-[#1a1814] hover:bg-[#2a2620] active:scale-y-[0.98] origin-top rounded-b-sm shadow-md cursor-pointer transition-colors overflow-hidden ${highlightClass}`}
                  aria-label={k.note}
                />
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
