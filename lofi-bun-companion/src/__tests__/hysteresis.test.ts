import { describe, expect, it } from 'vitest';
import { evaluateHysteresis } from '../utils/hysteresis';

describe('evaluateHysteresis', () => {
  describe('CPU Focus Transition (Rising 20%, Falling 17% with 3% buffer)', () => {
    const RISING_THRESHOLD = 20;
    const BUFFER = 3;

    it('should stay FALSE when rising below 20%', () => {
      expect(evaluateHysteresis(0, false, RISING_THRESHOLD, BUFFER)).toBe(
        false
      );
      expect(evaluateHysteresis(16.9, false, RISING_THRESHOLD, BUFFER)).toBe(
        false
      );
      expect(evaluateHysteresis(19.9, false, RISING_THRESHOLD, BUFFER)).toBe(
        false
      );
    });

    it('should transition to TRUE when rising reaches or exceeds 20%', () => {
      expect(evaluateHysteresis(20.0, false, RISING_THRESHOLD, BUFFER)).toBe(
        true
      );
      expect(evaluateHysteresis(25.0, false, RISING_THRESHOLD, BUFFER)).toBe(
        true
      );
    });

    it('should stay TRUE when falling but still >= 17% (20 - 3)', () => {
      expect(evaluateHysteresis(20.0, true, RISING_THRESHOLD, BUFFER)).toBe(
        true
      );
      expect(evaluateHysteresis(18.5, true, RISING_THRESHOLD, BUFFER)).toBe(
        true
      );
      expect(evaluateHysteresis(17.0, true, RISING_THRESHOLD, BUFFER)).toBe(
        true
      );
    });

    it('should transition to FALSE when falling below 17%', () => {
      expect(evaluateHysteresis(16.9, true, RISING_THRESHOLD, BUFFER)).toBe(
        false
      );
      expect(evaluateHysteresis(10.0, true, RISING_THRESHOLD, BUFFER)).toBe(
        false
      );
      expect(evaluateHysteresis(0.0, true, RISING_THRESHOLD, BUFFER)).toBe(
        false
      );
    });
  });

  describe('CPU Frenzy Transition (Rising 60%, Falling 57% with 3% buffer)', () => {
    const RISING_THRESHOLD = 60;
    const BUFFER = 3;

    it('should stay FALSE when rising below 60%', () => {
      expect(evaluateHysteresis(56.9, false, RISING_THRESHOLD, BUFFER)).toBe(
        false
      );
      expect(evaluateHysteresis(57.0, false, RISING_THRESHOLD, BUFFER)).toBe(
        false
      );
      expect(evaluateHysteresis(59.9, false, RISING_THRESHOLD, BUFFER)).toBe(
        false
      );
    });

    it('should transition to TRUE when rising reaches or exceeds 60%', () => {
      expect(evaluateHysteresis(60.0, false, RISING_THRESHOLD, BUFFER)).toBe(
        true
      );
      expect(evaluateHysteresis(85.0, false, RISING_THRESHOLD, BUFFER)).toBe(
        true
      );
    });

    it('should stay TRUE when falling but still >= 57% (60 - 3)', () => {
      expect(evaluateHysteresis(60.0, true, RISING_THRESHOLD, BUFFER)).toBe(
        true
      );
      expect(evaluateHysteresis(58.0, true, RISING_THRESHOLD, BUFFER)).toBe(
        true
      );
      expect(evaluateHysteresis(57.0, true, RISING_THRESHOLD, BUFFER)).toBe(
        true
      );
    });

    it('should transition to FALSE when falling below 57%', () => {
      expect(evaluateHysteresis(56.9, true, RISING_THRESHOLD, BUFFER)).toBe(
        false
      );
      expect(evaluateHysteresis(50.0, true, RISING_THRESHOLD, BUFFER)).toBe(
        false
      );
    });
  });

  describe('Disk Activity Transition (Rising 75%, Falling 72% with 3% buffer)', () => {
    const RISING_THRESHOLD = 75;
    const BUFFER = 3;

    it('should stay FALSE when rising below 75%', () => {
      expect(evaluateHysteresis(71.9, false, RISING_THRESHOLD, BUFFER)).toBe(
        false
      );
      expect(evaluateHysteresis(72.0, false, RISING_THRESHOLD, BUFFER)).toBe(
        false
      );
      expect(evaluateHysteresis(74.9, false, RISING_THRESHOLD, BUFFER)).toBe(
        false
      );
    });

    it('should transition to TRUE when rising reaches or exceeds 75%', () => {
      expect(evaluateHysteresis(75.0, false, RISING_THRESHOLD, BUFFER)).toBe(
        true
      );
      expect(evaluateHysteresis(90.0, false, RISING_THRESHOLD, BUFFER)).toBe(
        true
      );
    });

    it('should stay TRUE when falling but still >= 72% (75 - 3)', () => {
      expect(evaluateHysteresis(75.0, true, RISING_THRESHOLD, BUFFER)).toBe(
        true
      );
      expect(evaluateHysteresis(73.5, true, RISING_THRESHOLD, BUFFER)).toBe(
        true
      );
      expect(evaluateHysteresis(72.0, true, RISING_THRESHOLD, BUFFER)).toBe(
        true
      );
    });

    it('should transition to FALSE when falling below 72%', () => {
      expect(evaluateHysteresis(71.9, true, RISING_THRESHOLD, BUFFER)).toBe(
        false
      );
      expect(evaluateHysteresis(50.0, true, RISING_THRESHOLD, BUFFER)).toBe(
        false
      );
    });
  });

  describe('Default buffer behavior', () => {
    it('should use default buffer of 3 when buffer parameter is omitted', () => {
      // Rising test with default buffer
      expect(evaluateHysteresis(20, false, 20)).toBe(true);
      expect(evaluateHysteresis(19.9, false, 20)).toBe(false);

      // Falling test with default buffer (20 - 3 = 17)
      expect(evaluateHysteresis(17, true, 20)).toBe(true);
      expect(evaluateHysteresis(16.9, true, 20)).toBe(false);
    });
  });
});
