<div align="center">

# Wispwake — A Journey Through a Sleeping World

**A 2D Hand-Painted Cinematic Exploration Platformer Set in the Twilight Veilgrove**

[![License: MIT](https://img.shields.io/badge/Code_License-MIT-8FE7C7.svg?style=flat-square)](./LICENSE)
[![Art License: CC BY-NC 4.0](https://img.shields.io/badge/Art_License-CC_BY--NC_4.0-F1C878.svg?style=flat-square)](./ASSET_LICENSE.md)
[![Engine: Phaser 3.87](https://img.shields.io/badge/Engine-Phaser_3.87-B7A2E8.svg?style=flat-square)](https://phaser.io/)
[![UI: React 19 + TypeScript](https://img.shields.io/badge/Frontend-React_19_%2B_TypeScript-61DAFB.svg?style=flat-square)](https://react.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-8FE7C7.svg?style=flat-square)](./CONTRIBUTING.md)

<br />

<img src="docs/screenshots/title-screen.webp" alt="Wispwake Title Screen — The Sleeping Canopy" width="880" />

</div>

---

## Overview

**Wispwake** is a 2D atmospheric exploration platformer where you guide **Nima**—a small forest traveler carrying a warm, living seed—and her bioluminescent moth companion **Pip** through the **Veilgrove**, an ancient tree-world hushed by the *Stillness*.

Instead of combat, Nima interacts with the sleeping ecosystem by releasing a radial pulse of **Wake**:
- **Sleeping Veil-Bells (`BloomPlatform`)** unfurl into temporary glowing leaf-pads.
- **Dormant Tendrils (`RootBridge`)** uncoil across chasms and remain permanently open.
- **Bioluminescent Drifters (`Drifter`)** amplify their glide across mist-filled gaps.
- **Hollow Root Lanterns (`Checkpoint`)** ignite with golden sap light to anchor safe respawn points.
- **Ancient Blooms (`AncientBloom`)** trigger a grand biome restoration that washes warmth and light across all six parallax layers.

---

## Visual Tour & Screenshots

| Title Screen & Attract Mode | Chapter 01 · The Sleeping Canopy |
| :---: | :---: |
| <img src="docs/screenshots/title-screen.webp" alt="Title Screen" width="420" /> | <img src="docs/screenshots/sleeping-canopy-gameplay.webp" alt="Sleeping Canopy Gameplay" width="420" /> |
| **Nima Full-Body Running Stride & Wake** | **Pip Companion Helper & Story Narration** |
| <img src="docs/screenshots/nima-animation.webp" alt="Nima Running Animation" width="420" /> | <img src="docs/screenshots/pip-companion.webp" alt="Pip Companion Bubble" width="420" /> |
| **Chapter 02 · The Moonlit Marsh** | **Hybrid 2D / 2.5D Dynamic Lighting** |
| <img src="docs/screenshots/moonlit-marsh.webp" alt="Moonlit Marsh" width="420" /> | <img src="docs/screenshots/dynamic-lighting.webp" alt="Dynamic 2D/2.5D Lighting" width="420" /> |

<div align="center">
  <img src="docs/screenshots/organic-environments.webp" alt="Multi-Layer Organic Veilgrove Environment" width="860" />
</div>

---

## Key Features (Milestone 4)

- **Four-Chapter Story Campaign (`LevelRegistry.ts`)**:
  1. **Chapter 01 — The Sleeping Canopy**: Twilight boughs, mossy root bridges, and the First Bloom.
  2. **Chapter 02 — The Moonlit Marsh**: Reflective mist waters, sunken stone arches, and glowing cattail reeds.
  3. **Chapter 03 — The Hollow Below**: Subterranean giant root caverns and bioluminescent violet/mint shelf fungi.
  4. **Chapter 04 — The Windward Ruins**: High-altitude carved sky arches and wind-swept foliage at the crown of the Veilgrove.
- **Procedural Challenge Mode (`Wake Trials`)**:
  - Deterministic seeded platforming courses across **Easy**, **Medium**, **Hard**, and **Extreme** difficulties (`WakeTrialsGenerator.ts`).
  - Built-in physics traversability validator (`validateLevelTraversability`) guaranteeing every generated course is solvable without impossible jumps.
  - Shareable seed codes, live speedrun timer, and personal best tracking.
- **Pip as Companion Helper & Story Narrator (`DialogueManager.ts`)**:
  - 24 authored story and puzzle-hint lines across all 4 chapters.
  - World-matched floating speech bubbles near Pip that never obscure Nima, with `Skip` button and Subtitle toggle.
- **Hybrid Dynamic 2D / 2.5D Lighting System (`LightingSystem.ts`)**:
  - Real-time `MULTIPLY` offscreen lightmap with localized warm Sap Gold (`#F1C878`) and cool Wake Mint (`#8FE7C7`) illumination, soft 2D projected platform shadows, and normal-style directional rim highlights.
- **Responsive Desktop, Tablet & Mobile Support (`InputManager.ts`)**:
  - Unified Keyboard, Multi-Touch virtual buttons, and Gamepad support with automatic touch detection and portrait-orientation guidance.

---

## Controls

| Action | Keyboard | Mobile / Tablet Touch | Gamepad |
| :--- | :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` or `Left` / `Right Arrow` | Bottom-Left Left / Right Buttons | Left Stick or D-Pad |
| **Jump (Hold for Height)** | `Space`, `Z`, `W`, or `Up Arrow` | Bottom-Right **Jump** Button | `A` / Cross (`Button 0`) |
| **Release Wake Pulse** | `E`, `X`, or `Enter` | Bottom-Right **Wake** Button | `X` / Square (`Button 2`) or `RB` |
| **Pause / Menu** | `Esc` | Top-Right **Pause** Button | `Start` |

---

## Quick Start & Development

```bash
# 1. Clone the repository
git clone https://github.com/rawsushies/wispwake.git
cd wispwake

# 2. Install dependencies
npm install

# 3. Start the development server (http://localhost:3000)
npm run dev

# 4. Run TypeScript type-checking & build for production
npm run lint
npm run build
```

---

## Repository Structure

```text
wispwake/
├── src/
│   ├── assets/images/               # Hand-painted character masters, running poses & 4 biome backdrops
│   ├── game/
│   │   ├── config/                  # Palette tokens, physics tuning & game configuration
│   │   ├── dialogue/                # Authored Pip companion story & helper dialogue data
│   │   ├── entities/                # Player (Nima), Companion (Pip) & Drifter creature controllers
│   │   ├── levels/                  # Level data structures & Chapter 01–04 authored layouts
│   │   ├── objects/                 # BloomPlatform, RootBridge, Checkpoint & AncientBloom
│   │   ├── scenes/                  # Phaser 3 GameplayScene orchestrator
│   │   └── systems/                 # CharacterArtManager, LivingEnvironmentSystem, LightingSystem,
│   │                                # TerrainVisualAssembler, DialogueManager, WakeTrialsGenerator,
│   │                                # InputManager, SaveManager (Schema v2), AudioManager
│   └── App.tsx                      # React 19 UI shell, modals, Pip bubbles & touch controls
├── docs/
│   ├── ARCHITECTURE.md              # Technical architecture & subsystem breakdown
│   ├── ROADMAP.md                   # Completed milestones & future roadmap
│   └── screenshots/                 # Real captured WebP game screenshots
├── ASSET_MANIFEST.md                # Complete asset provenance & runtime status manifest
├── ASSET_LICENSE.md                 # Artwork (CC BY-NC 4.0) & procedural asset licensing
├── CONTRIBUTING.md                  # Developer workflow & pull request guidelines
└── LICENSE                          # MIT License for source code
```

---

## Documentation & Community

- **[Technical Architecture](./docs/ARCHITECTURE.md)**
- **[Project Roadmap](./docs/ROADMAP.md)**
- **[Asset Manifest](./ASSET_MANIFEST.md)**
- **[Contributing Guide](./CONTRIBUTING.md)**
- **[Code of Conduct](./CODE_OF_CONDUCT.md)**
- **[Security Policy](./SECURITY.md)**

---

## License

- **Source Code**: Licensed under the [MIT License](./LICENSE).
- **Visual Artwork**: Original project artwork in `src/assets/images/` is licensed under [CC BY-NC 4.0](./ASSET_LICENSE.md).
