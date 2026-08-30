import { describe, expect, it } from 'vitest';
import {
  COMPANION_REGISTRY,
  DEFAULT_ANIMATION_DURATIONS,
  getAllCompanions,
  getCompanion,
} from '../data/companionRegistry';
import { CompanionId } from '../types/companion';

describe('companionRegistry (Pluggable Companion Data Layer)', () => {
  const EXPECTED_IDS: CompanionId[] = [
    'bun',
    'neko',
    'shiba',
    'capybara',
    'cockatiel',
    'dolphin',
  ];

  describe('COMPANION_REGISTRY Integrity', () => {
    it('should register exactly 6 companion characters', () => {
      const keys = Object.keys(COMPANION_REGISTRY);
      expect(keys.length).toBe(6);
      expect(keys).toEqual(expect.arrayContaining(EXPECTED_IDS));
    });

    it('should contain valid schema fields for each companion', () => {
      EXPECTED_IDS.forEach((id) => {
        const companion = COMPANION_REGISTRY[id];
        expect(companion).toBeDefined();
        expect(companion.id).toBe(id);
        expect(typeof companion.displayName).toBe('string');
        expect(companion.displayName.length).toBeGreaterThan(0);
        expect(typeof companion.emoji).toBe('string');
        expect(companion.emoji.length).toBeGreaterThan(0);
        expect(typeof companion.role).toBe('string');
        expect(companion.role.length).toBeGreaterThan(0);
        expect(companion.spriteUrl).toMatch(/^\/sprites\/.*\.svg$/);
        expect(companion.propUrl).toMatch(/^\/sprites\/.*\.svg$/);
        expect(companion.animationDurations).toEqual(
          DEFAULT_ANIMATION_DURATIONS
        );
      });
    });

    it('should match the Universal 6-State Animation Durations Contract', () => {
      expect(DEFAULT_ANIMATION_DURATIONS).toEqual({
        idle: 800,
        focus: 600,
        frenzy: 300,
        disk: 400,
        rest: 1000,
      });
    });
  });

  describe('getCompanion helper', () => {
    it('should retrieve correct metadata for a valid companion ID', () => {
      const bun = getCompanion('bun');
      expect(bun.id).toBe('bun');
      expect(bun.displayName).toBe('Lo-fi Bun');
      expect(bun.emoji).toBe('🐰');
      expect(bun.spriteUrl).toBe('/sprites/bun-sprites.svg');
      expect(bun.propUrl).toBe('/sprites/prop-carrot.svg');

      const neko = getCompanion('neko');
      expect(neko.id).toBe('neko');
      expect(neko.displayName).toBe('Coffee Neko');
      expect(neko.emoji).toBe('🐱');
      expect(neko.spriteUrl).toBe('/sprites/neko-sprites.svg');
      expect(neko.propUrl).toBe('/sprites/prop-fish.svg');
    });

    it('should fallback to flagship companion "bun" for unrecognised ID', () => {
      // Test fallback runtime resilience
      const fallback = getCompanion('non_existent' as unknown as CompanionId);
      expect(fallback).toBeDefined();
      expect(fallback.id).toBe('bun');
      expect(fallback.displayName).toBe('Lo-fi Bun');
    });
  });

  describe('getAllCompanions helper', () => {
    it('should return all 6 companion metadata entries in an array', () => {
      const all = getAllCompanions();
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBe(6);
      expect(all.map((c) => c.id)).toEqual(
        expect.arrayContaining(EXPECTED_IDS)
      );
    });
  });
});
