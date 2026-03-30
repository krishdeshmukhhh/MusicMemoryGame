// lib/audio.ts
import * as Tone from 'tone';

class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private isInitialized = false;

  public async init() {
    if (this.isInitialized) return;
    
    await Tone.start();

    // Create a smooth, warm electric piano / synth pad sound
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.02,
        decay: 0.2,
        sustain: 0.2,
        release: 0.6
      }
    });

    const reverb = new Tone.Reverb({
      decay: 2,
      preDelay: 0.01,
      wet: 0.3
    });

    const delay = new Tone.FeedbackDelay({
      delayTime: 0.3,
      feedback: 0.3,
      wet: 0.2
    });

    this.synth.chain(delay, reverb, Tone.Destination);
    
    // Wait for reverb to generate
    await reverb.generate();

    Tone.Transport.bpm.value = 120;
    
    // PRE-COMPILE WARMUP: Web Audio takes ~50ms to JIT compile the native audio nodes 
    // for the very first note. Triggering a silent note here forces compilation immediately 
    // so the first round's sequence plays perfectly in sync.
    this.synth.triggerAttackRelease(['C4', 'E4', 'G4'], '32n', Tone.now(), 0);

    this.isInitialized = true;
  }

  public playNote(note: string, duration: string | number = '8n') {
    if (!this.synth) return;
    this.synth.triggerAttackRelease(note, duration);
  }

  public playSequence(notes: string[], onUpdate?: (noteIndex: number) => void, onComplete?: () => void) {
    if (!this.synth) return;
    
    const now = Tone.now() + 0.1;
    const noteGap = 0.5; // Gap in seconds between notes

    notes.forEach((note, i) => {
      const time = now + (i * noteGap);
      
      // Schedule the audio precisely
      this.synth!.triggerAttackRelease(note, '8n', time);
      
      // Schedule UI callbacks using standard Javascript setTimeout 
      // instead of Tone.Draw to prevent background-tab freezing
      const delayMs = (time - Tone.now()) * 1000;
      setTimeout(() => {
        if (onUpdate) onUpdate(i);
      }, delayMs);
    });

    // Schedule completion
    const completeTime = now + (notes.length * noteGap);
    const finishDelayMs = (completeTime - Tone.now()) * 1000;
    setTimeout(() => {
      if (onComplete) onComplete();
    }, finishDelayMs);
  }
}

// Export a singleton instance
export const engine = new AudioEngine();
