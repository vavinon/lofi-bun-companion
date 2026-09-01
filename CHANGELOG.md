# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-09-02

### Added
- **Pomodoro Focus Suite Engine & Flexible Intervals**:
  - Added dedicated Zustand Pomodoro State Machine (`src/stores/pomodoroStore.ts`) and TypeScript types (`src/types/pomodoro.ts`).
  - Implemented 3 focus modes: Classic (25m Focus / 5m Break), Deep Work (50m Focus / 10m Break), and Custom Timer (user-defined minutes).
  - Implemented 4-cycle Long Break automation (15 min deep rest after 4 completed focus rounds).
  - Built LocalStorage persistence storing Daily Focus Streak (🍅 counter) and accumulated focus minutes per calendar date.
- **Companion Rest Automation Hook (`usePomodoroTimer`)**:
  - Built reactive hook syncing break phases (`SHORT_BREAK` / `LONG_BREAK`) directly with `companionStore` `forceRest` state, automatically putting all 6 multiverse companions to sleep (`REST` pose) during breaks.
  - Automatically awakens companion to active hardware monitoring when focus phase starts.
- **Zero-Asset Web Audio Soft Pentatonic Chime (`soundSynth.ts`)**:
  - Synthesized dual-tone harmonic bell chime using native Web Audio API oscillators (Zero external MP3 asset footprint).
  - Safe lazy AudioContext initialization with preference toggle in Focus Dashboard.
- **Cozy Glassmorphism Focus UI**:
  - `PomodoroWidget.tsx`: Compact circular progress ring and time badge rendered smoothly over desktop mascot.
  - `PomodoroModal.tsx`: Full focus dashboard modal featuring circular countdown display, phase indicator, mode selection tabs, streak badges, and timer controls.
  - Seamless double-click trigger on Mascot and Showcase stage arenas.
- **Context Menu Overhaul & Lo-fi Slim Scrollbar**:
  - Integrated Quick Pomodoro Actions (Start 25m, Pause/Resume, Open Dashboard) into `PetContextMenu.tsx`.
  - Optimized menu ergonomics with collapsible companion switcher and custom Lo-fi Slim Scrollbars (`max-height: 340px`) eliminating window clipping.
- **Quality & Automated Test Expansion**:
  - Added 33 new automated tests covering `pomodoroStore`, `soundSynth`, `usePomodoroTimer`, `PomodoroWidget`, `PomodoroModal`, and `App` modal triggers (21 test suites, 171 tests passing 100%).

## [1.1.2] - 2026-09-02

### Fixed
- **WebView2Loader.dll Runtime Resolution & NSIS Packaging**:
  - Configured `bundle.resources` mapping in `tauri.conf.json` (`"resources/WebView2Loader.dll": "WebView2Loader.dll"`) so Tauri bundler installs the DLL directly alongside the main executable in the application root directory.
  - Implemented zero-overhead native Win32 `SetDllDirectoryW` fallback in `src-tauri/src/main.rs` before WebView2 initialization, ensuring DLL resolution succeeds seamlessly even if the binary resides in the `resources/` subfolder.
  - Bumped version across `package.json`, `Cargo.toml`, and `tauri.conf.json` to `1.1.2`.

## [1.1.1] - 2026-08-31

### Fixed
- **Real-Time Disk I/O Activity Telemetry**:
  - Refactored `telemetry.rs` `HardwareSampler` to query real-time process delta read/write throughput (MB/s) instead of static storage volume capacity.
  - Mapped throughput to 0–100% activity scale with 50 MB/s nominal saturation ceiling, ensuring companion DISK animation states trigger accurately during actual file read/write operations.
  - Added Rust unit test suite (`telemetry::tests`) verifying default payload shapes, valid range boundaries, and JSON serialization.
- **WebView2Loader.dll Installer Packaging**:
  - Bundled `WebView2Loader.dll` into `src-tauri/resources/` and configured `bundle.resources` in `tauri.conf.json` so NSIS installer includes the runtime DLL directly in target installation directory.

## [1.1.0] - 2026-08-30

### Added
- **Bun & Friends Multiverse (Character Expansion)**:
  - Added 5 new handcrafted pixel-art companion characters joining flagship 🐰 Lo-fi Bun:
    - 🐱 **Coffee Neko** (`/sprites/neko-sprites.svg` & `/sprites/prop-fish.svg`) — Cozy Barista & Chill Study Companion with Taiyaki/Fish Heavy RAM prop.
    - 🐶 **Bakery Shiba** (`/sprites/shiba-sprites.svg` & `/sprites/prop-croissant.svg`) — Energetic Artisan Baker & Morale Booster with Croissant stack Heavy RAM prop.
    - 🍊 **Onsen Capybara** (`/sprites/capybara-sprites.svg` & `/sprites/prop-yuzu.svg`) — Zen Master & Anti-Burnout Companion with Yuzu hot spring bob Heavy RAM prop.
    - 🦜 **DJ Cockatiel** (`/sprites/cockatiel-sprites.svg` & `/sprites/prop-vinyl.svg`) — Beat Maker & Lo-fi Rhythm Master with Retro Vinyl records Heavy RAM prop.
    - 🐬 **Wave Dolphin** (`/sprites/dolphin-sprites.svg` & `/sprites/prop-coral.svg`) — Flow State Surfer & Deep Work Buddy with Pink Coral & Pearl Crown Heavy RAM prop.
  - Complete 12 vector SVG assets (6 character spritesheets at 256x320px + 6 signature overlay props at 28x20px / 64x64px).
- **Pluggable Companion Registry Architecture**:
  - `src/data/companionRegistry.ts`: Central Single Source of Truth (SSOT) managing all companion metadata, sprite URLs, prop URLs, and universal animation durations.
  - `src/types/companion.ts`: Strong TypeScript definitions (`CompanionId`, `CompanionMetadata`, `CompanionRegistry`, `AnimationDurations`).
  - Implemented `getCompanion(id)` with graceful fallback to `'bun'` and `getAllCompanions()` helpers.
- **Dynamic GPU Step Renderer Engine**:
  - Refactored `PetSprite.tsx` & `PetSprite.module.css` to consume dynamic CSS Custom Properties (`--sprite-url`, `--prop-url`, `--anim-duration`).
  - Dynamic companion and prop switching with zero layout shift and 0.0% CPU overhead on idle.
- **Dual UI Character Switching**:
  - **Quick Switch (Context Menu)**: Added **🐾 Switch Companion** collapsible submenu in `PetContextMenu.tsx` with active indicator dots (`●` / `○`).
  - **Dashboard Ribbon (Full View)**: Added Multiverse Character Selector Ribbon in `App.tsx` displaying interactive cards for all 6 companions.
  - **Active Companion Pill**: Added reactive Companion Name & Emoji Pill in `CompactMascotView.tsx`.
- **Quality & Automated Testing**:
  - Expanded test suites (`companionRegistry.test.ts`, `companionStore.test.ts`, `PetSprite.test.tsx`, `PetContextMenu.test.tsx`, `App.test.tsx`, `CompactMascotView.test.tsx`, `svgAssets.test.ts`) to **138 tests passing 100%** with 0 warnings.
  - Pixel-art Preview Studio gallery (`non-docs/specs/characters/character-gallery.html`) showcasing live interactive 6-character animation viewer.

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
