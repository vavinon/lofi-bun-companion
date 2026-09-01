/**
 * useTelemetry Hook
 *
 * Custom React hook managing the lifecycle of TelemetryManager,
 * synchronizing live/manual hardware telemetry metrics with the companion store,
 * and ensuring resource cleanup on component unmount to prevent memory leaks.
 */

import { useEffect, useState, useCallback } from 'react';
import { useCompanionStore } from '../stores/companionStore';
import { telemetryManager } from './telemetryManager';
import { TelemetryMode, TelemetryProviderStatus } from './types';
import { HardwareMetrics } from '../types/companion';

export interface UseTelemetryOptions {
  /** Automatically start polling telemetry when the component mounts (default: true) */
  autoStart?: boolean;
  /** Polling interval in milliseconds for live telemetry updates (default: 1500ms) */
  pollingIntervalMs?: number;
}

export interface UseTelemetryResult {
  /** Current operational mode: LIVE (Native OS) or MANUAL (Mock/Sliders) */
  mode: TelemetryMode;
  /** Current lifecycle status of the active telemetry provider */
  status: TelemetryProviderStatus;
  /** Descriptive name of the currently active telemetry provider */
  providerName: string;
  /** Switches telemetry mode between LIVE and MANUAL */
  setMode: (mode: TelemetryMode) => void;
  /** Updates simulated metrics when in MANUAL mode */
  setManualMetrics: (metrics: Partial<HardwareMetrics>) => void;
}

export const useTelemetry = (
  options: UseTelemetryOptions = {}
): UseTelemetryResult => {
  const { autoStart = true, pollingIntervalMs = 1500 } = options;

  const mode = useCompanionStore((state) => state.telemetryMode);
  const setTelemetryMode = useCompanionStore((state) => state.setTelemetryMode);
  const setStoreMetrics = useCompanionStore((state) => state.setMetrics);

  const [status, setStatus] = useState<TelemetryProviderStatus>(() =>
    telemetryManager.getStatus()
  );
  const [providerName, setProviderName] = useState<string>(
    () => telemetryManager.getActiveProvider().name
  );

  useEffect(() => {
    let isMounted = true;

    if (autoStart) {
      void (async () => {
        await telemetryManager.setMode(mode);
        await telemetryManager.start((metrics) => {
          if (isMounted) {
            setStoreMetrics(metrics);
            setStatus(telemetryManager.getStatus());
            setProviderName(telemetryManager.getActiveProvider().name);
          }
        }, pollingIntervalMs);
        if (isMounted) {
          setStatus(telemetryManager.getStatus());
          setProviderName(telemetryManager.getActiveProvider().name);
        }
      })();
    }

    return () => {
      isMounted = false;
      void telemetryManager.stop();
    };
  }, [autoStart, mode, pollingIntervalMs, setStoreMetrics]);

  // Synchronize status and provider name when mode changes
  useEffect(() => {
    setStatus(telemetryManager.getStatus());
    setProviderName(telemetryManager.getActiveProvider().name);
  }, [mode]);

  const handleSetMode = useCallback(
    (nextMode: TelemetryMode) => {
      setTelemetryMode(nextMode);
      setStatus(telemetryManager.getStatus());
      setProviderName(telemetryManager.getActiveProvider().name);
    },
    [setTelemetryMode]
  );

  const handleSetManualMetrics = useCallback(
    (metrics: Partial<HardwareMetrics>) => {
      telemetryManager.setManualMetrics(metrics);
      setStoreMetrics(metrics);
    },
    [setStoreMetrics]
  );

  return {
    mode,
    status,
    providerName,
    setMode: handleSetMode,
    setManualMetrics: handleSetManualMetrics,
  };
};
