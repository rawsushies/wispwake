# Changelog

All notable changes to **Wispwake — A Journey Through a Sleeping World** are documented in this file.

## [0.5.0] — Milestone 5: The Complete Adventure

### Added
- **Expanded 4-Chapter Story Campaign (`levelData.ts`, `LevelRegistry.ts`)**:
  - Expanded every campaign chapter to `11,200–12,800` logical units with **10 distinct named sub-areas**, `23–27` platforming structures, `4` Resonance Cairn checkpoints, and `2` optional secret **Memory Echo** lore shrines (`8` total across the campaign):
    - **Chapter 01 — The Sleeping Canopy**: *01. The First Awakening* through *10. The First Bloom Sanctuary*.
    - **Chapter 02 — The Moonlit Marsh**: Introduces **Water Currents** (`waterCurrents`), drifting lily organisms, sunken bell shrines, and the Marsh Lotus.
    - **Chapter 03 — The Hollow Below**: Introduces rhythmic **Spore Vents** (`sporeVents`), **Crumbling Surfaces** (`crumblingPlatforms`), **Falling Debris** (`fallingDebris`), and the Root-Heart Chamber.
    - **Chapter 04 — The Windward Ruins**: Introduces skyward **Wind Zones & Updrafts** (`windZones`), crumbling sky-stones, double Drifter transfers, and the Great Crown Bloom ending.
- **True Story & Wake Trials Difficulty System (`LevelRegistry.ts`, `SaveManager.ts`)**:
  - Independent **Story Difficulty** (`Easy`, `Medium`, `Hard`, `Extreme`) and **Wake Trials Difficulty** (`Easy`, `Medium`, `Hard`, `Extreme`).
  - Story Difficulty dynamically adapts Bloom platform duration (`6.8s` / `5.2s` / `4.1s` / `3.35s`), crumbling ledge escape windows, Drifter cycle speed, hazard density, and checkpoint spacing without making Nima's movement sluggish.
- **Rebuilt Wake Trials & Simulation-Based Traversal Validator (`WakeTrialsGenerator.ts`, `TraversalSimulationValidator.ts`)**:
  - Expanded segment counts to `12–16` (`Easy`), `16–20` (`Medium`), `22–26` (`Hard`), and `28–36` (`Extreme`) across **15 curated segment archetypes**.
  - Built `TraversalSimulationValidator.ts` with step-by-step kinematic jump trajectory integration (`dt = 1/60s`), Wake range/duration verification, and Route Graph BFS reachability proof (verified across 200 deterministic seeds).
- **Menu Redesign & About Wispwake (`App.tsx`)**:
  - Streamlined Title Screen to **three primary buttons**: `PLAY`, `SETTINGS`, `CREDITS`.
  - Created the **Combined Play Selection Interface** with tabs for **STORY JOURNEY** and **WAKE TRIALS**.
  - Upgraded **CREDITS** into **ABOUT WISPWAKE** featuring `GAME WORLD`, `STORY`, and a clickable external link to `https://github.com/rawsushies/wispwake`.
- **Expanded Narrative & Pip Dialogue (`dialogueData.ts`, `DialogueManager.ts`)**:
  - Expanded to 46 authored Pip story lines, environmental mechanic callouts, midpoint lore revelations, and 8 optional Memory Echoes.

### Fixed
- **Bug Priority A — Nima Running Animation (`CharacterArtManager.ts`)**:
  - Fixed character proportion/height shrinking and design mismatch during running by locking Nima's upper body/head/hair/cloak/seed to `nima_side_gameplay_master`, cleanly masking out the standing legs below the tunic hem, and rendering a 10-frame biomechanical articulated leg stride (`Contact`, `Downward`, `Passing`, `High Point`, `Recovery`) with independent Front and Rear legs and dynamic cloak tail.
- **Bug Priority B — Wake Glow Rectangular Boundary (`CharacterArtManager.ts`, `AtlasBuilder.ts`, `WakeSystem.ts`, `LightingSystem.ts`)**:
  - Eliminated rectangular glow boundaries by strictly clipping all sprite-sheet cells (`ctx.clip()`), bounding sprite-local radial halos well inside cell edges, replacing the square-textured `vfx_wake_ring` with pure vector circular multi-band `Phaser.GameObjects.Graphics` waves, and overscanning the `512×288` dynamic lightmap.
- **Bug Priority C — Jellyfish / Drifter Instability (`Drifter.ts`, `Player.ts`, `GameplayScene.ts`)**:
  - Eliminated dual-authority movement jitter by setting `drifter.body.moves = false` and carrying Nima smoothly in both X (`deltaX`) and Y (`surfaceTopY`) via `player.carryOnMovingSurface(deltaX, body.top)`.
- **Bug Priority D — Multi-Checkpoint & Respawn Reliability (`Checkpoint.ts`, `SaveManager.ts`, `GameplayScene.ts`)**:
  - Added support for 4 checkpoints per chapter with `spawnX` clamped strictly inside the supporting platform's bounds and `spawnY` calibrated 4px above `platformTopY`.

---

## [0.4.0] — Milestone 4: Campaign, Companion, Lighting & Platform Expansion
- Added initial 4-chapter campaign structure, Wake Trials prototype, Pip speech bubbles, hybrid 2D/2.5D lighting, and mobile/tablet touch controls.

## [0.3.0] — Milestone 3: Visual & Character Overhaul
- Rebuilt Nima and Pip from canonical side-profile master artwork and upgraded the 6-layer parallax environment.

## [0.2.0] — Milestone 1 & 2: Core Movement & Wake Vertical Slice
- Implemented Phaser 3.87 Arcade Physics controller for Nima and Pip, `WakeSystem`, `BloomPlatform`, `RootBridge`, `Drifter`, `Checkpoint`, and `AncientBloom`.
