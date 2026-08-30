import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('SVG Asset Integrity & XML Well-Formedness Gate', () => {
  const spritesDir = path.resolve(__dirname, '../assets/sprites');

  it('should ensure all .svg asset files exist and are valid well-formed XML', () => {
    const files = fs
      .readdirSync(spritesDir)
      .filter((file) => file.endsWith('.svg'));
    expect(files.length).toBeGreaterThan(0);

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
});
