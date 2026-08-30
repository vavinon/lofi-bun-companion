/**
 * Companion domain types and data contracts for Lo-fi Bun Companion.
 * Adheres to SemVer 2.0.0 and extensible for Release 1.1.0 multi-pet roster.
 */

export type CompanionState = 'IDLE' | 'FOCUS' | 'FRENZY' | 'DISK' | 'REST';

/** Supported companion character IDs in the Multiverse roster */
export type CompanionId =
  'bun' | 'neko' | 'shiba' | 'capybara' | 'cockatiel' | 'dolphin';

export interface HardwareMetrics {
  /** CPU utilization percentage (0 - 100) */
  cpuUsage: number;
  /** RAM memory utilization percentage (0 - 100) */
  ramUsage: number;
  /** Disk I/O activity percentage (0 - 100) */
  diskUsage: number;
}

export interface ResolvedCompanionState {
  /** The primary state to be rendered by the sprite engine */
  activeState: CompanionState;
  /** Independent prop indicator when RAM usage exceeds threshold (> 80%) */
  isHeavyRam: boolean;
  /** Timestamp when the state resolution occurred */
  timestamp: number;
}

/** State-specific animation durations in milliseconds */
export interface AnimationDurations {
  idle: number;
  focus: number;
  frenzy: number;
  disk: number;
  rest: number;
}

/** Complete configuration and asset contract for a companion character */
export interface CompanionMetadata {
  /** Unique identifier matching CompanionId union */
  id: CompanionId;
  /** Display name of the companion (e.g. 'Lo-fi Bun', 'Coffee Neko') */
  displayName: string;
  /** Emoji avatar icon */
  emoji: string;
  /** Role or character archetype description */
  role: string;
  /** Asset path to the 256x320 pixel-art vector spritesheet */
  spriteUrl: string;
  /** Asset path to the 64x64 overlay prop */
  propUrl: string;
  /** Animation cycle durations per state in milliseconds */
  animationDurations: AnimationDurations;
}

export type CompanionRegistry = Record<CompanionId, CompanionMetadata>;
