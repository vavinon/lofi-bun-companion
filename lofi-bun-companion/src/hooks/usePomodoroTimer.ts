/**
 * Custom React Hook for Pomodoro Countdown Timer & Rest Automation.
 *
 * Responsibilities:
 * 1. Drives accurate 1-second countdown ticker when timer status is 'RUNNING'.
 * 2. Emits Web Audio chimes and desktop notifications on phase transitions.
 * 3. Rest Automation: Automatically puts companion to sleep (REST pose) during break phases.
 */

import { useEffect, useRef } from 'react';
import { usePomodoroStore } from '../stores/pomodoroStore';
import { useCompanionStore } from '../stores/companionStore';
import { playChimeSound } from '../utils/soundSynth';
import { PomodoroPhase } from '../types/pomodoro';

/**
 * Dispatch desktop notifications via Web Notification API or fallback.
 */
const sendCozyNotification = (phase: PomodoroPhase) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    if (phase === 'SHORT_BREAK' || phase === 'LONG_BREAK') {
      new Notification('Lo-fi Bun Companion 🍅', {
        body: 'Focus session complete! พักสายตา ดื่มน้ำอุ่นๆ กันนะ 💤',
        icon: '/favicon.ico',
      });
    } else {
      new Notification('Lo-fi Bun Companion ✨', {
        body: 'พักผ่อนเต็มอิ่มแล้ว พร้อมเริ่มโฟกัสรอบถัดไปหรือยัง? 🚀',
        icon: '/favicon.ico',
      });
    }
  }
};

export const usePomodoroTimer = () => {
  const status = usePomodoroStore((state) => state.status);
  const phase = usePomodoroStore((state) => state.phase);
  const soundEnabled = usePomodoroStore(
    (state) => state.preferences.soundEnabled
  );
  const notificationEnabled = usePomodoroStore(
    (state) => state.preferences.notificationEnabled
  );

  const prevPhaseRef = useRef<PomodoroPhase>(phase);

  // 1. Rest Automation: Synchronize break phases with companion REST pose
  useEffect(() => {
    const isBreak = phase === 'SHORT_BREAK' || phase === 'LONG_BREAK';
    const setForceRest = useCompanionStore.getState().setForceRest;

    if (isBreak) {
      setForceRest(true);
    } else {
      setForceRest(false);
    }

    // Phase transition notification & sound triggers
    if (prevPhaseRef.current !== phase) {
      if (soundEnabled) {
        if (isBreak) {
          playChimeSound('focusComplete');
        } else {
          playChimeSound('breakComplete');
        }
      }

      if (notificationEnabled) {
        sendCozyNotification(phase);
      }

      prevPhaseRef.current = phase;
    }
  }, [phase, soundEnabled, notificationEnabled]);

  // 2. Active Countdown Interval Driver
  useEffect(() => {
    if (status !== 'RUNNING') return;

    const intervalId = window.setInterval(() => {
      usePomodoroStore.getState().tick();
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [status]);
};
