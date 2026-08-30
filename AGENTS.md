# 🐰 Lo-fi Bun Companion — Agent Operating Guidelines & Project Framework

## 1. 🗣️ Language & Communication Policy
- **User Interaction & Collaboration (🇹🇭 Thai)**: 
  - Always converse, brainstorm, discuss architecture, and explain concepts in **Thai** for natural, clear, and nuanced communication.
- **Codebase & Technical Assets (🇬🇧 English)**: 
  - All source code, comments, JSDoc/TSDoc, commit messages, variable/type names, and file names MUST be in **English**.
- **Documentation (`non-docs/`) (🇹🇭 / 🇬🇧 Hybrid)**: 
  - Technical specs and architecture headers in English, supplemented with clear Thai summaries and explanations.

---

## 2. 📋 Core Workflow Protocol: "Plan-First Alignment"
1. **Plan First**: Before writing or modifying non-trivial code, the Agent MUST create a dated implementation plan in `non-docs/tasks/YYYY-MM-DD-<version>-<task-name>.md`.
2. **Visual Explanation**: Always use **Mermaid diagrams** or flowcharts to represent state machines, user flows, and component architecture.
3. **User Alignment**: Discuss tradeoffs (Pros & Cons) and wait for user confirmation before executing changes.
4. **Atomic & Non-Destructive Execution**: Implement changes in modular, verifiable steps. Never delete files or alter project-wide structure without explicit user agreement.
5. **Verification & 5-Pillar Automated Quality Gates (`npm run verify`)**: 
   - Before completing any task or making a commit, all 5 quality pillars MUST pass with 0 errors:
     1. **Linting**: `npm run lint` (ESLint v9 flat config — no dead code, proper React hooks dependencies)
     2. **Formatting**: `npm run format:check` (Prettier code style enforcement)
     3. **Type Safety**: `npm run typecheck` (`tsc --noEmit` strict type analysis)
     4. **Automated Unit Tests**: `npm test` (Vitest suites for state machine, timers, stores)
     5. **Build Integrity**: `npm run build` (Vite production bundle verification)
   - Combined verification script: `npm run verify` runs all 5 gates in sequence.

---

## 2.1 🏷️ Engineering & Collaboration Standards

### A. Versioning Standard: **SemVer 2.0.0 (Semantic Versioning)**
- Format: `MAJOR.MINOR.PATCH` (e.g. `0.1.0`, `0.2.0`, `1.0.0`).
- **`0.y.z`**: Initial development / Prototype phase.
- **`MAJOR` (`X.0.0`)**: Incompatible architectural/breaking changes.
- **`MINOR` (`0.X.0` / `1.X.0`)**: New backward-compatible features.
- **`PATCH` (`0.0.X` / `1.0.X`)**: Backward-compatible bug fixes & minor tweaks.
- Git release tags MUST use `v<MAJOR>.<MINOR>.<PATCH>` (e.g. `v0.1.0`).

### B. Commit Standard: **Conventional Commits 1.0.0**
- Commit format: `<type>(<scope>): <description>` (in English, imperative mood, lowercase subject).
- **Types**:
  - `feat`: New feature (e.g. `feat(renderer): implement pure css step animator`)
  - `fix`: Bug fix (e.g. `fix(hysteresis): fix threshold boundary check`)
  - `refactor`: Code change without behavioral change (e.g. `refactor(store): extract pure state resolver`)
  - `perf`: Performance optimization (e.g. `perf(renderer): reduce repaint cycles during idle`)
  - `test`: Adding or updating test suites (e.g. `test(utils): add tests for hysteresis buffer`)
  - `docs`: Documentation updates (e.g. `docs(spec): align roadmap to semver 2.0.0`)
  - `chore`: Maintenance, dependencies, toolchain (e.g. `chore(deps): configure eslint flat config`)

### C. Git Operations & Branching Strategy
- **Branch Hierarchy & Clear Prefixes**:
  - `main`: Release-ready code & production tags (`v1.0.0`).
  - `dev`: Active integration branch.
  - **Development Features (from `dev`)**: `dev-feat/<semver>-<slug>` (e.g. `dev-feat/0.1.0-core-sprite-engine`)
  - **Development Bugfixes (from `dev`)**: `dev-fix/<slug>` (e.g. `dev-fix/hysteresis-jitter`)
  - **Production Hotfixes (from `main`)**: `prod-hotfix/<slug>` (e.g. `prod-hotfix/audio-crash`)
  - **Chore / Docs Branch**: `dev-chore/<slug>` or `dev-docs/<slug>`
- **Decoupled & Manual Approval Protocol**:
  - **`git commit`**: Local only. Used only after `npm run verify` passes 100%, and with explicit user approval.
  - **`git push`**: Remote synchronization. **NEVER chained automatically after commit**. Pushing to remote is a strictly separate step requiring its own explicit confirmation.
  - The Agent MUST NEVER execute automated commit-and-push chains (`git commit ... && git push`).

### D. Architectural Decision Records (ADRs) & Changelog
- Significant architectural choices are documented in `non-docs/specs/adr/ADR-XXX-<title>.md`.
- Milestone releases maintain a `CHANGELOG.md` following **Keep a Changelog 1.1.0** format.
- Daily progress & decision logs are tracked in `non-docs/devlogs/YYYY-MM/YYYY-MM-DD.md`.

---

## 2.1 🧼 Code Simplicity, Modularity & Commenting Standards
1. **KISS Principle (Keep It Simple, Clean & Understandable)**:
   - Always prefer simple, straightforward, and readable solutions over clever, complex, or over-engineered abstractions.
   - Avoid deep nesting, premature micro-optimizations, and bloated helper layers.
2. **Granular File Modularity (Single Responsibility)**:
   - Keep files small, focused, and organized by domain (ideally under 100–150 lines per file).
   - Strictly separate:
     - `types/`: Type definitions and constants only (no UI/logic).
     - `stores/`: Pure state transitions & business logic.
     - `components/`: Pure visual widgets decoupled from heavy math logic.
     - `utils/`: Reusable, side-effect-free pure helper functions.
3. **Clear & Intentional English Comments**:
   - Write clear JSDoc and inline comments explaining **"WHY"** a design or formula exists (not just re-stating what code does).
   - Document state transition triggers, priority orders, and CSS animation step math so anyone can debug instantly.

---

## 3. 🗂️ Workspace Directory Structure

```text
c:/DevProjects/lofi_bun_companion/
├── AGENTS.md                  # Master guidelines, tech stack & protocols (this file)
├── non-docs/
│   ├── tasks/                 # Dated task plans (YYYY-MM-DD-<topic>.md)
│   │   └── templates/         # Task templates
│   ├── devlogs/               # Daily progress & decision logs (YYYY-MM/YYYY-MM-DD.md)
│   ├── specs/                 # Technical specs, state diagrams & ADRs
│   └── notes/                 # Brainstorming, inspirations & sound/sprite assets
└── lofi-bun-companion/        # Application Source Code
    ├── src/
    │   ├── assets/            # Sprites, icons, and static images
    │   ├── components/        # UI and visual widgets (Floating pet, Mini widget, Full view)
    │   ├── hooks/             # Custom React hooks (System metrics, Timer, Audio)
    │   ├── stores/            # Zustand state stores
    │   ├── utils/             # Audio, time, math, and system monitor utilities
    │   ├── types/             # TypeScript definitions
    │   └── __tests__/         # Automated Vitest unit & integration test suites
    └── public/
        └── sounds/            # Lo-fi loops, ambient audio, and SFX
```

---

## 4. 🎮 Project Overview: Lo-fi Bun Companion
A cozy, lightweight Virtual Desk Companion featuring an animated bunny character, real-time hardware monitor (RunCat/Bongo Cat style), Pomodoro focus timer, and ambient soundscape mixer.

### Core Modules & Lean Phased Delivery
- **Phase 1 (v0.1.0 - Done 🟢)**: Hardware-Reactive Bunny State Machine (Idle, Focus, Frenzy, Disk, Rest, Heavy RAM carrot prop, pure CSS step animator).
- **Phase 2 (v0.2.0 - Next 🎯)**: Windows Real Hardware Telemetry Engine (CPU, RAM, Disk OS polling with zero main-thread overhead).
- **Phase 3 (v1.0.0 - Official Launch 📦)**: The Hardware Desk Pet (.exe / Tauri Desktop Mascot with transparent, frameless floating window & context menu).
- **Phase 4 (v1.1.0 - Character Expansion 🐾)**: Bun & Friends Multiverse (Unlocking 5 companions: Neko, Shiba, Capybara, Cockatiel, Dolphin).
- **Phase 5 (v2.0.0 - Productivity 🍅)**: Pomodoro Focus Suite (Configurable 25/5 intervals, daily focus streak, automated companion sleep hooks on break).
- **Phase 6 (v3.0.0 - Soundscape 🎧)**: Ambient Lo-fi Audio Mixer (Multi-channel independent audio channels: beats, rain, keyboard clicks, cafe murmur).

### Tech Stack & Principles
- **Frontend**: React + Vite + TypeScript + CSS Modules (for pixel-art rendering)
- **State Management**: Zustand (Selective Subscriptions with `subscribeWithSelector`)
- **System Monitoring**: Lightweight system metrics hook (polling intervals: 1.5–2.0s)
- **Audio Engine**: Native Web Audio API / Howler.js (v3.0.0)
- **Animation**: Pure CSS Spritesheet / Keyframes for 0.0% CPU usage on idle
- **Automated Testing**: Vitest + React Testing Library (Fast unit & integration tests)
- **Desktop Packaging**: Tauri (Lightweight desktop wrapper on Windows)
- **Modularity & Performance**: Strictly decouple Hardware Polling, Audio, Timer, and Character Animation states with minimal CPU/RAM footprint (<35MB RAM, ~0.0% CPU on idle).