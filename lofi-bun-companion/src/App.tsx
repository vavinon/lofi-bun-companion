/**
 * Lo-fi Bun Companion — Master Showcase Container.
 *
 * Provides a cozy desk mat workspace presenting:
 * 1. Pet Stage Viewport: Real-time Lo-fi Bun animated by Pure CSS GPU step animator with stage HUD.
 * 2. Dashboard & Controls Panel: Interactive glassmorphism hardware metrics simulator.
 *
 * Utilizes selective Zustand store subscriptions to maintain zero unnecessary renders.
 */

import React from 'react';
import { useCompanionStore } from './stores/companionStore';
import { CompanionState } from './types/companion';
import { useTelemetry } from './telemetry/useTelemetry';
import { MockMetricController } from './components/Controls/MockMetricController';
import { PetSprite } from './components/Pet/PetSprite';
import { CompactMascotView } from './components/Desktop/CompactMascotView';
import styles from './App.module.css';

interface StatePresentation {
  icon: string;
  label: string;
  description: string;
  accentColor: string;
  glowColor: string;
}

const STATE_CONFIG: Record<CompanionState, StatePresentation> = {
  IDLE: {
    icon: '🍵',
    label: 'IDLE (0–20% CPU)',
    description: 'Chilling & Sipping Matcha',
    accentColor: '#A3B899',
    glowColor: 'rgba(163, 184, 153, 0.45)',
  },
  FOCUS: {
    icon: '⌨️',
    label: 'FOCUS (20–60% CPU)',
    description: 'Lo-fi Rhythm Typing',
    accentColor: '#FF9A3C',
    glowColor: 'rgba(255, 154, 60, 0.45)',
  },
  FRENZY: {
    icon: '🔥',
    label: 'FRENZY (>60% CPU)',
    description: 'Turbo Typing & Flame Bursts',
    accentColor: '#FF7A59',
    glowColor: 'rgba(255, 122, 89, 0.45)',
  },
  DISK: {
    icon: '📖',
    label: 'DISK (>75% I/O)',
    description: 'Fast Notebook Page-Flipping',
    accentColor: '#8EA8C3',
    glowColor: 'rgba(142, 168, 195, 0.45)',
  },
  REST: {
    icon: '💤',
    label: 'REST (Override Priority 1)',
    description: 'Lavender Pillow Nap',
    accentColor: '#DDD5E9',
    glowColor: 'rgba(221, 213, 233, 0.45)',
  },
};

export const App: React.FC = () => {
  // Activate global background telemetry manager lifecycle
  const { mode, status, providerName } = useTelemetry({
    autoStart: true,
    pollingIntervalMs: 1500,
  });

  // Selective Zustand store subscriptions
  const viewMode = useCompanionStore((state) => state.viewMode);
  const toggleViewMode = useCompanionStore((state) => state.toggleViewMode);
  const activeState = useCompanionStore(
    (state) => state.resolvedState.activeState
  );
  const isHeavyRam = useCompanionStore(
    (state) => state.resolvedState.isHeavyRam
  );
  const activeCompanionId = useCompanionStore(
    (state) => state.activeCompanionId
  );

  const stateInfo = STATE_CONFIG[activeState] || STATE_CONFIG.IDLE;

  // Store subscriptions
  const isAlwaysOnTop = useCompanionStore((state) => state.isAlwaysOnTop);
  const toggleAlwaysOnTop = useCompanionStore(
    (state) => state.toggleAlwaysOnTop
  );

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { isTauri } = await import('@tauri-apps/api/core');
      if (isTauri()) {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().minimize();
      }
    } catch {
      // Fallback
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { invoke, isTauri } = await import('@tauri-apps/api/core');
      if (isTauri()) {
        await invoke('exit_app');
      }
    } catch {
      // Fallback
    }
  };

  // Render ultra-clean frameless floating desk pet when COMPACT view is selected
  if (viewMode === 'COMPACT') {
    return (
      <div
        className={styles.compactContainerRoot}
        data-testid="app-compact-root"
      >
        <CompactMascotView />
      </div>
    );
  }

  return (
    <main className={styles.appContainer} data-testid="app-full-root">
      <div className={styles.deskMat}>
        {/* Unified Top Header & Drag Bar */}
        <header className={styles.headerBar} data-tauri-drag-region>
          <div className={styles.brandGroup} data-tauri-drag-region>
            <span
              className={styles.brandIcon}
              role="img"
              aria-label="Bun Icon"
              data-tauri-drag-region
            >
              🐰
            </span>
            <div data-tauri-drag-region>
              <h1 className={styles.brandTitle} data-tauri-drag-region>
                Lo-fi Bun Companion
              </h1>
              <p className={styles.brandSubtitle} data-tauri-drag-region>
                Cozy Hardware-Reactive Virtual Desk Companion
              </p>
            </div>
          </div>

          <div className={styles.headerBadges} data-tauri-drag-region>
            {/* Telemetry Mode HUD Badge */}
            <div
              className={`${styles.telemetryModeBadge} ${
                mode === 'LIVE' ? styles.modeLive : styles.modeManual
              }`}
              data-testid="telemetry-mode-badge"
            >
              <span
                className={`${styles.modeDot} ${
                  mode === 'LIVE' ? styles.modeDotLive : ''
                }`}
              />
              <span>{mode === 'LIVE' ? '⚡ LIVE' : '🎛️ MANUAL'}</span>
            </div>

            {/* Provider Source Badge */}
            <span
              className={styles.providerBadge}
              data-testid="telemetry-provider-badge"
            >
              {providerName.includes('Native') ||
              providerName.includes('Windows')
                ? '🖥️ '
                : '🌐 '}
              {providerName}
            </span>

            {/* Polling Lifecycle Status Badge */}
            <span
              className={`${styles.statusBadge} ${
                status === 'POLLING' ? styles.statusPolling : styles.statusIdle
              }`}
              data-testid="telemetry-status-badge"
            >
              {status === 'POLLING' ? '🟢 POLLING' : '⚪ IDLE'}
            </span>

            <span className={styles.companionTag}>
              Pet: {activeCompanionId.toUpperCase()} (Flagship)
            </span>
            <span className={styles.versionBadge}>
              v1.0.0 • Desktop Mascot Edition
            </span>
          </div>

          {/* Unified Window Controls Group */}
          <div
            className={styles.windowControlsGroup}
            onMouseDown={(e) => e.stopPropagation()}
            data-testid="window-controls-group"
          >
            {/* Switch View Mode */}
            <button
              type="button"
              className={styles.viewModeToggleBtn}
              onClick={toggleViewMode}
              aria-label="Switch to Compact Desktop Mascot View"
              data-testid="view-mode-toggle-btn"
            >
              <span>🪟</span>
              <span>Mascot View</span>
            </button>

            {/* Toggle Always on Top */}
            <button
              type="button"
              className={`${styles.controlButton} ${
                isAlwaysOnTop ? styles.pinned : ''
              }`}
              onClick={toggleAlwaysOnTop}
              title={
                isAlwaysOnTop
                  ? 'Unpin (Always on Top: ON)'
                  : 'Pin Always on Top'
              }
              aria-label={
                isAlwaysOnTop ? 'Unpin Always on Top' : 'Pin Always on Top'
              }
              data-testid="btn-toggle-always-on-top"
            >
              {isAlwaysOnTop ? '📌' : '📍'}
            </button>

            {/* Minimize */}
            <button
              type="button"
              className={styles.controlButton}
              onClick={handleMinimize}
              title="Minimize Window"
              aria-label="Minimize Window"
              data-testid="btn-minimize-window"
            >
              −
            </button>

            {/* Close */}
            <button
              type="button"
              className={`${styles.controlButton} ${styles.closeButton}`}
              onClick={handleClose}
              title="Close Pet"
              aria-label="Close Pet"
              data-testid="btn-close-window"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Responsive Showcase Split Grid */}
        <div className={styles.showcaseGrid}>
          {/* Left Panel: Pet Stage Viewport */}
          <section className={styles.stageCard} aria-label="Pet Stage Viewport">
            {/* Top Stage HUD */}
            <div className={styles.stageHudHeader}>
              <div
                className={styles.activeStatePill}
                style={{
                  background: `${stateInfo.accentColor}20`,
                  border: `1px solid ${stateInfo.accentColor}55`,
                  color: stateInfo.accentColor,
                }}
                data-testid="active-state-badge"
              >
                <span
                  className={styles.stateDot}
                  style={{ backgroundColor: stateInfo.accentColor }}
                />
                <span>
                  {stateInfo.icon} {stateInfo.label}
                </span>
              </div>

              <div
                className={`${styles.propIndicator} ${
                  isHeavyRam ? styles.propActive : styles.propInactive
                }`}
                data-testid="ram-prop-indicator"
              >
                <span>🥕</span>
                <span>
                  {isHeavyRam
                    ? 'Carrots Stacked (>80% RAM)'
                    : 'RAM Prop: Normal'}
                </span>
              </div>
            </div>

            {/* Center Stage & Desk Rug */}
            <div className={styles.stageArena}>
              <div
                className={styles.stageGlow}
                style={{ backgroundColor: stateInfo.glowColor }}
              />
              <div className={styles.stagePedestal} />
              <PetSprite scale={2.6} />
            </div>

            {/* Stage Bottom Performance HUD */}
            <footer className={styles.stageFooter}>
              <div className={styles.perfBadge}>
                <span className={styles.perfDot} />
                <span>Engine: Pure CSS GPU Step Animation (0.0% CPU)</span>
              </div>
              <span>Sprite Grid: 64x64 px (4-Frame Loop)</span>
            </footer>
          </section>

          {/* Right Panel: Controls & Metrics Dashboard */}
          <section
            className={styles.controlsPanel}
            aria-label="Companion Controls and Hardware Simulator"
          >
            <MockMetricController />
          </section>
        </div>
      </div>

      {/* Footer Notes */}
      <footer className={styles.appFooter}>
        <p>
          Lo-fi Bun Companion • Crafted with 🍵 matcha & ⌨️ cozy beats for
          peaceful deep work.
        </p>
      </footer>
    </main>
  );
};

export default App;
