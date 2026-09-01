import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAudioContext,
  playChimeSound,
  setAudioContextForTesting,
} from '../utils/soundSynth';

describe('soundSynth Web Audio Synthesizer', () => {
  let mockOscillator: {
    type: string;
    frequency: { setValueAtTime: ReturnType<typeof vi.fn> };
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  };

  let mockGain: {
    gain: {
      setValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
  };

  let mockAudioContext: {
    state: AudioContextState;
    currentTime: number;
    destination: Record<string, unknown>;
    resume: ReturnType<typeof vi.fn>;
    createOscillator: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockOscillator = {
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 10.0,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGain),
    };

    setAudioContextForTesting(mockAudioContext as unknown as AudioContext);
  });

  afterEach(() => {
    setAudioContextForTesting(null);
    vi.restoreAllMocks();
  });

  it('resumes audio context if suspended', () => {
    mockAudioContext.state = 'suspended';
    const ctx = getAudioContext();
    expect(ctx).toBe(mockAudioContext);
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });

  it('synthesizes focus complete pentatonic bell chime (4 notes)', () => {
    const success = playChimeSound('focusComplete');
    expect(success).toBe(true);
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4);
    expect(mockAudioContext.createGain).toHaveBeenCalledTimes(4);
    expect(mockOscillator.start).toHaveBeenCalledTimes(4);
    expect(mockOscillator.stop).toHaveBeenCalledTimes(4);
  });

  it('synthesizes break complete readiness chime (3 notes)', () => {
    const success = playChimeSound('breakComplete');
    expect(success).toBe(true);
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
    expect(mockAudioContext.createGain).toHaveBeenCalledTimes(3);
    expect(mockOscillator.start).toHaveBeenCalledTimes(3);
    expect(mockOscillator.stop).toHaveBeenCalledTimes(3);
  });

  it('handles null audio context gracefully without throwing', () => {
    setAudioContextForTesting(null);
    const origAudioContext = window.AudioContext;
    // @ts-expect-error Mocking window AudioContext removal
    delete window.AudioContext;

    const result = playChimeSound('focusComplete');
    expect(result).toBe(false);

    window.AudioContext = origAudioContext;
  });
});
