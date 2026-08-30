/**
 * Pure CSS Step Animator for Multiverse Companions.
 *
 * Implements 0.0% CPU GPU-accelerated frame animation using CSS `steps(4)`
 * and background-position translation over 256x320 px vector spritesheets.
 * Dynamically loads active companion sprite sheets, signature props, and
 * animation timings from the companion registry with zero JS animation overhead.
 */

import React from 'react';
import { useCompanionStore } from '../../stores/companionStore';
import { getCompanion } from '../../data/companionRegistry';
import { AnimationDurations } from '../../types/companion';
import styles from './PetSprite.module.css';

export interface PetSpriteProps {
  /** Optional custom scale factor (default: 2.5x) */
  scale?: number;
  /** Optional className for custom wrapper positioning */
  className?: string;
}

export const PetSprite: React.FC<PetSpriteProps> = ({
  scale = 2.5,
  className = '',
}) => {
  // Selective Zustand Subscriptions
  const activeCompanionId = useCompanionStore(
    (state) => state.activeCompanionId
  );
  const activeState = useCompanionStore(
    (state) => state.resolvedState.activeState
  );
  const isHeavyRam = useCompanionStore(
    (state) => state.resolvedState.isHeavyRam
  );

  // Retrieve active companion metadata from SSOT registry
  const companion = getCompanion(activeCompanionId);

  // Map companion state to corresponding CSS animation class
  const stateClassMap: Record<string, string> = {
    IDLE: styles.idle,
    FOCUS: styles.focus,
    FRENZY: styles.frenzy,
    DISK: styles.disk,
    REST: styles.rest,
  };

  const currentAnimClass = stateClassMap[activeState] || styles.idle;

  // Derive dynamic animation duration based on character contract
  const stateKey = activeState.toLowerCase() as keyof AnimationDurations;
  const durationMs = companion.animationDurations[stateKey] ?? 800;
  const durationSec = `${durationMs / 1000}s`;

  // Dynamic CSS variables passed to GPU styling
  const customCssVars = {
    transform: `scale(${scale})`,
    '--sprite-url': `url("${companion.spriteUrl}")`,
    '--prop-url': `url("${companion.propUrl}")`,
    '--anim-duration': durationSec,
  } as React.CSSProperties;

  return (
    <div
      className={`${styles.spriteWrapper} ${className}`}
      style={customCssVars}
      data-testid="pet-sprite-wrapper"
      data-companion-id={activeCompanionId}
      data-state={activeState}
      data-heavy-ram={isHeavyRam ? 'true' : 'false'}
    >
      {/* 64x64 Base Sprite Canvas with Pure CSS Step Keyframes */}
      <div
        className={`${styles.spriteCanvas} ${currentAnimClass}`}
        role="img"
        aria-label={`${companion.displayName} in ${activeState} state`}
      >
        {/* Dynamic Head Prop Layer (Signature item when RAM > 80%) */}
        {isHeavyRam && (
          <div
            className={styles.propLayer}
            data-testid="companion-prop-layer"
            data-prop-url={companion.propUrl}
            aria-label={`${companion.displayName} prop on head`}
          />
        )}
      </div>
    </div>
  );
};

export default PetSprite;
