# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
