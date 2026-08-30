/**
 * Reactive Zustand store for Lo-fi Bun Companion.
 *
 * Manages hardware metrics, user overrides, active companion metadata,
 * telemetry operational mode (LIVE / MANUAL), desktop window layout states
 * (viewMode, windowOpacity, isAlwaysOnTop), and automatically computes
 * the derived ResolvedCompanionState via pure stateResolver.
 *
 * Employs `subscribeWithSelector` middleware to enable selective component subscriptions
 * ensuring 0.0% CPU overhead during idle cycles.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  CompanionId,
  CompanionMetadata,
  HardwareMetrics,
  ResolvedCompanionState,
} from '../types/companion';
import {
  DEFAULT_ALWAYS_ON_TOP,
  DEFAULT_VIEW_MODE,
  DEFAULT_WINDOW_OPACITY,
  MAX_WINDOW_OPACITY,
  MIN_WINDOW_OPACITY,
  ViewMode,
} from '../types/desktop';
import { resolveCompanionState } from '../utils/stateResolver';
import { TelemetryMode } from '../telemetry/types';
import { telemetryManager } from '../telemetry/telemetryManager';
import { getCompanion } from '../data/companionRegistry';

export interface CompanionStoreState {
  /** Real-time or simulated hardware load metrics */
  metrics: HardwareMetrics;
  /** Operational mode for telemetry data ingestion ('LIVE' | 'MANUAL') */
  telemetryMode: TelemetryMode;
  /** Manual user override to trigger companion resting animation */
  forceRest: boolean;
  /** Unique ID of currently selected companion character */
  activeCompanionId: CompanionId;
  /** Purely derived visual state evaluated from metrics and priority rules */
  resolvedState: ResolvedCompanionState;

  // Desktop Window State
  /** Current display layout mode ('COMPACT' mascot vs 'FULL' showcase dashboard) */
  viewMode: ViewMode;
  /** Desktop window opacity level (clamped between 0.4 and 1.0) */
  windowOpacity: number;
  /** Floating mascot window always-on-top toggle status */
  isAlwaysOnTop: boolean;

  // Actions
  /** Update one or more hardware metrics and recompute resolved state */
  setMetrics: (metrics: Partial<HardwareMetrics>) => void;
  /** Switch between LIVE native hardware monitoring and MANUAL simulation */
  setTelemetryMode: (mode: TelemetryMode) => void;
  /** Toggle manual rest mode override and recompute resolved state */
  setForceRest: (forceRest: boolean) => void;
  /** Switch active companion character */
  setActiveCompanionId: (id: CompanionId) => void;
  /** Set explicit desktop view mode ('COMPACT' or 'FULL') */
  setViewMode: (mode: ViewMode) => void;
  /** Toggle between 'COMPACT' mascot view and 'FULL' dashboard view */
  toggleViewMode: () => void;
  /** Set window opacity with automatic boundary clamping [0.4, 1.0] */
  setWindowOpacity: (opacity: number) => void;
  /** Set explicit always-on-top window pinning state */
  setAlwaysOnTop: (enabled: boolean) => void;
  /** Toggle always-on-top window pinning state */
  toggleAlwaysOnTop: () => void;
  /** Reset all store state and metrics back to initial defaults */
  resetToDefaults: () => void;
}

/** Initial default metrics (low workload) */
export const DEFAULT_METRICS: HardwareMetrics = {
  cpuUsage: 10,
  ramUsage: 30,
  diskUsage: 5,
};

export const DEFAULT_COMPANION_ID: CompanionId = 'bun';
export const DEFAULT_FORCE_REST = false;
export const DEFAULT_TELEMETRY_MODE: TelemetryMode = 'LIVE';

/** Helper to generate initial resolved state from default metrics */
const getInitialResolvedState = (): ResolvedCompanionState =>
  resolveCompanionState({
    metrics: DEFAULT_METRICS,
    previousState: 'IDLE',
    forceRest: DEFAULT_FORCE_REST,
  });

/** Helper to clamp window opacity within allowable safe limits [0.4, 1.0] */
const clampOpacity = (opacity: number): number => {
  return Math.min(MAX_WINDOW_OPACITY, Math.max(MIN_WINDOW_OPACITY, opacity));
};

/** Helper to synchronize Tauri window size when switching view modes */
const syncWindowSize = async (mode: ViewMode) => {
  try {
    const { invoke, isTauri } = await import('@tauri-apps/api/core');
    if (isTauri()) {
      await invoke('set_view_mode', { mode });
    }
  } catch (err) {
    console.error('Failed to sync window size with Tauri backend:', err);
  }
};

/** Helper to synchronize Tauri window always-on-top state */
const syncAlwaysOnTop = async (enabled: boolean) => {
  try {
    const { isTauri } = await import('@tauri-apps/api/core');
    if (isTauri()) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().setAlwaysOnTop(enabled);
    }
  } catch (err) {
    console.error('Failed to sync always on top with Tauri backend:', err);
  }
};

export const useCompanionStore = create<CompanionStoreState>()(
  subscribeWithSelector((set) => ({
    metrics: DEFAULT_METRICS,
    telemetryMode: DEFAULT_TELEMETRY_MODE,
    forceRest: DEFAULT_FORCE_REST,
    activeCompanionId: DEFAULT_COMPANION_ID,
    resolvedState: getInitialResolvedState(),
    viewMode: DEFAULT_VIEW_MODE,
    windowOpacity: DEFAULT_WINDOW_OPACITY,
    isAlwaysOnTop: DEFAULT_ALWAYS_ON_TOP,

    setMetrics: (partialMetrics) =>
      set((state) => {
        const nextMetrics: HardwareMetrics = {
          ...state.metrics,
          ...partialMetrics,
        };

        const nextResolved = resolveCompanionState({
          metrics: nextMetrics,
          previousState: state.resolvedState.activeState,
          forceRest: state.forceRest,
        });

        return {
          metrics: nextMetrics,
          resolvedState: nextResolved,
        };
      }),

    setTelemetryMode: (telemetryMode) => {
      set(() => ({ telemetryMode }));
      void telemetryManager.setMode(telemetryMode);
    },

    setForceRest: (forceRest) =>
      set((state) => {
        const nextResolved = resolveCompanionState({
          metrics: state.metrics,
          previousState: state.resolvedState.activeState,
          forceRest,
        });

        return {
          forceRest,
          resolvedState: nextResolved,
        };
      }),

    setActiveCompanionId: (activeCompanionId) =>
      set(() => ({
        activeCompanionId,
      })),

    setViewMode: (viewMode) => {
      set(() => ({ viewMode }));
      void syncWindowSize(viewMode);
    },

    toggleViewMode: () =>
      set((state) => {
        const nextMode = state.viewMode === 'FULL' ? 'COMPACT' : 'FULL';
        void syncWindowSize(nextMode);
        return { viewMode: nextMode };
      }),

    setWindowOpacity: (opacity) =>
      set(() => ({
        windowOpacity: clampOpacity(opacity),
      })),

    setAlwaysOnTop: (isAlwaysOnTop) => {
      set(() => ({ isAlwaysOnTop }));
      void syncAlwaysOnTop(isAlwaysOnTop);
    },

    toggleAlwaysOnTop: () =>
      set((state) => {
        const next = !state.isAlwaysOnTop;
        void syncAlwaysOnTop(next);
        return { isAlwaysOnTop: next };
      }),

    resetToDefaults: () => {
      set(() => ({
        metrics: DEFAULT_METRICS,
        telemetryMode: DEFAULT_TELEMETRY_MODE,
        forceRest: DEFAULT_FORCE_REST,
        activeCompanionId: DEFAULT_COMPANION_ID,
        resolvedState: getInitialResolvedState(),
        viewMode: DEFAULT_VIEW_MODE,
        windowOpacity: DEFAULT_WINDOW_OPACITY,
        isAlwaysOnTop: DEFAULT_ALWAYS_ON_TOP,
      }));
      void telemetryManager.setMode(DEFAULT_TELEMETRY_MODE);
      telemetryManager.setManualMetrics(DEFAULT_METRICS);
    },
  }))
);

/**
 * Reactive selector hook to retrieve active companion metadata from Registry.
 * Subscribes only to `activeCompanionId` state changes.
 */
export const useActiveCompanionMetadata = (): CompanionMetadata => {
  const activeCompanionId = useCompanionStore(
    (state) => state.activeCompanionId
  );
  return getCompanion(activeCompanionId);
};
