"use client";

import { useEffect, useState, useRef } from 'react';
import { scoreNote, NOTES } from '@/lib/seed';
import { engine } from '@/lib/audio';
import gsap from 'gsap';
import Piano from './Piano';

interface ScoreRevealProps {
  correctSequence: string[];
  playerSequence: string[];
  onComplete: (score: number) => void;
}

const QUIPS = {
  perfect: [
    "Virtuoso.",
    "Flawless execution.",
    "Perfect pitch.",
    "Robot, is that you?",
    "Did you compose this?",
    "Absolute recall.",
    "Savant behavior.",
    "Your ears don't miss.",
    "Pitch perfect. Literally.",
    "Mozart is shaking.",
    "That was surgical.",
    "No notes. Literally.",
  ],

  great: [
    "Great ear.",
    "Almost perfect.",
    "Solid performance.",
    "Very well done.",
    "Just a hair off.",
    "You clearly practice.",
    "Strong musical memory.",
    "One semitone away from god.",
    "Close enough to hurt.",
    "Your ear is well-trained.",
    "Nearly untouchable.",
    "Room to be perfect.",
  ],

  good: [
    "Not bad at all.",
    "You're getting it.",
    "Above average.",
    "Fairly accurate.",
    "Decent relative pitch.",
    "Better than most.",
    "Your brain held on.",
    "Respectable.",
    "The melody stayed with you.",
    "Passing grade.",
    "More right than wrong.",
    "You've got something here.",
  ],

  poor: [
    "Needs practice.",
    "A bit off.",
    "Keep trying.",
    "Tough one.",
    "The notes had other plans.",
    "Close-ish.",
    "Your memory faded fast.",
    "Transposed to a different key... entirely.",
    "Room for improvement is an understatement.",
    "The spirit was there.",
    "You heard something.",
    "At least you finished.",
  ],

  terrible: [
    "Are your speakers on?",
    "Tone deaf?",
    "Ouch.",
    "Did you even try?",
    "That was a different song.",
    "The melody called. You didn't answer.",
    "You invented a new key.",
    "This one stays between us.",
    "Beethoven is crying. He can finally hear.",
    "That was... ambitious.",
    "Bold choices across the board.",
    "The notes were suggestions, apparently.",
    "Try turning it off and on again.",
    "We all start somewhere.",
  ],
};

export default function ScoreReveal({ correctSequence, playerSequence, onComplete }: ScoreRevealProps) {
  const [highlights, setHighlights] = useState<{ note: string, color: 'blue' | 'red' | 'green' | 'yellow' }[]>([]);
  const [currentScore, setCurrentScore] = useState(0);
  const scoreRef = useRef(0);

  const [isRevealing, setIsRevealing] = useState(true);
  const [quip, setQuip] = useState("");
  const finalScoreRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const playReveal = async () => {
      let totalScore = 0;
      await new Promise(r => setTimeout(r, 1000));

      for (let i = 0; i < 4; i++) {
        if (!isMounted) return;
        const correct = correctSequence[i];
        const player = playerSequence[i];

        setHighlights([{ note: correct, color: 'blue' }]);
        engine.playNote(correct, '8n');
        await new Promise(r => setTimeout(r, 600));

        if (!isMounted) return;
        
        const dist = Math.abs(NOTES.indexOf(player) - NOTES.indexOf(correct));
        
        if (player === correct) {
          setHighlights([
            { note: correct, color: 'green' }
          ]);
        } else if (dist <= 2) {
          setHighlights([
            { note: correct, color: 'blue' },
            { note: player, color: 'yellow' }
          ]);
        } else {
          setHighlights([
            { note: correct, color: 'blue' },
            { note: player, color: 'red' }
          ]);
        }
        
        engine.playNote(player, '8n');

        const points = scoreNote(player, correct);
        totalScore += points;

        const scoreObj = { val: scoreRef.current };
        gsap.to(scoreObj, {
          val: totalScore,
          duration: 0.8,
          ease: 'power2.out',
          onUpdate: function () {
            if (isMounted) {
              scoreRef.current = scoreObj.val;
              setCurrentScore(Math.round(scoreObj.val * 100) / 100);
            }
          }
        });

        await new Promise(r => setTimeout(r, 1000));
        if (isMounted) setHighlights([]);
        await new Promise(r => setTimeout(r, 200));
      }

      if (isMounted) {
        finalScoreRef.current = Math.round(totalScore * 100) / 100;
        let category: keyof typeof QUIPS = 'terrible';
        if (totalScore >= 9.5) category = 'perfect';
        else if (totalScore >= 8.5) category = 'great';
        else if (totalScore >= 7.0) category = 'good';
        else if (totalScore >= 5.0) category = 'poor';

        const possible = QUIPS[category];
        setQuip(possible[Math.floor(Math.random() * possible.length)]);
        setIsRevealing(false);
      }
    };

    playReveal();

    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 w-full animate-in fade-in zoom-in duration-700">
      <div className="flex items-center justify-center flex-col">
        <h3 className="text-text-muted text-sm uppercase tracking-widest mb-2 font-display">Score</h3>
        <h2 className="text-6xl text-white font-display pb-2">
          {currentScore.toFixed(2)} <span className="text-2xl text-text-faint">/ 10</span>
        </h2>
        <div className="h-px w-16 bg-border mb-4" />

        <div className="h-6 flex items-center justify-center">
          {!isRevealing && (
            <p className="text-text-muted uppercase tracking-[0.2em] text-xs animate-in fade-in slide-in-from-bottom-2">
              {quip}
            </p>
          )}
        </div>
      </div>

      <div className="w-full pointer-events-none scale-90 sm:scale-100">
        <Piano disabled={true} highlightedNotes={highlights} />
      </div>

      <div className="mt-4 h-12 flex items-center justify-center">
        {!isRevealing && (
          <button
            autoFocus
            onClick={() => onComplete(finalScoreRef.current)}
            className="px-10 py-3 rounded-full border border-border text-white hover:bg-white hover:text-black transition-colors text-sm font-semibold tracking-widest uppercase animate-in fade-in zoom-in-95 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white focus:text-black"
          >
            Next Round
          </button>
        )}
      </div>
    </div>
  );
}
