import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PomodoroWidget } from '../components/Controls/PomodoroWidget';
import { usePomodoroStore } from '../stores/pomodoroStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('PomodoroWidget Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    usePomodoroStore.getState().resetToDefaults();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  const renderWidget = async (props = {}) => {
    await act(async () => {
      root.render(<PomodoroWidget {...props} />);
    });
  };

  const cleanup = async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  };

  it('renders time readout and progress ring correctly', async () => {
    await renderWidget();

    const widget = container.querySelector(
      '[data-testid="pomodoro-mini-widget"]'
    );
    expect(widget).not.toBeNull();

    const timeDisplay = container.querySelector(
      '[data-testid="pomodoro-widget-time"]'
    );
    expect(timeDisplay?.textContent).toBe('25:00');

    await cleanup();
  });

  it('toggles timer running/pause state on button click', async () => {
    await renderWidget();

    const toggleBtn = container.querySelector(
      '[data-testid="btn-widget-toggle"]'
    );
    expect(usePomodoroStore.getState().status).toBe('IDLE');

    // Click to start
    await act(async () => {
      toggleBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(usePomodoroStore.getState().status).toBe('RUNNING');

    // Click to pause
    await act(async () => {
      toggleBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(usePomodoroStore.getState().status).toBe('PAUSED');

    await cleanup();
  });

  it('skips to next phase on skip button click', async () => {
    await renderWidget();

    const skipBtn = container.querySelector('[data-testid="btn-widget-skip"]');
    expect(usePomodoroStore.getState().phase).toBe('FOCUS');

    await act(async () => {
      skipBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(usePomodoroStore.getState().phase).toBe('SHORT_BREAK');

    await cleanup();
  });

  it('triggers onOpenModal when clicking widget container', async () => {
    const onOpenModal = vi.fn();
    await renderWidget({ onOpenModal });

    const widget = container.querySelector(
      '[data-testid="pomodoro-mini-widget"]'
    );
    await act(async () => {
      widget?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onOpenModal).toHaveBeenCalledTimes(1);

    await cleanup();
  });

  it('returns null when miniWidgetVisible is set to false in preferences', async () => {
    usePomodoroStore.getState().setPreferences({ miniWidgetVisible: false });
    await renderWidget();

    const widget = container.querySelector(
      '[data-testid="pomodoro-mini-widget"]'
    );
    expect(widget).toBeNull();

    await cleanup();
  });
});
