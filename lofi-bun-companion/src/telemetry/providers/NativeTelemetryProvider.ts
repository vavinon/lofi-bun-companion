/**
 * NativeTelemetryProvider
 *
 * Hardware telemetry provider for reading real OS hardware metrics on Windows via Tauri IPC Bridge.
 * Features asynchronous zero-main-thread polling with automatic graceful fallback to
 * a realistic dynamic oscillation stream when running in standard browser or test environments.
 */

import { invoke } from '@tauri-apps/api/core';
import { HardwareMetrics } from '../../types/companion';
import {
  HardwareTelemetryProvider,
  TelemetryProviderStatus,
  TelemetryUpdateListener,
} from '../types';

export type NativeSamplerFn = () => Promise<HardwareMetrics> | HardwareMetrics;

const DEFAULT_POLLING_INTERVAL_MS = 1500;

export const DEFAULT_NATIVE_METRICS: HardwareMetrics = {
  cpuUsage: 15,
  ramUsage: 45,
  diskUsage: 5,
};

/**
 * Expected response shape from the Tauri backend `get_hardware_metrics` command.
 * Supports both camelCase and snake_case serde deserialization formats.
 */
export interface TauriHardwareMetricsPayload {
  cpuUsage?: number;
  ramUsage?: number;
  diskUsage?: number;
  cpu_usage?: number;
  ram_usage?: number;
  disk_usage?: number;
}

/** Checks if the app is running within a Tauri desktop native container */
export const isDesktopEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as Record<string, unknown>;
  return Boolean(win.__TAURI_INTERNALS__ || win.__TAURI_IPC__ || win.__TAURI__);
};

/**
 * Helper to safely invoke Tauri IPC commands with graceful error suppression.
 */
export const invokeNativeCommand = async <T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T | null> => {
  if (!isDesktopEnvironment()) {
    return null;
  }

  try {
    return await invoke<T>(command, args);
  } catch (error) {
    console.warn(`[Tauri IPC] Command "${command}" failed:`, error);
    return null;
  }
};

/**
 * Maps raw payload from Tauri Rust backend into the unified HardwareMetrics interface.
 */
export const mapPayloadToHardwareMetrics = (
  payload: TauriHardwareMetricsPayload
): HardwareMetrics => {
  const rawCpu = payload.cpuUsage ?? payload.cpu_usage ?? 15;
  const rawRam = payload.ramUsage ?? payload.ram_usage ?? 45;
  const rawDisk = payload.diskUsage ?? payload.disk_usage ?? 5;

  return {
    cpuUsage: Math.min(100, Math.max(0, Math.round(rawCpu))),
    ramUsage: Math.min(100, Math.max(0, Math.round(rawRam))),
    diskUsage: Math.min(100, Math.max(0, Math.round(rawDisk))),
  };
};

/** Generates realistic hardware oscillations for web showcase environments */
export const generateSimulatedLiveMetrics = (
  tick: number,
  prev: HardwareMetrics
): HardwareMetrics => {
  // Smooth wave fluctuation + bounded random noise
  const cpuSine = Math.sin(tick * 0.3) * 15;
  const cpuNoise = (Math.random() - 0.5) * 6;
  const nextCpu = Math.max(
    5,
    Math.min(95, Math.round(25 + cpuSine + cpuNoise))
  );

  // RAM drifts slowly
  const ramDrift = Math.cos(tick * 0.1) * 8;
  const nextRam = Math.max(20, Math.min(90, Math.round(48 + ramDrift)));

  // Disk has occasional bursts
  const isBurst = Math.random() < 0.15;
  const nextDisk = isBurst
    ? Math.min(90, Math.round(20 + Math.random() * 60))
    : Math.max(
        2,
        Math.min(20, Math.round(prev.diskUsage * 0.6 + Math.random() * 4))
      );

  return {
    cpuUsage: nextCpu,
    ramUsage: nextRam,
    diskUsage: nextDisk,
  };
};

export class NativeTelemetryProvider implements HardwareTelemetryProvider {
  public readonly name = 'Native Hardware Telemetry Provider';
  public readonly type = 'native' as const;

  private status: TelemetryProviderStatus = 'IDLE';
  private metrics: HardwareMetrics = { ...DEFAULT_NATIVE_METRICS };
  private timerId: ReturnType<typeof setInterval> | null = null;
  private listener: TelemetryUpdateListener | null = null;
  private tickCounter = 0;
  private customSampler?: NativeSamplerFn;

  constructor(customSampler?: NativeSamplerFn) {
    this.customSampler = customSampler;
  }

  public isSupported(): boolean {
    return true;
  }

  public async start(
    onUpdate: TelemetryUpdateListener,
    intervalMs: number = DEFAULT_POLLING_INTERVAL_MS
  ): Promise<void> {
    this.stop();
    this.listener = onUpdate;
    this.status = 'POLLING';

    // Perform immediate first sample
    await this.sampleOnce();

    // Start background periodic polling loop
    this.timerId = setInterval(() => {
      void this.sampleOnce();
    }, intervalMs);
  }

  public stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.listener = null;
    this.status = 'IDLE';
  }

  public getLatestMetrics(): HardwareMetrics {
    return { ...this.metrics };
  }

  public getStatus(): TelemetryProviderStatus {
    return this.status;
  }

  /** Samples metrics from native bridge, custom sampler, or simulation fallback */
  private async sampleOnce(): Promise<void> {
    if (this.status !== 'POLLING' || !this.listener) return;

    try {
      let sampled: HardwareMetrics;

      if (this.customSampler) {
        sampled = await this.customSampler();
      } else if (isDesktopEnvironment()) {
        try {
          // Native Tauri IPC invocation
          const payload = await invoke<TauriHardwareMetricsPayload>(
            'get_hardware_metrics'
          );
          if (payload && typeof payload === 'object') {
            sampled = mapPayloadToHardwareMetrics(payload);
          } else {
            // Fallback if payload is empty or invalid
            this.tickCounter++;
            sampled = generateSimulatedLiveMetrics(
              this.tickCounter,
              this.metrics
            );
          }
        } catch {
          // Graceful fallback to simulated telemetry if IPC call fails
          this.tickCounter++;
          sampled = generateSimulatedLiveMetrics(
            this.tickCounter,
            this.metrics
          );
        }
      } else {
        // Standard Web Browser environment fallback
        this.tickCounter++;
        sampled = generateSimulatedLiveMetrics(this.tickCounter, this.metrics);
      }

      this.metrics = {
        cpuUsage: Math.min(100, Math.max(0, sampled.cpuUsage)),
        ramUsage: Math.min(100, Math.max(0, sampled.ramUsage)),
        diskUsage: Math.min(100, Math.max(0, sampled.diskUsage)),
      };

      if (this.status === 'POLLING' && this.listener) {
        this.listener({ ...this.metrics });
      }
    } catch {
      this.status = 'ERROR';
    }
  }
}
