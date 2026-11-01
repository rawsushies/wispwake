# Wispwake — Asset Provenance & Runtime Manifest (Milestone 4)

Every visual and audio asset in **Wispwake — A Journey Through a Sleeping World** is cataloged below with its canonical source, resolution, runtime texture key, and honest verification status (`PLANNED`, `GENERATED`, `INTEGRATED`, `RUNTIME TESTED`, `APPROVED`).

---

## 1. Canonical Character & Companion Art Masters

| Asset ID | File Path | Source / Provenance | Dimensions | Runtime Key / Atlas | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ref_nima_pip_concept` | `src/assets/images/ref_nima_pip_concept_1793515706089.jpg` | Original AI-Generated Concept Art (Visual Bible Sec. 05) | `1024×1024` | Credits & Visual Bible Reference | `APPROVED` |
| `nima_side_gameplay_master` | `src/assets/images/nima_side_gameplay_master_1793518602554.jpg` | Original AI-Generated Side-Profile Gameplay Master | `1024×1024` | `nima_master_raw` → `nima_sheet` (Idle, Jump, Fall, Land, Wake) | `APPROVED` |
| `nima_run_contact_pose` | `src/assets/images/nima_run_contact_pose_1793520804478.jpg` | Original AI-Generated Full-Body Running Contact Stride Pose | `1024×1024` | `nima_run_contact_raw` → `nima_sheet` (Run Frames 8..17) | `RUNTIME TESTED` |
| `nima_run_passing_pose` | `src/assets/images/nima_run_passing_pose_1793520806672.jpg` | Original AI-Generated Full-Body Running Passing Stride Pose | `1024×1024` | `nima_run_passing_raw` → `nima_sheet` (Run Frames 8..17) | `RUNTIME TESTED` |
| `pip_companion_master` | `src/assets/images/pip_companion_master_1793518605829.jpg` | Original AI-Generated Luminous Moth-Sprite Master | `1024×1024` | `pip_master_raw` → `pip_sheet` (Frames 0..11) | `APPROVED` |

---

## 2. Multi-Biome Environment & Parallax Plates (Chapters 01–04)

| Asset ID | File Path | Source / Provenance | Dimensions | Parallax / Layer Role | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `bg_canopy_far_sky` | `src/assets/images/bg_canopy_far_sky_1793515702210.jpg` | Original AI-Generated Chapter 01 Twilight Canopy Plate | `1344×768` | Chapter 01 Far Sky (`0.05x`) | `APPROVED` |
| `bg_moonlit_marsh_plate` | `src/assets/images/bg_moonlit_marsh_plate_1793520808533.jpg` | Original AI-Generated Chapter 02 Moonlit Marsh Plate | `1344×768` | Chapter 02 Far Sky (`0.05x`) | `RUNTIME TESTED` |
| `bg_hollow_below_plate` | `src/assets/images/bg_hollow_below_plate_1793520810711.jpg` | Original AI-Generated Chapter 03 Hollow Below Cavern Plate | `1344×768` | Chapter 03 Far Sky (`0.05x`) | `RUNTIME TESTED` |
| `bg_windward_ruins_plate` | `src/assets/images/bg_windward_ruins_plate_1793520811669.jpg` | Original AI-Generated Chapter 04 Windward Ruins Plate | `1344×768` | Chapter 04 Far Sky (`0.05x`) | `RUNTIME TESTED` |
| `env_distant_canopy_silhouettes` | `src/assets/images/env_distant_canopy_silhouettes_1793518605060.jpg` | Original AI-Generated Layer 2 Distant Canopy Plate | `1344×768` | Layer 2 Distant Trees (`0.14x`) | `APPROVED` |
| `bg_canopy_giant_roots` | `src/assets/images/bg_canopy_giant_roots_1793515702546.jpg` | Original AI-Generated Layer 3 Midground Forest Plate | `1344×768` | Layer 3 Midground Forest (`0.26x`) | `APPROVED` |
| `env_near_twisted_roots` | `src/assets/images/env_near_twisted_roots_1793518604954.jpg` | Original AI-Generated Layer 4 Near Root Archways (Keyed) | `1344×768` | Layer 4 Near Arches (`0.46x`) | `APPROVED` |
| `ref_ancient_bloom_shrine` | `src/assets/images/ref_ancient_bloom_shrine_1793515708787.jpg` | Original AI-Generated Ancient Bloom Shrine Illustration | `1344×768` | Chapter Completion & Shrine Reference | `APPROVED` |

---

## 3. Procedural Canvas Atlases & Dynamic Lighting Textures (`AtlasBuilder`, `TerrainVisualAssembler`, `LightingSystem`)

| Runtime Key | Generator Module | Dimensions | Purpose | Status |
| :--- | :--- | :--- | :--- | :--- |
| `nima_sheet` | `CharacterArtManager.ts` | `2688×112` (28 frames) | Full-body pose-interpolated character sheet (`idle`, `run`, `jump`, `fall`, `land`, `wake`) | `RUNTIME TESTED` |
| `pip_sheet` | `CharacterArtManager.ts` | `768×64` (12 frames) | Articulated 4-wing moth companion sheet (`hover`, `dart`, `pulse`) | `APPROVED` |
| `bloom_sheet` | `AtlasBuilder.ts` | `384×64` (3 frames) | Wake-reactive BloomPlatform (`dormant`, `opening`, `open`) | `APPROVED` |
| `root_bridge_sheet` | `AtlasBuilder.ts` | `640×48` (2 frames) | Wake-reactive RootBridge (`recessed`, `extended`) | `APPROVED` |
| `drifter_sheet` | `AtlasBuilder.ts` | `192×56` (2 frames) | Bioluminescent beetle-creature platform (`calm`, `amplified`) | `APPROVED` |
| `checkpoint_sheet` | `AtlasBuilder.ts` | `128×96` (2 frames) | Hollow Root Lantern checkpoint (`dormant`, `lit`) | `APPROVED` |
| `ancient_bloom_sheet` | `AtlasBuilder.ts` | `320×160` (2 frames) | Chapter Finale Ancient Bloom Shrine (`dormant`, `restored`) | `APPROVED` |
| `org_plat_*` | `TerrainVisualAssembler.ts` | Dynamic per platform | Multi-biome organic root/stone/marsh/cavern/ruin terrain formations | `RUNTIME TESTED` |
| `env_upper_canopy_bough` | `LivingEnvironmentSystem.ts` | `340×165` | Upper Canopy overhanging branches & bioluminescent blossoms | `RUNTIME TESTED` |
| `dynamic_lightmap_rt` | `LightingSystem.ts` | `320×180` (2× scale) | Real-time MULTIPLY darkness & localized dynamic lightmap | `RUNTIME TESTED` |
