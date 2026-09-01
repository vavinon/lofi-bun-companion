/**
 * PetContextMenu Component
 *
 * Floating glassmorphism context menu displayed on right-click.
 * Provides controls for:
 * 1. 🍅 Pomodoro Focus Suite (Quick Start 25m, Pause/Resume, Open Dashboard)
 * 2. 🐾 Switch Companion (Collapsible submenu)
 * 3. ⚡ Live Hardware Polling (Toggle Real OS vs Manual Simulation)
 * 4. 💤 Lavender Nap / Rest (Toggle forceRest)
 * 5. 👁️ Window Opacity (100%, 85%, 70%, 50%)
 * 6. 📌 Always on Top (Toggle pin)
 * 7. 🎛️ Full Dashboard (Toggle viewMode)
 * 8. ✕ Exit Pet (Close application)
 */

import React, { useEffect, useRef, useState } from 'react';
import { useCompanionStore } from '../../stores/companionStore';
import { usePomodoroStore } from '../../stores/pomodoroStore';
import { getAllCompanions } from '../../data/companionRegistry';
import { CompanionId } from '../../types/companion';
import {
  WINDOW_OPACITY_PRESETS,
  WindowOpacityOption,
} from '../../types/desktop';
import styles from './PetContextMenu.module.css';

export interface PetContextMenuProps {
  /** Screen X coordinate for menu spawn */
  x: number;
  /** Screen Y coordinate for menu spawn */
  y: number;
  /** Whether the menu is visible */
  isOpen: boolean;
  /** Callback invoked to close the menu */
  onClose: () => void;
  /** Optional callback to open the Pomodoro Focus Dashboard */
  onOpenPomodoro?: () => void;
  /** Optional custom exit handler */
  onExit?: () => void;
}

const formatTimerMinutesSeconds = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const PetContextMenu: React.FC<PetContextMenuProps> = ({
  x,
  y,
  isOpen,
  onClose,
  onOpenPomodoro,
  onExit,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  // Default to collapsed (false) to keep the menu compact and avoid overflow
  const [isCompanionSubmenuOpen, setIsCompanionSubmenuOpen] = useState(false);

  // Companion store subscriptions and actions
  const activeCompanionId = useCompanionStore(
    (state) => state.activeCompanionId
  );
  const setActiveCompanionId = useCompanionStore(
    (state) => state.setActiveCompanionId
  );
  const telemetryMode = useCompanionStore((state) => state.telemetryMode);
  const setTelemetryMode = useCompanionStore((state) => state.setTelemetryMode);
  const forceRest = useCompanionStore((state) => state.forceRest);
  const setForceRest = useCompanionStore((state) => state.setForceRest);
  const isAlwaysOnTop = useCompanionStore((state) => state.isAlwaysOnTop);
  const toggleAlwaysOnTop = useCompanionStore(
    (state) => state.toggleAlwaysOnTop
  );
  const viewMode = useCompanionStore((state) => state.viewMode);
  const toggleViewMode = useCompanionStore((state) => state.toggleViewMode);
  const windowOpacity = useCompanionStore((state) => state.windowOpacity);
  const setWindowOpacity = useCompanionStore((state) => state.setWindowOpacity);

  // Pomodoro store subscriptions and actions
  const pomodoroStatus = usePomodoroStore((state) => state.status);
  const pomodoroPhase = usePomodoroStore((state) => state.phase);
  const pomodoroRemaining = usePomodoroStore((state) => state.remainingSeconds);
  const startFocus = usePomodoroStore((state) => state.startFocus);
  const pauseTimer = usePomodoroStore((state) => state.pauseTimer);
  const resumeTimer = usePomodoroStore((state) => state.resumeTimer);

  const companions = getAllCompanions();

  // Handle Escape key and outside click to close context menu
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  // Calculate adjusted menu coordinates to prevent overflowing window bounds
  const MENU_WIDTH = 210;
  const MENU_MAX_HEIGHT = 340;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 320;
  const viewportHeight =
    typeof window !== 'undefined' ? window.innerHeight : 480;

  const adjustedX = Math.min(x, Math.max(10, viewportWidth - MENU_WIDTH - 10));
  const adjustedY = Math.min(
    y,
    Math.max(10, viewportHeight - MENU_MAX_HEIGHT - 10)
  );

  const handleSelectCompanion = (id: CompanionId) => {
    setActiveCompanionId(id);
    onClose();
  };

  const handleTogglePomodoro = () => {
    if (pomodoroStatus === 'RUNNING') {
      pauseTimer();
    } else if (pomodoroStatus === 'PAUSED') {
      resumeTimer();
    } else {
      startFocus();
    }
    onClose();
  };

  const handleOpenPomodoroDashboard = () => {
    onClose();
    if (onOpenPomodoro) {
      onOpenPomodoro();
    }
  };

  const handleToggleTelemetry = () => {
    setTelemetryMode(telemetryMode === 'LIVE' ? 'MANUAL' : 'LIVE');
    onClose();
  };

  const handleToggleRest = () => {
    setForceRest(!forceRest);
    onClose();
  };

  const handleToggleAlwaysOnTop = () => {
    toggleAlwaysOnTop();
    onClose();
  };

  const handleToggleViewMode = () => {
    toggleViewMode();
    onClose();
  };

  const handleSelectOpacity = (opacity: WindowOpacityOption) => {
    setWindowOpacity(opacity);
  };

  const handleExit = async () => {
    onClose();
    if (onExit) {
      onExit();
      return;
    }

    try {
      const { isTauri } = await import('@tauri-apps/api/core');
      if (isTauri()) {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().close();
      }
    } catch {
      // Fallback
    }
  };

  return (
    <>
      {/* Invisible backdrop to capture outside click */}
      <div
        className={styles.menuBackdrop}
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
        data-testid="context-menu-backdrop"
      />

      {/* Glassmorphic Context Menu Panel */}
      <div
        ref={menuRef}
        className={styles.menuContainer}
        style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
        role="menu"
        aria-label="Pet Context Menu"
        data-testid="pet-context-menu"
      >
        <div className={styles.menuHeader}>
          <span>🐰 Lo-fi Bun Companion</span>
        </div>

        <ul className={styles.menuList}>
          {/* Quick Pomodoro Controls Section */}
          <li>
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleTogglePomodoro}
              role="menuitem"
              data-testid="menu-item-pomodoro-toggle"
            >
              <span className={styles.itemLabel}>
                <span className={styles.itemIcon}>
                  {pomodoroPhase === 'FOCUS' ? '🍅' : '💤'}
                </span>
                <span>
                  {pomodoroStatus === 'RUNNING'
                    ? `Pause ${pomodoroPhase === 'FOCUS' ? 'Focus' : 'Break'}`
                    : pomodoroStatus === 'PAUSED'
                      ? 'Resume Timer'
                      : 'Start 25m Focus'}
                </span>
              </span>
              <span className={styles.pomodoroActiveCheck}>
                {pomodoroStatus !== 'IDLE'
                  ? formatTimerMinutesSeconds(pomodoroRemaining)
                  : '25:00'}
              </span>
            </button>
          </li>

          <li>
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleOpenPomodoroDashboard}
              role="menuitem"
              data-testid="menu-item-pomodoro-dashboard"
            >
              <span className={styles.itemLabel}>
                <span className={styles.itemIcon}>⏱️</span>
                <span>Focus Dashboard...</span>
              </span>
            </button>
          </li>

          <div className={styles.divider} />

          {/* Switch Companion Submenu / Section (Default Collapsed) */}
          <li className={styles.sectionHeaderItem}>
            <button
              type="button"
              className={styles.sectionHeaderButton}
              onClick={() => setIsCompanionSubmenuOpen(!isCompanionSubmenuOpen)}
              data-testid="menu-item-switch-companion"
            >
              <span className={styles.itemLabel}>
                <span className={styles.itemIcon}>🐾</span>
                <span>Switch Companion</span>
              </span>
              <span className={styles.submenuChevron}>
                {isCompanionSubmenuOpen ? '▾' : '▸'}
              </span>
            </button>

            {isCompanionSubmenuOpen && (
              <div
                className={styles.companionSubmenuList}
                data-testid="menu-section-companions"
              >
                {companions.map((comp) => {
                  const isActive = activeCompanionId === comp.id;
                  return (
                    <button
                      key={comp.id}
                      type="button"
                      className={`${styles.companionMenuItem} ${
                        isActive ? styles.companionMenuActive : ''
                      }`}
                      onClick={() => handleSelectCompanion(comp.id)}
                      role="menuitemradio"
                      aria-checked={isActive}
                      data-testid={`menu-companion-${comp.id}`}
                    >
                      <span className={styles.itemLabel}>
                        <span className={styles.itemIcon}>{comp.emoji}</span>
                        <span>{comp.displayName}</span>
                      </span>
                      <span className={styles.radioIndicator}>
                        {isActive ? '●' : '○'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </li>

          <div className={styles.divider} />

          {/* Toggle Live Telemetry */}
          <li>
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleToggleTelemetry}
              role="menuitem"
              data-testid="menu-item-telemetry"
            >
              <span className={styles.itemLabel}>
                <span className={styles.itemIcon}>⚡</span>
                <span>Real OS Telemetry</span>
              </span>
              <span className={styles.itemCheck}>
                {telemetryMode === 'LIVE' ? 'ON' : 'OFF'}
              </span>
            </button>
          </li>

          {/* Toggle Rest Mode */}
          <li>
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleToggleRest}
              role="menuitem"
              data-testid="menu-item-rest"
            >
              <span className={styles.itemLabel}>
                <span className={styles.itemIcon}>💤</span>
                <span>Lavender Nap / Rest</span>
              </span>
              <span className={styles.itemCheck}>
                {forceRest ? 'ON' : 'OFF'}
              </span>
            </button>
          </li>

          {/* Opacity Control */}
          <li>
            <div className={styles.menuItem} style={{ cursor: 'default' }}>
              <span className={styles.itemLabel}>
                <span className={styles.itemIcon}>👁️</span>
                <span>Window Opacity</span>
              </span>
              <span className={styles.itemCheck}>
                {Math.round(windowOpacity * 100)}%
              </span>
            </div>
            <div
              className={styles.opacitySubmenu}
              data-testid="menu-opacity-selector"
            >
              {WINDOW_OPACITY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`${styles.opacityButton} ${
                    Math.abs(windowOpacity - preset) < 0.05
                      ? styles.opacityActive
                      : ''
                  }`}
                  onClick={() => handleSelectOpacity(preset)}
                  data-testid={`btn-opacity-${Math.round(preset * 100)}`}
                >
                  {Math.round(preset * 100)}%
                </button>
              ))}
            </div>
          </li>

          <div className={styles.divider} />

          {/* Toggle Always on Top */}
          <li>
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleToggleAlwaysOnTop}
              role="menuitem"
              data-testid="menu-item-always-on-top"
            >
              <span className={styles.itemLabel}>
                <span className={styles.itemIcon}>📌</span>
                <span>Always on Top</span>
              </span>
              <span className={styles.itemCheck}>
                {isAlwaysOnTop ? '✓' : ''}
              </span>
            </button>
          </li>

          {/* Switch View Mode */}
          <li>
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleToggleViewMode}
              role="menuitem"
              data-testid="menu-item-view-mode"
            >
              <span className={styles.itemLabel}>
                <span className={styles.itemIcon}>🎛️</span>
                <span>
                  {viewMode === 'COMPACT' ? 'Full Dashboard' : 'Compact Mascot'}
                </span>
              </span>
            </button>
          </li>

          <div className={styles.divider} />

          {/* Exit Application */}
          <li>
            <button
              type="button"
              className={`${styles.menuItem} ${styles.dangerItem}`}
              onClick={handleExit}
              role="menuitem"
              data-testid="menu-item-exit"
            >
              <span className={styles.itemLabel}>
                <span className={styles.itemIcon}>✕</span>
                <span>Exit Desk Pet</span>
              </span>
            </button>
          </li>
        </ul>
      </div>
    </>
  );
};

export default PetContextMenu;
