/**
 * Reactive Zustand store for Pomodoro Focus Suite.
 *
 * Coordinates focus/break timer countdowns, cycle progression (25/5, 50/10, Custom),
 * daily streak statistics, and LocalStorage persistence.
 *
 * Employs `subscribeWithSelector` for zero-overhead component subscriptions.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  CYCLES_UNTIL_LONG_BREAK,
  DailyStreakStats,
  POMODORO_STORAGE_KEY,
  PomodoroDurations,
  PomodoroMode,
  PomodoroPhase,
  PomodoroPreferences,
  PomodoroStatus,
  PRESET_DURATIONS,
} from '../types/pomodoro';

export interface PomodoroTickResult {
  phaseEnded: boolean;
  previousPhase?: PomodoroPhase;
  nextPhase?: PomodoroPhase;
}

export interface PomodoroStoreState {
  /** Selected countdown preset mode */
  mode: PomodoroMode;
  /** Active session phase (FOCUS, SHORT_BREAK, LONG_BREAK) */
  phase: PomodoroPhase;
  /** Current timer activity status (IDLE, RUNNING, PAUSED) */
  status: PomodoroStatus;
  /** Countdown time left in seconds */
  remainingSeconds: number;
  /** Total duration in seconds for the current phase */
  totalSeconds: number;
  /** Current cycle within the 4-cycle loop (1 to 4) */
  currentCycle: number;
  /** Lifetime / session completed focus cycles count */
  completedCycles: number;
  /** Custom configured interval durations */
  customDurations: PomodoroDurations;
  /** User preferences (sounds, notifications, auto-start) */
  preferences: PomodoroPreferences;
  /** Daily focus streak and cumulative minutes */
  dailyStreak: DailyStreakStats;

  // Actions
  /** Start or switch to an active focus session immediately */
  startFocus: () => void;
  /** Resume timer execution */
  resumeTimer: () => void;
  /** Pause timer execution */
  pauseTimer: () => void;
  /** Reset current phase timer back to full duration in IDLE status */
  resetTimer: () => void;
  /** Advance immediately to the next phase */
  skipPhase: () => PomodoroTickResult;
  /** Select preset timer mode ('25_5', '50_10', 'CUSTOM') */
  setMode: (mode: PomodoroMode) => void;
  /** Update custom timer durations */
  setCustomDurations: (durations: Partial<PomodoroDurations>) => void;
  /** Update user preferences */
  setPreferences: (preferences: Partial<PomodoroPreferences>) => void;
  /** Advance the countdown by 1 second. Evaluates phase completion triggers. */
  tick: () => PomodoroTickResult;
  /** Reset today's daily streak statistics */
  resetStreak: () => void;
  /** Reset entire Pomodoro store to default values */
  resetToDefaults: () => void;
}

/** Default user preferences */
export const DEFAULT_PREFERENCES: PomodoroPreferences = {
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  notificationEnabled: true,
  miniWidgetVisible: true,
};

/** Helper to generate today's local date string in YYYY-MM-DD format */
export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Helper to get duration for a phase based on mode and custom configs */
export const getPhaseDuration = (
  mode: PomodoroMode,
  phase: PomodoroPhase,
  custom: PomodoroDurations
): number => {
  const durations = mode === 'CUSTOM' ? custom : PRESET_DURATIONS[mode];
  switch (phase) {
    case 'FOCUS':
      return durations.focus;
    case 'SHORT_BREAK':
      return durations.shortBreak;
    case 'LONG_BREAK':
      return durations.longBreak;
  }
};

interface PersistedData {
  customDurations: PomodoroDurations;
  preferences: PomodoroPreferences;
  dailyStreak: DailyStreakStats;
}

/** Safe LocalStorage loader */
const loadPersistedData = (): PersistedData => {
  const today = getTodayDateString();
  const defaultData: PersistedData = {
    customDurations: { ...PRESET_DURATIONS.CUSTOM },
    preferences: { ...DEFAULT_PREFERENCES },
    dailyStreak: {
      date: today,
      completedCycles: 0,
      totalFocusMinutes: 0,
    },
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultData;
  }

  try {
    const raw = window.localStorage.getItem(POMODORO_STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as Partial<PersistedData>;

    // Handle date rollover for streak
    let streak = parsed.dailyStreak;
    if (!streak || streak.date !== today) {
      streak = {
        date: today,
        completedCycles: 0,
        totalFocusMinutes: 0,
      };
    }

    return {
      customDurations: {
        ...defaultData.customDurations,
        ...parsed.customDurations,
      },
      preferences: {
        ...defaultData.preferences,
        ...parsed.preferences,
      },
      dailyStreak: streak,
    };
  } catch {
    return defaultData;
  }
};

/** Safe LocalStorage saver */
const savePersistedData = (data: PersistedData): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Safely ignore quota/storage errors
  }
};

const initialPersisted = loadPersistedData();
const INITIAL_MODE: PomodoroMode = '25_5';
const INITIAL_PHASE: PomodoroPhase = 'FOCUS';
const initialDuration = getPhaseDuration(
  INITIAL_MODE,
  INITIAL_PHASE,
  initialPersisted.customDurations
);

export const usePomodoroStore = create<PomodoroStoreState>()(
  subscribeWithSelector((set, get) => ({
    mode: INITIAL_MODE,
    phase: INITIAL_PHASE,
    status: 'IDLE',
    remainingSeconds: initialDuration,
    totalSeconds: initialDuration,
    currentCycle: 1,
    completedCycles: 0,
    customDurations: initialPersisted.customDurations,
    preferences: initialPersisted.preferences,
    dailyStreak: initialPersisted.dailyStreak,

    startFocus: () => {
      const state = get();
      const duration = getPhaseDuration(
        state.mode,
        'FOCUS',
        state.customDurations
      );
      set(() => ({
        phase: 'FOCUS',
        status: 'RUNNING',
        remainingSeconds: duration,
        totalSeconds: duration,
      }));
    },

    resumeTimer: () => {
      set(() => ({ status: 'RUNNING' }));
    },

    pauseTimer: () => {
      set(() => ({ status: 'PAUSED' }));
    },

    resetTimer: () => {
      const state = get();
      const duration = getPhaseDuration(
        state.mode,
        state.phase,
        state.customDurations
      );
      set(() => ({
        status: 'IDLE',
        remainingSeconds: duration,
        totalSeconds: duration,
      }));
    },

    skipPhase: () => {
      const state = get();
      const prevPhase = state.phase;
      let nextPhase: PomodoroPhase = 'FOCUS';
      let nextCycle = state.currentCycle;
      let nextCompleted = state.completedCycles;
      const today = getTodayDateString();
      let streak = { ...state.dailyStreak };

      if (streak.date !== today) {
        streak = { date: today, completedCycles: 0, totalFocusMinutes: 0 };
      }

      if (prevPhase === 'FOCUS') {
        nextCompleted += 1;
        const focusDurationMinutes = Math.round(state.totalSeconds / 60);
        streak.completedCycles += 1;
        streak.totalFocusMinutes += focusDurationMinutes;

        if (state.currentCycle >= CYCLES_UNTIL_LONG_BREAK) {
          nextPhase = 'LONG_BREAK';
          nextCycle = 1;
        } else {
          nextPhase = 'SHORT_BREAK';
          nextCycle = state.currentCycle + 1;
        }
      } else {
        // From SHORT_BREAK or LONG_BREAK -> Next is FOCUS
        nextPhase = 'FOCUS';
      }

      const nextDuration = getPhaseDuration(
        state.mode,
        nextPhase,
        state.customDurations
      );

      const autoStart =
        nextPhase === 'FOCUS'
          ? state.preferences.autoStartFocus
          : state.preferences.autoStartBreaks;

      set(() => ({
        phase: nextPhase,
        currentCycle: nextCycle,
        completedCycles: nextCompleted,
        remainingSeconds: nextDuration,
        totalSeconds: nextDuration,
        status: autoStart ? 'RUNNING' : 'IDLE',
        dailyStreak: streak,
      }));

      savePersistedData({
        customDurations: state.customDurations,
        preferences: state.preferences,
        dailyStreak: streak,
      });

      return {
        phaseEnded: true,
        previousPhase: prevPhase,
        nextPhase,
      };
    },

    setMode: (mode) => {
      set((state) => {
        const nextDuration = getPhaseDuration(
          mode,
          state.phase,
          state.customDurations
        );
        return {
          mode,
          remainingSeconds:
            state.status === 'IDLE' ? nextDuration : state.remainingSeconds,
          totalSeconds:
            state.status === 'IDLE' ? nextDuration : state.totalSeconds,
        };
      });
    },

    setCustomDurations: (partial) => {
      set((state) => {
        const nextCustom: PomodoroDurations = {
          ...state.customDurations,
          ...partial,
        };
        const nextDuration = getPhaseDuration(
          state.mode,
          state.phase,
          nextCustom
        );

        savePersistedData({
          customDurations: nextCustom,
          preferences: state.preferences,
          dailyStreak: state.dailyStreak,
        });

        return {
          customDurations: nextCustom,
          remainingSeconds:
            state.mode === 'CUSTOM' && state.status === 'IDLE'
              ? nextDuration
              : state.remainingSeconds,
          totalSeconds:
            state.mode === 'CUSTOM' && state.status === 'IDLE'
              ? nextDuration
              : state.totalSeconds,
        };
      });
    },

    setPreferences: (partial) => {
      set((state) => {
        const nextPrefs: PomodoroPreferences = {
          ...state.preferences,
          ...partial,
        };

        savePersistedData({
          customDurations: state.customDurations,
          preferences: nextPrefs,
          dailyStreak: state.dailyStreak,
        });

        return { preferences: nextPrefs };
      });
    },

    tick: () => {
      const state = get();
      if (state.status !== 'RUNNING') {
        return { phaseEnded: false };
      }

      if (state.remainingSeconds > 1) {
        set((s) => ({ remainingSeconds: s.remainingSeconds - 1 }));
        return { phaseEnded: false };
      }

      // Remaining seconds reached 0 -> Complete current phase and transition
      return get().skipPhase();
    },

    resetStreak: () => {
      const today = getTodayDateString();
      const freshStreak: DailyStreakStats = {
        date: today,
        completedCycles: 0,
        totalFocusMinutes: 0,
      };

      set((state) => {
        savePersistedData({
          customDurations: state.customDurations,
          preferences: state.preferences,
          dailyStreak: freshStreak,
        });
        return { dailyStreak: freshStreak, completedCycles: 0 };
      });
    },

    resetToDefaults: () => {
      const fresh = loadPersistedData();
      const duration = getPhaseDuration(
        INITIAL_MODE,
        INITIAL_PHASE,
        fresh.customDurations
      );
      set(() => ({
        mode: INITIAL_MODE,
        phase: INITIAL_PHASE,
        status: 'IDLE',
        remainingSeconds: duration,
        totalSeconds: duration,
        currentCycle: 1,
        completedCycles: 0,
        customDurations: fresh.customDurations,
        preferences: fresh.preferences,
        dailyStreak: fresh.dailyStreak,
      }));
    },
  }))
);
