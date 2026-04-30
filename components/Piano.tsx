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

const KEY_MAP: Record<string, string> = {
  'a': 'C4',
  'w': 'Db4',
  's': 'D4',
  'e': 'Eb4',
  'd': 'E4',
  'f': 'F4',
  't': 'Gb4',
  'g': 'G4',
  'y': 'Ab4',
  'h': 'A4',
  'u': 'Bb4',
  'j': 'B4',
  'k': 'C5',
  'o': 'Db5',
  'l': 'D5',
  'p': 'Eb5',
  ';': 'E5',
};

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
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (disabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // ignore auto-repeat
      // Do not trigger if user is typing in an input field
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      const note = KEY_MAP[key];
      if (note) {
        setPressedKeys(prev => new Set(prev).add(note));
        
        engine.playNote(note);
        if (onNoteSelected) onNoteSelected(note);

        const button = containerRef.current?.querySelector(`[data-note="${note}"]`) as HTMLElement;
        if (button) {
          gsap.fromTo(button, 
            { scaleY: 0.94 }, 
            { scaleY: 1, duration: 0.3, ease: 'back.out(2)', transformOrigin: 'top' }
          );
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const note = KEY_MAP[key];
      if (note) {
        setPressedKeys(prev => {
          const next = new Set(prev);
          next.delete(note);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [disabled, onNoteSelected]);

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

          const isPressed = pressedKeys.has(k.note);

          if (isWhite) {
            return (
              <button
                key={k.note}
                data-note={k.note}
                onPointerDown={(e) => handleKeyPress(k.note, e.currentTarget)}
                style={{
                  width: 'min(56px, calc(10vw - 4px))',
                  height: 'min(180px, 45vw)'
                }}
                className={`flex-shrink-0 ${isPressed ? 'bg-primary/30 scale-y-[0.98]' : 'bg-[#f2ece0] hover:bg-[#fffaf2]'} active:bg-primary/30 active:scale-y-[0.98] origin-top rounded-b-md mx-[1px] relative cursor-pointer shadow-sm border border-black/10 transition-colors overflow-hidden flex flex-col justify-end items-center pb-2 sm:pb-3 ${highlightClass}`}
                aria-label={k.note}
              >
                <span className="text-black/30 font-bold text-[10px] sm:text-xs font-sans pointer-events-none select-none">{k.note.replace(/\d/g, '')}</span>
              </button>
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
                    width: 'min(32px, calc(6vw - 2px))',
                    height: 'min(110px, 28vw)',
                    left: 'calc(-0.5 * min(32px, calc(6vw - 2px)))',
                  }}
                  className={`absolute top-0 ${isPressed ? 'bg-[#3a3630] scale-y-[0.98]' : 'bg-[#1a1814] hover:bg-[#2a2620]'} active:scale-y-[0.98] origin-top rounded-b-sm shadow-md cursor-pointer transition-colors overflow-hidden flex flex-col justify-end items-center pb-2 ${highlightClass}`}
                  aria-label={k.note}
                >
                  <span className="text-white/30 font-bold text-[8px] sm:text-[10px] font-sans pointer-events-none select-none">{k.note.replace(/\d/g, '').replace('b', '♭')}</span>
                </button>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
