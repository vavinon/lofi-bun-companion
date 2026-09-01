/**
 * TelemetryManager
 *
 * Singleton coordinator managing telemetry provider lifecycle,
 * dynamic switching between LIVE and MANUAL simulation modes,
 * and dispatching hardware metrics updates.
 */

import { HardwareMetrics } from '../types/companion';
import { NativeTelemetryProvider } from './providers/NativeTelemetryProvider';
import { WebMockTelemetryProvider } from './providers/WebMockTelemetryProvider';
import {
  HardwareTelemetryProvider,
  TelemetryMode,
  TelemetryProviderStatus,
  TelemetryUpdateListener,
} from './types';

export class TelemetryManager {
  private mode: TelemetryMode = 'LIVE';
  private nativeProvider: HardwareTelemetryProvider;
  private mockProvider: WebMockTelemetryProvider;
  private listener: TelemetryUpdateListener | null = null;
  private pollingIntervalMs = 1500;
  private isRunning = false;

  constructor(
    nativeProvider: HardwareTelemetryProvider = new NativeTelemetryProvider(),
    mockProvider: WebMockTelemetryProvider = new WebMockTelemetryProvider(),
    initialMode: TelemetryMode = 'LIVE'
  ) {
    this.nativeProvider = nativeProvider;
    this.mockProvider = mockProvider;
    this.mode = initialMode;
  }

  /** Gets the active provider based on current telemetry mode */
  public getActiveProvider(): HardwareTelemetryProvider {
    return this.mode === 'LIVE' ? this.nativeProvider : this.mockProvider;
  }

  /** Gets current telemetry mode */
  public getMode(): TelemetryMode {
    return this.mode;
  }

  /** Gets the underlying mock provider */
  public getMockProvider(): WebMockTelemetryProvider {
    return this.mockProvider;
  }

  /** Gets current provider status */
  public getStatus(): TelemetryProviderStatus {
    return this.getActiveProvider().getStatus();
  }

  /** Returns latest metrics snapshot from active provider */
  public getLatestMetrics(): HardwareMetrics {
    return this.getActiveProvider().getLatestMetrics();
  }

  /** Starts active telemetry provider polling */
  public async start(
    onUpdate?: TelemetryUpdateListener,
    intervalMs: number = this.pollingIntervalMs
  ): Promise<void> {
    if (onUpdate) {
      this.listener = onUpdate;
    }
    this.pollingIntervalMs = intervalMs;
    this.isRunning = true;

    const activeProvider = this.getActiveProvider();
    await activeProvider.start((metrics) => {
      if (this.listener) {
        this.listener(metrics);
      }
    }, this.pollingIntervalMs);
  }

  /** Stops active telemetry provider polling */
  public async stop(): Promise<void> {
    this.isRunning = false;
    await this.getActiveProvider().stop();
  }

  /** Switches telemetry mode between LIVE and MANUAL */
  public async setMode(nextMode: TelemetryMode): Promise<void> {
    if (this.mode === nextMode) return;

    const prevProvider = this.getActiveProvider();
    this.mode = nextMode;

    if (this.isRunning) {
      await prevProvider.stop();
      const nextProvider = this.getActiveProvider();
      await nextProvider.start((metrics) => {
        if (this.listener) {
          this.listener(metrics);
        }
      }, this.pollingIntervalMs);
    }
  }

  /** Updates mock metrics and notifies listeners if in MANUAL mode */
  public setManualMetrics(metrics: Partial<HardwareMetrics>): void {
    this.mockProvider.setManualMetrics(metrics);
  }

  /** Checks if the manager is currently running */
  public isActive(): boolean {
    return this.isRunning;
  }
}

/** Global singleton instance */
export const telemetryManager = new TelemetryManager();
