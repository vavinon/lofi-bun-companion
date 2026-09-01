/**
 * Zero-Asset Web Audio Synthesizer for Lo-fi Bun Companion.
 *
 * Produces cozy, gentle pentatonic bell chimes using native Web Audio API oscillators.
 * Requires 0 external MP3/WAV assets to maintain zero CPU/bundle overhead.
 */

export type ChimeType = 'focusComplete' | 'breakComplete';

/** Audio context holder singleton */
let audioCtx: AudioContext | null = null;

/**
 * Lazily initialize and retrieve the shared AudioContext instance.
 * Handles suspended context resumption safely.
 */
export const getAudioContext = (): AudioContext | null => {
  // If an audio context is already instantiated (or mocked for testing), reuse it.
  if (audioCtx) {
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume().catch(() => {
        // Safe catch if user has not yet interacted with the window
      });
    }
    return audioCtx;
  }

  if (typeof window === 'undefined') return null;

  const AudioContextClass =
    window.AudioContext ||
    (
      window as unknown as {
        webkitAudioContext: typeof AudioContext;
      }
    ).webkitAudioContext;

  if (!AudioContextClass) return null;

  try {
    audioCtx = new AudioContextClass();
  } catch {
    return null;
  }

  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => {
      // Ignored if user has not yet interacted with the window
    });
  }

  return audioCtx;
};

/**
 * Override the internal AudioContext instance (primarily used for unit testing).
 */
export const setAudioContextForTesting = (
  mockContext: AudioContext | null
): void => {
  audioCtx = mockContext;
};

interface BellNote {
  freq: number;
  timeOffset: number;
  duration: number;
  gain: number;
}

/**
 * Synthesizes a single bell tone with harmonic overtone decay.
 */
const playBellTone = (
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  peakGain: number
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Fundamental frequency (Sine wave for lo-fi softness)
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);

  // Smooth attack and gentle exponential decay
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
};

/**
 * Play a gentle pentatonic chime sequence based on the completed phase.
 */
export const playChimeSound = (type: ChimeType = 'focusComplete'): boolean => {
  const ctx = getAudioContext();
  if (!ctx) return false;

  const now = ctx.currentTime;

  if (type === 'focusComplete') {
    // Warm E Major / Pentatonic relaxing rest chime (E5 -> G#5 -> B5 -> E6)
    const notes: BellNote[] = [
      { freq: 659.25, timeOffset: 0.0, duration: 1.2, gain: 0.15 },
      { freq: 830.61, timeOffset: 0.18, duration: 1.2, gain: 0.13 },
      { freq: 987.77, timeOffset: 0.36, duration: 1.4, gain: 0.12 },
      { freq: 1318.51, timeOffset: 0.54, duration: 1.8, gain: 0.1 },
    ];

    for (const note of notes) {
      playBellTone(
        ctx,
        note.freq,
        now + note.timeOffset,
        note.duration,
        note.gain
      );
    }
    return true;
  }

  // breakComplete: Cheerful upward focus readiness chime (A4 -> C#5 -> E5)
  const notes: BellNote[] = [
    { freq: 440.0, timeOffset: 0.0, duration: 0.8, gain: 0.15 },
    { freq: 554.37, timeOffset: 0.15, duration: 0.9, gain: 0.14 },
    { freq: 659.25, timeOffset: 0.3, duration: 1.2, gain: 0.16 },
  ];

  for (const note of notes) {
    playBellTone(
      ctx,
      note.freq,
      now + note.timeOffset,
      note.duration,
      note.gain
    );
  }
  return true;
};
