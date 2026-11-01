# Wispwake — Project Roadmap

This document tracks completed milestones and future open-source goals for **Wispwake — A Journey Through a Sleeping World**.

---

## Completed Milestones

### Milestone 1 — Foundation & Character Controller (Completed)
- [x] React 19 + Phaser 3.87 Arcade Physics integration (`960×540` FIT scaling).
- [x] Responsive Nima movement (`210 px/s` run, variable jump height, `100ms` coyote time, `110ms` jump buffer, fall gravity multiplier).
- [x] Spring-damper companion controller for Pip (`Pip.ts`) with figure-eight idle hover and curiosity hints.

### Milestone 2 — Signature Wake Mechanic & First Vertical Slice (Completed)
- [x] Radial `WakeSystem` pulse (`150px` radius, `0.65s` expansion, `0.45s` cooldown).
- [x] Interactive ecosystem objects: `BloomPlatform`, `RootBridge`, `Drifter`, `Checkpoint`, and `AncientBloom`.
- [x] Procedural Web Audio API soundscape and harmonic Wake chimes (`AudioManager.ts`).

### Milestone 3 — Visual & Character Overhaul (Completed)
- [x] Canonical hand-painted side-profile character art pipeline (`CharacterArtManager.ts`).
- [x] Six-layer parallax environment (`LivingEnvironmentSystem.ts`) with birds, wisps, hanging vines, and player-reactive ferns.
- [x] Organic root and mossy stone terrain visuals (`TerrainVisualAssembler.ts`) separated from physics collision boxes.
- [x] Clean player-facing UI with bespoke SVG title lockup.

### Milestone 4 — Campaign, Companion, Lighting & Platform Expansion (Completed)
- [x] Full-body pose-based running animation for Nima (`nima_run_contact_pose`, `nima_run_passing_pose`).
- [x] Reliable platform-top checkpoint respawn (`Player.getSafeCenterYForPlatformTop` + `body.reset`).
- [x] Pip Companion Helper & Story Narrator (`DialogueManager.ts`, 24 authored dialogue lines across 4 chapters).
- [x] 4-Chapter Story Campaign (*The Sleeping Canopy*, *The Moonlit Marsh*, *The Hollow Below*, *The Windward Ruins*) with Schema v2 save persistence.
- [x] Procedural Challenge Mode (`Wake Trials`) with deterministic seeds, 4 difficulty tiers, and physics traversability validation.
- [x] Hybrid 2D / 2.5D Dynamic Lighting System (`LightingSystem.ts`) and Upper Canopy vertical band enrichment.
- [x] Unified Keyboard, Multi-Touch, and Gamepad support (`InputManager.ts`).

---

## Future Community Milestones

### Milestone 5 — Extended Ecological Mechanics & Audio
- [ ] **Wind Currents & Gliding Seed Pods**: Updraft channels in *The Windward Ruins* that carry Nima and Pip across high-altitude chasms.
- [ ] **Resonant Echo Stones**: Chime stones that relay a Wake pulse to distant unreachable platforms.
- [ ] **Custom Keybinding Remapper**: In-game UI to rebind keyboard and gamepad buttons.
- [ ] **Speedrun Ghost Recording**: Optional replay ghost of your personal best run in *Wake Trials*.
