import { describe, it, expect, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PetSprite } from '../components/Pet/PetSprite';
import { useCompanionStore } from '../stores/companionStore';
import { getAllCompanions } from '../data/companionRegistry';
import { CompanionId } from '../types/companion';

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

  it('renders initial IDLE sprite canvas for flagship Bun and hides prop overlay by default', async () => {
    await renderComponent();

    const wrapper = container.querySelector(
      '[data-testid="pet-sprite-wrapper"]'
    ) as HTMLElement;
    const spriteCanvas = container.querySelector('[role="img"]');
    const propLayer = container.querySelector(
      '[data-testid="companion-prop-layer"]'
    );

    expect(wrapper).not.toBeNull();
    expect(wrapper.getAttribute('data-companion-id')).toBe('bun');
    expect(wrapper.getAttribute('data-state')).toBe('IDLE');
    expect(wrapper.getAttribute('data-heavy-ram')).toBe('false');
    expect(spriteCanvas?.getAttribute('aria-label')).toBe(
      'Lo-fi Bun in IDLE state'
    );
    expect(propLayer).toBeNull();

    // Verify CSS Custom Properties
    expect(wrapper.style.getPropertyValue('--sprite-url')).toBe(
      'url("/sprites/bun-sprites.svg")'
    );
    expect(wrapper.style.getPropertyValue('--prop-url')).toBe(
      'url("/sprites/prop-carrot.svg")'
    );
    expect(wrapper.style.getPropertyValue('--anim-duration')).toBe('0.8s');

    await cleanup();
  });

  it('updates animation state and duration dynamically when metrics change', async () => {
    await renderComponent();

    const wrapper = container.querySelector(
      '[data-testid="pet-sprite-wrapper"]'
    ) as HTMLElement;

    // Change to FOCUS (CPU 30%) -> 600ms / 0.6s
    await act(async () => {
      useCompanionStore.getState().setMetrics({ cpuUsage: 30 });
    });
    expect(wrapper.getAttribute('data-state')).toBe('FOCUS');
    expect(wrapper.style.getPropertyValue('--anim-duration')).toBe('0.6s');

    // Change to FRENZY (CPU 80%) -> 300ms / 0.3s
    await act(async () => {
      useCompanionStore.getState().setMetrics({ cpuUsage: 80 });
    });
    expect(wrapper.getAttribute('data-state')).toBe('FRENZY');
    expect(wrapper.style.getPropertyValue('--anim-duration')).toBe('0.3s');

    // Change to DISK (CPU 10%, Disk 75%) -> 400ms / 0.4s
    await act(async () => {
      useCompanionStore.getState().setMetrics({ cpuUsage: 10, diskUsage: 75 });
    });
    expect(wrapper.getAttribute('data-state')).toBe('DISK');
    expect(wrapper.style.getPropertyValue('--anim-duration')).toBe('0.4s');

    await cleanup();
  });

  it('switches sprite and prop URLs across all multiverse characters dynamically', async () => {
    await renderComponent();

    const wrapper = container.querySelector(
      '[data-testid="pet-sprite-wrapper"]'
    ) as HTMLElement;
    const allCompanions = getAllCompanions();

    for (const companion of allCompanions) {
      await act(async () => {
        useCompanionStore
          .getState()
          .setActiveCompanionId(companion.id as CompanionId);
      });

      expect(wrapper.getAttribute('data-companion-id')).toBe(companion.id);
      expect(wrapper.style.getPropertyValue('--sprite-url')).toBe(
        `url("${companion.spriteUrl}")`
      );
      expect(wrapper.style.getPropertyValue('--prop-url')).toBe(
        `url("${companion.propUrl}")`
      );

      const spriteCanvas = container.querySelector('[role="img"]');
      expect(spriteCanvas?.getAttribute('aria-label')).toContain(
        companion.displayName
      );
    }

    await cleanup();
  });

  it('displays companion signature prop layer overlay when RAM usage exceeds 80%', async () => {
    await renderComponent();

    expect(
      container.querySelector('[data-testid="companion-prop-layer"]')
    ).toBeNull();

    // Trigger Heavy RAM on Bun
    await act(async () => {
      useCompanionStore.getState().setMetrics({ ramUsage: 85 });
    });

    let propLayer = container.querySelector(
      '[data-testid="companion-prop-layer"]'
    );
    expect(propLayer).not.toBeNull();
    expect(propLayer?.getAttribute('aria-label')).toBe(
      'Lo-fi Bun prop on head'
    );
    expect(propLayer?.getAttribute('data-prop-url')).toBe(
      '/sprites/prop-carrot.svg'
    );

    // Switch to Neko during heavy RAM
    await act(async () => {
      useCompanionStore.getState().setActiveCompanionId('neko');
    });

    propLayer = container.querySelector('[data-testid="companion-prop-layer"]');
    expect(propLayer).not.toBeNull();
    expect(propLayer?.getAttribute('aria-label')).toBe(
      'Coffee Neko prop on head'
    );
    expect(propLayer?.getAttribute('data-prop-url')).toBe(
      '/sprites/prop-fish.svg'
    );

    // Switch to Dolphin during heavy RAM
    await act(async () => {
      useCompanionStore.getState().setActiveCompanionId('dolphin');
    });

    propLayer = container.querySelector('[data-testid="companion-prop-layer"]');
    expect(propLayer).not.toBeNull();
    expect(propLayer?.getAttribute('aria-label')).toBe(
      'Wave Dolphin prop on head'
    );
    expect(propLayer?.getAttribute('data-prop-url')).toBe(
      '/sprites/prop-coral.svg'
    );

    // Reset RAM back to normal (<80%)
    await act(async () => {
      useCompanionStore.getState().setMetrics({ ramUsage: 40 });
    });

    expect(
      container.querySelector('[data-testid="companion-prop-layer"]')
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
    ) as HTMLElement;
    expect(wrapper.getAttribute('data-state')).toBe('REST');
    expect(wrapper.style.getPropertyValue('--anim-duration')).toBe('1s');

    await cleanup();
  });

  it('applies custom scale transform correctly', async () => {
    await renderComponent(4);

    const wrapper = container.querySelector(
      '[data-testid="pet-sprite-wrapper"]'
    ) as HTMLElement;
    expect(wrapper.style.transform).toBe('scale(4)');

    await cleanup();
  });
});
