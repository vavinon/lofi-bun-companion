import { beforeEach, describe, expect, it } from 'vitest';
import { useCompanionStore } from '../stores/companionStore';

describe('companionStore (Zustand State Store)', () => {
  beforeEach(() => {
    // Reset store to default state before each test run
    useCompanionStore.getState().resetToDefaults();
  });

  describe('Initial State', () => {
    it('should initialize with default hardware metrics (cpu 10%, ram 30%, disk 5%)', () => {
      const state = useCompanionStore.getState();
      expect(state.metrics).toEqual({
        cpuUsage: 10,
        ramUsage: 30,
        diskUsage: 5,
      });
    });

    it('should initialize with forceRest as false, activeCompanionId as bun-01, and telemetryMode as MANUAL', () => {
      const state = useCompanionStore.getState();
      expect(state.forceRest).toBe(false);
      expect(state.activeCompanionId).toBe('bun-01');
      expect(state.telemetryMode).toBe('MANUAL');
    });

    it('should initialize with resolvedState reflecting default metrics (IDLE, not heavy RAM)', () => {
      const { resolvedState } = useCompanionStore.getState();
      expect(resolvedState.activeState).toBe('IDLE');
      expect(resolvedState.isHeavyRam).toBe(false);
      expect(typeof resolvedState.timestamp).toBe('number');
    });
  });

  describe('setMetrics Action & State Resolution', () => {
    it('should update partial metrics and recalculate resolvedState', () => {
      const store = useCompanionStore.getState();

      // Transition CPU to 45% (FOCUS state)
      store.setMetrics({ cpuUsage: 45 });

      const state = useCompanionStore.getState();
      expect(state.metrics.cpuUsage).toBe(45);
      expect(state.metrics.ramUsage).toBe(30); // preserved
      expect(state.metrics.diskUsage).toBe(5); // preserved
      expect(state.resolvedState.activeState).toBe('FOCUS');
      expect(state.resolvedState.isHeavyRam).toBe(false);
    });

    it('should transition to FRENZY when CPU exceeds 60%', () => {
      useCompanionStore.getState().setMetrics({ cpuUsage: 85 });

      const state = useCompanionStore.getState();
      expect(state.resolvedState.activeState).toBe('FRENZY');
    });

    it('should transition to DISK when Disk exceeds 75% even under moderate CPU load', () => {
      useCompanionStore.getState().setMetrics({ cpuUsage: 30, diskUsage: 80 });

      const state = useCompanionStore.getState();
      expect(state.resolvedState.activeState).toBe('DISK');
    });

    it('should toggle isHeavyRam flag when RAM exceeds 80%', () => {
      useCompanionStore.getState().setMetrics({ ramUsage: 88 });

      const state = useCompanionStore.getState();
      expect(state.resolvedState.isHeavyRam).toBe(true);

      // Drops below 80%
      useCompanionStore.getState().setMetrics({ ramUsage: 75 });
      expect(useCompanionStore.getState().resolvedState.isHeavyRam).toBe(false);
    });

    it('should apply hysteresis smoothing when transitioning states', () => {
      const store = useCompanionStore.getState();

      // Rise to FRENZY (>= 60%)
      store.setMetrics({ cpuUsage: 65 });
      expect(useCompanionStore.getState().resolvedState.activeState).toBe(
        'FRENZY'
      );

      // Falling edge: 58% stays in FRENZY because falling threshold is 57%
      store.setMetrics({ cpuUsage: 58 });
      expect(useCompanionStore.getState().resolvedState.activeState).toBe(
        'FRENZY'
      );

      // Falling below 57% drops back to FOCUS
      store.setMetrics({ cpuUsage: 55 });
      expect(useCompanionStore.getState().resolvedState.activeState).toBe(
        'FOCUS'
      );
    });
  });

  describe('setTelemetryMode Action', () => {
    it('should update telemetryMode to LIVE and back to MANUAL', () => {
      const store = useCompanionStore.getState();
      expect(store.telemetryMode).toBe('MANUAL');

      store.setTelemetryMode('LIVE');
      expect(useCompanionStore.getState().telemetryMode).toBe('LIVE');

      store.setTelemetryMode('MANUAL');
      expect(useCompanionStore.getState().telemetryMode).toBe('MANUAL');
    });
  });

  describe('setForceRest Action', () => {
    it('should override active state to REST when forceRest is set to true', () => {
      const store = useCompanionStore.getState();
      store.setMetrics({ cpuUsage: 90, diskUsage: 90 }); // High workload
      expect(useCompanionStore.getState().resolvedState.activeState).toBe(
        'DISK'
      );

      store.setForceRest(true);

      const state = useCompanionStore.getState();
      expect(state.forceRest).toBe(true);
      expect(state.resolvedState.activeState).toBe('REST');
    });

    it('should restore normal state calculation when forceRest is toggled back to false', () => {
      const store = useCompanionStore.getState();
      store.setMetrics({ cpuUsage: 50 });
      store.setForceRest(true);
      expect(useCompanionStore.getState().resolvedState.activeState).toBe(
        'REST'
      );

      store.setForceRest(false);

      const state = useCompanionStore.getState();
      expect(state.forceRest).toBe(false);
      expect(state.resolvedState.activeState).toBe('FOCUS');
    });
  });

  describe('setActiveCompanionId Action', () => {
    it('should switch active companion id', () => {
      const store = useCompanionStore.getState();
      store.setActiveCompanionId('cat-02');

      expect(useCompanionStore.getState().activeCompanionId).toBe('cat-02');
    });
  });

  describe('resetToDefaults Action', () => {
    it('should reset all state, telemetryMode, and metrics back to initial defaults', () => {
      const store = useCompanionStore.getState();
      store.setMetrics({ cpuUsage: 95, ramUsage: 92, diskUsage: 85 });
      store.setTelemetryMode('LIVE');
      store.setForceRest(true);
      store.setActiveCompanionId('fox-03');

      // Reset
      store.resetToDefaults();

      const state = useCompanionStore.getState();
      expect(state.metrics).toEqual({
        cpuUsage: 10,
        ramUsage: 30,
        diskUsage: 5,
      });
      expect(state.telemetryMode).toBe('MANUAL');
      expect(state.forceRest).toBe(false);
      expect(state.activeCompanionId).toBe('bun-01');
      expect(state.resolvedState.activeState).toBe('IDLE');
      expect(state.resolvedState.isHeavyRam).toBe(false);
    });
  });

  describe('Selective Subscription & State Isolation', () => {
    it('should allow discrete state slice subscriptions', () => {
      let activeStateCount = 0;
      let lastActiveState = '';

      // Subscribe specifically to activeState slice
      const unsubscribe = useCompanionStore.subscribe(
        (state) => state.resolvedState.activeState,
        (activeState) => {
          activeStateCount++;
          lastActiveState = activeState;
        }
      );

      // Update RAM only without changing CPU/activeState (activeState should remain IDLE)
      useCompanionStore.getState().setMetrics({ ramUsage: 50 });
      expect(activeStateCount).toBe(0);
      expect(lastActiveState).toBe('');

      // Update CPU to 50% which transitions activeState from IDLE to FOCUS
      useCompanionStore.getState().setMetrics({ cpuUsage: 50 });
      expect(activeStateCount).toBe(1);
      expect(lastActiveState).toBe('FOCUS');

      unsubscribe();
    });
  });
});
