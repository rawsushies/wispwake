# Changelog

All notable changes to **Wispwake — A Journey Through a Sleeping World** are documented in this file.

## [0.6.0] — Milestone 6: The Living Adventure & Native Portrait Mobile Gameplay

### Added
- **Native Portrait Smartphone Gameplay & Live Orientation Switching (`App.tsx`, `CameraController.ts`, `GameplayScene.ts`, `LivingEnvironmentSystem.ts`, `LightingSystem.ts`)**:
  - Full native portrait playability across `9:16`, `9:19`, `9:19.5` smartphones (`320×568` through `430×932`) without requiring phone rotation or rotating the canvas 90 degrees.
  - Dynamic world window sizing (`960×540` in landscape; proportional `~360..480 × 640` world window in portrait) so Nima, Pip, platforms, and hazards remain properly scaled and readable.
  - Responsive portrait camera with forward horizontal anticipation (`±38px` in portrait) and live orientation resizing (`game.scale.resize` + `scene.handleViewportResize`) that preserves Nima's exact position, velocity, checkpoints, and progression when rotating between portrait and landscape.
- **Expanded 6-Chapter Story Campaign (`LevelRegistry.ts`, `levelData.ts`, `EnvironmentalHazardSystem.ts`)**:
  - Added **Chapter 05 — The Shattered Choir (`shattered_choir`)** featuring acoustic Resonance Bells (`ResonanceBellNode`) that awaken linked Bloom chains when rung with Wake.
  - Added **Chapter 06 — The Heart of the Veil (`heart_of_veil`)** featuring Golden Sap Rivers, combined environmental mastery gauntlets, and the First Seed Bloom finale.
- **Friendly NPC System (`NPCManager.ts`)**:
  - Added 4 Veilgrove dwellers (**Oakhaven the Last Gardener**, **Mirel the Tide-Watcher**, **Thornwick the Rootkeeper**, **Solen the Bellkeeper**) with custom painted sprite animations, proximity prompts (`[F] Speak` / touch button), dialogue sequences, and regional quests.
- **Hostile Creature System (`EnemyManager.ts`)**:
  - Added 3 hostile Veilgrove creatures (**Hushed Stalker**, **Gloom Moth**, **Rootbound Sentinel**) with deterministic patrol trajectories, state machines (`patrol`, `alert`, `lunge`, `stunned`), and non-lethal **Wake stun/calm** interactions.
- **Persistent Story Journal & Leaderboard (`StoryJournalManager.ts`, `LeaderboardManager.ts`, `SaveManager.ts`)**:
  - Added a 6-category **Story Journal** (`STORY`, `MEMORIES`, `CHARACTERS`, `PLACES`, `CREATURES`, `QUESTS`) with 34 authored entries, unread badges, and spoiler-safe locked hints.
  - Added a **Leaderboard** system with run scoring, deterministic tie-breaking, and mode/difficulty filtering across all 6 Story Chapters and Wake Trials.
  - Upgraded persistence to **Save Schema V3 (`wispwake_save_v3`)** with automatic migration from V2 and V1.
- **World-Anchored Pip Speech Bubble & Desktop 2.5D Mouse Depth Parallax (`DialogueManager.ts`, `PointerDepthParallaxSystem.ts`)**:
  - Replaced screen-projected HTML speech bubbles with a Phaser-native world-anchored speech bubble above Pip (`depth 34`) with viewport edge clamping and directional tail.
  - Added desktop mouse-driven 2.5D depth parallax across background and foreground botanical layers.
- **Credits World Artwork (`wispwake_world_credits_art_1793528891474.jpg`)**:
  - Generated a full 16:9 hand-painted world illustration of Nima and Pip overlooking the living Veilgrove for the **About Wispwake** modal.

### Fixed
- **Priority 1 — Nima Canonical Clothing & Run Animation (`CharacterArtManager.ts`)**:
  - Removed the unintended extra dark leggings layer during running by erasing the static standing brown trousers up to the cream tunic hem (`relY = 0.592`) while preserving the green leaf-cloak tail, and rendering ONE unified pair of canonical warm-brown cropped trousers (`#765A45`), bare lower ankle (`#E3B696`), and cloth foot-wraps (`#5C4A3B`).
- **Priority 2 — Drifter Collision & Passenger Carrying (`Drifter.ts`, `Player.ts`, `GameplayScene.ts`)**:
  - Fixed Nima falling through Drifters by synchronizing `body.prev` before moving the kinematic body, adding swept top-surface landing detection, and maintaining `ridingMovingSurface` across frames.

---

## [0.5.0] — Milestone 5: The Complete Adventure
- Added 4-Chapter Story Campaign, Story & Wake Trials Difficulty System, Simulation-Based Traversal Validator, and 3-Button Title Screen.
