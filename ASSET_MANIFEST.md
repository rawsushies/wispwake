# Wispwake — Asset Provenance & Runtime Manifest (Milestone 6 + Native Portrait Mobile)

Every visual and audio asset in **Wispwake — A Journey Through a Sleeping World** is cataloged below with its canonical source, resolution, runtime texture key, and honest verification status (`PLANNED`, `GENERATED`, `INTEGRATED`, `RUNTIME TESTED`, `APPROVED`).

---

## 1. Canonical Character, Companion & World Art Masters

| Asset ID | File Path | Source / Provenance | Dimensions | Runtime Key / Atlas | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ref_nima_pip_concept` | `src/assets/images/ref_nima_pip_concept_1793515706089.jpg` | Original AI-Generated Concept Art (Visual Bible Sec. 05) | `1024×1024` | Visual Bible Reference | `APPROVED` |
| `wispwake_world_credits_art` | `src/assets/images/wispwake_world_credits_art_1793528891474.jpg` | Original AI-Generated 16:9 World Illustration (Nima & Pip in the Veilgrove) | `1344×768` | Credits — About Wispwake Hero Illustration | `APPROVED` |
| `nima_side_gameplay_master` | `src/assets/images/nima_side_gameplay_master_1793518602554.jpg` | Original AI-Generated Side-Profile Gameplay Master | `1024×1024` | `nima_master_raw` → `nima_sheet` (41 frames: Idle, 10-frame Canonical Outfit Run, Jump, Fall, Land, Wake) | `APPROVED` |
| `nima_run_contact_pose` | `src/assets/images/nima_run_contact_pose_1793520804478.jpg` | Original AI-Generated Stride Reference Pose | `1024×1024` | Reference asset | `APPROVED` |
| `nima_run_passing_pose` | `src/assets/images/nima_run_passing_pose_1793520806672.jpg` | Original AI-Generated Stride Reference Pose | `1024×1024` | Reference asset | `APPROVED` |
| `pip_gameplay_master` | `src/assets/images/pip_gameplay_master_1793518604109.jpg` | Original AI-Generated Luminous Moth-Sprite Master | `1024×1024` | `pip_master_raw` → `pip_sheet` (Frames 0..21) | `APPROVED` |

---

## 2. Multi-Biome Environment & Parallax Plates (Chapters 01–06)

| Asset ID | File Path | Source / Provenance | Dimensions | Parallax / Layer Role | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `bg_canopy_far_sky` | `src/assets/images/bg_canopy_far_sky_1793515701725.jpg` | Original AI-Generated Chapter 01 Twilight Canopy Plate | `1344×768` | Chapter 01 Far Sky (`0.05x`) | `APPROVED` |
| `bg_moonlit_marsh_plate` | `src/assets/images/bg_moonlit_marsh_plate_1793520808533.jpg` | Original AI-Generated Chapter 02 Moonlit Marsh Plate | `1344×768` | Chapter 02 Far Sky (`0.05x`) | `APPROVED` |
| `bg_hollow_below_plate` | `src/assets/images/bg_hollow_below_plate_1793520810711.jpg` | Original AI-Generated Chapter 03 Hollow Below Cavern Plate | `1344×768` | Chapter 03 Far Sky (`0.05x`) | `APPROVED` |
| `bg_windward_ruins_plate` | `src/assets/images/bg_windward_ruins_plate_1793520811669.jpg` | Original AI-Generated Chapter 04 Windward Ruins Plate | `1344×768` | Chapter 04 Far Sky (`0.05x`) | `APPROVED` |
| `bg_shattered_choir_plate` | `src/assets/images/bg_shattered_choir_plate_1793528889563.jpg` | Original AI-Generated Chapter 05 Shattered Choir Plate | `1344×768` | Chapter 05 Far Sky (`0.05x`) | `APPROVED` |
| `bg_heart_of_veil_plate` | `src/assets/images/bg_heart_of_veil_plate_1793528890608.jpg` | Original AI-Generated Chapter 06 Heart of the Veil Plate | `1344×768` | Chapter 06 Far Sky (`0.05x`) | `APPROVED` |
| `env_distant_canopy_silhouettes` | `src/assets/images/env_distant_canopy_silhouettes_1793518606630.jpg` | Original AI-Generated Layer 2 Distant Canopy Plate | `1344×768` | Layer 2 Distant Trees (`0.14x`) | `APPROVED` |
| `bg_canopy_giant_roots` | `src/assets/images/bg_canopy_giant_roots_1793515703954.jpg` | Original AI-Generated Layer 3 Midground Forest Plate | `1344×768` | Layer 3 Midground Forest (`0.26x`) | `APPROVED` |
| `env_near_twisted_roots` | `src/assets/images/env_near_twisted_roots_foliage_1793518606409.jpg` | Original AI-Generated Layer 4 Near Root Archways (Keyed) | `1344×768` | Layer 4 Near Arches (`0.46x`) | `APPROVED` |
| `ref_ancient_bloom_shrine` | `src/assets/images/ref_ancient_bloom_shrine_1793515704899.jpg` | Original AI-Generated Ancient Bloom Shrine Illustration | `1344×768` | Chapter Completion & Shrine Reference | `APPROVED` |

---

## 3. Procedural Canvas Atlases, NPCs, Creatures & Dynamic Lighting

| Runtime Key | Generator Module | Dimensions | Purpose | Status |
| :--- | :--- | :--- | :--- | :--- |
| `nima_sheet` | `CharacterArtManager.ts` | `768×672` (41 frames) | Identity-locked character atlas (`idle`, 10-frame canonical outfit `run`, `jump`, `fall`, `land`, `wake`) | `APPROVED` |
| `pip_sheet` | `CharacterArtManager.ts` | `336×224` (22 frames) | Articulated 4-wing moth companion sheet (`hover`, `dart`, `pulse`) | `APPROVED` |
| `npc_dwellers_sheet` | `NPCManager.ts` | `384×384` (16 frames) | 4 Veilgrove dweller NPCs (`gardener`, `tide_watcher`, `rootkeeper`, `bellkeeper`) | `APPROVED` |
| `enemy_creatures_sheet` | `EnemyManager.ts` | `432×216` (18 frames) | 3 hostile Veilgrove creatures (`hushed_stalker`, `gloom_moth`, `rootbound_sentinel`) | `APPROVED` |
| `resonance_bell_sheet` | `EnvironmentalHazardSystem.ts` | `360×136` (4 frames) | Wake-reactive bronze/stone Resonance Bell (`dormant`, `ringing`, `awakened`) | `APPROVED` |
| `bloom_platform_sheet` | `AtlasBuilder.ts` | `560×480` (16 frames) | Wake-reactive BloomPlatform (`dormant`, `awakening`, `active`, `closing`) | `APPROVED` |
| `root_bridge_sheet` | `AtlasBuilder.ts` | `520×420` (10 frames) | Wake-reactive RootBridge (`recessed`, `extending`, `extended`) | `APPROVED` |
| `drifter_sheet` | `AtlasBuilder.ts` | `640×312` (12 frames) | Translucent gliding Drifter organism (`calm`, `resonating`) | `APPROVED` |
| `checkpoint_cairn_sheet` | `AtlasBuilder.ts` | `480×272` (10 frames) | Resonance Cairn lantern checkpoint (`dormant`, `activating`, `active`) | `APPROVED` |
| `ancient_bloom_sheet` | `AtlasBuilder.ts` | `1120×780` (12 frames) | Chapter Finale Ancient Bloom Shrine (`dormant`, `opening`, `open`) | `APPROVED` |
| `org_plat_*` | `TerrainVisualAssembler.ts` | Dynamic per platform | 6-biome organic root/stone/marsh/cavern/ruin/choir/heart terrain formations | `APPROVED` |
| `dynamic_lightmap_rt` | `LightingSystem.ts` | `512×512` (overscanned) | Portrait & Landscape adaptive real-time MULTIPLY dynamic lightmap | `APPROVED` |
