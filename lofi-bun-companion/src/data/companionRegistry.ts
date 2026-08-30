/**
 * Pluggable Companion Registry for Lo-fi Bun Companion (Milestone v1.1.0 Multiverse).
 *
 * Serves as the Single Source of Truth (SSOT) for all companion character metadata,
 * vector sprite assets, signature prop overlays, and animation durations.
 */

import {
  AnimationDurations,
  CompanionId,
  CompanionMetadata,
  CompanionRegistry,
} from '../types/companion';

/**
 * Universal animation timing contract across all characters.
 * Guarantees zero-overhead GPU step rendering synchronization.
 */
export const DEFAULT_ANIMATION_DURATIONS: AnimationDurations = {
  idle: 800,
  focus: 600,
  frenzy: 300,
  disk: 400,
  rest: 1000,
};

/**
 * Static registry of all 6 multiverse companion characters.
 */
export const COMPANION_REGISTRY: CompanionRegistry = {
  bun: {
    id: 'bun',
    displayName: 'Lo-fi Bun',
    emoji: '🐰',
    role: 'Flagship Desk Companion & Cozy Focus Partner',
    spriteUrl: '/sprites/bun-sprites.svg',
    propUrl: '/sprites/prop-carrot.svg',
    animationDurations: { ...DEFAULT_ANIMATION_DURATIONS },
  },
  neko: {
    id: 'neko',
    displayName: 'Coffee Neko',
    emoji: '🐱',
    role: 'Cozy Barista & Chill Study Companion',
    spriteUrl: '/sprites/neko-sprites.svg',
    propUrl: '/sprites/prop-fish.svg',
    animationDurations: { ...DEFAULT_ANIMATION_DURATIONS },
  },
  shiba: {
    id: 'shiba',
    displayName: 'Bakery Shiba',
    emoji: '🐶',
    role: 'Energetic Artisan Baker & Morale Booster',
    spriteUrl: '/sprites/shiba-sprites.svg',
    propUrl: '/sprites/prop-croissant.svg',
    animationDurations: { ...DEFAULT_ANIMATION_DURATIONS },
  },
  capybara: {
    id: 'capybara',
    displayName: 'Onsen Capybara',
    emoji: '🍊',
    role: 'Zen Master & Anti-Burnout / Stress Reducer',
    spriteUrl: '/sprites/capybara-sprites.svg',
    propUrl: '/sprites/prop-yuzu.svg',
    animationDurations: { ...DEFAULT_ANIMATION_DURATIONS },
  },
  cockatiel: {
    id: 'cockatiel',
    displayName: 'DJ Cockatiel',
    emoji: '🦜',
    role: 'Beat Maker & Lo-fi Rhythm Keeper',
    spriteUrl: '/sprites/cockatiel-sprites.svg',
    propUrl: '/sprites/prop-vinyl.svg',
    animationDurations: { ...DEFAULT_ANIMATION_DURATIONS },
  },
  dolphin: {
    id: 'dolphin',
    displayName: 'Wave Dolphin',
    emoji: '🐬',
    role: 'Flow State Surfer & Deep Work Buddy',
    spriteUrl: '/sprites/dolphin-sprites.svg',
    propUrl: '/sprites/prop-coral.svg',
    animationDurations: { ...DEFAULT_ANIMATION_DURATIONS },
  },
};

/**
 * Retrieves metadata for a companion by ID.
 * Falls back to 'bun' (Flagship companion) if the provided ID is invalid or not found.
 *
 * @param id Unique companion identifier
 * @returns CompanionMetadata object
 */
export function getCompanion(id: CompanionId): CompanionMetadata {
  return COMPANION_REGISTRY[id] ?? COMPANION_REGISTRY['bun'];
}

/**
 * Returns an array of all registered companion characters in the multiverse roster.
 *
 * @returns Array of CompanionMetadata
 */
export function getAllCompanions(): CompanionMetadata[] {
  return Object.values(COMPANION_REGISTRY);
}
