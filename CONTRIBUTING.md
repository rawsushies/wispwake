# Contributing to Wispwake

Thank you for your interest in contributing to **Wispwake — A Journey Through a Sleeping World**! Whether you are fixing a physics edge case, authoring new Pip companion dialogue, designing a new biome, or improving mobile touch ergonomics, we welcome your contributions.

---

## 1. Local Development Setup

### Prerequisites
- **Node.js**: `v20+` recommended
- **npm**: `v10+`

### Installation & Running Locally
```bash
git clone https://github.com/rawsushies/wispwake.git
cd wispwake
npm install
npm run dev
```
The development server runs at `http://localhost:3000`.

### Type-Checking & Production Build
```bash
npm run lint
npm run build
```
Always ensure both `npm run lint` (`tsc --noEmit`) and `npm run build` pass with zero errors before opening a Pull Request.

---

## 2. Project Architecture & Code Style

- **Canonical Design Specification**: Read `Wispwake — Game Design & Visual Bible` and [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) before modifying core gameplay or visual systems.
- **Separation of Collision & Art**: Platform collision boxes (`Phaser.Physics.Arcade.StaticGroup`) must remain crisp and predictable, while organic root/moss/stone visuals (`TerrainVisualAssembler.ts`) extend around the collision bounds with a clear top rim highlight.
- **Physics Tuning**: Nima's movement feel (`src/game/config/physicsTuning.ts`) is carefully tuned (`maxRunSpeed: 210`, `jumpVelocity: -410`, `coyoteTimeMs: 100`, `jumpBufferMs: 110`). Do not alter movement constants unless addressing a specific physics issue.
- **Palette Discipline**: Use the canonical Veilgrove color tokens defined in `src/game/config/palette.ts`.

---

## 3. Adding Dialogue, Levels, or Wake Trials

- **Pip Companion Dialogue**: Add or edit entries in `src/game/dialogue/dialogueData.ts`. Ensure story triggers have `oncePerSave: true` and concise, non-intrusive lines.
- **Campaign Chapters**: Chapter definitions live in `src/game/systems/LevelRegistry.ts` and `src/game/levels/sleepingCanopy/levelData.ts`.
- **Procedural Wake Trials**: If modifying `src/game/systems/WakeTrialsGenerator.ts`, ensure `WakeTrialsGenerator.validateLevelTraversability(level)` passes for all generated seeds across `easy`, `medium`, `hard`, and `extreme`.

---

## 4. Pull Request Checklist

1. Branch from `main` using a descriptive name (`fix/checkpoint-respawn`, `feat/marsh-flora`, etc.).
2. Verify `npm run lint` and `npm run build` succeed cleanly.
3. Test keyboard, mouse, and mobile touch controls (`Settings -> On-Screen Touch Controls -> Always On`).
4. Include screenshots or short WebP/GIF captures for any visual or UI changes.
