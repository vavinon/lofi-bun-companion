/**
 * PomodoroWidget Component
 *
 * Compact floating badge & progress ring designed for Desktop Mascot.
 * Features:
 * 1. Circular SVG progress ring tracking remaining time in current phase.
 * 2. Monospace time readout (MM:SS) and active phase label.
 * 3. Quick Play / Pause / Skip actions with zero layout shift.
 * 4. Click to expand full Focus Dashboard Modal.
 * 5. Respects user preferences (miniWidgetVisible).
 */

import React from 'react';
import { usePomodoroStore } from '../../stores/pomodoroStore';
import { PomodoroPhase } from '../../types/pomodoro';
import styles from './PomodoroWidget.module.css';

export interface PomodoroWidgetProps {
  /** Optional callback to open the full Focus Dashboard Modal */
  onOpenModal?: () => void;
  /** Optional className override */
  className?: string;
}

const PHASE_ICONS: Record<PomodoroPhase, string> = {
  FOCUS: '🍅',
  SHORT_BREAK: '🍵',
  LONG_BREAK: '💤',
};

const PHASE_CLASS_MAP: Record<PomodoroPhase, string> = {
  FOCUS: styles.phaseFocus,
  SHORT_BREAK: styles.phaseShortBreak,
  LONG_BREAK: styles.phaseLongBreak,
};

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({
  onOpenModal,
  className = '',
}) => {
  const phase = usePomodoroStore((state) => state.phase);
  const status = usePomodoroStore((state) => state.status);
  const remainingSeconds = usePomodoroStore((state) => state.remainingSeconds);
  const totalSeconds = usePomodoroStore((state) => state.totalSeconds);
  const currentCycle = usePomodoroStore((state) => state.currentCycle);
  const isVisible = usePomodoroStore(
    (state) => state.preferences.miniWidgetVisible
  );

  const startFocus = usePomodoroStore((state) => state.startFocus);
  const resumeTimer = usePomodoroStore((state) => state.resumeTimer);
  const pauseTimer = usePomodoroStore((state) => state.pauseTimer);
  const skipPhase = usePomodoroStore((state) => state.skipPhase);

  if (!isVisible) {
    return null;
  }

  // Calculate SVG progress ring values (Radius = 13, Circumference = 2 * PI * 13 = ~81.68)
  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  const progressRatio =
    totalSeconds > 0
      ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds))
      : 1;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const phaseColorClass = PHASE_CLASS_MAP[phase] || styles.phaseFocus;
  const phaseIcon = PHASE_ICONS[phase] || '🍅';

  const handleToggleTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'RUNNING') {
      pauseTimer();
    } else if (status === 'PAUSED') {
      resumeTimer();
    } else {
      startFocus();
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    skipPhase();
  };

  const handleContainerClick = () => {
    if (onOpenModal) {
      onOpenModal();
    }
  };

  return (
    <div
      className={`${styles.widgetContainer} ${
        status === 'PAUSED' ? styles.paused : ''
      } ${className}`}
      onClick={handleContainerClick}
      title="Click to open Focus Dashboard"
      data-testid="pomodoro-mini-widget"
    >
      {/* SVG Circular Progress Ring */}
      <div className={styles.progressRingWrapper}>
        <svg
          className={styles.progressSvg}
          viewBox="0 0 32 32"
          aria-hidden="true"
        >
          <circle
            className={styles.progressBackground}
            cx="16"
            cy="16"
            r={radius}
          />
          <circle
            className={`${styles.progressBar} ${phaseColorClass}`}
            cx="16"
            cy="16"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <span className={styles.ringCenterIcon}>{phaseIcon}</span>
      </div>

      {/* Countdown and Phase Info */}
      <div className={styles.infoColumn}>
        <span className={styles.timeDisplay} data-testid="pomodoro-widget-time">
          {formatTime(remainingSeconds)}
        </span>
        <span className={styles.phaseLabel}>
          {phase === 'FOCUS' ? `Focus ${currentCycle}/4` : 'Rest 💤'}
        </span>
      </div>

      {/* Quick Action Controls */}
      <div className={styles.controlsGroup}>
        <button
          type="button"
          className={styles.actionButton}
          onClick={handleToggleTimer}
          title={status === 'RUNNING' ? 'Pause' : 'Start / Resume'}
          aria-label={status === 'RUNNING' ? 'Pause Timer' : 'Start Timer'}
          data-testid="btn-widget-toggle"
        >
          {status === 'RUNNING' ? '⏸' : '▶'}
        </button>

        <button
          type="button"
          className={styles.actionButton}
          onClick={handleSkip}
          title="Skip to next phase"
          aria-label="Skip to next phase"
          data-testid="btn-widget-skip"
        >
          ⏭
        </button>
      </div>
    </div>
  );
};

export default PomodoroWidget;
