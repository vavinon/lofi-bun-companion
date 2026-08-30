/**
 * Pure state resolver for Lo-fi Bun Companion.
 *
 * Evaluates hardware metrics (CPU, RAM, Disk) and user controls (forceRest)
 * to determine the active companion animation state and secondary prop layers.
 *
 * State Priority Order:
 * 1. REST (forceRest === true)
 * 2. DISK (diskUsage >= 75% or falling edge >= 72%)
 * 3. FRENZY (cpuUsage >= 60% or falling edge >= 57%)
 * 4. FOCUS (cpuUsage >= 20% or falling edge >= 17%)
 * 5. IDLE (default low load)
 *
 * Secondary Prop Layer:
 * - isHeavyRam (ramUsage > 80%) is evaluated independently across all states.
 */

import {
  CompanionState,
  HardwareMetrics,
  ResolvedCompanionState,
} from '../types/companion';
import { evaluateHysteresis } from './hysteresis';

export interface StateResolverInput {
  /** Current hardware resource utilization */
  metrics: HardwareMetrics;
  /** Previous active state (used for hysteresis buffer calculation) */
  previousState?: CompanionState;
  /** User override switch to force rest mode */
  forceRest?: boolean;
}

// Threshold Constants
const THRESHOLDS = {
  DISK_RISING: 75,
  CPU_FRENZY_RISING: 60,
  CPU_FOCUS_RISING: 20,
  RAM_HEAVY_LIMIT: 80,
  HYSTERESIS_BUFFER: 3,
} as const;

/**
 * Resolves the primary visual companion state and prop layers from input metrics.
 *
 * @param input - StateResolverInput containing metrics, previous state, and control flags.
 * @param timestamp - Optional epoch timestamp (defaults to Date.now()).
 * @returns ResolvedCompanionState containing activeState, isHeavyRam, and timestamp.
 */
export function resolveCompanionState(
  input: StateResolverInput,
  timestamp: number = Date.now()
): ResolvedCompanionState {
  const { metrics, previousState = 'IDLE', forceRest = false } = input;

  // Independent Prop Layer: Heavy RAM Flag (>80%)
  const isHeavyRam = metrics.ramUsage > THRESHOLDS.RAM_HEAVY_LIMIT;

  // Priority 1: Force Rest Override
  if (forceRest) {
    return {
      activeState: 'REST',
      isHeavyRam,
      timestamp,
    };
  }

  // Priority 2: Disk I/O Activity (>=75% rising, <72% falling)
  const isDiskActive = evaluateHysteresis(
    metrics.diskUsage,
    previousState === 'DISK',
    THRESHOLDS.DISK_RISING,
    THRESHOLDS.HYSTERESIS_BUFFER
  );

  if (isDiskActive) {
    return {
      activeState: 'DISK',
      isHeavyRam,
      timestamp,
    };
  }

  // Priority 3: CPU Workload (FRENZY >=60% / FOCUS >=20% / IDLE)
  const isFrenzyActive = evaluateHysteresis(
    metrics.cpuUsage,
    previousState === 'FRENZY',
    THRESHOLDS.CPU_FRENZY_RISING,
    THRESHOLDS.HYSTERESIS_BUFFER
  );

  if (isFrenzyActive) {
    return {
      activeState: 'FRENZY',
      isHeavyRam,
      timestamp,
    };
  }

  // Check Focus: Sustain if previous was at least FOCUS (FOCUS or FRENZY)
  const wasAtLeastFocus =
    previousState === 'FOCUS' || previousState === 'FRENZY';
  const isFocusActive = evaluateHysteresis(
    metrics.cpuUsage,
    wasAtLeastFocus,
    THRESHOLDS.CPU_FOCUS_RISING,
    THRESHOLDS.HYSTERESIS_BUFFER
  );

  if (isFocusActive) {
    return {
      activeState: 'FOCUS',
      isHeavyRam,
      timestamp,
    };
  }

  // Default Baseline State
  return {
    activeState: 'IDLE',
    isHeavyRam,
    timestamp,
  };
}
