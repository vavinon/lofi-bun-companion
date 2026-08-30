/**
 * MockMetricController: Interactive Glassmorphism Control Panel for Lo-fi Bun.
 *
 * Provides real-time sliders for simulated Hardware Metrics (CPU, RAM, Disk)
 * and an override toggle for Rest Mode, directly updating the reactive Zustand store.
 * Employs selective subscriptions to prevent unnecessary renders and keep 0% CPU overhead.
 */

import React, { useId, useCallback } from 'react';
import { useCompanionStore } from '../../stores/companionStore';
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
const getTrackBackground = (value: number, accentColor: string): string => {
  const percent = Math.min(100, Math.max(0, value));
  return `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${percent}%, rgba(28, 22, 20, 0.6) ${percent}%, rgba(28, 22, 20, 0.6) 100%)`;
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

  const setMetrics = useCompanionStore((state) => state.setMetrics);
  const setForceRest = useCompanionStore((state) => state.setForceRest);
  const resetToDefaults = useCompanionStore((state) => state.resetToDefaults);

  // Handlers
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
      {/* Header */}
      <header className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <span className={styles.titleIcon} role="img" aria-label="Controls">
            🎛️
          </span>
          <h2 className={styles.title}>Hardware Lab Controls</h2>
        </div>
        <span className={styles.tagBadge}>Simulated</span>
      </header>

      {/* Control Sliders */}
      <div className={styles.controlGroup}>
        {/* CPU Usage Slider */}
        <div className={styles.sliderItem}>
          <div className={styles.labelRow}>
            <label htmlFor={cpuId} className={styles.metricName}>
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
            onChange={handleCpuChange}
            className={`${styles.rangeInput} ${styles.cpuSlider}`}
            style={{ background: getTrackBackground(cpuUsage, '#FF9A3C') }}
            aria-label="CPU Usage Percentage"
            aria-valuenow={cpuUsage}
          />
        </div>

        {/* RAM Usage Slider */}
        <div className={styles.sliderItem}>
          <div className={styles.labelRow}>
            <label htmlFor={ramId} className={styles.metricName}>
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
            onChange={handleRamChange}
            className={`${styles.rangeInput} ${styles.ramSlider}`}
            style={{ background: getTrackBackground(ramUsage, '#A3B899') }}
            aria-label="RAM Usage Percentage"
            aria-valuenow={ramUsage}
          />
        </div>

        {/* Disk Usage Slider */}
        <div className={styles.sliderItem}>
          <div className={styles.labelRow}>
            <label htmlFor={diskId} className={styles.metricName}>
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
            onChange={handleDiskChange}
            className={`${styles.rangeInput} ${styles.diskSlider}`}
            style={{ background: getTrackBackground(diskUsage, '#8EA8C3') }}
            aria-label="Disk Usage Percentage"
            aria-valuenow={diskUsage}
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
