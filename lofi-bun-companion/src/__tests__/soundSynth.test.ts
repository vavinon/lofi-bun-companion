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
    disconnect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    onended: (() => void) | null;
  };

  let mockGain: {
    gain: {
      setValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };

  let mockAudioContext: {
    state: AudioContextState;
    currentTime: number;
    destination: Record<string, unknown>;
    resume: ReturnType<typeof vi.fn>;
    suspend: ReturnType<typeof vi.fn>;
    createOscillator: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockOscillator = {
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    };

    mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 10.0,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      suspend: vi.fn().mockResolvedValue(undefined),
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGain),
    };

    setAudioContextForTesting(mockAudioContext as unknown as AudioContext);
  });

  afterEach(() => {
    setAudioContextForTesting(null);
    vi.useRealTimers();
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

  it('disconnects audio nodes on note completion to trigger garbage collection', () => {
    playChimeSound('focusComplete');
    expect(typeof mockOscillator.onended).toBe('function');

    // Simulate oscillator tone completion event
    mockOscillator.onended!();
    expect(mockOscillator.disconnect).toHaveBeenCalled();
    expect(mockGain.disconnect).toHaveBeenCalled();
  });

  it('schedules debounced suspend after 3 seconds to return CPU to 0.0%', () => {
    playChimeSound('focusComplete');
    expect(mockAudioContext.suspend).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2999);
    expect(mockAudioContext.suspend).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(mockAudioContext.suspend).toHaveBeenCalledTimes(1);
  });

  it('resets debounced suspend timer when another chime is triggered within 3s', () => {
    playChimeSound('focusComplete');
    vi.advanceTimersByTime(2000);

    // Trigger second chime before 3.0s expires
    playChimeSound('breakComplete');
    vi.advanceTimersByTime(2000);
    expect(mockAudioContext.suspend).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(mockAudioContext.suspend).toHaveBeenCalledTimes(1);
  });
});
