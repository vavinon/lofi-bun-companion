/**
 * Desktop domain types and data contracts for Lo-fi Bun Companion.
 * Adheres to SemVer 2.0.0 and Tauri Desktop Mascot architecture.
 */

/**
 * View mode for the desktop companion application.
 * - 'COMPACT': Lightweight, borderless floating mascot widget.
 * - 'FULL': Comprehensive showcase dashboard with telemetry controls and gauges.
 */
export type ViewMode = 'COMPACT' | 'FULL';

/**
 * Preset window opacity levels for desktop floating window.
 */
export type WindowOpacityOption = 1.0 | 0.85 | 0.7 | 0.5;

/**
 * Minimum and maximum bounds for window opacity.
 */
export const MIN_WINDOW_OPACITY = 0.4;
export const MAX_WINDOW_OPACITY = 1.0;

/**
 * Predefined opacity preset values available in context menu and controls.
 */
export const WINDOW_OPACITY_PRESETS: readonly WindowOpacityOption[] = [
  1.0, 0.85, 0.7, 0.5,
];

/**
 * Action identifiers for right-click context menu and system tray.
 */
export type ContextMenuActionId =
  | 'TOGGLE_TELEMETRY'
  | 'TOGGLE_REST'
  | 'SET_OPACITY'
  | 'TOGGLE_ALWAYS_ON_TOP'
  | 'TOGGLE_VIEW_MODE'
  | 'EXIT_APP';

/**
 * Interface representing an individual action item within the pet context menu.
 */
export interface ContextMenuActionItem {
  id: ContextMenuActionId;
  label: string;
  icon?: string;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  danger?: boolean;
  children?: ContextMenuActionItem[];
}

/**
 * Window state descriptor for desktop environment management.
 */
export interface DesktopWindowState {
  viewMode: ViewMode;
  windowOpacity: number;
  isAlwaysOnTop: boolean;
}

/**
 * Default desktop window configuration constants.
 */
export const DEFAULT_VIEW_MODE: ViewMode = 'COMPACT';
export const DEFAULT_WINDOW_OPACITY = 1.0;
export const DEFAULT_ALWAYS_ON_TOP = true;
