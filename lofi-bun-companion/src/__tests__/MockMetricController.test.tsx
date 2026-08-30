import { describe, it, expect, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MockMetricController } from '../components/Controls/MockMetricController';
import { useCompanionStore, DEFAULT_METRICS } from '../stores/companionStore';

// Enable React act environment in JSDOM
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Helper to dispatch simulated input value change to React controlled inputs in JSDOM.
 */
function setNativeInputValue(element: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;
  valueSetter?.call(element, value);
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('MockMetricController Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    // Reset Zustand store state before each test
    useCompanionStore.getState().resetToDefaults();
    useCompanionStore.getState().setTelemetryMode('MANUAL');

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  const renderComponent = async () => {
    await act(async () => {
      root.render(<MockMetricController />);
    });
  };

  const cleanup = async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  };

  it('renders default metrics and controls correctly', async () => {
    await renderComponent();

    const cpuInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="CPU Usage Percentage"]'
    );
    const ramInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="RAM Usage Percentage"]'
    );
    const diskInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="Disk Usage Percentage"]'
    );
    const restToggle = container.querySelector<HTMLInputElement>(
      'input[aria-label="Toggle Force Rest Mode"]'
    );

    expect(cpuInput).not.toBeNull();
    expect(Number(cpuInput?.value)).toBe(DEFAULT_METRICS.cpuUsage);

    expect(ramInput).not.toBeNull();
    expect(Number(ramInput?.value)).toBe(DEFAULT_METRICS.ramUsage);

    expect(diskInput).not.toBeNull();
    expect(Number(diskInput?.value)).toBe(DEFAULT_METRICS.diskUsage);

    expect(restToggle).not.toBeNull();
    expect(restToggle?.checked).toBe(false);

    await cleanup();
  });

  it('updates CPU metric on slider input change', async () => {
    await renderComponent();

    const cpuInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="CPU Usage Percentage"]'
    )!;

    await act(async () => {
      setNativeInputValue(cpuInput, '75');
    });

    expect(useCompanionStore.getState().metrics.cpuUsage).toBe(75);
    expect(useCompanionStore.getState().resolvedState.activeState).toBe(
      'FRENZY'
    );

    await cleanup();
  });

  it('updates RAM metric and shows Carrot indicator when >80%', async () => {
    await renderComponent();

    const ramInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="RAM Usage Percentage"]'
    )!;

    await act(async () => {
      setNativeInputValue(ramInput, '85');
    });

    expect(useCompanionStore.getState().metrics.ramUsage).toBe(85);
    expect(useCompanionStore.getState().resolvedState.isHeavyRam).toBe(true);
    expect(container.textContent).toContain('Carrots Stack');

    await cleanup();
  });

  it('updates Disk metric and shows Book Flipping indicator when >75%', async () => {
    await renderComponent();

    const diskInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="Disk Usage Percentage"]'
    )!;

    await act(async () => {
      setNativeInputValue(diskInput, '80');
    });

    expect(useCompanionStore.getState().metrics.diskUsage).toBe(80);
    expect(useCompanionStore.getState().resolvedState.activeState).toBe('DISK');
    expect(container.textContent).toContain('Book Flipping');

    await cleanup();
  });

  it('toggles Rest Mode override switch', async () => {
    await renderComponent();

    const restToggle = container.querySelector<HTMLInputElement>(
      'input[aria-label="Toggle Force Rest Mode"]'
    )!;

    await act(async () => {
      restToggle.click();
    });

    expect(useCompanionStore.getState().forceRest).toBe(true);
    expect(useCompanionStore.getState().resolvedState.activeState).toBe('REST');

    await cleanup();
  });

  it('resets all metrics to default on Reset button click', async () => {
    await act(async () => {
      useCompanionStore.getState().setMetrics({
        cpuUsage: 90,
        ramUsage: 95,
        diskUsage: 85,
      });
      useCompanionStore.getState().setForceRest(true);
    });

    await renderComponent();

    const resetBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Reset metrics to default values"]'
    )!;

    await act(async () => {
      resetBtn.click();
    });

    expect(useCompanionStore.getState().metrics).toEqual(DEFAULT_METRICS);
    expect(useCompanionStore.getState().forceRest).toBe(false);
    expect(useCompanionStore.getState().resolvedState.activeState).toBe('IDLE');

    await cleanup();
  });

  it('switches between MANUAL and LIVE telemetry modes and locks sliders', async () => {
    await renderComponent();

    const manualBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="mode-btn-manual"]'
    );
    const liveBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="mode-btn-live"]'
    );
    const cpuInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="CPU Usage Percentage"]'
    )!;
    const ramInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="RAM Usage Percentage"]'
    )!;
    const diskInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="Disk Usage Percentage"]'
    )!;

    expect(manualBtn).not.toBeNull();
    expect(liveBtn).not.toBeNull();
    expect(cpuInput.disabled).toBe(false);
    expect(ramInput.disabled).toBe(false);
    expect(diskInput.disabled).toBe(false);
    expect(
      container.querySelector('[data-testid="live-telemetry-banner"]')
    ).toBeNull();

    // Switch to LIVE mode
    await act(async () => {
      liveBtn?.click();
    });

    expect(useCompanionStore.getState().telemetryMode).toBe('LIVE');
    expect(cpuInput.disabled).toBe(true);
    expect(ramInput.disabled).toBe(true);
    expect(diskInput.disabled).toBe(true);
    expect(
      container.querySelector('[data-testid="live-telemetry-banner"]')
    ).not.toBeNull();

    // Switch back to MANUAL mode
    await act(async () => {
      manualBtn?.click();
    });

    expect(useCompanionStore.getState().telemetryMode).toBe('MANUAL');
    expect(cpuInput.disabled).toBe(false);
    expect(ramInput.disabled).toBe(false);
    expect(diskInput.disabled).toBe(false);
    expect(
      container.querySelector('[data-testid="live-telemetry-banner"]')
    ).toBeNull();

    await cleanup();
  });

  it('reactively syncs when external store changes occur', async () => {
    await renderComponent();

    const cpuInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="CPU Usage Percentage"]'
    )!;

    await act(async () => {
      useCompanionStore.getState().setMetrics({ cpuUsage: 45 });
    });

    expect(cpuInput.value).toBe('45');
    expect(container.textContent).toContain('FOCUS (20-60%)');

    await cleanup();
  });
});
