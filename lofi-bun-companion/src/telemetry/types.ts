/**
 * Telemetry domain types and provider contracts for Lo-fi Bun Companion.
 * Adheres to SemVer 2.0.0 and the Pluggable Telemetry Provider architecture.
 */

import { HardwareMetrics } from '../types/companion';

/** Operational mode of the telemetry manager */
export type TelemetryMode = 'LIVE' | 'MANUAL';

/** Lifecycle status of a telemetry provider */
export type TelemetryProviderStatus = 'IDLE' | 'POLLING' | 'ERROR';

/** Callback signature for receiving live hardware metric updates */
export type TelemetryUpdateListener = (metrics: HardwareMetrics) => void;

/**
 * Standard contract for telemetry providers.
 * Decouples native OS bridges (Tauri / Windows) from web simulation mocks.
 */
export interface HardwareTelemetryProvider {
  /** Descriptive identifier of the provider */
  readonly name: string;
  /** Provider categorization tag */
  readonly type: 'native' | 'mock';

  /** Checks if the provider environment is supported */
  isSupported(): Promise<boolean> | boolean;

  /**
   * Starts periodic polling or event streaming.
   * @param onUpdate Callback invoked whenever new metrics are available
   * @param intervalMs Polling interval in milliseconds (default: 1500ms)
   */
  start(
    onUpdate: TelemetryUpdateListener,
    intervalMs?: number
  ): Promise<void> | void;

  /** Stops polling and releases timer resources */
  stop(): Promise<void> | void;

  /** Returns the most recently sampled metrics snapshot */
  getLatestMetrics(): HardwareMetrics;

  /** Returns the current provider lifecycle status */
  getStatus(): TelemetryProviderStatus;
}
