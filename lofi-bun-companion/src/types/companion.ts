/**
 * Companion domain types and data contracts for Lo-fi Bun Companion.
 * Adheres to SemVer 2.0.0 and extensible for Release 1.1.0 multi-pet roster.
 */

export type CompanionState = 'IDLE' | 'FOCUS' | 'FRENZY' | 'DISK' | 'REST';

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

export interface CompanionMetadata {
  /** Unique identifier for companion character (e.g. 'bun-01', 'cat-02') */
  id: string;
  /** Display name of the companion */
  name: string;
  /** Role or character description */
  role: string;
  /** URL or asset path to the 256x320 pixel-art vector spritesheet */
  spriteUrl: string;
  /** URL or asset path to optional overlay props */
  propUrl: string;
  /** Animation cycle durations per state in milliseconds */
  animationDurations: Record<CompanionState, number>;
}

export type CompanionRegistry = Record<string, CompanionMetadata>;
