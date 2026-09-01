/**
 * Pomodoro domain types and contracts for Lo-fi Bun Companion.
 * Adheres to SemVer 2.0.0 - Release 2.0.0 Pomodoro Focus Suite.
 */

/** Supported Pomodoro timer presets and custom mode */
export type PomodoroMode = '25_5' | '50_10' | 'CUSTOM';

/** Operational phase of the Pomodoro cycle */
export type PomodoroPhase = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

/** Execution status of the timer */
export type PomodoroStatus = 'IDLE' | 'RUNNING' | 'PAUSED';

/** Interval durations represented in seconds */
export interface PomodoroDurations {
  /** Focus session length (seconds) */
  focus: number;
  /** Short rest duration (seconds) */
  shortBreak: number;
  /** Long restorative break duration (seconds) */
  longBreak: number;
}

/** Daily focus statistics and streak tracking */
export interface DailyStreakStats {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Number of completed focus sessions today */
  completedCycles: number;
  /** Cumulative focused time in minutes */
  totalFocusMinutes: number;
}

/** User configurable preferences for Pomodoro behaviors */
export interface PomodoroPreferences {
  /** Whether to automatically start break timers when focus ends */
  autoStartBreaks: boolean;
  /** Whether to automatically start next focus session when break ends */
  autoStartFocus: boolean;
  /** Whether to synthesize Web Audio bell chimes on phase transitions */
  soundEnabled: boolean;
  /** Whether to dispatch native OS desktop notifications */
  notificationEnabled: boolean;
  /** Whether to display the compact mini timer badge on desktop mascot */
  miniWidgetVisible: boolean;
}

/** Default preset interval configurations (in seconds) */
export const PRESET_DURATIONS: Record<PomodoroMode, PomodoroDurations> = {
  '25_5': {
    focus: 25 * 60, // 1500s
    shortBreak: 5 * 60, // 300s
    longBreak: 15 * 60, // 900s
  },
  '50_10': {
    focus: 50 * 60, // 3000s
    shortBreak: 10 * 60, // 600s
    longBreak: 20 * 60, // 1200s
  },
  CUSTOM: {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  },
};

/** Number of focus cycles completed before triggering a long break */
export const CYCLES_UNTIL_LONG_BREAK = 4;

/** LocalStorage key for persisting Pomodoro preferences and streak data */
export const POMODORO_STORAGE_KEY = 'lofi_bun_pomodoro_v2';
