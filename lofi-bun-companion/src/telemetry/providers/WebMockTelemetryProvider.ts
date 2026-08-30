/**
 * WebMockTelemetryProvider
 *
 * Pluggable mock provider for unit testing and manual simulation sliders.
 * Emits metric updates immediately when modified manually.
 */

import { HardwareMetrics } from '../../types/companion';
import {
  HardwareTelemetryProvider,
  TelemetryProviderStatus,
  TelemetryUpdateListener,
} from '../types';

const INITIAL_MOCK_METRICS: HardwareMetrics = {
  cpuUsage: 10,
  ramUsage: 30,
  diskUsage: 5,
};

/** Clamps a number to the 0-100 percentage range */
const clampPercent = (val: number): number => Math.min(100, Math.max(0, val));

export class WebMockTelemetryProvider implements HardwareTelemetryProvider {
  public readonly name = 'Web Mock Telemetry Provider';
  public readonly type = 'mock' as const;

  private status: TelemetryProviderStatus = 'IDLE';
  private metrics: HardwareMetrics;
  private listener: TelemetryUpdateListener | null = null;

  constructor(initialMetrics: HardwareMetrics = INITIAL_MOCK_METRICS) {
    this.metrics = { ...initialMetrics };
  }

  public isSupported(): boolean {
    return true;
  }

  public start(onUpdate: TelemetryUpdateListener): void {
    this.listener = onUpdate;
    this.status = 'POLLING';
    // Immediately publish initial metrics snapshot to the subscriber
    this.listener({ ...this.metrics });
  }

  public stop(): void {
    this.listener = null;
    this.status = 'IDLE';
  }

  /**
   * Sets manual mock metrics (e.g. from UI sliders or tests)
   * and triggers the active listener immediately.
   */
  public setManualMetrics(partial: Partial<HardwareMetrics>): void {
    this.metrics = {
      cpuUsage:
        partial.cpuUsage !== undefined
          ? clampPercent(partial.cpuUsage)
          : this.metrics.cpuUsage,
      ramUsage:
        partial.ramUsage !== undefined
          ? clampPercent(partial.ramUsage)
          : this.metrics.ramUsage,
      diskUsage:
        partial.diskUsage !== undefined
          ? clampPercent(partial.diskUsage)
          : this.metrics.diskUsage,
    };

    if (this.status === 'POLLING' && this.listener) {
      this.listener({ ...this.metrics });
    }
  }

  public getLatestMetrics(): HardwareMetrics {
    return { ...this.metrics };
  }

  public getStatus(): TelemetryProviderStatus {
    return this.status;
  }
}
