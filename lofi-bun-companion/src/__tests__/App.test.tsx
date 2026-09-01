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
    expect(container.textContent).toContain('v2.0.0 • Focus Suite');
    expect(container.textContent).toContain('Pet: LO-FI BUN (Flagship)');

    // Verify View Mode Button in Full View
    const viewModeBtn = container.querySelector(
      '[data-testid="view-mode-toggle-btn"]'
    );
    expect(viewModeBtn).not.toBeNull();
    expect(viewModeBtn?.textContent).toContain('Mascot View');

    // Verify Pomodoro Focus Suite Button in Full View
    const pomodoroBtn = container.querySelector(
      '[data-testid="btn-open-pomodoro-modal"]'
    );
    expect(pomodoroBtn).not.toBeNull();
    expect(pomodoroBtn?.textContent).toContain('Focus Suite');

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
    expect(modeBadge?.textContent).toContain('LIVE');
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
    expect(stateBadge?.textContent).toMatch(/(IDLE|FOCUS|FRENZY|DISK|REST)/);
    expect(ramIndicator).not.toBeNull();
    expect(petSprite).not.toBeNull();

    // Verify Performance HUD
    expect(container.textContent).toContain(
      'Pure CSS GPU Step Animation (0.0% CPU)'
    );

    await cleanup();
  });

  it('renders Multiverse Character Selector Ribbon and switches characters on card click', async () => {
    useCompanionStore.getState().setViewMode('FULL');
    await renderComponent();

    const ribbon = container.querySelector(
      '[data-testid="character-selector-ribbon"]'
    );
    expect(ribbon).not.toBeNull();

    const bunCard = container.querySelector(
      '[data-testid="character-card-bun"]'
    );
    const nekoCard = container.querySelector(
      '[data-testid="character-card-neko"]'
    );
    const capyCard = container.querySelector(
      '[data-testid="character-card-capybara"]'
    );
    const cockatielCard = container.querySelector(
      '[data-testid="character-card-cockatiel"]'
    );
    const dolphinCard = container.querySelector(
      '[data-testid="character-card-dolphin"]'
    );

    expect(bunCard).not.toBeNull();
    expect(nekoCard).not.toBeNull();
    expect(capyCard).not.toBeNull();
    expect(cockatielCard).not.toBeNull();
    expect(dolphinCard).not.toBeNull();

    // Verify initial active state on Bun
    expect(bunCard?.getAttribute('aria-pressed')).toBe('true');
    expect(nekoCard?.getAttribute('aria-pressed')).toBe('false');

    // Click DJ Cockatiel card
    await act(async () => {
      cockatielCard?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(useCompanionStore.getState().activeCompanionId).toBe('cockatiel');
    expect(cockatielCard?.getAttribute('aria-pressed')).toBe('true');
    expect(bunCard?.getAttribute('aria-pressed')).toBe('false');

    // Click Wave Dolphin card
    await act(async () => {
      dolphinCard?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(useCompanionStore.getState().activeCompanionId).toBe('dolphin');
    expect(dolphinCard?.getAttribute('aria-pressed')).toBe('true');

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
    useCompanionStore.getState().setTelemetryMode('MANUAL');
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
    useCompanionStore.getState().setTelemetryMode('MANUAL');
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
      '[data-testid="companion-prop-layer"], [data-testid="carrot-prop-layer"]'
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

  it('updates Telemetry HUD when switching to MANUAL mode via controller', async () => {
    useCompanionStore.getState().setViewMode('FULL');
    await renderComponent();

    const manualBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="mode-btn-manual"]'
    );
    expect(manualBtn).not.toBeNull();

    await act(async () => {
      manualBtn?.click();
    });

    const modeBadge = container.querySelector(
      '[data-testid="telemetry-mode-badge"]'
    );
    expect(modeBadge?.textContent).toContain('MANUAL');

    await cleanup();
  });

  it('renders all 6 multiverse character cards in ribbon and switches active companion on click', async () => {
    useCompanionStore.getState().setViewMode('FULL');
    await renderComponent();

    const ribbon = container.querySelector(
      '[data-testid="character-selector-ribbon"]'
    );
    expect(ribbon).not.toBeNull();

    // Check all 6 character cards exist
    const bunCard = container.querySelector(
      '[data-testid="character-card-bun"]'
    );
    const nekoCard = container.querySelector(
      '[data-testid="character-card-neko"]'
    );
    const shibaCard = container.querySelector(
      '[data-testid="character-card-shiba"]'
    );
    const capyCard = container.querySelector(
      '[data-testid="character-card-capybara"]'
    );
    const tielCard = container.querySelector(
      '[data-testid="character-card-cockatiel"]'
    );
    const dolphinCard = container.querySelector(
      '[data-testid="character-card-dolphin"]'
    );

    expect(bunCard).not.toBeNull();
    expect(nekoCard).not.toBeNull();
    expect(shibaCard).not.toBeNull();
    expect(capyCard).not.toBeNull();
    expect(tielCard).not.toBeNull();
    expect(dolphinCard).not.toBeNull();

    // Initial state: bun selected
    expect(bunCard?.getAttribute('aria-pressed')).toBe('true');
    expect(shibaCard?.getAttribute('aria-pressed')).toBe('false');

    // Click Shiba Card
    await act(async () => {
      shibaCard?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(useCompanionStore.getState().activeCompanionId).toBe('shiba');
    expect(shibaCard?.getAttribute('aria-pressed')).toBe('true');
    expect(bunCard?.getAttribute('aria-pressed')).toBe('false');
    expect(container.textContent).toContain('BAKERY SHIBA');

    // Click Wave Dolphin Card
    await act(async () => {
      dolphinCard?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(useCompanionStore.getState().activeCompanionId).toBe('dolphin');
    expect(dolphinCard?.getAttribute('aria-pressed')).toBe('true');
    expect(shibaCard?.getAttribute('aria-pressed')).toBe('false');
    expect(container.textContent).toContain('WAVE DOLPHIN');

    await cleanup();
  });

  it('opens and closes Pomodoro Focus Suite modal in FULL view mode', async () => {
    useCompanionStore.getState().setViewMode('FULL');
    await renderComponent();

    // Verify modal is not rendered initially
    expect(
      container.querySelector('[data-testid="pomodoro-modal"]')
    ).toBeNull();

    // Click Focus Suite button in header
    const pomodoroBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="btn-open-pomodoro-modal"]'
    );
    expect(pomodoroBtn).not.toBeNull();

    await act(async () => {
      pomodoroBtn?.click();
    });

    // Modal should now be open
    expect(
      container.querySelector('[data-testid="pomodoro-modal"]')
    ).not.toBeNull();

    // Close modal via close button
    const closeBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="btn-close-pomodoro-modal"]'
    );
    expect(closeBtn).not.toBeNull();

    await act(async () => {
      closeBtn?.click();
    });

    expect(
      container.querySelector('[data-testid="pomodoro-modal"]')
    ).toBeNull();

    // Double click stage card should also open modal
    const stageCard = container.querySelector<HTMLElement>(
      '[aria-label="Pet Stage Viewport"]'
    );
    expect(stageCard).not.toBeNull();

    await act(async () => {
      stageCard?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    });

    expect(
      container.querySelector('[data-testid="pomodoro-modal"]')
    ).not.toBeNull();

    await cleanup();
  });
});
