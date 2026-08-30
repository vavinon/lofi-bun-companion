# 🐰 Lo-fi Bun Companion

<p align="center">
  <img src="lofi-bun-companion/src/assets/sprites/bun-sprites.svg" alt="Lo-fi Bun Companion Banner" width="280" />
</p>

<p align="center">
  <strong>A cozy, lightweight Virtual Desk Companion featuring hardware-reactive pixel animations, Pomodoro focus timer, and ambient lo-fi soundscapes.</strong>
</p>

<p align="center">
  <a href="#-key-features"><img src="https://img.shields.io/badge/version-v1.1.0-8b5cf6?style=flat-square" alt="Version 1.1.0" /></a>
  <a href="#-5-pillar-automated-quality-gates"><img src="https://img.shields.io/badge/tests-138%2F138%20passed-10b981?style=flat-square" alt="138/138 Tests Passed" /></a>
  <a href="#-pure-css-animation-engine"><img src="https://img.shields.io/badge/CPU%20Usage-0.0%25%20(Pure%20CSS)-f59e0b?style=flat-square" alt="0.0% Idle CPU" /></a>
  <a href="#-typescript-architecture"><img src="https://img.shields.io/badge/TypeScript-Strict%205.7-3178c6?style=flat-square" alt="TypeScript Strict" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-6b7280?style=flat-square" alt="License MIT" /></a>
</p>

---

## ✨ Overview

**Lo-fi Bun Companion** transforms your desktop into a calm, productive workspace. Inspired by classic desktop mascots (like RunCat and Bongo Cat) and modern lo-fi aesthetics, our animated bunny reacts in real-time to your computer's hardware workload (CPU, RAM, and Disk I/O) while providing zero-friction productivity tools.

---

## 🎮 Key Features

### 1. 🪟 The Hardware Desk Pet (Tauri Desktop Mascot)
- **Frameless & Transparent Floating Window**: Seamless desktop mascot floating gracefully over your wallpaper with no intrusive titlebars.
- **Draggable Canvas (`data-tauri-drag-region`)**: Freely position the companion anywhere on your desktop.
- **Right-Click Context Menu**: Instant glassmorphism controls for telemetry mode switching (Live vs Simulation), Rest override, opacity adjusting (40%–100%), always-on-top pinning, and view toggling.
- **Dual View Modes**: Seamlessly toggle between **Compact Mascot View** (minimal floating widget) and **Full Showcase Dashboard** (complete hardware lab).

### 2. ⚙️ Hardware-Reactive Companion State Machine
Our bunny intelligently transitions across 5 workload states and dynamic prop layers based on system utilization:

| State | Hardware Condition | Bunny Visual Animation |
| :--- | :--- | :--- |
| **`IDLE`** | CPU `< 20%` | Chilling, sipping warm tea/coffee, gentle ear wiggles |
| **`FOCUS`** | CPU `20% - 60%` | Typing calmly on a mechanical keyboard at steady speed |
| **`FRENZY`** | CPU `> 60%` | Turbo-typing with sweat drops and intense focus |
| **`DISK`** | Disk I/O `> 75%` | Flipping furiously through study book pages |
| **`REST`** | User Override / Break | Cozy sleeping cap, snoring bubbles (`Zzz`) |
| **`HEAVY RAM`** *(Prop Layer)* | RAM `> 80%` | Balanced carrot stack atop bunny's head (across all states) |

```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> FOCUS: CPU >= 20%
    FOCUS --> IDLE: CPU < 17% (Hysteresis)
    FOCUS --> FRENZY: CPU >= 60%
    FRENZY --> FOCUS: CPU < 57% (Hysteresis)
    FRENZY --> IDLE: CPU < 17% (Rapid Drop)
    
    IDLE --> DISK: Disk >= 75%
    FOCUS --> DISK: Disk >= 75%
    FRENZY --> DISK: Disk >= 75%
    DISK --> IDLE: Disk < 72% (Hysteresis)
    
    state "Any State" as AnyState
    AnyState --> REST: forceRest === true
    REST --> IDLE: forceRest === false
```

### 3. ⚡ Native OS Telemetry Engine (Rust + `sysinfo`)
- Non-blocking background hardware polling (1.5s interval) in Rust with zero main-thread overhead.
- Pluggable provider architecture (`NativeTelemetryProvider` for desktop, `WebMockTelemetryProvider` for browsers and Vitest).

### 4. ⚡ Pure CSS GPU Step Animator (0.0% CPU Footprint)
- **Zero JavaScript Render Loops**: Animation frames are handled purely via CSS `@keyframes` with `steps(4)` and GPU-accelerated texture translations.
- **Ultra-Lightweight SVG Spritesheet**: Crisp vector rendering at any DPI scale with crisp pixel-art styling (`image-rendering: pixelated`).

### 5. 🎯 Asymmetric Hysteresis Anti-Jitter Smoothing
- Implements a $\pm 3\%$ dual-threshold deadband to eliminate rapid state flapping when system metrics hover near boundary thresholds.

### 6. 🎛️ Interactive Metric Controller & HUD
- Real-time hardware sliders (CPU, RAM, Disk) for live state simulation.
- Force Rest mode toggle switch.
- Live Performance HUD with instant state badge indicators.

---

## 🏗️ Architecture & Project Structure

```text
lofi_bun_companion/
├── AGENTS.md                  # Master guidelines, tech stack & protocols
├── README.md                  # Project overview & documentation
├── CHANGELOG.md               # Version history (Keep a Changelog 1.1.0)
├── non-docs/
│   ├── tasks/                 # Dated task plans & implementation roadmaps
│   ├── devlogs/               # Daily progress & architectural decision logs
│   └── specs/                 # Technical specifications & ADRs
└── lofi-bun-companion/        # Application Source Code
    ├── src-tauri/             # Tauri Rust Desktop Core (sysinfo sampler & IPC commands)
    ├── src/
    │   ├── assets/sprites/    # SVG Vector Spritesheets (6 companions & 6 overlay props)
    │   ├── components/
    │   │   ├── Desktop/       # CompactMascotView, PetContextMenu, WindowHeader
    │   │   ├── Pet/           # PetSprite Pure CSS step animator
    │   │   └── Controls/      # MockMetricController simulation sliders
    │   ├── data/              # Pluggable Companion Registry (companionRegistry.ts)
    │   ├── stores/            # Zustand state management (companionStore)
    │   ├── telemetry/         # Pluggable telemetry engine (Native & WebMock)
    │   ├── utils/             # State resolver & hysteresis math utilities
    │   ├── types/             # TypeScript type definitions (companion, desktop)
    │   └── __tests__/         # Vitest automated test suites (138 tests)
    ├── package.json
    └── vite.config.ts
```

---

## 🛡️ 5-Pillar Automated Quality Gates

Every release is strictly verified against 5 automated quality pillars:

```bash
npm run verify
```

```
┌────────────────────────────────────────────────────────────┐
│              5-Pillar Quality Gate Pipeline                │
├─────────────────┬──────────────────────────────────────────┤
│ 1. Linting      │ npm run lint         (ESLint v9 Flat)   │
│ 2. Formatting   │ npm run format:check (Prettier)          │
│ 3. Type Safety  │ npm run typecheck    (tsc --noEmit)      │
│ 4. Unit Tests   │ npm test             (Vitest - 138 test) │
│ 5. Build        │ npm run build        (Vite Production)   │
└─────────────────┴──────────────────────────────────────────┘
```

---

## 🚀 Quickstart & Development

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### Installation & Run Locally

```bash
# Clone the repository
git clone https://github.com/vavinon/lofi-bun-companion.git
cd lofi_bun_companion/lofi-bun-companion

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Run Tests & Verification

```bash
# Run Vitest unit tests in watch mode
npm run test:watch

# Run Vitest single run
npm test

# Run full 5-pillar verification gate
npm run verify
```

---

## 🗺️ Roadmap & Milestones

- [x] **v0.1.0 — Core Sprite Engine & State Machine** *(Completed)*
  - [x] Pure CSS GPU Step Animator (`steps(4)`) & Crisp SVG Vector Spritesheets
  - [x] Hardware-Reactive State Resolver with $\pm 3\%$ Asymmetric Hysteresis
  - [x] Zustand State Store with selective reactive subscriptions (0% CPU Idle)
  - [x] Interactive Simulation Controls & Showcase HUD
  - [x] 59/59 Automated Vitest Suites & Mutation Verification
- [x] **v0.2.0 — Real Hardware Telemetry Engine** *(Completed)*
  - [x] Real Windows OS hardware metrics polling (CPU Utilization, RAM, Disk I/O)
  - [x] Pluggable Telemetry Provider architecture (Native OS vs Web Mock Fallback)
  - [x] Background polling throttling (1.5s - 2.0s) with zero main-thread overhead
  - [x] Automated provider unit tests and store integration verification (84 tests)
- [x] **v1.0.0 — 📦 The Hardware Desk Pet (Official Desktop Release)** *(Completed 🎉)*
  - [x] Lightweight Tauri Desktop Mascot package (.exe single-file on Windows)
  - [x] Frameless, transparent, draggable floating pet window with Always-on-Top
  - [x] Quick Context Menu (Window opacity, telemetry mode, rest toggle, view switcher, exit)
  - [x] Under 35MB RAM footprint and near-zero idle CPU usage
  - [x] Full integration test suite (111/111 tests passing)
- [x] **v1.1.0 — 🐾 Bun & Friends Multiverse (Character Expansion)** *(Completed 🟢)*
  - [x] Unlock 5 additional companion characters (*🐱 Neko, 🐶 Shiba, 🍊 Capybara, 🦜 Cockatiel, 🐬 Dolphin*)
  - [x] Pluggable Companion Registry architecture & dynamic GPU step renderer
  - [x] Character switcher via Quick Context Menu & Dashboard Multiverse Ribbon
  - [x] Complete 12 SVG pixel-art assets and 138 automated unit tests (100% passing)
- [ ] **v2.0.0 — 🍅 The Productivity Update (Pomodoro Focus Suite)**
  - [ ] Configurable 25/5 Pomodoro interval timer with auto-rest hooks for companion
  - [ ] Daily focus streak tracker and break reminder cues
- [ ] **v3.0.0 — 🎧 The Soundscape Update (Ambient Lo-fi Audio Mixer)**
  - [ ] Multi-channel Web Audio soundscape mixer (Lo-fi beats, rain, mechanical keyboard clicks, cafe murmur)
  - [ ] Independent audio channel volume controls and mute presets

---

## 📄 License & Attribution

- **Original Character & Artwork**: All vector sprites and pixel graphics are 100% original artwork designed for Lo-fi Bun Companion.
- **Code License**: Released under the [MIT License](LICENSE).
