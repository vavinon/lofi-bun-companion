import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { WindowHeader } from '../components/Desktop/WindowHeader';
import { useCompanionStore } from '../stores/companionStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('WindowHeader Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useCompanionStore.getState().resetToDefaults();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  const renderComponent = async (props = {}) => {
    await act(async () => {
      root.render(<WindowHeader {...props} />);
    });
  };

  const cleanup = async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  };

  it('renders default title and drag regions', async () => {
    await renderComponent();

    const header = container.querySelector('[data-testid="window-header"]');
    const titleText = container.querySelector(
      '[data-testid="window-title-text"]'
    );

    expect(header).not.toBeNull();
    expect(header?.hasAttribute('data-tauri-drag-region')).toBe(true);
    expect(titleText?.textContent).toBe('Lo-fi Bun');

    await cleanup();
  });

  it('toggles always on top when pin button is clicked', async () => {
    await renderComponent();

    const pinBtn = container.querySelector(
      '[data-testid="btn-toggle-always-on-top"]'
    );
    expect(pinBtn).not.toBeNull();
    expect(useCompanionStore.getState().isAlwaysOnTop).toBe(true);

    await act(async () => {
      pinBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(useCompanionStore.getState().isAlwaysOnTop).toBe(false);

    await cleanup();
  });

  it('toggles view mode between COMPACT and FULL', async () => {
    await renderComponent();

    const viewModeBtn = container.querySelector(
      '[data-testid="btn-toggle-view-mode"]'
    );
    expect(viewModeBtn).not.toBeNull();
    expect(useCompanionStore.getState().viewMode).toBe('FULL');

    await act(async () => {
      viewModeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(useCompanionStore.getState().viewMode).toBe('COMPACT');

    await act(async () => {
      viewModeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(useCompanionStore.getState().viewMode).toBe('FULL');

    await cleanup();
  });

  it('invokes onClose and onMinimize callbacks when provided', async () => {
    const onCloseMock = vi.fn();
    const onMinimizeMock = vi.fn();

    await renderComponent({
      onClose: onCloseMock,
      onMinimize: onMinimizeMock,
    });

    const closeBtn = container.querySelector(
      '[data-testid="btn-close-window"]'
    );
    const minimizeBtn = container.querySelector(
      '[data-testid="btn-minimize-window"]'
    );

    await act(async () => {
      minimizeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onMinimizeMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      closeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    await cleanup();
  });
});
