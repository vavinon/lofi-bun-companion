/**
 * Pure CSS Step Animator for Lo-fi Bun Sprites.
 *
 * Implements 0.0% CPU GPU-accelerated frame animation using CSS `steps(4)`
 * and background-position translation over the 256x320 px vector spritesheet.
 * Selectively subscribes to Zustand store to react to resolved states and RAM overlays.
 */

import React from 'react';
import { useCompanionStore } from '../../stores/companionStore';
import bunSpritesUrl from '../../assets/sprites/bun-sprites.svg';
import propCarrotUrl from '../../assets/sprites/prop-carrot.svg';
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
  const activeState = useCompanionStore(
    (state) => state.resolvedState.activeState
  );
  const isHeavyRam = useCompanionStore(
    (state) => state.resolvedState.isHeavyRam
  );

  // Map companion state to corresponding CSS animation class
  const stateClassMap: Record<string, string> = {
    IDLE: styles.idle,
    FOCUS: styles.focus,
    FRENZY: styles.frenzy,
    DISK: styles.disk,
    REST: styles.rest,
  };

  const currentAnimClass = stateClassMap[activeState] || styles.idle;

  return (
    <div
      className={`${styles.spriteWrapper} ${className}`}
      style={{ transform: `scale(${scale})` }}
      data-testid="pet-sprite-wrapper"
      data-state={activeState}
      data-heavy-ram={isHeavyRam ? 'true' : 'false'}
    >
      {/* 64x64 Base Sprite Canvas with Pure CSS Step Keyframes */}
      <div
        className={`${styles.spriteCanvas} ${currentAnimClass}`}
        style={{ backgroundImage: `url(${bunSpritesUrl})` }}
        role="img"
        aria-label={`Lo-fi Bun in ${activeState} state`}
      >
        {/* Dynamic Head Prop Layer (Carrot Stack when RAM > 80%) */}
        {isHeavyRam && (
          <div
            className={styles.propCarrot}
            style={{ backgroundImage: `url(${propCarrotUrl})` }}
            data-testid="carrot-prop-layer"
            aria-label="Carrot stack prop on head"
          />
        )}
      </div>
    </div>
  );
};

export default PetSprite;
