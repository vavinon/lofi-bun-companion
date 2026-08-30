/**
 * Automated Unit Tests for NativeTelemetryProvider & Tauri IPC Bridge
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  NativeTelemetryProvider,
  generateSimulatedLiveMetrics,
  isDesktopEnvironment,
  mapPayloadToHardwareMetrics,
  invokeNativeCommand,
} from '../telemetry/providers/NativeTelemetryProvider';

// Mock Tauri core API invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('NativeTelemetryProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
    delete (window as unknown as Record<string, unknown>).__TAURI_IPC__;
    delete (window as unknown as Record<string, unknown>).__TAURI__;
  });

  it('should initialize with correct metadata and IDLE status', () => {
    const provider = new NativeTelemetryProvider();

    expect(provider.name).toBe('Native Hardware Telemetry Provider');
    expect(provider.type).toBe('native');
    expect(provider.isSupported()).toBe(true);
    expect(provider.getStatus()).toBe('IDLE');
    expect(provider.getLatestMetrics()).toEqual({
      cpuUsage: 15,
      ramUsage: 45,
      diskUsage: 5,
    });
  });

  it('should detect environment correctly based on window flags', () => {
    expect(isDesktopEnvironment()).toBe(false);

    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    expect(isDesktopEnvironment()).toBe(true);

    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
    (window as unknown as Record<string, unknown>).__TAURI__ = {};
    expect(isDesktopEnvironment()).toBe(true);
  });

  it('should map camelCase and snake_case payloads properly', () => {
    const camelPayload = { cpuUsage: 42.4, ramUsage: 78.9, diskUsage: 12.1 };
    expect(mapPayloadToHardwareMetrics(camelPayload)).toEqual({
      cpuUsage: 42,
      ramUsage: 79,
      diskUsage: 12,
    });

    const snakePayload = {
      cpu_usage: 88.6,
      ram_usage: 55.4,
      disk_usage: 99.8,
    };
    expect(mapPayloadToHardwareMetrics(snakePayload)).toEqual({
      cpuUsage: 89,
      ramUsage: 55,
      diskUsage: 100,
    });

    const partialPayload = {};
    expect(mapPayloadToHardwareMetrics(partialPayload)).toEqual({
      cpuUsage: 15,
      ramUsage: 45,
      diskUsage: 5,
    });
  });

  it('should execute invokeNativeCommand correctly or return null outside desktop', async () => {
    // Outside desktop
    const outsideResult = await invokeNativeCommand('get_hardware_metrics');
    expect(outsideResult).toBeNull();
    expect(invoke).not.toHaveBeenCalled();

    // Inside desktop
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    vi.mocked(invoke).mockResolvedValueOnce({
      cpuUsage: 30,
      ramUsage: 60,
      diskUsage: 20,
    });

    const desktopResult = await invokeNativeCommand('get_hardware_metrics');
    expect(desktopResult).toEqual({
      cpuUsage: 30,
      ramUsage: 60,
      diskUsage: 20,
    });
    expect(invoke).toHaveBeenCalledWith('get_hardware_metrics', undefined);
  });

  it('should safely catch errors in invokeNativeCommand and return null', async () => {
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    vi.mocked(invoke).mockRejectedValueOnce(new Error('IPC Disconnected'));

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await invokeNativeCommand('exit_app');

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should sample from Tauri IPC bridge when in desktop environment', async () => {
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    vi.mocked(invoke).mockResolvedValue({
      cpuUsage: 65,
      ramUsage: 82,
      diskUsage: 34,
    });

    const provider = new NativeTelemetryProvider();
    const listener = vi.fn();

    await provider.start(listener, 1500);

    expect(invoke).toHaveBeenCalledWith('get_hardware_metrics');
    expect(listener).toHaveBeenCalledWith({
      cpuUsage: 65,
      ramUsage: 82,
      diskUsage: 34,
    });

    provider.stop();
  });

  it('should gracefully fallback to simulated metrics if Tauri IPC invoke fails', async () => {
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    vi.mocked(invoke).mockRejectedValue(new Error('Tauri backend unavailable'));

    const provider = new NativeTelemetryProvider();
    const listener = vi.fn();

    await provider.start(listener, 1500);

    expect(provider.getStatus()).toBe('POLLING');
    expect(listener).toHaveBeenCalled();
    const latest = provider.getLatestMetrics();
    expect(latest.cpuUsage).toBeGreaterThanOrEqual(0);
    expect(latest.cpuUsage).toBeLessThanOrEqual(100);

    provider.stop();
  });

  it('should generate simulated metrics within valid percentage bounds in browser', () => {
    const prev = { cpuUsage: 20, ramUsage: 40, diskUsage: 10 };
    for (let tick = 1; tick <= 50; tick++) {
      const simulated = generateSimulatedLiveMetrics(tick, prev);
      expect(simulated.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(simulated.cpuUsage).toBeLessThanOrEqual(100);
      expect(simulated.ramUsage).toBeGreaterThanOrEqual(0);
      expect(simulated.ramUsage).toBeLessThanOrEqual(100);
      expect(simulated.diskUsage).toBeGreaterThanOrEqual(0);
      expect(simulated.diskUsage).toBeLessThanOrEqual(100);
    }
  });

  it('should immediately sample on start and continue polling at intervals with customSampler', async () => {
    let callCount = 0;
    const sampler = vi.fn().mockImplementation(() => {
      callCount++;
      return { cpuUsage: 20 + callCount, ramUsage: 50, diskUsage: 10 };
    });

    const provider = new NativeTelemetryProvider(sampler);
    const listener = vi.fn();

    await provider.start(listener, 1500);

    expect(provider.getStatus()).toBe('POLLING');
    expect(sampler).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      cpuUsage: 21,
      ramUsage: 50,
      diskUsage: 10,
    });

    // Advance 1 interval (1500ms)
    await vi.advanceTimersByTimeAsync(1500);
    expect(sampler).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith({
      cpuUsage: 22,
      ramUsage: 50,
      diskUsage: 10,
    });

    // Advance another interval
    await vi.advanceTimersByTimeAsync(1500);
    expect(sampler).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenCalledWith({
      cpuUsage: 23,
      ramUsage: 50,
      diskUsage: 10,
    });

    provider.stop();
    expect(provider.getStatus()).toBe('IDLE');

    // Advancing timers after stop should not trigger sampler
    await vi.advanceTimersByTimeAsync(3000);
    expect(sampler).toHaveBeenCalledTimes(3);
  });

  it('should clamp sampled values into 0-100 range', async () => {
    const sampler = vi.fn().mockResolvedValue({
      cpuUsage: 150,
      ramUsage: -10,
      diskUsage: 200,
    });

    const provider = new NativeTelemetryProvider(sampler);
    const listener = vi.fn();

    await provider.start(listener, 1000);

    expect(listener).toHaveBeenCalledWith({
      cpuUsage: 100,
      ramUsage: 0,
      diskUsage: 100,
    });

    provider.stop();
  });

  it('should safely transition to ERROR status if customSampler throws', async () => {
    const failingSampler = vi
      .fn()
      .mockRejectedValue(new Error('Hardware read failure'));
    const provider = new NativeTelemetryProvider(failingSampler);
    const listener = vi.fn();

    await provider.start(listener, 1000);

    expect(provider.getStatus()).toBe('ERROR');
    expect(listener).not.toHaveBeenCalled();

    provider.stop();
    expect(provider.getStatus()).toBe('IDLE');
  });
});
