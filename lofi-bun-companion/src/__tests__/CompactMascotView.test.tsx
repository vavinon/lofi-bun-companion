import { describe, it, expect, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { CompactMascotView } from '../components/Desktop/CompactMascotView';
import { useCompanionStore } from '../stores/companionStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('CompactMascotView Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    await act(async () => {
      useCompanionStore.getState().resetToDefaults();
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  const renderComponent = async () => {
    await act(async () => {
      root.render(<CompactMascotView />);
    });
  };

  const cleanup = async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  };

  it('renders compact mascot container, draggable regions, and stage glow', async () => {
    await renderComponent();

    const mascotView = container.querySelector(
      '[data-testid="compact-mascot-view"]'
    );
    const petStage = container.querySelector(
      '[data-testid="compact-pet-stage"]'
    );
    const glowHalo = container.querySelector('[data-testid="state-glow-halo"]');
    const spriteWrapper = container.querySelector(
      '[data-testid="compact-pet-sprite"]'
    );

    expect(mascotView).not.toBeNull();
    expect(petStage).not.toBeNull();
    expect(petStage?.hasAttribute('data-tauri-drag-region')).toBe(true);
    expect(glowHalo).not.toBeNull();
    expect(spriteWrapper).not.toBeNull();

    await cleanup();
  });

  it('displays hardware metrics and active state in the floating HUD', async () => {
    await renderComponent();

    const statePill = container.querySelector(
      '[data-testid="compact-state-pill"]'
    );
    const cpuBadge = container.querySelector('[data-testid="badge-cpu"]');
    const ramBadge = container.querySelector('[data-testid="badge-ram"]');
    const diskBadge = container.querySelector('[data-testid="badge-disk"]');

    expect(statePill?.textContent).toContain('IDLE');
    expect(cpuBadge?.textContent).toContain('10%');
    expect(ramBadge?.textContent).toContain('30%');
    expect(diskBadge?.textContent).toContain('5%');

    // Update metrics to FRENZY + Heavy RAM
    await act(async () => {
      useCompanionStore.getState().setMetrics({
        cpuUsage: 75,
        ramUsage: 90,
        diskUsage: 15,
      });
    });

    expect(statePill?.textContent).toContain('FRENZY');
    expect(cpuBadge?.textContent).toContain('75%');
    expect(ramBadge?.textContent).toContain('90%');
    expect(ramBadge?.textContent).toContain('🥕'); // Heavy RAM carrot emoji
    expect(diskBadge?.textContent).toContain('15%');

    // Test DISK state override (>75% disk IO)
    await act(async () => {
      useCompanionStore.getState().setMetrics({
        diskUsage: 85,
      });
    });

    expect(statePill?.textContent).toContain('DISK');
    expect(diskBadge?.textContent).toContain('85%');

    await cleanup();
  });

  it('opens and closes context menu on right click and outside click', async () => {
    await renderComponent();

    const mascotView = container.querySelector(
      '[data-testid="compact-mascot-view"]'
    );
    expect(
      container.querySelector('[data-testid="pet-context-menu"]')
    ).toBeNull();

    // Trigger right click (contextmenu)
    await act(async () => {
      mascotView?.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          clientX: 120,
          clientY: 180,
        })
      );
    });

    const contextMenu = container.querySelector(
      '[data-testid="pet-context-menu"]'
    );
    expect(contextMenu).not.toBeNull();

    // Click backdrop to close
    const backdrop = container.querySelector(
      '[data-testid="context-menu-backdrop"]'
    );
    await act(async () => {
      backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(
      container.querySelector('[data-testid="pet-context-menu"]')
    ).toBeNull();

    await cleanup();
  });

  it('applies window opacity style from companionStore', async () => {
    await renderComponent();

    const mascotView = container.querySelector(
      '[data-testid="compact-mascot-view"]'
    ) as HTMLElement;
    expect(mascotView.style.opacity).toBe('1');

    await act(async () => {
      useCompanionStore.getState().setWindowOpacity(0.85);
    });

    expect(mascotView.style.opacity).toBe('0.85');

    await cleanup();
  });
});
