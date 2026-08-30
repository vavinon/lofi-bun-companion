import { describe, it, expect, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { App } from '../App';
import { useCompanionStore } from '../stores/companionStore';

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

describe('App Showcase Container Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useCompanionStore.getState().resetToDefaults();

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  const renderComponent = async () => {
    await act(async () => {
      root.render(<App />);
    });
  };

  const cleanup = async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  };

  it('renders CompactMascotView directly as default on app startup', async () => {
    await renderComponent();

    expect(
      container.querySelector('[data-testid="app-compact-root"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="compact-mascot-view"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="compact-pet-stage"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="compact-floating-hud"]')
    ).not.toBeNull();

    await cleanup();
  });

  it('renders all core showcase elements and headers correctly in FULL viewMode', async () => {
    useCompanionStore.getState().setViewMode('FULL');
    await renderComponent();

    // Verify Title and Subtitle
    expect(container.textContent).toContain('Lo-fi Bun Companion');
    expect(container.textContent).toContain('v1.0.0 • Desktop Mascot Edition');
    expect(container.textContent).toContain('Pet: BUN (Flagship)');

    // Verify View Mode Button in Full View
    const viewModeBtn = container.querySelector(
      '[data-testid="view-mode-toggle-btn"]'
    );
    expect(viewModeBtn).not.toBeNull();
    expect(viewModeBtn?.textContent).toContain('Mascot View');

    // Verify Telemetry HUD Badges
    const modeBadge = container.querySelector(
      '[data-testid="telemetry-mode-badge"]'
    );
    const providerBadge = container.querySelector(
      '[data-testid="telemetry-provider-badge"]'
    );
    const statusBadge = container.querySelector(
      '[data-testid="telemetry-status-badge"]'
    );

    expect(modeBadge).not.toBeNull();
    expect(modeBadge?.textContent).toContain('MANUAL');
    expect(providerBadge).not.toBeNull();
    expect(providerBadge?.textContent).toMatch(
      /(Native|Web|Simulation|Provider)/i
    );
    expect(statusBadge).not.toBeNull();

    // Verify Stage & HUD
    const stateBadge = container.querySelector(
      '[data-testid="active-state-badge"]'
    );
    const ramIndicator = container.querySelector(
      '[data-testid="ram-prop-indicator"]'
    );
    const petSprite = container.querySelector(
      '[data-testid="pet-sprite-wrapper"]'
    );

    expect(stateBadge).not.toBeNull();
    expect(stateBadge?.textContent).toContain('IDLE');
    expect(ramIndicator?.textContent).toContain('RAM Prop: Normal');
    expect(petSprite).not.toBeNull();

    // Verify Performance HUD
    expect(container.textContent).toContain(
      'Pure CSS GPU Step Animation (0.0% CPU)'
    );

    await cleanup();
  });

  it('switches between COMPACT and FULL viewModes seamlessly', async () => {
    useCompanionStore.getState().setViewMode('FULL');
    await renderComponent();

    // Verify initially in FULL view
    expect(
      container.querySelector('[data-testid="app-full-root"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="compact-mascot-view"]')
    ).toBeNull();

    // Click Mascot View button
    const viewModeBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="view-mode-toggle-btn"]'
    );
    expect(viewModeBtn).not.toBeNull();

    await act(async () => {
      viewModeBtn?.click();
    });

    // Verify now rendering Compact Mascot View
    expect(
      container.querySelector('[data-testid="app-compact-root"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="compact-mascot-view"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="compact-floating-hud"]')
    ).not.toBeNull();

    // Switch back to FULL view via store action
    await act(async () => {
      useCompanionStore.getState().setViewMode('FULL');
    });

    expect(
      container.querySelector('[data-testid="app-full-root"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="compact-mascot-view"]')
    ).toBeNull();

    await cleanup();
  });

  it('updates Stage HUD and PetSprite when hardware sliders change', async () => {
    useCompanionStore.getState().setViewMode('FULL');
    await renderComponent();

    // Find CPU slider
    const cpuInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="CPU Usage Percentage"]'
    )!;

    // Simulate CPU = 85% (FRENZY state)
    await act(async () => {
      setNativeInputValue(cpuInput, '85');
    });

    const stateBadge = container.querySelector(
      '[data-testid="active-state-badge"]'
    );
    expect(stateBadge?.textContent).toContain('FRENZY');

    const petSprite = container.querySelector(
      '[data-testid="pet-sprite-wrapper"]'
    );
    expect(petSprite?.getAttribute('data-state')).toBe('FRENZY');

    await cleanup();
  });

  it('updates RAM Prop indicator and renders Carrot overlay on high RAM', async () => {
    useCompanionStore.getState().setViewMode('FULL');
    await renderComponent();

    const ramInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="RAM Usage Percentage"]'
    )!;

    // Simulate RAM = 92% (>80% Heavy RAM)
    await act(async () => {
      setNativeInputValue(ramInput, '92');
    });

    const ramIndicator = container.querySelector(
      '[data-testid="ram-prop-indicator"]'
    );
    expect(ramIndicator?.textContent).toContain('Carrots Stack');

    const carrotProp = container.querySelector(
      '[data-testid="carrot-prop-layer"]'
    );
    expect(carrotProp).not.toBeNull();

    await cleanup();
  });

  it('switches to REST mode and updates HUD when toggle switch is clicked', async () => {
    useCompanionStore.getState().setViewMode('FULL');
    await renderComponent();

    const restToggle = container.querySelector<HTMLInputElement>(
      'input[aria-label="Toggle Force Rest Mode"]'
    )!;

    await act(async () => {
      restToggle.click();
    });

    const stateBadge = container.querySelector(
      '[data-testid="active-state-badge"]'
    );
    expect(stateBadge?.textContent).toContain('REST');

    const petSprite = container.querySelector(
      '[data-testid="pet-sprite-wrapper"]'
    );
    expect(petSprite?.getAttribute('data-state')).toBe('REST');

    await cleanup();
  });

  it('updates Telemetry HUD when switching to LIVE mode via controller', async () => {
    useCompanionStore.getState().setViewMode('FULL');
    await renderComponent();

    const liveBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="mode-btn-live"]'
    );
    expect(liveBtn).not.toBeNull();

    await act(async () => {
      liveBtn?.click();
    });

    const modeBadge = container.querySelector(
      '[data-testid="telemetry-mode-badge"]'
    );
    expect(modeBadge?.textContent).toContain('LIVE');

    await cleanup();
  });
});
