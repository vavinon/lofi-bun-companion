/**
 * WindowHeader Component
 *
 * Provides a minimal, translucent titlebar for the desktop companion window.
 * Features:
 * 1. Tauri Drag Region (`data-tauri-drag-region` and native `start_drag` IPC on mouse down).
 * 2. Quick action buttons: Toggle Always-On-Top, Switch View Mode (Compact <-> Full), Minimize, and Close/Exit.
 */

import React from 'react';
import { useCompanionStore } from '../../stores/companionStore';
import styles from './WindowHeader.module.css';

export interface WindowHeaderProps {
  /** Optional custom title text (default: 'Lo-fi Bun') */
  title?: string;
  /** Optional callback invoked when minimize button is clicked */
  onMinimize?: () => void;
  /** Optional callback invoked when close/exit button is clicked */
  onClose?: () => void;
}

export const WindowHeader: React.FC<WindowHeaderProps> = ({
  title = 'Lo-fi Bun',
  onMinimize,
  onClose,
}) => {
  const isAlwaysOnTop = useCompanionStore((state) => state.isAlwaysOnTop);
  const toggleAlwaysOnTop = useCompanionStore(
    (state) => state.toggleAlwaysOnTop
  );
  const viewMode = useCompanionStore((state) => state.viewMode);
  const toggleViewMode = useCompanionStore((state) => state.toggleViewMode);

  const handleStartDrag = async (e: React.MouseEvent) => {
    if (e.button === 0) {
      try {
        const { invoke, isTauri } = await import('@tauri-apps/api/core');
        if (isTauri()) {
          await invoke('start_drag');
        }
      } catch {
        // Fallback for browser testing
      }
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClose) {
      onClose();
      return;
    }

    try {
      const { invoke, isTauri } = await import('@tauri-apps/api/core');
      if (isTauri()) {
        await invoke('exit_app');
      }
    } catch {
      // Fallback for browser testing
    }
  };

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMinimize) {
      onMinimize();
      return;
    }

    try {
      const { isTauri } = await import('@tauri-apps/api/core');
      if (isTauri()) {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().minimize();
      }
    } catch {
      // Fallback for browser testing
    }
  };

  const handleToggleAlwaysOnTop = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleAlwaysOnTop();
  };

  const handleToggleViewMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleViewMode();
  };

  return (
    <header
      className={styles.headerContainer}
      data-tauri-drag-region
      onMouseDown={handleStartDrag}
      data-testid="window-header"
    >
      <div
        className={styles.titleArea}
        data-tauri-drag-region
        onMouseDown={handleStartDrag}
        data-testid="window-title-area"
      >
        <span
          className={styles.petIcon}
          role="img"
          aria-label="Bun"
          data-tauri-drag-region
        >
          🐰
        </span>
        <span
          className={styles.titleText}
          data-tauri-drag-region
          data-testid="window-title-text"
        >
          {title}
        </span>
      </div>

      <div
        className={styles.controlsGroup}
        onMouseDown={(e) => e.stopPropagation()}
        data-testid="window-controls-group"
      >
        {/* Toggle Always on Top */}
        <button
          type="button"
          className={`${styles.controlButton} ${
            isAlwaysOnTop ? styles.pinned : ''
          }`}
          onClick={handleToggleAlwaysOnTop}
          title={isAlwaysOnTop ? 'Unpin (Always on Top: ON)' : 'Pin on Top'}
          aria-label={
            isAlwaysOnTop ? 'Unpin Always on Top' : 'Pin Always on Top'
          }
          data-testid="btn-toggle-always-on-top"
        >
          {isAlwaysOnTop ? '📌' : '📍'}
        </button>

        {/* Toggle View Mode (Compact <-> Full) */}
        <button
          type="button"
          className={styles.controlButton}
          onClick={handleToggleViewMode}
          title={
            viewMode === 'COMPACT'
              ? 'Open Full Dashboard'
              : 'Switch to Mascot View'
          }
          aria-label={
            viewMode === 'COMPACT'
              ? 'Switch to Full Dashboard'
              : 'Switch to Compact Mascot View'
          }
          data-testid="btn-toggle-view-mode"
        >
          {viewMode === 'COMPACT' ? '🎛️' : '🐰'}
        </button>

        {/* Minimize Window */}
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

        {/* Close / Exit */}
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
  );
};

export default WindowHeader;
