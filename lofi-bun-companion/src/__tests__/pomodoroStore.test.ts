import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  usePomodoroStore,
  getTodayDateString,
  getPhaseDuration,
} from '../stores/pomodoroStore';
import { POMODORO_STORAGE_KEY, PRESET_DURATIONS } from '../types/pomodoro';

describe('usePomodoroStore', () => {
  beforeEach(() => {
    localStorage.clear();
    usePomodoroStore.getState().resetToDefaults();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with 25/5 defaults and IDLE state', () => {
    const state = usePomodoroStore.getState();
    expect(state.mode).toBe('25_5');
    expect(state.phase).toBe('FOCUS');
    expect(state.status).toBe('IDLE');
    expect(state.remainingSeconds).toBe(25 * 60);
    expect(state.totalSeconds).toBe(25 * 60);
    expect(state.currentCycle).toBe(1);
    expect(state.completedCycles).toBe(0);
    expect(state.preferences.soundEnabled).toBe(true);
  });

  it('starts focus timer and changes status to RUNNING', () => {
    usePomodoroStore.getState().startFocus();
    const state = usePomodoroStore.getState();
    expect(state.status).toBe('RUNNING');
    expect(state.phase).toBe('FOCUS');
    expect(state.remainingSeconds).toBe(25 * 60);
  });

  it('pauses, resumes, and resets timer', () => {
    const store = usePomodoroStore.getState();
    store.startFocus();
    expect(usePomodoroStore.getState().status).toBe('RUNNING');

    store.pauseTimer();
    expect(usePomodoroStore.getState().status).toBe('PAUSED');

    store.resumeTimer();
    expect(usePomodoroStore.getState().status).toBe('RUNNING');

    store.resetTimer();
    const resetState = usePomodoroStore.getState();
    expect(resetState.status).toBe('IDLE');
    expect(resetState.remainingSeconds).toBe(25 * 60);
  });

  it('switches timer mode and updates duration when IDLE', () => {
    usePomodoroStore.getState().setMode('50_10');
    let state = usePomodoroStore.getState();
    expect(state.mode).toBe('50_10');
    expect(state.remainingSeconds).toBe(50 * 60);
    expect(state.totalSeconds).toBe(50 * 60);

    usePomodoroStore.getState().setMode('CUSTOM');
    state = usePomodoroStore.getState();
    expect(state.mode).toBe('CUSTOM');
  });

  it('updates custom durations and recalculates in CUSTOM mode', () => {
    usePomodoroStore.getState().setMode('CUSTOM');
    usePomodoroStore.getState().setCustomDurations({
      focus: 35 * 60,
      shortBreak: 7 * 60,
      longBreak: 25 * 60,
    });

    const state = usePomodoroStore.getState();
    expect(state.customDurations.focus).toBe(35 * 60);
    expect(state.remainingSeconds).toBe(35 * 60);
  });

  it('ticks down by 1 second when status is RUNNING', () => {
    usePomodoroStore.getState().startFocus();
    const initialRemaining = usePomodoroStore.getState().remainingSeconds;

    const result = usePomodoroStore.getState().tick();
    expect(result.phaseEnded).toBe(false);
    expect(usePomodoroStore.getState().remainingSeconds).toBe(
      initialRemaining - 1
    );
  });

  it('does not tick when status is IDLE or PAUSED', () => {
    const initialRemaining = usePomodoroStore.getState().remainingSeconds;
    usePomodoroStore.getState().tick();
    expect(usePomodoroStore.getState().remainingSeconds).toBe(initialRemaining);

    usePomodoroStore.getState().startFocus();
    usePomodoroStore.getState().pauseTimer();
    usePomodoroStore.getState().tick();
    expect(usePomodoroStore.getState().remainingSeconds).toBe(initialRemaining);
  });

  it('transitions from FOCUS to SHORT_BREAK when timer expires (Cycles 1 to 3)', () => {
    usePomodoroStore.getState().startFocus();
    usePomodoroStore.setState({ remainingSeconds: 1 });

    const result = usePomodoroStore.getState().tick();
    expect(result.phaseEnded).toBe(true);
    expect(result.previousPhase).toBe('FOCUS');
    expect(result.nextPhase).toBe('SHORT_BREAK');

    const state = usePomodoroStore.getState();
    expect(state.phase).toBe('SHORT_BREAK');
    expect(state.currentCycle).toBe(2);
    expect(state.completedCycles).toBe(1);
    expect(state.dailyStreak.completedCycles).toBe(1);
    expect(state.dailyStreak.totalFocusMinutes).toBe(25);
    expect(state.remainingSeconds).toBe(5 * 60);
  });

  it('triggers LONG_BREAK on completion of cycle 4', () => {
    usePomodoroStore.setState({
      currentCycle: 4,
      phase: 'FOCUS',
      status: 'RUNNING',
      remainingSeconds: 1,
    });

    const result = usePomodoroStore.getState().tick();
    expect(result.phaseEnded).toBe(true);
    expect(result.nextPhase).toBe('LONG_BREAK');

    const state = usePomodoroStore.getState();
    expect(state.phase).toBe('LONG_BREAK');
    expect(state.currentCycle).toBe(1); // Resets cycle loop back to 1
    expect(state.remainingSeconds).toBe(15 * 60);
  });

  it('transitions from BREAK to FOCUS on skipPhase', () => {
    usePomodoroStore.setState({
      phase: 'SHORT_BREAK',
      remainingSeconds: 300,
    });

    const result = usePomodoroStore.getState().skipPhase();
    expect(result.nextPhase).toBe('FOCUS');
    expect(usePomodoroStore.getState().phase).toBe('FOCUS');
    expect(usePomodoroStore.getState().remainingSeconds).toBe(25 * 60);
  });

  it('persists preferences and updates LocalStorage', () => {
    usePomodoroStore.getState().setPreferences({
      soundEnabled: false,
      autoStartBreaks: true,
    });

    const state = usePomodoroStore.getState();
    expect(state.preferences.soundEnabled).toBe(false);
    expect(state.preferences.autoStartBreaks).toBe(true);

    const stored = JSON.parse(
      localStorage.getItem(POMODORO_STORAGE_KEY) || '{}'
    );
    expect(stored.preferences?.soundEnabled).toBe(false);
    expect(stored.preferences?.autoStartBreaks).toBe(true);
  });

  it('resets daily streak stats correctly', () => {
    usePomodoroStore.setState({
      dailyStreak: {
        date: getTodayDateString(),
        completedCycles: 5,
        totalFocusMinutes: 125,
      },
      completedCycles: 5,
    });

    usePomodoroStore.getState().resetStreak();
    const state = usePomodoroStore.getState();
    expect(state.dailyStreak.completedCycles).toBe(0);
    expect(state.dailyStreak.totalFocusMinutes).toBe(0);
    expect(state.completedCycles).toBe(0);
  });

  it('calculates getPhaseDuration correctly for all modes', () => {
    expect(getPhaseDuration('25_5', 'FOCUS', PRESET_DURATIONS.CUSTOM)).toBe(
      1500
    );
    expect(
      getPhaseDuration('50_10', 'SHORT_BREAK', PRESET_DURATIONS.CUSTOM)
    ).toBe(600);
    expect(
      getPhaseDuration('50_10', 'LONG_BREAK', PRESET_DURATIONS.CUSTOM)
    ).toBe(1200);
    expect(
      getPhaseDuration('CUSTOM', 'FOCUS', {
        focus: 100,
        shortBreak: 50,
        longBreak: 200,
      })
    ).toBe(100);
  });
});
