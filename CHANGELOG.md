# Changelog

All notable changes to **Wispwake — A Journey Through a Sleeping World** are documented in this file.

## [0.4.0] — Milestone 4: Campaign, Companion, Lighting & Platform Expansion

### Added
- **Four-Chapter Story Campaign (`LevelRegistry.ts`)**:
  - **Chapter 01**: *The Sleeping Canopy* (`canopy` biome)
  - **Chapter 02**: *The Moonlit Marsh* (`marsh` biome with reflective water backdrop, sunken arches, and marsh reeds)
  - **Chapter 03**: *The Hollow Below* (`cavern` biome with subterranean giant roots and bioluminescent purple/mint fungi)
  - **Chapter 04**: *The Windward Ruins* (`ruins` biome with high-altitude stone arches and wind-swept foliage)
- **Procedural Challenge Mode (`Wake Trials`)**:
  - Deterministic seeded platforming challenges across `Easy`, `Medium`, `Hard`, and `Extreme` difficulties (`WakeTrialsGenerator.ts`).
  - Built-in physics traversability validator (`validateLevelTraversability`) ensuring every generated jump gap and elevation change is physically solvable.
  - Live run timer, shareable seed input/randomizer, and personal best records per difficulty.
- **Pip Companion Helper & Narrator (`DialogueManager.ts`, `dialogueData.ts`)**:
  - Authored 24 story narration and contextual puzzle-helper dialogue entries across all 4 chapters.
  - World-matched floating speech bubble positioned near Pip that never obscures Nima, with `Skip` affordance and Subtitle toggle.
- **Hybrid Dynamic 2D / 2.5D Lighting System (`LightingSystem.ts`)**:
  - Real-time MULTIPLY canvas lightmap with localized warm Sap Gold (`#F1C878`) and cool Wake Mint (`#8FE7C7`) illumination from Nima's seed, Pip, Wake pulses, awakened flowers, checkpoints, and Ancient Blooms.
  - Soft 2D projected drop shadows beneath platforms and normal-style directional rim highlights.
  - Configurable lighting quality (`Auto`, `High`, `Balanced`, `Low`).
- **Upper Canopy & Midground Vertical Bands (`LivingEnvironmentSystem.ts`)**:
  - Added overhanging canopy branches, blossom garlands, upper-band vines, and multi-height wisps/birds so the upper viewport feels richly inhabited.
- **Responsive Mobile & Tablet Controls (`InputManager.ts`)**:
  - Unified Keyboard, Multi-Touch, and Gamepad input abstraction with automatic touch detection and portrait-orientation guidance.

### Fixed
- **Nima Running Animation (`CharacterArtManager.ts`)**:
  - Replaced the Milestone 3 lower-body slicing run cycle with a full-body pose-interpolated 10-frame running cycle built from dedicated contact and passing stride pose masters (`nima_run_contact_pose`, `nima_run_passing_pose`).
- **Checkpoint Respawn Reliability (`Player.ts`, `Checkpoint.ts`, `GameplayScene.ts`)**:
  - Fixed the bug where Nima spawned partially inside a platform and fell through after checkpoint respawn by computing exact safe center Y coordinates from platform top surfaces (`Player.getSafeCenterYForPlatformTop`), calling `body.reset(safeX, safeY)`, clearing velocity/input state, and granting `0.85s` respawn protection.

### Removed
- Removed unused `@google/genai` package and stale Gemini metadata from `metadata.json` and `.env.example`.

---

## [0.3.0] — Milestone 3: Visual & Character Overhaul
- Rebuilt Nima and Pip from canonical side-profile master artwork with background chroma/luma keying.
- Upgraded environment to a 6-layer parallax system with birds, canopy wisps, hanging vines, and player-reactive surface ferns.
- Replaced rectangular blocks with organic root and mossy stone formations (`TerrainVisualAssembler.ts`).
- Removed developer telemetry and AI studio drawers from player-facing UI.

## [0.2.0] — Milestone 1 & 2: Core Movement & Wake Vertical Slice
- Implemented Phaser 3.87 Arcade Physics controller for Nima (`coyoteTime`, `jumpBuffer`, variable jump height) and spring-damper companion Pip.
- Implemented `WakeSystem` radial pulse mechanic and `BloomPlatform`, `RootBridge`, `Drifter`, `Checkpoint`, and `AncientBloom`.
