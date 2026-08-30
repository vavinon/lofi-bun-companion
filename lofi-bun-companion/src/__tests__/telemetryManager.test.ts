/**
 * Automated Unit Tests for TelemetryManager
 */

import { describe, it, expect, vi } from 'vitest';
import { TelemetryManager } from '../telemetry/telemetryManager';
import { WebMockTelemetryProvider } from '../telemetry/providers/WebMockTelemetryProvider';
import { NativeTelemetryProvider } from '../telemetry/providers/NativeTelemetryProvider';

describe('TelemetryManager', () => {
  it('should initialize with default MANUAL mode and mock provider active', () => {
    const manager = new TelemetryManager();

    expect(manager.getMode()).toBe('MANUAL');
    expect(manager.getActiveProvider().type).toBe('mock');
    expect(manager.getStatus()).toBe('IDLE');
    expect(manager.isActive()).toBe(false);
  });

  it('should start mock provider in MANUAL mode and forward metric updates', async () => {
    const mockProvider = new WebMockTelemetryProvider({
      cpuUsage: 12,
      ramUsage: 34,
      diskUsage: 56,
    });
    const manager = new TelemetryManager(
      new NativeTelemetryProvider(),
      mockProvider
    );
    const listener = vi.fn();

    await manager.start(listener);

    expect(manager.isActive()).toBe(true);
    expect(manager.getStatus()).toBe('POLLING');
    expect(listener).toHaveBeenCalledWith({
      cpuUsage: 12,
      ramUsage: 34,
      diskUsage: 56,
    });

    // Manual metric update through manager
    manager.setManualMetrics({ cpuUsage: 99 });
    expect(listener).toHaveBeenCalledWith({
      cpuUsage: 99,
      ramUsage: 34,
      diskUsage: 56,
    });
  });

  it('should seamlessly switch to LIVE mode and back to MANUAL mode while running', async () => {
    const mockProvider = new WebMockTelemetryProvider({
      cpuUsage: 10,
      ramUsage: 20,
      diskUsage: 30,
    });
    const nativeSampler = vi.fn().mockResolvedValue({
      cpuUsage: 77,
      ramUsage: 88,
      diskUsage: 99,
    });
    const nativeProvider = new NativeTelemetryProvider(nativeSampler);

    const manager = new TelemetryManager(nativeProvider, mockProvider);
    const listener = vi.fn();

    // Start in MANUAL mode
    await manager.start(listener, 1500);
    expect(manager.getMode()).toBe('MANUAL');
    expect(manager.getActiveProvider().type).toBe('mock');
    expect(listener).toHaveBeenCalledWith({
      cpuUsage: 10,
      ramUsage: 20,
      diskUsage: 30,
    });

    // Switch to LIVE mode
    listener.mockClear();
    await manager.setMode('LIVE');
    expect(manager.getMode()).toBe('LIVE');
    expect(manager.getActiveProvider().type).toBe('native');
    expect(listener).toHaveBeenCalledWith({
      cpuUsage: 77,
      ramUsage: 88,
      diskUsage: 99,
    });

    // Switch back to MANUAL mode
    listener.mockClear();
    await manager.setMode('MANUAL');
    expect(manager.getMode()).toBe('MANUAL');
    expect(manager.getActiveProvider().type).toBe('mock');
    expect(listener).toHaveBeenCalledWith({
      cpuUsage: 10,
      ramUsage: 20,
      diskUsage: 30,
    });
  });

  it('should handle mode switch when manager is stopped without starting providers', async () => {
    const manager = new TelemetryManager();

    expect(manager.getMode()).toBe('MANUAL');
    await manager.setMode('LIVE');
    expect(manager.getMode()).toBe('LIVE');
    expect(manager.getStatus()).toBe('IDLE');
    expect(manager.isActive()).toBe(false);

    // Switching to same mode should be a no-op
    await manager.setMode('LIVE');
    expect(manager.getMode()).toBe('LIVE');
  });

  it('should stop active provider when stop is called', async () => {
    const manager = new TelemetryManager();
    const listener = vi.fn();

    await manager.start(listener);
    expect(manager.isActive()).toBe(true);

    await manager.stop();
    expect(manager.isActive()).toBe(false);
    expect(manager.getStatus()).toBe('IDLE');
  });
});
