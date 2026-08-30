import { describe, it, expect, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PetSprite } from '../components/Pet/PetSprite';
import { useCompanionStore } from '../stores/companionStore';

// Enable React act environment in JSDOM
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('PetSprite Pure CSS Step Animator Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useCompanionStore.getState().resetToDefaults();

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  const renderComponent = async (scale?: number) => {
    await act(async () => {
      root.render(<PetSprite scale={scale} />);
    });
  };

  const cleanup = async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  };

  it('renders initial IDLE sprite canvas and hides carrot prop overlay by default', async () => {
    await renderComponent();

    const wrapper = container.querySelector(
      '[data-testid="pet-sprite-wrapper"]'
    );
    const spriteCanvas = container.querySelector('[role="img"]');
    const carrotProp = container.querySelector(
      '[data-testid="carrot-prop-layer"]'
    );

    expect(wrapper).not.toBeNull();
    expect(wrapper?.getAttribute('data-state')).toBe('IDLE');
    expect(wrapper?.getAttribute('data-heavy-ram')).toBe('false');
    expect(spriteCanvas?.getAttribute('aria-label')).toBe(
      'Lo-fi Bun in IDLE state'
    );
    expect(carrotProp).toBeNull();

    await cleanup();
  });

  it('updates animation state dynamically when store changes to FOCUS and FRENZY', async () => {
    await renderComponent();

    // Change to FOCUS (CPU 30%)
    await act(async () => {
      useCompanionStore.getState().setMetrics({ cpuUsage: 30 });
    });

    const wrapper = container.querySelector(
      '[data-testid="pet-sprite-wrapper"]'
    );
    expect(wrapper?.getAttribute('data-state')).toBe('FOCUS');

    // Change to FRENZY (CPU 80%)
    await act(async () => {
      useCompanionStore.getState().setMetrics({ cpuUsage: 80 });
    });

    expect(wrapper?.getAttribute('data-state')).toBe('FRENZY');

    await cleanup();
  });

  it('displays carrot prop layer overlay when RAM usage exceeds 80%', async () => {
    await renderComponent();

    expect(
      container.querySelector('[data-testid="carrot-prop-layer"]')
    ).toBeNull();

    // Trigger Heavy RAM
    await act(async () => {
      useCompanionStore.getState().setMetrics({ ramUsage: 85 });
    });

    const carrotProp = container.querySelector(
      '[data-testid="carrot-prop-layer"]'
    );
    expect(carrotProp).not.toBeNull();
    expect(carrotProp?.getAttribute('aria-label')).toBe(
      'Carrot stack prop on head'
    );

    // Reset RAM back to normal
    await act(async () => {
      useCompanionStore.getState().setMetrics({ ramUsage: 40 });
    });

    expect(
      container.querySelector('[data-testid="carrot-prop-layer"]')
    ).toBeNull();

    await cleanup();
  });

  it('switches to REST animation when forceRest is enabled', async () => {
    await renderComponent();

    await act(async () => {
      useCompanionStore.getState().setForceRest(true);
    });

    const wrapper = container.querySelector(
      '[data-testid="pet-sprite-wrapper"]'
    );
    expect(wrapper?.getAttribute('data-state')).toBe('REST');

    await cleanup();
  });
});
