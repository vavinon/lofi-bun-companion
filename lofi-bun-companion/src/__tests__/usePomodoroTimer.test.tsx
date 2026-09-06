/**
 * Automated Unit Tests for usePomodoroTimer Hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';
import { usePomodoroStore } from '../stores/pomodoroStore';
import { useCompanionStore } from '../stores/companionStore';
import * as soundSynth from '../utils/soundSynth';

// Enable React act environment in JSDOM
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const TestHarness: React.FC = () => {
  usePomodoroTimer();
  return null;
};

describe('usePomodoroTimer hook', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    usePomodoroStore.getState().resetToDefaults();
    useCompanionStore.getState().resetToDefaults();
    vi.spyOn(soundSynth, 'playChimeSound').mockReturnValue(true);

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('drives countdown interval when status is RUNNING', async () => {
    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      usePomodoroStore.getState().startFocus();
    });

    const initialSeconds = usePomodoroStore.getState().remainingSeconds;

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(usePomodoroStore.getState().remainingSeconds).toBe(
      initialSeconds - 3
    );
  });

  it('automatically sets companion forceRest to true during break phases', async () => {
    await act(async () => {
      root.render(<TestHarness />);
    });

    expect(useCompanionStore.getState().forceRest).toBe(false);

    await act(async () => {
      usePomodoroStore.setState({ phase: 'SHORT_BREAK' });
    });

    expect(useCompanionStore.getState().forceRest).toBe(true);

    await act(async () => {
      usePomodoroStore.setState({ phase: 'LONG_BREAK' });
    });

    expect(useCompanionStore.getState().forceRest).toBe(true);

    await act(async () => {
      usePomodoroStore.setState({ phase: 'FOCUS' });
    });

    expect(useCompanionStore.getState().forceRest).toBe(false);
  });

  it('triggers sound chime on phase transitions when sound is enabled', async () => {
    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      usePomodoroStore.setState({ phase: 'SHORT_BREAK' });
    });

    expect(soundSynth.playChimeSound).toHaveBeenCalledWith('focusComplete');

    await act(async () => {
      usePomodoroStore.setState({ phase: 'FOCUS' });
    });

    expect(soundSynth.playChimeSound).toHaveBeenCalledWith('breakComplete');
  });

  it('preserves fractional remainder across sub-second timer intervals', async () => {
    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      usePomodoroStore.getState().startFocus();
    });

    const initial = usePomodoroStore.getState().remainingSeconds;

    // Advance 1400ms (1.4s) -> interval fires at 1000ms, elapsed = 1s, 400ms remaining
    await act(async () => {
      vi.advanceTimersByTime(1400);
    });
    expect(usePomodoroStore.getState().remainingSeconds).toBe(initial - 1);

    // Advance another 800ms -> total 2200ms -> should tick 1 more second (preserving 200ms)
    await act(async () => {
      vi.advanceTimersByTime(800);
    });
    expect(usePomodoroStore.getState().remainingSeconds).toBe(initial - 2);
  });

  it('re-synchronizes countdown immediately on visibilitychange and focus events', async () => {
    await act(async () => {
      root.render(<TestHarness />);
    });

    await act(async () => {
      usePomodoroStore.getState().startFocus();
    });

    const initial = usePomodoroStore.getState().remainingSeconds;

    // Simulate system sleep/window minimize: advance system clock without running interval
    await act(async () => {
      vi.setSystemTime(Date.now() + 5000);
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(usePomodoroStore.getState().remainingSeconds).toBe(initial - 5);

    // Simulate window regain focus
    await act(async () => {
      vi.setSystemTime(Date.now() + 3000);
      window.dispatchEvent(new Event('focus'));
    });

    expect(usePomodoroStore.getState().remainingSeconds).toBe(initial - 8);
  });
});
