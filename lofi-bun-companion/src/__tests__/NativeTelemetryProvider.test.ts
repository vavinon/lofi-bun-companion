/**
 * Automated Unit Tests for NativeTelemetryProvider
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NativeTelemetryProvider,
  generateSimulatedLiveMetrics,
  isDesktopEnvironment,
} from '../telemetry/providers/NativeTelemetryProvider';

describe('NativeTelemetryProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('should detect environment correctly', () => {
    expect(isDesktopEnvironment()).toBe(false);
  });

  it('should generate simulated metrics within valid percentage bounds', () => {
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

  it('should immediately sample on start and continue polling at intervals', async () => {
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

  it('should safely transition to ERROR status if sampler throws', async () => {
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
