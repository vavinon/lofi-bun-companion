/**
 * Automated Unit Tests for useTelemetry Hook
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import {
  useTelemetry,
  UseTelemetryOptions,
  UseTelemetryResult,
} from '../telemetry/useTelemetry';
import { useCompanionStore } from '../stores/companionStore';
import { telemetryManager } from '../telemetry/telemetryManager';

// Enable React act environment in JSDOM
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

interface TestHarnessProps {
  options?: UseTelemetryOptions;
  onResult: (result: UseTelemetryResult) => void;
}

const TestHarness: React.FC<TestHarnessProps> = ({ options, onResult }) => {
  const telemetry = useTelemetry(options);
  React.useEffect(() => {
    onResult(telemetry);
  });
  return null;
};

describe('useTelemetry Hook', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useCompanionStore.getState().resetToDefaults();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    await telemetryManager.stop();
  });

  it('should initialize with MANUAL mode and mock provider by default', async () => {
    let hookResult!: UseTelemetryResult;

    await act(async () => {
      root.render(
        <TestHarness
          onResult={(res) => {
            hookResult = res;
          }}
        />
      );
    });

    expect(hookResult.mode).toBe('MANUAL');
    expect(hookResult.providerName).toBe('Web Mock Telemetry Provider');
    expect(hookResult.status).toBe('POLLING');
  });

  it('should auto-start telemetry polling by default and update companionStore', async () => {
    let hookResult!: UseTelemetryResult;

    await act(async () => {
      root.render(
        <TestHarness
          onResult={(res) => {
            hookResult = res;
          }}
        />
      );
    });

    expect(telemetryManager.isActive()).toBe(true);
    expect(useCompanionStore.getState().metrics).toEqual({
      cpuUsage: 10,
      ramUsage: 30,
      diskUsage: 5,
    });

    // Update manual metrics through hook helper
    await act(async () => {
      hookResult.setManualMetrics({ cpuUsage: 65 });
    });

    expect(useCompanionStore.getState().metrics.cpuUsage).toBe(65);
    expect(useCompanionStore.getState().resolvedState.activeState).toBe(
      'FRENZY'
    );
  });

  it('should not start polling when autoStart is set to false', async () => {
    let hookResult!: UseTelemetryResult;

    await act(async () => {
      root.render(
        <TestHarness
          options={{ autoStart: false }}
          onResult={(res) => {
            hookResult = res;
          }}
        />
      );
    });

    expect(hookResult.status).toBe('IDLE');
    expect(telemetryManager.isActive()).toBe(false);
  });

  it('should cleanup telemetry polling when component unmounts', async () => {
    await act(async () => {
      root.render(<TestHarness onResult={() => {}} />);
    });

    expect(telemetryManager.isActive()).toBe(true);

    await act(async () => {
      root.unmount();
    });

    expect(telemetryManager.isActive()).toBe(false);
    expect(telemetryManager.getStatus()).toBe('IDLE');
  });

  it('should switch mode between LIVE and MANUAL', async () => {
    let hookResult!: UseTelemetryResult;

    await act(async () => {
      root.render(
        <TestHarness
          onResult={(res) => {
            hookResult = res;
          }}
        />
      );
    });

    expect(hookResult.mode).toBe('MANUAL');

    // Switch to LIVE mode
    await act(async () => {
      hookResult.setMode('LIVE');
    });

    expect(useCompanionStore.getState().telemetryMode).toBe('LIVE');
    expect(telemetryManager.getMode()).toBe('LIVE');

    // Switch back to MANUAL mode
    await act(async () => {
      hookResult.setMode('MANUAL');
    });

    expect(useCompanionStore.getState().telemetryMode).toBe('MANUAL');
    expect(telemetryManager.getMode()).toBe('MANUAL');
  });
});
