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

  describe('Individual Companion Metadata Specifications', () => {
    it('should configure Lo-fi Bun metadata correctly', () => {
      const bun = getCompanion('bun');
      expect(bun.id).toBe('bun');
      expect(bun.displayName).toBe('Lo-fi Bun');
      expect(bun.emoji).toBe('🐰');
      expect(bun.role).toBe('Flagship Desk Companion & Cozy Focus Partner');
      expect(bun.spriteUrl).toBe('/sprites/bun-sprites.svg');
      expect(bun.propUrl).toBe('/sprites/prop-carrot.svg');
    });

    it('should configure Coffee Neko metadata correctly', () => {
      const neko = getCompanion('neko');
      expect(neko.id).toBe('neko');
      expect(neko.displayName).toBe('Coffee Neko');
      expect(neko.emoji).toBe('🐱');
      expect(neko.role).toBe('Cozy Barista & Chill Study Companion');
      expect(neko.spriteUrl).toBe('/sprites/neko-sprites.svg');
      expect(neko.propUrl).toBe('/sprites/prop-fish.svg');
    });

    it('should configure Bakery Shiba metadata correctly', () => {
      const shiba = getCompanion('shiba');
      expect(shiba.id).toBe('shiba');
      expect(shiba.displayName).toBe('Bakery Shiba');
      expect(shiba.emoji).toBe('🐶');
      expect(shiba.role).toBe('Energetic Artisan Baker & Morale Booster');
      expect(shiba.spriteUrl).toBe('/sprites/shiba-sprites.svg');
      expect(shiba.propUrl).toBe('/sprites/prop-croissant.svg');
    });

    it('should configure Onsen Capybara metadata correctly', () => {
      const capy = getCompanion('capybara');
      expect(capy.id).toBe('capybara');
      expect(capy.displayName).toBe('Onsen Capybara');
      expect(capy.emoji).toBe('🍊');
      expect(capy.role).toBe('Zen Master & Anti-Burnout / Stress Reducer');
      expect(capy.spriteUrl).toBe('/sprites/capybara-sprites.svg');
      expect(capy.propUrl).toBe('/sprites/prop-yuzu.svg');
    });

    it('should configure DJ Cockatiel metadata correctly', () => {
      const tiel = getCompanion('cockatiel');
      expect(tiel.id).toBe('cockatiel');
      expect(tiel.displayName).toBe('DJ Cockatiel');
      expect(tiel.emoji).toBe('🦜');
      expect(tiel.role).toBe('Beat Maker & Lo-fi Rhythm Keeper');
      expect(tiel.spriteUrl).toBe('/sprites/cockatiel-sprites.svg');
      expect(tiel.propUrl).toBe('/sprites/prop-vinyl.svg');
    });

    it('should configure Wave Dolphin metadata correctly', () => {
      const dolphin = getCompanion('dolphin');
      expect(dolphin.id).toBe('dolphin');
      expect(dolphin.displayName).toBe('Wave Dolphin');
      expect(dolphin.emoji).toBe('🐬');
      expect(dolphin.role).toBe('Flow State Surfer & Deep Work Buddy');
      expect(dolphin.spriteUrl).toBe('/sprites/dolphin-sprites.svg');
      expect(dolphin.propUrl).toBe('/sprites/prop-coral.svg');
    });
  });

  describe('getCompanion fallback & edge case resilience', () => {
    it('should fallback to flagship companion "bun" for unrecognised ID', () => {
      const fallback = getCompanion('non_existent' as unknown as CompanionId);
      expect(fallback).toBeDefined();
      expect(fallback.id).toBe('bun');
      expect(fallback.displayName).toBe('Lo-fi Bun');
    });

    it('should fallback to flagship companion for empty string or invalid type', () => {
      const fallbackEmpty = getCompanion('' as unknown as CompanionId);
      expect(fallbackEmpty.id).toBe('bun');

      const fallbackNull = getCompanion(null as unknown as CompanionId);
      expect(fallbackNull.id).toBe('bun');

      const fallbackUndefined = getCompanion(
        undefined as unknown as CompanionId
      );
      expect(fallbackUndefined.id).toBe('bun');
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

    it('should maintain the standard canonical ordering in the array', () => {
      const all = getAllCompanions();
      const ids = all.map((c) => c.id);
      expect(ids).toEqual([
        'bun',
        'neko',
        'shiba',
        'capybara',
        'cockatiel',
        'dolphin',
      ]);
    });
  });
});
