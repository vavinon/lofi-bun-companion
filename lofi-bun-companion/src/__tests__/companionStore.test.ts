import { beforeEach, describe, expect, it } from 'vitest';
import { useCompanionStore } from '../stores/companionStore';
import type { CompanionMetadata } from '../types/companion';

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

    it('should initialize with forceRest as false, activeCompanionId as bun, and telemetryMode as MANUAL', () => {
      const state = useCompanionStore.getState();
      expect(state.forceRest).toBe(false);
      expect(state.activeCompanionId).toBe('bun');
      expect(state.telemetryMode).toBe('MANUAL');
    });

    it('should initialize with default desktop window configuration (COMPACT view, opacity 1.0, always-on-top true)', () => {
      const state = useCompanionStore.getState();
      expect(state.viewMode).toBe('COMPACT');
      expect(state.windowOpacity).toBe(1.0);
      expect(state.isAlwaysOnTop).toBe(true);
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
      store.setActiveCompanionId('neko');

      expect(useCompanionStore.getState().activeCompanionId).toBe('neko');
    });
  });

  describe('Desktop Window State Actions', () => {
    it('should update viewMode via setViewMode', () => {
      const store = useCompanionStore.getState();
      expect(store.viewMode).toBe('COMPACT');

      store.setViewMode('FULL');
      expect(useCompanionStore.getState().viewMode).toBe('FULL');

      store.setViewMode('COMPACT');
      expect(useCompanionStore.getState().viewMode).toBe('COMPACT');
    });

    it('should toggle viewMode between FULL and COMPACT via toggleViewMode', () => {
      const store = useCompanionStore.getState();
      expect(store.viewMode).toBe('COMPACT');

      store.toggleViewMode();
      expect(useCompanionStore.getState().viewMode).toBe('FULL');

      store.toggleViewMode();
      expect(useCompanionStore.getState().viewMode).toBe('COMPACT');
    });

    it('should update windowOpacity with clamping within [0.4, 1.0]', () => {
      const store = useCompanionStore.getState();

      store.setWindowOpacity(0.85);
      expect(useCompanionStore.getState().windowOpacity).toBe(0.85);

      // Clamp upper bound
      store.setWindowOpacity(1.5);
      expect(useCompanionStore.getState().windowOpacity).toBe(1.0);

      // Clamp lower bound
      store.setWindowOpacity(0.1);
      expect(useCompanionStore.getState().windowOpacity).toBe(0.4);
    });

    it('should update isAlwaysOnTop via setAlwaysOnTop and toggleAlwaysOnTop', () => {
      const store = useCompanionStore.getState();
      expect(store.isAlwaysOnTop).toBe(true);

      store.setAlwaysOnTop(false);
      expect(useCompanionStore.getState().isAlwaysOnTop).toBe(false);

      store.toggleAlwaysOnTop();
      expect(useCompanionStore.getState().isAlwaysOnTop).toBe(true);

      store.toggleAlwaysOnTop();
      expect(useCompanionStore.getState().isAlwaysOnTop).toBe(false);
    });
  });

  describe('resetToDefaults Action', () => {
    it('should reset all state, telemetryMode, desktop window options, and metrics back to initial defaults', () => {
      const store = useCompanionStore.getState();
      store.setMetrics({ cpuUsage: 95, ramUsage: 92, diskUsage: 85 });
      store.setTelemetryMode('LIVE');
      store.setForceRest(true);
      store.setActiveCompanionId('shiba');
      store.setViewMode('FULL');
      store.setWindowOpacity(0.5);
      store.setAlwaysOnTop(false);

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
      expect(state.activeCompanionId).toBe('bun');
      expect(state.resolvedState.activeState).toBe('IDLE');
      expect(state.resolvedState.isHeavyRam).toBe(false);
      expect(state.viewMode).toBe('COMPACT');
      expect(state.windowOpacity).toBe(1.0);
      expect(state.isAlwaysOnTop).toBe(true);
    });
  });

  describe('useActiveCompanionMetadata Selector', () => {
    it('should retrieve metadata for active companion reactively', async () => {
      const React = await import('react');
      const { act } = React;
      const { createRoot } = await import('react-dom/client');
      const { useActiveCompanionMetadata } =
        await import('../stores/companionStore');

      const holder: { current: CompanionMetadata | null } = { current: null };
      const TestComponent: React.FC = () => {
        const metadata = useActiveCompanionMetadata();
        React.useEffect(() => {
          holder.current = metadata;
        });
        return null;
      };

      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);

      await act(async () => {
        root.render(React.createElement(TestComponent));
      });

      expect(holder.current).not.toBeNull();
      expect(holder.current?.id).toBe('bun');
      expect(holder.current?.displayName).toBe('Lo-fi Bun');
      expect(holder.current?.emoji).toBe('🐰');

      // Switch companion to capybara
      await act(async () => {
        useCompanionStore.getState().setActiveCompanionId('capybara');
      });

      expect(holder.current?.id).toBe('capybara');
      expect(holder.current?.displayName).toBe('Onsen Capybara');
      expect(holder.current?.emoji).toBe('🍊');

      await act(async () => {
        root.unmount();
      });
      container.remove();
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
