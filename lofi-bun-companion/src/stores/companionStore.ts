/**
 * Reactive Zustand store for Lo-fi Bun Companion.
 *
 * Manages hardware metrics, user overrides, active companion metadata,
 * telemetry operational mode (LIVE / MANUAL), and automatically computes
 * the derived ResolvedCompanionState via pure stateResolver.
 *
 * Employs `subscribeWithSelector` middleware to enable selective component subscriptions
 * ensuring 0.0% CPU overhead during idle cycles.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { HardwareMetrics, ResolvedCompanionState } from '../types/companion';
import { resolveCompanionState } from '../utils/stateResolver';
import { TelemetryMode } from '../telemetry/types';
import { telemetryManager } from '../telemetry/telemetryManager';

export interface CompanionStoreState {
  /** Real-time or simulated hardware load metrics */
  metrics: HardwareMetrics;
  /** Operational mode for telemetry data ingestion ('LIVE' | 'MANUAL') */
  telemetryMode: TelemetryMode;
  /** Manual user override to trigger companion resting animation */
  forceRest: boolean;
  /** Unique ID of currently selected companion character */
  activeCompanionId: string;
  /** Purely derived visual state evaluated from metrics and priority rules */
  resolvedState: ResolvedCompanionState;

  // Actions
  /** Update one or more hardware metrics and recompute resolved state */
  setMetrics: (metrics: Partial<HardwareMetrics>) => void;
  /** Switch between LIVE native hardware monitoring and MANUAL simulation */
  setTelemetryMode: (mode: TelemetryMode) => void;
  /** Toggle manual rest mode override and recompute resolved state */
  setForceRest: (forceRest: boolean) => void;
  /** Switch active companion character */
  setActiveCompanionId: (id: string) => void;
  /** Reset all store state and metrics back to initial defaults */
  resetToDefaults: () => void;
}

/** Initial default metrics (low workload) */
export const DEFAULT_METRICS: HardwareMetrics = {
  cpuUsage: 10,
  ramUsage: 30,
  diskUsage: 5,
};

export const DEFAULT_COMPANION_ID = 'bun-01';
export const DEFAULT_FORCE_REST = false;
export const DEFAULT_TELEMETRY_MODE: TelemetryMode = 'MANUAL';

/** Helper to generate initial resolved state from default metrics */
const getInitialResolvedState = (): ResolvedCompanionState =>
  resolveCompanionState({
    metrics: DEFAULT_METRICS,
    previousState: 'IDLE',
    forceRest: DEFAULT_FORCE_REST,
  });

export const useCompanionStore = create<CompanionStoreState>()(
  subscribeWithSelector((set) => ({
    metrics: DEFAULT_METRICS,
    telemetryMode: DEFAULT_TELEMETRY_MODE,
    forceRest: DEFAULT_FORCE_REST,
    activeCompanionId: DEFAULT_COMPANION_ID,
    resolvedState: getInitialResolvedState(),

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

    resetToDefaults: () => {
      set(() => ({
        metrics: DEFAULT_METRICS,
        telemetryMode: DEFAULT_TELEMETRY_MODE,
        forceRest: DEFAULT_FORCE_REST,
        activeCompanionId: DEFAULT_COMPANION_ID,
        resolvedState: getInitialResolvedState(),
      }));
      void telemetryManager.setMode(DEFAULT_TELEMETRY_MODE);
      telemetryManager.setManualMetrics(DEFAULT_METRICS);
    },
  }))
);
