import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PetContextMenu } from '../components/Desktop/PetContextMenu';
import { useCompanionStore } from '../stores/companionStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('PetContextMenu Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useCompanionStore.getState().resetToDefaults();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  const renderMenu = async (props = {}) => {
    const defaultProps = {
      x: 100,
      y: 150,
      isOpen: true,
      onClose: vi.fn(),
      ...props,
    };
    await act(async () => {
      root.render(<PetContextMenu {...defaultProps} />);
    });
    return defaultProps;
  };

  const cleanup = async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  };

  it('does not render when isOpen is false', async () => {
    await renderMenu({ isOpen: false });

    const menu = container.querySelector('[data-testid="pet-context-menu"]');
    expect(menu).toBeNull();

    await cleanup();
  });

  it('renders correctly at specified coordinates when isOpen is true', async () => {
    await renderMenu({ x: 50, y: 80, isOpen: true });

    const menu = container.querySelector(
      '[data-testid="pet-context-menu"]'
    ) as HTMLElement;
    expect(menu).not.toBeNull();
    expect(menu.style.left).toBe('50px');
    expect(menu.style.top).toBe('80px');

    await cleanup();
  });

  it('toggles telemetry mode and closes menu on click', async () => {
    const onClose = vi.fn();
    await renderMenu({ isOpen: true, onClose });

    const telemetryBtn = container.querySelector(
      '[data-testid="menu-item-telemetry"]'
    );
    expect(useCompanionStore.getState().telemetryMode).toBe('MANUAL');

    await act(async () => {
      telemetryBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(useCompanionStore.getState().telemetryMode).toBe('LIVE');
    expect(onClose).toHaveBeenCalledTimes(1);

    await cleanup();
  });

  it('toggles forceRest and closes menu on click', async () => {
    const onClose = vi.fn();
    await renderMenu({ isOpen: true, onClose });

    const restBtn = container.querySelector('[data-testid="menu-item-rest"]');
    expect(useCompanionStore.getState().forceRest).toBe(false);

    await act(async () => {
      restBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(useCompanionStore.getState().forceRest).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);

    await cleanup();
  });

  it('updates window opacity when selecting opacity presets', async () => {
    const onClose = vi.fn();
    await renderMenu({ isOpen: true, onClose });

    const opacity70Btn = container.querySelector(
      '[data-testid="btn-opacity-70"]'
    );
    expect(opacity70Btn).not.toBeNull();

    await act(async () => {
      opacity70Btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(useCompanionStore.getState().windowOpacity).toBe(0.7);

    await cleanup();
  });

  it('closes menu when clicking the backdrop or pressing Escape key', async () => {
    const onClose = vi.fn();
    await renderMenu({ isOpen: true, onClose });

    // Test backdrop click
    const backdrop = container.querySelector(
      '[data-testid="context-menu-backdrop"]'
    );
    await act(async () => {
      backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    // Test Escape key
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalledTimes(2);

    await cleanup();
  });

  it('triggers exit action when clicking Exit Pet', async () => {
    const onClose = vi.fn();
    const onExit = vi.fn();
    await renderMenu({ isOpen: true, onClose, onExit });

    const exitBtn = container.querySelector('[data-testid="menu-item-exit"]');
    await act(async () => {
      exitBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledTimes(1);

    await cleanup();
  });
});
