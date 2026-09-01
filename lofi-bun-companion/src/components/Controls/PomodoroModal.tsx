/**
 * PomodoroModal Component
 *
 * Full-featured Focus Dashboard Modal for Lo-fi Bun Companion.
 * Features:
 * 1. Mode Selector: Classic 25/5, Deep Work 50/10, and Custom Duration inputs.
 * 2. Big cozy countdown timer with active phase pill (FOCUS, SHORT_BREAK, LONG_BREAK).
 * 3. 4-step cycle progress indicator (🍅 🍅 ⚪ ⚪).
 * 4. Control buttons: Start/Pause/Resume, Skip Phase, Reset Timer.
 * 5. Daily Streak Statistics card (Completed Cycles, Cumulative Minutes, Reset Streak).
 * 6. User Preferences toggles (Bell Chime, Notifications, Mini Widget, Auto-start).
 * 7. Keyboard navigation (Escape key to dismiss) and backdrop click.
 */

import React, { useEffect, useState } from 'react';
import { usePomodoroStore } from '../../stores/pomodoroStore';
import { PomodoroMode, PomodoroPhase } from '../../types/pomodoro';
import styles from './PomodoroModal.module.css';

export interface PomodoroModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const PHASE_DETAILS: Record<
  PomodoroPhase,
  { label: string; icon: string; className: string }
> = {
  FOCUS: {
    label: 'Focus Session',
    icon: '🍅',
    className: styles.phaseFocus,
  },
  SHORT_BREAK: {
    label: 'Short Break',
    icon: '🍵',
    className: styles.phaseShortBreak,
  },
  LONG_BREAK: {
    label: 'Long Rest',
    icon: '💤',
    className: styles.phaseLongBreak,
  },
};

export const PomodoroModal: React.FC<PomodoroModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Store subscriptions
  const mode = usePomodoroStore((state) => state.mode);
  const phase = usePomodoroStore((state) => state.phase);
  const status = usePomodoroStore((state) => state.status);
  const remainingSeconds = usePomodoroStore((state) => state.remainingSeconds);
  const currentCycle = usePomodoroStore((state) => state.currentCycle);
  const dailyStreak = usePomodoroStore((state) => state.dailyStreak);
  const preferences = usePomodoroStore((state) => state.preferences);
  const customDurations = usePomodoroStore((state) => state.customDurations);

  // Store actions
  const startFocus = usePomodoroStore((state) => state.startFocus);
  const resumeTimer = usePomodoroStore((state) => state.resumeTimer);
  const pauseTimer = usePomodoroStore((state) => state.pauseTimer);
  const resetTimer = usePomodoroStore((state) => state.resetTimer);
  const skipPhase = usePomodoroStore((state) => state.skipPhase);
  const setMode = usePomodoroStore((state) => state.setMode);
  const setCustomDurations = usePomodoroStore(
    (state) => state.setCustomDurations
  );
  const setPreferences = usePomodoroStore((state) => state.setPreferences);
  const resetStreak = usePomodoroStore((state) => state.resetStreak);

  // Local state for custom minutes input
  const [customFocusMin, setCustomFocusMin] = useState(
    Math.round(customDurations.focus / 60)
  );
  const [customShortMin, setCustomShortMin] = useState(
    Math.round(customDurations.shortBreak / 60)
  );
  const [customLongMin, setCustomLongMin] = useState(
    Math.round(customDurations.longBreak / 60)
  );

  // Sync inputs with customDurations if changed outside
  useEffect(() => {
    setCustomFocusMin(Math.round(customDurations.focus / 60));
    setCustomShortMin(Math.round(customDurations.shortBreak / 60));
    setCustomLongMin(Math.round(customDurations.longBreak / 60));
  }, [customDurations]);

  // Escape key handler to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const phaseDetail = PHASE_DETAILS[phase] || PHASE_DETAILS.FOCUS;

  const handleModeChange = (nextMode: PomodoroMode) => {
    setMode(nextMode);
  };

  const handleCustomDurationChange = (
    field: 'focus' | 'shortBreak' | 'longBreak',
    minutesStr: string
  ) => {
    const val = parseInt(minutesStr, 10);
    if (isNaN(val) || val <= 0) return;

    if (field === 'focus') {
      setCustomFocusMin(val);
      setCustomDurations({ focus: val * 60 });
    } else if (field === 'shortBreak') {
      setCustomShortMin(val);
      setCustomDurations({ shortBreak: val * 60 });
    } else {
      setCustomLongMin(val);
      setCustomDurations({ longBreak: val * 60 });
    }
  };

  const handleToggleTimer = () => {
    if (status === 'RUNNING') {
      pauseTimer();
    } else if (status === 'PAUSED') {
      resumeTimer();
    } else {
      startFocus();
    }
  };

  return (
    <div
      className={styles.modalBackdrop}
      onClick={onClose}
      data-testid="pomodoro-modal-backdrop"
    >
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pomodoro-modal-title"
        data-testid="pomodoro-modal"
      >
        {/* Header */}
        <header className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <span className={styles.titleIcon}>🍅</span>
            <div>
              <h2 id="pomodoro-modal-title" className={styles.modalTitle}>
                Pomodoro Focus Suite
              </h2>
              <p className={styles.modalSubtitle}>
                Cozy productivity intervals with companion sleep sync
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
            data-testid="btn-close-pomodoro-modal"
          >
            ✕
          </button>
        </header>

        {/* Mode Selector Tabs */}
        <div
          className={styles.modeTabsRow}
          role="tablist"
          aria-label="Timer Mode"
        >
          <button
            type="button"
            className={`${styles.modeTab} ${
              mode === '25_5' ? styles.modeTabActive : ''
            }`}
            onClick={() => handleModeChange('25_5')}
            role="tab"
            aria-selected={mode === '25_5'}
            data-testid="mode-tab-25_5"
          >
            Classic (25/5m)
          </button>
          <button
            type="button"
            className={`${styles.modeTab} ${
              mode === '50_10' ? styles.modeTabActive : ''
            }`}
            onClick={() => handleModeChange('50_10')}
            role="tab"
            aria-selected={mode === '50_10'}
            data-testid="mode-tab-50_10"
          >
            Deep Work (50/10m)
          </button>
          <button
            type="button"
            className={`${styles.modeTab} ${
              mode === 'CUSTOM' ? styles.modeTabActive : ''
            }`}
            onClick={() => handleModeChange('CUSTOM')}
            role="tab"
            aria-selected={mode === 'CUSTOM'}
            data-testid="mode-tab-custom"
          >
            Custom
          </button>
        </div>

        {/* Custom Mode Inputs */}
        {mode === 'CUSTOM' && (
          <div
            className={styles.customInputsRow}
            data-testid="custom-inputs-row"
          >
            <div className={styles.customInputGroup}>
              <label
                htmlFor="custom-focus-input"
                className={styles.customInputLabel}
              >
                Focus (min)
              </label>
              <input
                id="custom-focus-input"
                type="number"
                min="1"
                max="180"
                className={styles.customInputField}
                value={customFocusMin}
                onChange={(e) =>
                  handleCustomDurationChange('focus', e.target.value)
                }
                data-testid="input-custom-focus"
              />
            </div>
            <div className={styles.customInputGroup}>
              <label
                htmlFor="custom-short-input"
                className={styles.customInputLabel}
              >
                Short (min)
              </label>
              <input
                id="custom-short-input"
                type="number"
                min="1"
                max="60"
                className={styles.customInputField}
                value={customShortMin}
                onChange={(e) =>
                  handleCustomDurationChange('shortBreak', e.target.value)
                }
                data-testid="input-custom-short"
              />
            </div>
            <div className={styles.customInputGroup}>
              <label
                htmlFor="custom-long-input"
                className={styles.customInputLabel}
              >
                Long (min)
              </label>
              <input
                id="custom-long-input"
                type="number"
                min="1"
                max="120"
                className={styles.customInputField}
                value={customLongMin}
                onChange={(e) =>
                  handleCustomDurationChange('longBreak', e.target.value)
                }
                data-testid="input-custom-long"
              />
            </div>
          </div>
        )}

        {/* Big Timer Hero Card */}
        <section
          className={styles.timerHeroCard}
          aria-label="Timer Countdown"
          data-testid="timer-hero-card"
        >
          <div className={`${styles.phasePill} ${phaseDetail.className}`}>
            <span>{phaseDetail.icon}</span>
            <span>{phaseDetail.label}</span>
          </div>

          <div
            className={styles.timeCountdown}
            data-testid="pomodoro-modal-countdown"
          >
            {formatTime(remainingSeconds)}
          </div>

          {/* 4-Cycle Dots */}
          <div
            className={styles.cycleDotsRow}
            data-testid="pomodoro-cycle-dots"
          >
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`${styles.cycleDot} ${
                  step <= currentCycle ? styles.cycleDotFilled : ''
                }`}
                title={`Cycle ${step} of 4`}
              />
            ))}
            <span className={styles.cycleLabel}>Cycle {currentCycle}/4</span>
          </div>

          {/* Controls Buttons */}
          <div className={styles.primaryControlsRow}>
            <button
              type="button"
              className={styles.mainActionButton}
              onClick={handleToggleTimer}
              data-testid="btn-modal-main-action"
            >
              <span>{status === 'RUNNING' ? '⏸ Pause' : '▶ Start Focus'}</span>
            </button>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={skipPhase}
              title="Skip to next phase"
              data-testid="btn-modal-skip"
            >
              <span>⏭ Skip</span>
            </button>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={resetTimer}
              title="Reset current phase timer"
              data-testid="btn-modal-reset"
            >
              <span>↺ Reset</span>
            </button>
          </div>
        </section>

        {/* Daily Streak & Stats */}
        <section
          className={styles.statsCard}
          aria-label="Daily Streak Statistics"
          data-testid="pomodoro-stats-card"
        >
          <div className={styles.statItem}>
            <span className={styles.statEmoji}>🍅</span>
            <div>
              <div
                className={styles.statValue}
                data-testid="stat-completed-cycles"
              >
                {dailyStreak.completedCycles} Cycles
              </div>
              <div className={styles.statLabel}>Completed Today</div>
            </div>
          </div>

          <div className={styles.statItem}>
            <span className={styles.statEmoji}>⏳</span>
            <div>
              <div
                className={styles.statValue}
                data-testid="stat-total-minutes"
              >
                {dailyStreak.totalFocusMinutes} min
              </div>
              <div className={styles.statLabel}>Total Focused Time</div>
            </div>
          </div>

          <button
            type="button"
            className={styles.resetStreakBtn}
            onClick={resetStreak}
            title="Reset today's streak"
            data-testid="btn-reset-streak"
          >
            Reset
          </button>
        </section>

        {/* Preferences / Settings Section */}
        <section
          className={styles.preferencesSection}
          aria-label="Pomodoro Preferences"
          data-testid="pomodoro-preferences-section"
        >
          <div className={styles.sectionHeading}>⚙️ Preferences</div>

          {/* Sound Toggle */}
          <label className={styles.preferenceRow}>
            <span>🔔 Soft Bell Chime (Web Audio API)</span>
            <div className={styles.toggleSwitch}>
              <input
                type="checkbox"
                className={styles.toggleInput}
                checked={preferences.soundEnabled}
                onChange={(e) =>
                  setPreferences({ soundEnabled: e.target.checked })
                }
                data-testid="toggle-sound-pref"
              />
              <span className={styles.toggleSlider} />
            </div>
          </label>

          {/* Notification Toggle */}
          <label className={styles.preferenceRow}>
            <span>📢 Desktop Notifications</span>
            <div className={styles.toggleSwitch}>
              <input
                type="checkbox"
                className={styles.toggleInput}
                checked={preferences.notificationEnabled}
                onChange={(e) =>
                  setPreferences({ notificationEnabled: e.target.checked })
                }
                data-testid="toggle-notification-pref"
              />
              <span className={styles.toggleSlider} />
            </div>
          </label>

          {/* Mini Mascot Widget Visibility */}
          <label className={styles.preferenceRow}>
            <span>🪟 Show Mini Badge on Desktop Mascot</span>
            <div className={styles.toggleSwitch}>
              <input
                type="checkbox"
                className={styles.toggleInput}
                checked={preferences.miniWidgetVisible}
                onChange={(e) =>
                  setPreferences({ miniWidgetVisible: e.target.checked })
                }
                data-testid="toggle-mini-widget-pref"
              />
              <span className={styles.toggleSlider} />
            </div>
          </label>

          {/* Auto Start Breaks */}
          <label className={styles.preferenceRow}>
            <span>⚡ Auto-start Breaks</span>
            <div className={styles.toggleSwitch}>
              <input
                type="checkbox"
                className={styles.toggleInput}
                checked={preferences.autoStartBreaks}
                onChange={(e) =>
                  setPreferences({ autoStartBreaks: e.target.checked })
                }
                data-testid="toggle-autostart-breaks-pref"
              />
              <span className={styles.toggleSlider} />
            </div>
          </label>

          {/* Auto Start Focus */}
          <label className={styles.preferenceRow}>
            <span>⚡ Auto-start Next Focus Session</span>
            <div className={styles.toggleSwitch}>
              <input
                type="checkbox"
                className={styles.toggleInput}
                checked={preferences.autoStartFocus}
                onChange={(e) =>
                  setPreferences({ autoStartFocus: e.target.checked })
                }
                data-testid="toggle-autostart-focus-pref"
              />
              <span className={styles.toggleSlider} />
            </div>
          </label>
        </section>
      </div>
    </div>
  );
};

export default PomodoroModal;
