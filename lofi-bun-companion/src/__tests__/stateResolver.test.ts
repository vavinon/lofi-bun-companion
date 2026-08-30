import { describe, expect, it } from 'vitest';
import {
  CompanionState,
  HardwareMetrics,
  ResolvedCompanionState,
} from '../types/companion';
import { resolveCompanionState } from '../utils/stateResolver';

describe('resolveCompanionState', () => {
  const defaultMetrics: HardwareMetrics = {
    cpuUsage: 10,
    ramUsage: 30,
    diskUsage: 5,
  };

  describe('Priority 1: Force Rest Override', () => {
    it('should resolve to REST when forceRest is true, even during high CPU and Disk load', () => {
      const highLoadMetrics: HardwareMetrics = {
        cpuUsage: 99,
        ramUsage: 90,
        diskUsage: 95,
      };

      const result: ResolvedCompanionState = resolveCompanionState({
        metrics: highLoadMetrics,
        previousState: 'FRENZY',
        forceRest: true,
      });

      expect(result.activeState).toBe('REST');
      expect(result.isHeavyRam).toBe(true);
    });

    it('should resolve to REST when idle and forceRest is activated', () => {
      const result = resolveCompanionState({
        metrics: defaultMetrics,
        forceRest: true,
      });

      expect(result.activeState).toBe('REST');
      expect(result.isHeavyRam).toBe(false);
    });
  });

  describe('Priority 2: High Disk I/O Activity', () => {
    it('should transition to DISK when diskUsage reaches >= 75%', () => {
      const diskHeavyMetrics: HardwareMetrics = {
        cpuUsage: 40,
        ramUsage: 50,
        diskUsage: 75,
      };

      const result = resolveCompanionState({
        metrics: diskHeavyMetrics,
        previousState: 'FOCUS',
        forceRest: false,
      });

      expect(result.activeState).toBe('DISK');
    });

    it('should take priority over FRENZY CPU load when DISK threshold is met', () => {
      const extremeMetrics: HardwareMetrics = {
        cpuUsage: 95,
        ramUsage: 50,
        diskUsage: 80,
      };

      const result = resolveCompanionState({
        metrics: extremeMetrics,
        previousState: 'IDLE',
      });

      expect(result.activeState).toBe('DISK');
    });

    it('should stay in DISK state with hysteresis until diskUsage drops below 72%', () => {
      // Still >= 72% falling edge
      const fallingResult = resolveCompanionState({
        metrics: { cpuUsage: 10, ramUsage: 50, diskUsage: 72 },
        previousState: 'DISK',
      });
      expect(fallingResult.activeState).toBe('DISK');

      // Drops below 72%
      const dropResult = resolveCompanionState({
        metrics: { cpuUsage: 10, ramUsage: 50, diskUsage: 71.9 },
        previousState: 'DISK',
      });
      expect(dropResult.activeState).toBe('IDLE');
    });
  });

  describe('Priority 3: CPU Workload (FRENZY / FOCUS / IDLE)', () => {
    it('should resolve to IDLE when CPU < 20%', () => {
      const result = resolveCompanionState({
        metrics: { cpuUsage: 19.9, ramUsage: 40, diskUsage: 10 },
        previousState: 'IDLE',
      });

      expect(result.activeState).toBe('IDLE');
    });

    it('should transition from IDLE to FOCUS when CPU >= 20%', () => {
      const result = resolveCompanionState({
        metrics: { cpuUsage: 20, ramUsage: 40, diskUsage: 10 },
        previousState: 'IDLE',
      });

      expect(result.activeState).toBe('FOCUS');
    });

    it('should maintain FOCUS until CPU drops below 17% (Hysteresis)', () => {
      const sustainFocus = resolveCompanionState({
        metrics: { cpuUsage: 17.0, ramUsage: 40, diskUsage: 10 },
        previousState: 'FOCUS',
      });
      expect(sustainFocus.activeState).toBe('FOCUS');

      const dropToIdle = resolveCompanionState({
        metrics: { cpuUsage: 16.9, ramUsage: 40, diskUsage: 10 },
        previousState: 'FOCUS',
      });
      expect(dropToIdle.activeState).toBe('IDLE');
    });

    it('should transition from FOCUS to FRENZY when CPU >= 60%', () => {
      const result = resolveCompanionState({
        metrics: { cpuUsage: 60.0, ramUsage: 40, diskUsage: 10 },
        previousState: 'FOCUS',
      });

      expect(result.activeState).toBe('FRENZY');
    });

    it('should maintain FRENZY until CPU drops below 57% (Hysteresis)', () => {
      const sustainFrenzy = resolveCompanionState({
        metrics: { cpuUsage: 57.0, ramUsage: 40, diskUsage: 10 },
        previousState: 'FRENZY',
      });
      expect(sustainFrenzy.activeState).toBe('FRENZY');

      const dropToFocus = resolveCompanionState({
        metrics: { cpuUsage: 56.9, ramUsage: 40, diskUsage: 10 },
        previousState: 'FRENZY',
      });
      expect(dropToFocus.activeState).toBe('FOCUS');
    });

    it('should transition directly from FRENZY to IDLE if CPU crashes below 17%', () => {
      const crashToIdle = resolveCompanionState({
        metrics: { cpuUsage: 10.0, ramUsage: 40, diskUsage: 10 },
        previousState: 'FRENZY',
      });

      expect(crashToIdle.activeState).toBe('IDLE');
    });
  });

  describe('Independent RAM Heavy Prop Layer', () => {
    it('should set isHeavyRam to true when ramUsage > 80%', () => {
      const result = resolveCompanionState({
        metrics: { cpuUsage: 10, ramUsage: 80.1, diskUsage: 10 },
      });

      expect(result.isHeavyRam).toBe(true);
    });

    it('should set isHeavyRam to false when ramUsage <= 80%', () => {
      const atBoundary = resolveCompanionState({
        metrics: { cpuUsage: 10, ramUsage: 80.0, diskUsage: 10 },
      });
      expect(atBoundary.isHeavyRam).toBe(false);

      const belowBoundary = resolveCompanionState({
        metrics: { cpuUsage: 10, ramUsage: 79.9, diskUsage: 10 },
      });
      expect(belowBoundary.isHeavyRam).toBe(false);
    });

    it('should apply isHeavyRam across all active states', () => {
      const states: CompanionState[] = [
        'IDLE',
        'FOCUS',
        'FRENZY',
        'DISK',
        'REST',
      ];

      states.forEach((state) => {
        const result = resolveCompanionState({
          metrics: { cpuUsage: 10, ramUsage: 85, diskUsage: 10 },
          previousState: state,
          forceRest: state === 'REST',
        });
        expect(result.isHeavyRam).toBe(true);
      });
    });
  });

  describe('Timestamp and Default Values', () => {
    it('should use provided timestamp or default to current time', () => {
      const fixedTime = 1756540000000;
      const resultWithFixedTime = resolveCompanionState(
        { metrics: defaultMetrics },
        fixedTime
      );
      expect(resultWithFixedTime.timestamp).toBe(fixedTime);

      const before = Date.now();
      const resultWithDefaultTime = resolveCompanionState({
        metrics: defaultMetrics,
      });
      const after = Date.now();

      expect(resultWithDefaultTime.timestamp).toBeGreaterThanOrEqual(before);
      expect(resultWithDefaultTime.timestamp).toBeLessThanOrEqual(after);
    });

    it('should handle undefined previousState safely as IDLE base', () => {
      const result = resolveCompanionState({
        metrics: defaultMetrics,
      });

      expect(result.activeState).toBe('IDLE');
    });
  });
});
