/**
 * CompactMascotView Component
 *
 * Provides a borderless, floating desktop mascot view tailored for Tauri desktop pet mode.
 * Features:
 * 1. Compact draggable viewport (`data-tauri-drag-region`).
 * 2. WindowHeader integration with quick controls.
 * 3. Dynamic ambient halo glow reacting to companion's active state.
 * 4. Minimal floating hardware metrics HUD (CPU, RAM, Disk).
 * 5. Right-click context menu triggering PetContextMenu.
 * 6. Responsive opacity binding from companionStore.
 */

import React, { useState } from 'react';
import { useCompanionStore } from '../../stores/companionStore';
import { CompanionState } from '../../types/companion';
import { PetSprite } from '../Pet/PetSprite';
import { WindowHeader } from './WindowHeader';
import { PetContextMenu } from './PetContextMenu';
import styles from './CompactMascotView.module.css';

interface StateVisualConfig {
  icon: string;
  label: string;
  accentColor: string;
  glowColor: string;
}

const STATE_VISUAL_MAP: Record<CompanionState, StateVisualConfig> = {
  IDLE: {
    icon: '🍵',
    label: 'IDLE',
    accentColor: '#A3B899',
    glowColor: 'rgba(163, 184, 153, 0.45)',
  },
  FOCUS: {
    icon: '⌨️',
    label: 'FOCUS',
    accentColor: '#FF9A3C',
    glowColor: 'rgba(255, 154, 60, 0.45)',
  },
  FRENZY: {
    icon: '🔥',
    label: 'FRENZY',
    accentColor: '#FF7A59',
    glowColor: 'rgba(255, 122, 89, 0.55)',
  },
  DISK: {
    icon: '📖',
    label: 'DISK',
    accentColor: '#8EA8C3',
    glowColor: 'rgba(142, 168, 195, 0.45)',
  },
  REST: {
    icon: '💤',
    label: 'REST',
    accentColor: '#DDD5E9',
    glowColor: 'rgba(221, 213, 233, 0.45)',
  },
};

export const CompactMascotView: React.FC = () => {
  // Store subscriptions
  const activeState = useCompanionStore(
    (state) => state.resolvedState.activeState
  );
  const isHeavyRam = useCompanionStore(
    (state) => state.resolvedState.isHeavyRam
  );
  const metrics = useCompanionStore((state) => state.metrics);
  const windowOpacity = useCompanionStore((state) => state.windowOpacity);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  const stateVisual = STATE_VISUAL_MAP[activeState] || STATE_VISUAL_MAP.IDLE;

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      isOpen: true,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div
      className={styles.compactContainer}
      style={{ opacity: windowOpacity }}
      onContextMenu={handleContextMenu}
      data-testid="compact-mascot-view"
    >
      {/* Top Drag Header with Quick Action Buttons */}
      <WindowHeader title="Lo-fi Bun" />

      {/* Main Pet Interactive Stage */}
      <div
        className={styles.petStageArea}
        data-tauri-drag-region
        data-testid="compact-pet-stage"
      >
        {/* State Halo Glow */}
        <div
          className={styles.stateGlowHalo}
          style={{ backgroundColor: stateVisual.glowColor }}
          data-testid="state-glow-halo"
        />

        {/* Floor Shadow Pedestal */}
        <div className={styles.petPedestal} />

        {/* Pet Sprite Character */}
        <div
          className={styles.petSpriteWrapper}
          data-tauri-drag-region
          data-testid="compact-pet-sprite"
        >
          <PetSprite scale={2.2} />
        </div>

        {/* Floating Minimal Hardware & State HUD */}
        <div className={styles.floatingHud} data-testid="compact-floating-hud">
          {/* Active State Pill */}
          <div
            className={styles.statePill}
            style={{
              background: `${stateVisual.accentColor}25`,
              border: `1px solid ${stateVisual.accentColor}60`,
              color: stateVisual.accentColor,
            }}
            data-testid="compact-state-pill"
          >
            <span
              className={styles.stateDot}
              style={{ backgroundColor: stateVisual.accentColor }}
            />
            <span>
              {stateVisual.icon} {stateVisual.label}
            </span>
          </div>

          {/* Minimal Metrics Bar */}
          <div
            className={styles.metricsPillBar}
            data-testid="compact-metrics-bar"
          >
            <div className={styles.metricBadge} data-testid="badge-cpu">
              <span>⚡</span>
              <span>CPU</span>
              <span className={styles.metricValue}>
                {Math.round(metrics.cpuUsage)}%
              </span>
            </div>

            <div className={styles.metricBadge} data-testid="badge-ram">
              <span className={isHeavyRam ? styles.heavyRamCarrot : ''}>
                {isHeavyRam ? '🥕' : '🧠'}
              </span>
              <span>RAM</span>
              <span className={styles.metricValue}>
                {Math.round(metrics.ramUsage)}%
              </span>
            </div>

            <div className={styles.metricBadge} data-testid="badge-disk">
              <span>💾</span>
              <span>Disk</span>
              <span className={styles.metricValue}>
                {Math.round(metrics.diskUsage)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right-Click Context Menu */}
      <PetContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.isOpen}
        onClose={handleCloseContextMenu}
      />
    </div>
  );
};

export default CompactMascotView;
