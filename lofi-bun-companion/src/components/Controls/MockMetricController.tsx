/**
 * MockMetricController: Interactive Glassmorphism Control Panel for Lo-fi Bun.
 *
 * Supports dual operational modes:
 * 1. ⚡ LIVE METRICS: Real-time background hardware telemetry (sliders locked).
 * 2. 🎛️ MANUAL SIMULATION: Interactive sliders for custom CPU, RAM, Disk tuning.
 *
 * Employs selective Zustand subscriptions to maintain 0% CPU overhead.
 */

import React, { useId, useCallback } from 'react';
import { useCompanionStore } from '../../stores/companionStore';
import { TelemetryMode } from '../../telemetry/types';
import styles from './MockMetricController.module.css';

/**
 * Returns a short readable badge for the current CPU threshold.
 */
const getCpuHint = (cpu: number): string => {
  if (cpu < 20) return 'IDLE (0-20%)';
  if (cpu <= 60) return 'FOCUS (20-60%)';
  return 'FRENZY (>60%)';
};

/**
 * Generates an inline CSS background gradient to visually fill the slider track up to the current value.
 */
const getTrackBackground = (
  value: number,
  accentColor: string,
  disabled: boolean
): string => {
  const percent = Math.min(100, Math.max(0, value));
  const trackBase = disabled
    ? 'rgba(40, 32, 30, 0.4)'
    : 'rgba(28, 22, 20, 0.6)';
  const fill = disabled ? 'rgba(163, 184, 153, 0.4)' : accentColor;
  return `linear-gradient(to right, ${fill} 0%, ${fill} ${percent}%, ${trackBase} ${percent}%, ${trackBase} 100%)`;
};

export const MockMetricController: React.FC = () => {
  const cpuId = useId();
  const ramId = useId();
  const diskId = useId();
  const restId = useId();

  // Selective Zustand Subscriptions
  const cpuUsage = useCompanionStore((state) => state.metrics.cpuUsage);
  const ramUsage = useCompanionStore((state) => state.metrics.ramUsage);
  const diskUsage = useCompanionStore((state) => state.metrics.diskUsage);
  const forceRest = useCompanionStore((state) => state.forceRest);
  const telemetryMode = useCompanionStore((state) => state.telemetryMode);

  const setMetrics = useCompanionStore((state) => state.setMetrics);
  const setTelemetryMode = useCompanionStore((state) => state.setTelemetryMode);
  const setForceRest = useCompanionStore((state) => state.setForceRest);
  const resetToDefaults = useCompanionStore((state) => state.resetToDefaults);

  const isLive = telemetryMode === 'LIVE';

  // Mode Switch Handlers
  const handleModeSelect = useCallback(
    (mode: TelemetryMode) => {
      setTelemetryMode(mode);
    },
    [setTelemetryMode]
  );

  // Handlers for sliders
  const handleCpuChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMetrics({ cpuUsage: Number(e.target.value) });
    },
    [setMetrics]
  );

  const handleRamChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMetrics({ ramUsage: Number(e.target.value) });
    },
    [setMetrics]
  );

  const handleDiskChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMetrics({ diskUsage: Number(e.target.value) });
    },
    [setMetrics]
  );

  const handleRestToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForceRest(e.target.checked);
    },
    [setForceRest]
  );

  return (
    <section
      className={styles.controllerCard}
      aria-label="Hardware Metrics & Override Controls"
    >
      {/* Header with Mode Selector */}
      <header className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <span className={styles.titleIcon} role="img" aria-label="Controls">
            🎛️
          </span>
          <h2 className={styles.title}>Hardware Lab Controls</h2>
        </div>

        <div
          className={styles.modeToggleGroup}
          role="group"
          aria-label="Telemetry Mode Selector"
        >
          <button
            type="button"
            className={`${styles.modeBtn} ${!isLive ? styles.modeBtnActive : ''}`}
            onClick={() => handleModeSelect('MANUAL')}
            aria-pressed={!isLive}
            data-testid="mode-btn-manual"
          >
            🎛️ Manual
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${isLive ? styles.modeBtnActiveLive : ''}`}
            onClick={() => handleModeSelect('LIVE')}
            aria-pressed={isLive}
            data-testid="mode-btn-live"
          >
            <span className={styles.liveDot} />⚡ Live
          </button>
        </div>
      </header>

      {/* Live Mode Streaming Banner */}
      {isLive && (
        <div className={styles.liveBanner} data-testid="live-telemetry-banner">
          <div className={styles.liveBannerHeader}>
            <span className={styles.pulsingDot} />
            <span className={styles.liveBannerTitle}>
              Real-time Hardware Telemetry Active
            </span>
          </div>
          <p className={styles.liveBannerDesc}>
            Sliders locked. Ingesting live OS metrics with ±3% jitter hysteresis
            filtering.
          </p>
        </div>
      )}

      {/* Control Sliders */}
      <div className={styles.controlGroup}>
        {/* CPU Usage Slider */}
        <div className={styles.sliderItem}>
          <div className={styles.labelRow}>
            <label
              htmlFor={cpuId}
              className={`${styles.metricName} ${isLive ? styles.disabledLabel : ''}`}
            >
              <span>⚡</span> CPU Usage
            </label>
            <div className={styles.metricValue}>
              <span>{Math.round(cpuUsage)}%</span>
              <span className={styles.stateHint}>{getCpuHint(cpuUsage)}</span>
            </div>
          </div>
          <input
            id={cpuId}
            type="range"
            min={0}
            max={100}
            step={1}
            value={cpuUsage}
            disabled={isLive}
            onChange={handleCpuChange}
            className={`${styles.rangeInput} ${styles.cpuSlider}`}
            style={{
              background: getTrackBackground(cpuUsage, '#FF9A3C', isLive),
            }}
            aria-label="CPU Usage Percentage"
            aria-valuenow={cpuUsage}
            aria-disabled={isLive}
          />
        </div>

        {/* RAM Usage Slider */}
        <div className={styles.sliderItem}>
          <div className={styles.labelRow}>
            <label
              htmlFor={ramId}
              className={`${styles.metricName} ${isLive ? styles.disabledLabel : ''}`}
            >
              <span>🧠</span> RAM Usage
            </label>
            <div className={styles.metricValue}>
              <span>{Math.round(ramUsage)}%</span>
              {ramUsage > 80 && (
                <span className={styles.stateHint} style={{ color: '#A3B899' }}>
                  🥕 Carrots Stack
                </span>
              )}
            </div>
          </div>
          <input
            id={ramId}
            type="range"
            min={0}
            max={100}
            step={1}
            value={ramUsage}
            disabled={isLive}
            onChange={handleRamChange}
            className={`${styles.rangeInput} ${styles.ramSlider}`}
            style={{
              background: getTrackBackground(ramUsage, '#A3B899', isLive),
            }}
            aria-label="RAM Usage Percentage"
            aria-valuenow={ramUsage}
            aria-disabled={isLive}
          />
        </div>

        {/* Disk Usage Slider */}
        <div className={styles.sliderItem}>
          <div className={styles.labelRow}>
            <label
              htmlFor={diskId}
              className={`${styles.metricName} ${isLive ? styles.disabledLabel : ''}`}
            >
              <span>💾</span> Disk I/O
            </label>
            <div className={styles.metricValue}>
              <span>{Math.round(diskUsage)}%</span>
              {diskUsage > 75 && (
                <span className={styles.stateHint} style={{ color: '#8EA8C3' }}>
                  📖 Book Flipping
                </span>
              )}
            </div>
          </div>
          <input
            id={diskId}
            type="range"
            min={0}
            max={100}
            step={1}
            value={diskUsage}
            disabled={isLive}
            onChange={handleDiskChange}
            className={`${styles.rangeInput} ${styles.diskSlider}`}
            style={{
              background: getTrackBackground(diskUsage, '#8EA8C3', isLive),
            }}
            aria-label="Disk Usage Percentage"
            aria-valuenow={diskUsage}
            aria-disabled={isLive}
          />
        </div>

        {/* Rest Mode Override Switch */}
        <label className={styles.toggleRow} htmlFor={restId}>
          <div className={styles.toggleLabel}>
            <span>🛏️</span>
            <div>
              <span>Rest Mode Override</span>
              <span className={styles.toggleDesc}>
                Priority 1 — Nap with Lavender Pillow
              </span>
            </div>
          </div>
          <div className={styles.switch}>
            <input
              id={restId}
              type="checkbox"
              role="switch"
              checked={forceRest}
              onChange={handleRestToggle}
              aria-label="Toggle Force Rest Mode"
              aria-checked={forceRest}
            />
            <span className={styles.switchSlider} />
          </div>
        </label>
      </div>

      {/* Actions */}
      <footer className={styles.actionsRow}>
        <button
          type="button"
          onClick={resetToDefaults}
          className={styles.resetBtn}
          aria-label="Reset metrics to default values"
        >
          <span>🔄</span> Reset to Defaults
        </button>
      </footer>
    </section>
  );
};

export default MockMetricController;
