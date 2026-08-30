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

  it('renders all core showcase elements and headers correctly', async () => {
    await renderComponent();

    // Verify Title and Subtitle
    expect(container.textContent).toContain('Lo-fi Bun Companion');
    expect(container.textContent).toContain('v0.1.0 • Core Sprite Engine');
    expect(container.textContent).toContain('Pet: BUN-01 (Flagship)');

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

  it('updates Stage HUD and PetSprite when hardware sliders change', async () => {
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
    expect(ramIndicator?.textContent).toContain('Carrots Stacked');

    const carrotProp = container.querySelector(
      '[data-testid="carrot-prop-layer"]'
    );
    expect(carrotProp).not.toBeNull();

    await cleanup();
  });

  it('switches to REST mode and updates HUD when toggle switch is clicked', async () => {
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
});
