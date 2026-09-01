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
});
