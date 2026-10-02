// lib/audio.ts — pitch-game synth. Tone.js (~300 KB) is loaded lazily so it stays off
// the critical path: `preload()` fetches it during idle time after first paint, and
// `init()` (called from a user gesture) starts the AudioContext.
import type * as ToneNS from 'tone';

type Tone = typeof ToneNS;

class AudioEngine {
  private tone: Tone | null = null;
  private tonePromise: Promise<Tone> | null = null;
  private synth: ToneNS.PolySynth | null = null;
  private initPromise: Promise<void> | null = null;

  /** Start downloading Tone.js without creating any audio nodes. Safe to call repeatedly. */
  public preload(): Promise<Tone> {
    if (!this.tonePromise) {
      this.tonePromise = import('tone').then(mod => (this.tone = mod));
    }
    return this.tonePromise;
  }

  public init(): Promise<void> {
    // If Tone is already loaded, resume the AudioContext synchronously inside the
    // user gesture — iOS Safari is strict about this.
    if (this.tone && !this.synth) void this.tone.start();
    if (!this.initPromise) {
      this.initPromise = this.setup().catch(err => {
        this.initPromise = null; // allow a retry on the next gesture
        throw err;
      });
    }
    return this.initPromise;
  }

  private async setup() {
    const Tone = await this.preload();
    await Tone.start();

    // Create a smooth, warm electric piano / synth pad sound
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.6 },
    });
    const reverb = new Tone.Reverb({ decay: 2, preDelay: 0.01, wet: 0.3 });
    const delay = new Tone.FeedbackDelay({ delayTime: 0.3, feedback: 0.3, wet: 0.2 });

    synth.chain(delay, reverb, Tone.Destination);

    // Wait for reverb to generate
    await reverb.generate();

    Tone.getTransport().bpm.value = 120;

    // PRE-COMPILE WARMUP: Web Audio takes ~50ms to JIT compile the native audio nodes
    // for the very first note. Triggering a silent note here forces compilation immediately
    // so the first round's sequence plays perfectly in sync.
    synth.triggerAttackRelease(['C4', 'E4', 'G4'], '32n', Tone.now(), 0);

    this.synth = synth;
  }

  public playNote(note: string, duration: string | number = '8n') {
    if (!this.synth) return;
    this.synth.triggerAttackRelease(note, duration);
  }

  public playSequence(notes: string[], onUpdate?: (noteIndex: number) => void, onComplete?: () => void) {
    const Tone = this.tone;
    if (!this.synth || !Tone) return;

    const now = Tone.now() + 0.1;
    const noteGap = 0.5; // Gap in seconds between notes

    notes.forEach((note, i) => {
      const time = now + (i * noteGap);

      // Schedule the audio precisely
      this.synth!.triggerAttackRelease(note, '8n', time);

      // Schedule UI callbacks using standard Javascript setTimeout
      // instead of Tone.Draw to prevent background-tab freezing
      const delayMs = (time - Tone.now()) * 1000;
      setTimeout(() => onUpdate?.(i), delayMs);
    });

    // Schedule completion
    const finishDelayMs = (now + (notes.length * noteGap) - Tone.now()) * 1000;
    setTimeout(() => onComplete?.(), finishDelayMs);
  }
}

// Export a singleton instance
export const engine = new AudioEngine();
