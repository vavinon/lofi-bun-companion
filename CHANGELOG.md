# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-08-30

### Added
- **The Hardware Desk Pet (Tauri Desktop Mascot)**:
  - Frameless, transparent, floating desktop window configuration with native Windows support (`src-tauri/tauri.conf.json`).
  - Native Windows OS telemetry engine written in Rust utilizing the `sysinfo` crate for zero main-thread overhead CPU, RAM, and Disk polling (`src-tauri/src/telemetry.rs` & `src-tauri/src/main.rs`).
  - `NativeTelemetryProvider` IPC bridge connecting Tauri `get_hardware_metrics` with graceful fallback to browser simulation.
- **Desktop UI Components & Mascot View**:
  - `CompactMascotView`: Ultra-clean floating desk pet with dynamic state halo glow, minimal hardware metric pills, and `data-tauri-drag-region` draggable canvas.
  - `PetContextMenu`: Right-click floating glassmorphism context menu for instant state toggling, telemetry mode switching, opacity tuning, always-on-top pinning, and graceful exit.
  - `WindowHeader`: Subtle frameless window control bar with Pin, Expand/Compact View Toggle, Minimize, and Close buttons.
  - `App.tsx` Master View Mode switcher supporting seamless switching between `COMPACT` mascot and `FULL` showcase dashboard modes.
- **Desktop Domain Store State**:
  - Extended `useCompanionStore` with `viewMode` (`'COMPACT'` | `'FULL'`), `windowOpacity` (clamped `0.4`–`1.0`), and `isAlwaysOnTop` toggle state.
- **Windows Installer & Release Packaging (Phase 3 & 4)**:
  - Custom Master App Icon SVG (`app-icon.svg`) and multi-platform icon assets (`32x32`, `128x128`, `128x128@2x`, `icon.ico`, `icon.png`, `icon.icns`).
  - NSIS Setup Wizard Installer (`lofi-bun-companion_1.0.0_x64-setup.exe` ~5.17 MB).
  - WiX Windows Installer Package (`lofi-bun-companion_1.0.0_x64_en-US.msi` ~7.50 MB).
  - Standalone Portable Windows Binary (`lofi-bun-companion.exe` ~25.25 MB).
- **Automated Testing & 5-Pillar Quality Gate**:
  - Added test suites for `CompactMascotView`, `PetContextMenu`, `WindowHeader`, and view-mode switching in `App` (15 test suites, 111 tests passing 100%).

## [0.2.0] - 2026-08-30

### Added
- **Pluggable Telemetry Provider Architecture**:
  - `HardwareTelemetryProvider` interface contract defining lifecycle hooks (`start`, `stop`, `getLatestMetrics`, `isSupported`, `getStatus`).
  - `NativeTelemetryProvider` for native Windows OS hardware polling with zero main-thread overhead (1.5s background interval).
  - `WebMockTelemetryProvider` for deterministic simulation in web browsers and Vitest test environments.
  - `telemetryManager` singleton managing provider switching, listener subscriptions, and non-blocking polling loops.
- **Store & Hook Integration**:
  - Extended `useCompanionStore` with `telemetryMode: 'LIVE' | 'MANUAL'` and `setTelemetryMode` action.
  - `useTelemetry` custom React hook for seamless lifecycle orchestration, auto-starting telemetry and handling clean unmounting.
- **Showcase Lab UI & Controls**:
  - `MockMetricController` Live vs Manual mode toggle switch with glowing pulsing indicator and automatic slider locking in Live mode.
  - Real-time Telemetry Status HUD badges in `App.tsx` displaying Mode (`⚡ LIVE` / `🎛️ MANUAL`), Source Provider (`🖥️ Windows Native` / `🌐 Web Simulation`), and Polling Status (`🟢 POLLING` / `⚪ IDLE`).
- **Automated Testing**:
  - Unit and integration tests for `telemetryManager`, `NativeTelemetryProvider`, `WebMockTelemetryProvider`, `useTelemetry`, `MockMetricController`, and `App` (12 test suites, 84 tests passing 100%).

## [0.1.0] - 2026-08-30

### Added
- **Core Vector Pixel-Art Engine**:
  - 256x320px SVG spritesheet (`bun-sprites.svg`) with 5 core animation states (`IDLE`, `FOCUS`, `FRENZY`, `DISK`, `REST`).
  - Heavy RAM carrot stack overlay prop (`prop-carrot.svg`).
  - Pure CSS GPU step animator (`PetSprite`) with `steps(4)` rendering at 0.0% CPU overhead on idle.
- **Hysteresis State Machine & Store**:
  - Asymmetric dual-threshold hysteresis smoothing engine ($\pm 3\%$ buffer) preventing state oscillation.
  - Pure state priority hierarchy resolver (`REST` > `DISK` > `FRENZY` > `FOCUS` > `IDLE` with heavy RAM flag).
  - Reactive Zustand state store (`useCompanionStore`) with selective subscriptions pattern.
- **Cozy Showcase UI**:
  - Dark Espresso desk mat theme with glassmorphism controller sliders and HUD state badges.
- **5-Pillar Quality Gate Pipeline**:
  - Automated verification script (`npm run verify`) combining Lint, Format, Typecheck, Test, and Build.
