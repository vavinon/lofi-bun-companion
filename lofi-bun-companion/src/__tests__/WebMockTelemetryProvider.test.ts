/**
 * Automated Unit Tests for WebMockTelemetryProvider
 */

import { describe, it, expect, vi } from 'vitest';
import { WebMockTelemetryProvider } from '../telemetry/providers/WebMockTelemetryProvider';

describe('WebMockTelemetryProvider', () => {
  it('should initialize with correct metadata and default status', () => {
    const provider = new WebMockTelemetryProvider();

    expect(provider.name).toBe('Web Mock Telemetry Provider');
    expect(provider.type).toBe('mock');
    expect(provider.isSupported()).toBe(true);
    expect(provider.getStatus()).toBe('IDLE');
    expect(provider.getLatestMetrics()).toEqual({
      cpuUsage: 10,
      ramUsage: 30,
      diskUsage: 5,
    });
  });

  it('should support custom initial metrics', () => {
    const custom = { cpuUsage: 50, ramUsage: 75, diskUsage: 90 };
    const provider = new WebMockTelemetryProvider(custom);

    expect(provider.getLatestMetrics()).toEqual(custom);
  });

  it('should start polling, update status, and immediately emit initial metrics', () => {
    const provider = new WebMockTelemetryProvider();
    const listener = vi.fn();

    provider.start(listener);

    expect(provider.getStatus()).toBe('POLLING');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      cpuUsage: 10,
      ramUsage: 30,
      diskUsage: 5,
    });
  });

  it('should update metrics and notify listener when setManualMetrics is called during polling', () => {
    const provider = new WebMockTelemetryProvider();
    const listener = vi.fn();

    provider.start(listener);
    listener.mockClear();

    provider.setManualMetrics({ cpuUsage: 88 });

    expect(provider.getLatestMetrics()).toEqual({
      cpuUsage: 88,
      ramUsage: 30,
      diskUsage: 5,
    });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      cpuUsage: 88,
      ramUsage: 30,
      diskUsage: 5,
    });
  });

  it('should clamp manual metrics between 0 and 100', () => {
    const provider = new WebMockTelemetryProvider();
    provider.setManualMetrics({ cpuUsage: 150, ramUsage: -20, diskUsage: 105 });

    expect(provider.getLatestMetrics()).toEqual({
      cpuUsage: 100,
      ramUsage: 0,
      diskUsage: 100,
    });
  });

  it('should stop polling, release listener, and set status to IDLE', () => {
    const provider = new WebMockTelemetryProvider();
    const listener = vi.fn();

    provider.start(listener);
    listener.mockClear();

    provider.stop();
    expect(provider.getStatus()).toBe('IDLE');

    // Modifying metrics after stop should not trigger old listener
    provider.setManualMetrics({ cpuUsage: 42 });
    expect(listener).not.toHaveBeenCalled();
    expect(provider.getLatestMetrics().cpuUsage).toBe(42);
  });
});
