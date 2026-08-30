import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('SVG Asset Integrity & XML Well-Formedness Gate', () => {
  const spritesDir = path.resolve(__dirname, '../assets/sprites');
  const EXPECTED_CHARACTER_SPRITES = [
    'bun-sprites.svg',
    'neko-sprites.svg',
    'shiba-sprites.svg',
    'capybara-sprites.svg',
    'cockatiel-sprites.svg',
    'dolphin-sprites.svg',
  ];
  const EXPECTED_PROPS = [
    'prop-carrot.svg',
    'prop-fish.svg',
    'prop-croissant.svg',
    'prop-yuzu.svg',
    'prop-vinyl.svg',
    'prop-coral.svg',
  ];

  it('should ensure all .svg asset files exist and are valid well-formed XML', () => {
    const files = fs
      .readdirSync(spritesDir)
      .filter((file) => file.endsWith('.svg'));
    expect(files.length).toBeGreaterThanOrEqual(12);

    const parser = new DOMParser();

    for (const file of files) {
      const filePath = path.join(spritesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      const doc = parser.parseFromString(content, 'image/svg+xml');
      const parserErrors = doc.querySelectorAll('parsererror');

      // Ensure no XML parsing error elements exist
      expect(
        parserErrors.length,
        `SVG file "${file}" has XML parse errors: ${parserErrors[0]?.textContent}`
      ).toBe(0);

      // Verify root SVG element properties
      const svg = doc.querySelector('svg');
      expect(
        svg,
        `SVG file "${file}" must have a root <svg> element`
      ).not.toBeNull();
      expect(svg?.getAttribute('viewBox')).toBeTruthy();
      expect(svg?.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
    }
  });

  it('should have all 6 character spritesheets and 6 companion props in asset inventory', () => {
    const files = fs
      .readdirSync(spritesDir)
      .filter((file) => file.endsWith('.svg'));

    EXPECTED_CHARACTER_SPRITES.forEach((sprite) => {
      expect(files).toContain(sprite);
    });

    EXPECTED_PROPS.forEach((prop) => {
      expect(files).toContain(prop);
    });
  });

  it('should enforce 256x320 viewBox standard for all character spritesheets', () => {
    const parser = new DOMParser();
    EXPECTED_CHARACTER_SPRITES.forEach((spriteFile) => {
      const filePath = path.join(spritesDir, spriteFile);
      const content = fs.readFileSync(filePath, 'utf-8');
      const doc = parser.parseFromString(content, 'image/svg+xml');
      const svg = doc.querySelector('svg');

      expect(svg?.getAttribute('viewBox')).toBe('0 0 256 320');
      expect(svg?.getAttribute('width')).toBe('256');
      expect(svg?.getAttribute('height')).toBe('320');
    });
  });

  it('should verify prop overlay assets have valid crispEdges rendering and proper dimensions', () => {
    const parser = new DOMParser();
    EXPECTED_PROPS.forEach((propFile) => {
      const filePath = path.join(spritesDir, propFile);
      const content = fs.readFileSync(filePath, 'utf-8');
      const doc = parser.parseFromString(content, 'image/svg+xml');
      const svg = doc.querySelector('svg');

      const viewBox = svg?.getAttribute('viewBox');
      // Props are either standard 28x20 or specialized 64x64
      expect(['0 0 28 20', '0 0 64 64']).toContain(viewBox);
      expect(svg?.getAttribute('shape-rendering')).toBe('crispEdges');
    });
  });
});
