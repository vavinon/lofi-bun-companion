import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PomodoroModal } from '../components/Controls/PomodoroModal';
import { usePomodoroStore } from '../stores/pomodoroStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('PomodoroModal Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    usePomodoroStore.getState().resetToDefaults();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  const renderModal = async (props = {}) => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      ...props,
    };
    await act(async () => {
      root.render(<PomodoroModal {...defaultProps} />);
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
    await renderModal({ isOpen: false });

    const modal = container.querySelector('[data-testid="pomodoro-modal"]');
    expect(modal).toBeNull();

    await cleanup();
  });

  it('renders mode tabs and switches preset mode', async () => {
    await renderModal();

    const tab50 = container.querySelector(
      '[data-testid="mode-tab-50_10"]'
    ) as HTMLElement;
    expect(tab50).not.toBeNull();

    await act(async () => {
      tab50.click();
    });

    expect(usePomodoroStore.getState().mode).toBe('50_10');
    expect(usePomodoroStore.getState().remainingSeconds).toBe(50 * 60);

    await cleanup();
  });

  it('renders custom inputs when custom mode is selected and updates durations', async () => {
    await renderModal();

    const tabCustom = container.querySelector(
      '[data-testid="mode-tab-custom"]'
    ) as HTMLElement;
    await act(async () => {
      tabCustom.click();
    });

    expect(usePomodoroStore.getState().mode).toBe('CUSTOM');

    const focusInput = container.querySelector(
      '[data-testid="input-custom-focus"]'
    ) as HTMLInputElement;
    expect(focusInput).not.toBeNull();

    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      nativeInputValueSetter?.call(focusInput, '35');
      focusInput.dispatchEvent(new Event('input', { bubbles: true }));
      focusInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(usePomodoroStore.getState().customDurations.focus).toBe(35 * 60);

    await cleanup();
  });

  it('triggers start, pause, skip, and reset actions from hero controls', async () => {
    await renderModal();

    const mainBtn = container.querySelector(
      '[data-testid="btn-modal-main-action"]'
    ) as HTMLElement;
    const skipBtn = container.querySelector(
      '[data-testid="btn-modal-skip"]'
    ) as HTMLElement;
    const resetBtn = container.querySelector(
      '[data-testid="btn-modal-reset"]'
    ) as HTMLElement;

    // Start
    await act(async () => {
      mainBtn.click();
    });
    expect(usePomodoroStore.getState().status).toBe('RUNNING');

    // Skip
    await act(async () => {
      skipBtn.click();
    });
    expect(usePomodoroStore.getState().phase).toBe('SHORT_BREAK');

    // Reset
    await act(async () => {
      resetBtn.click();
    });
    expect(usePomodoroStore.getState().status).toBe('IDLE');

    await cleanup();
  });

  it('updates preferences toggles correctly', async () => {
    await renderModal();

    const soundToggle = container.querySelector(
      '[data-testid="toggle-sound-pref"]'
    ) as HTMLInputElement;
    expect(soundToggle.checked).toBe(true);

    await act(async () => {
      soundToggle.click();
    });

    expect(usePomodoroStore.getState().preferences.soundEnabled).toBe(false);

    await cleanup();
  });

  it('closes modal on backdrop click, close button, or Escape key', async () => {
    const onClose = vi.fn();
    await renderModal({ onClose });

    const closeBtn = container.querySelector(
      '[data-testid="btn-close-pomodoro-modal"]'
    ) as HTMLElement;
    await act(async () => {
      closeBtn.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    const backdrop = container.querySelector(
      '[data-testid="pomodoro-modal-backdrop"]'
    ) as HTMLElement;
    await act(async () => {
      backdrop.click();
    });
    expect(onClose).toHaveBeenCalledTimes(2);

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalledTimes(3);

    await cleanup();
  });
});
