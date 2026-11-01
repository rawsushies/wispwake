# Wispwake — Asset Provenance & Runtime Manifest (Milestone 5)

Every visual and audio asset in **Wispwake — A Journey Through a Sleeping World** is cataloged below with its canonical source, resolution, runtime texture key, and honest verification status (`PLANNED`, `GENERATED`, `INTEGRATED`, `RUNTIME TESTED`, `APPROVED`).

---

## 1. Canonical Character & Companion Art Masters

| Asset ID | File Path | Source / Provenance | Dimensions | Runtime Key / Atlas | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ref_nima_pip_concept` | `src/assets/images/ref_nima_pip_concept_1793515706089.jpg` | Original AI-Generated Concept Art (Visual Bible Sec. 05) | `1024×1024` | Credits & Visual Bible Reference | `APPROVED` |
| `nima_side_gameplay_master` | `src/assets/images/nima_side_gameplay_master_1793518602554.jpg` | Original AI-Generated Side-Profile Gameplay Master | `1024×1024` | `nima_master_raw` → `nima_sheet` (All 28 frames: Idle, 10-frame Biomechanical Run, Jump, Fall, Land, Wake) | `APPROVED` |
| `nima_run_contact_pose` | `src/assets/images/nima_run_contact_pose_1793520804478.jpg` | Original AI-Generated Stride Reference Pose | `1024×1024` | Reference asset (superseded in runtime by identity-locked `nima_master_raw` biomechanical rig) | `APPROVED` |
| `nima_run_passing_pose` | `src/assets/images/nima_run_passing_pose_1793520806672.jpg` | Original AI-Generated Stride Reference Pose | `1024×1024` | Reference asset (superseded in runtime by identity-locked `nima_master_raw` biomechanical rig) | `APPROVED` |
| `pip_gameplay_master` | `src/assets/images/pip_gameplay_master_1793518604109.jpg` | Original AI-Generated Luminous Moth-Sprite Master | `1024×1024` | `pip_master_raw` → `pip_sheet` (Frames 0..21) | `APPROVED` |

---

## 2. Multi-Biome Environment & Parallax Plates (Chapters 01–04)

| Asset ID | File Path | Source / Provenance | Dimensions | Parallax / Layer Role | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `bg_canopy_far_sky` | `src/assets/images/bg_canopy_far_sky_1793515701725.jpg` | Original AI-Generated Chapter 01 Twilight Canopy Plate | `1344×768` | Chapter 01 Far Sky (`0.05x`) | `APPROVED` |
| `bg_moonlit_marsh_plate` | `src/assets/images/bg_moonlit_marsh_plate_1793520808533.jpg` | Original AI-Generated Chapter 02 Moonlit Marsh Plate | `1344×768` | Chapter 02 Far Sky (`0.05x`) | `APPROVED` |
| `bg_hollow_below_plate` | `src/assets/images/bg_hollow_below_plate_1793520810711.jpg` | Original AI-Generated Chapter 03 Hollow Below Cavern Plate | `1344×768` | Chapter 03 Far Sky (`0.05x`) | `APPROVED` |
| `bg_windward_ruins_plate` | `src/assets/images/bg_windward_ruins_plate_1793520811669.jpg` | Original AI-Generated Chapter 04 Windward Ruins Plate | `1344×768` | Chapter 04 Far Sky (`0.05x`) | `APPROVED` |
| `env_distant_canopy_silhouettes` | `src/assets/images/env_distant_canopy_silhouettes_1793518606630.jpg` | Original AI-Generated Layer 2 Distant Canopy Plate | `1344×768` | Layer 2 Distant Trees (`0.14x`) | `APPROVED` |
| `bg_canopy_giant_roots` | `src/assets/images/bg_canopy_giant_roots_1793515703954.jpg` | Original AI-Generated Layer 3 Midground Forest Plate | `1344×768` | Layer 3 Midground Forest (`0.26x`) | `APPROVED` |
| `env_near_twisted_roots` | `src/assets/images/env_near_twisted_roots_foliage_1793518606409.jpg` | Original AI-Generated Layer 4 Near Root Archways (Keyed) | `1344×768` | Layer 4 Near Arches (`0.46x`) | `APPROVED` |
| `ref_ancient_bloom_shrine` | `src/assets/images/ref_ancient_bloom_shrine_1793515704899.jpg` | Original AI-Generated Ancient Bloom Shrine Illustration | `1344×768` | Chapter Completion & Shrine Reference | `APPROVED` |

---

## 3. Procedural Canvas Atlases, Environmental Mechanics & Dynamic Lighting (`AtlasBuilder`, `TerrainVisualAssembler`, `LightingSystem`)

| Runtime Key | Generator Module | Dimensions | Purpose | Status |
| :--- | :--- | :--- | :--- | :--- |
| `nima_sheet` | `CharacterArtManager.ts` | `768×672` (41 frames) | Identity-locked character atlas (`idle`, 10-frame biomechanical `run`, `jump`, `fall`, `land`, `wake`) with strictly clipped cell bounds | `APPROVED` |
| `pip_sheet` | `CharacterArtManager.ts` | `336×224` (22 frames) | Articulated 4-wing moth companion sheet (`hover`, `dart`, `pulse`) | `APPROVED` |
| `bloom_platform_sheet` | `AtlasBuilder.ts` | `560×480` (16 frames) | Wake-reactive BloomPlatform (`dormant`, `awakening`, `active`, `closing`) with cell-clipped halo | `APPROVED` |
| `root_bridge_sheet` | `AtlasBuilder.ts` | `520×420` (10 frames) | Wake-reactive RootBridge (`recessed`, `extending`, `extended`) | `APPROVED` |
| `drifter_sheet` | `AtlasBuilder.ts` | `640×312` (12 frames) | Translucent gliding Drifter organism (`calm`, `resonating`) | `APPROVED` |
| `checkpoint_cairn_sheet` | `AtlasBuilder.ts` | `480×272` (10 frames) | Resonance Cairn lantern checkpoint (`dormant`, `activating`, `active`) | `APPROVED` |
| `ancient_bloom_sheet` | `AtlasBuilder.ts` | `1120×780` (12 frames) | Chapter Finale Ancient Bloom Shrine (`dormant`, `opening`, `open`) | `APPROVED` |
| `crumbling_platform_sheet` | `AtlasBuilder.ts` | `640×52` (4 frames) | Fractured bark/sky-stone crumbling surface (`solid`, `cracking 1..3`) | `APPROVED` |
| `spore_vent_sheet` | `AtlasBuilder.ts` | `228×64` (3 frames) | Subterranean rhythmic spore vent chimney (`calm`, `telegraph`, `burst`) | `APPROVED` |
| `falling_debris_sheet` | `AtlasBuilder.ts` | `96×68` (2 frames) | Cavern & ruin overhead stalactite/stone (`resting`, `warning/falling`) | `APPROVED` |
| `memory_echo_sheet` | `AtlasBuilder.ts` | `352×104` (4 frames) | Optional Memory Echo lore crystal (`dormant`, `awakened`) | `APPROVED` |
| `org_plat_*` | `TerrainVisualAssembler.ts` | Dynamic per platform | Multi-biome organic root/stone/marsh/cavern/ruin terrain formations | `APPROVED` |
| `dynamic_lightmap_rt` | `LightingSystem.ts` | `512×288` (overscanned) | Real-time MULTIPLY darkness & 4-stop circular radial dynamic lightmap | `APPROVED` |
