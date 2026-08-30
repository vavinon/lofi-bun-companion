/**
 * PetContextMenu Component
 *
 * Floating glassmorphism context menu displayed on right-click.
 * Provides controls for:
 * 1. ⚡ Live Hardware Polling (Toggle Real OS vs Manual Simulation)
 * 2. 💤 Lavender Nap / Rest (Toggle forceRest)
 * 3. 👁️ Window Opacity (100%, 85%, 70%, 50%)
 * 4. 📌 Always on Top (Toggle pin)
 * 5. 🎛️ Full Dashboard (Toggle viewMode)
 * 6. ❌ Exit Pet (Close application)
 */

import React, { useEffect, useRef } from 'react';
import { useCompanionStore } from '../../stores/companionStore';
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
  /** Optional custom exit handler */
  onExit?: () => void;
}

export const PetContextMenu: React.FC<PetContextMenuProps> = ({
  x,
  y,
  isOpen,
  onClose,
  onExit,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Store subscriptions and actions
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
  const MENU_WIDTH = 200;
  const MENU_HEIGHT = 280;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 320;
  const viewportHeight =
    typeof window !== 'undefined' ? window.innerHeight : 380;

  const adjustedX = Math.min(x, Math.max(10, viewportWidth - MENU_WIDTH - 10));
  const adjustedY = Math.min(
    y,
    Math.max(10, viewportHeight - MENU_HEIGHT - 10)
  );

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
