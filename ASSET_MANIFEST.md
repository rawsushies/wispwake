# Wispwake — Asset Manifest & Production Inventory

This manifest tracks every asset required and implemented for **Wispwake — Chapter 01: The Sleeping Canopy** (Milestones 0, 1, 2, and 3 baseline), adhering strictly to Section 5, Section 9, and Section 13 of *Wispwake — Game Design & Visual Bible*.

## 1. Original AI-Generated Artwork (Priority 1)

| Asset Filename | Category | Intended Purpose | Dimensions | Format | Animation Info | Generation Method / Source | Licence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/src/assets/images/bg_canopy_far_sky_1793515701725.jpg` | `environments/backgrounds` | Far canopy twilight sky and colossal ancient tree silhouettes (`0.08x` parallax) | `1920×1080` (`16:9`) | `JPG` | Static / Slow horizontal scroll | Original AI-Generated (`generate_image` tool) | First-party project asset | **Implemented & Verified** |
| `/src/assets/images/bg_canopy_giant_roots_1793515703954.jpg` | `environments/midgrounds` | Sweeping ancient tree roots, hanging moss, and Veil Teal shafts of mist (`0.22x` parallax) | `1920×1080` (`16:9`) | `JPG` | Layered parallax with restoration tint response | Original AI-Generated (`generate_image` tool) | First-party project asset | **Implemented & Verified** |
| `/src/assets/images/ref_nima_pip_concept_1793515706089.jpg` | `characters/nima` & `pip` | Canonical character reference sheet for Nima (leaf cloak, glowing seed) and Pip (Spirit Lilac & Wake Mint moth wings) | `1024×1024` (`1:1`) | `JPG` | Reference master & Art Forger Studio template | Original AI-Generated (`generate_image` tool) | First-party project asset | **Implemented & Verified** |
| `/src/assets/images/ref_ancient_bloom_shrine_1793515704899.jpg` | `objects/flowers` | Canonical landmark reference for Beat 7 Ancient Bloom shrine atop intertwined roots | `1280×960` (`4:3`) | `JPG` | Reference master & Restoration Vignette | Original AI-Generated (`generate_image` tool) | First-party project asset | **Implemented & Verified** |

---

## 2. Custom Multi-Part Painterly Sprite Atlases & Procedural Textures (Priority 3)

All gameplay sprites and interactive objects are baked at boot into high-resolution transparent PNG/Canvas texture atlases with separated collision bodies and multi-state animations matching the exact hex palette (`#121B2B`, `#1D2D43`, `#294D4D`, `#57725B`, `#78906A`, `#A7B8AE`, `#8FE7C7`, `#F1C878`, `#B7A2E8`, `#E98372`).

| Asset Key | Category | Intended Purpose | Dimensions | Format | Animation States & Frames | Generation Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `nima_sheet` | `characters/nima` | Protagonist wanderer sprite sheet (`88px` visible height, `36×74` trimmed physics hitbox) | `96×112` per frame (`41 frames`) | Transparent Canvas Atlas (`PNG`) | `idle` (8f), `run` (10f), `jump_start` (3f), `rise` (3f), `fall` (3f), `land` (4f), `wake_cast` (6f), `respawn` (4f) | Custom Multi-Part Painterly Rig (`AtlasBuilder.ts`) | **Implemented & Verified** |
| `pip_sheet` | `characters/pip` | Moth-like light companion following Nima with spring kinematics | `56×56` per frame (`22 frames`) | Transparent Canvas Atlas (`PNG`) | `hover` (6f), `follow` (6f), `curious` (4f), `wake_react` (6f) | Custom Multi-Part Painterly Rig (`AtlasBuilder.ts`) | **Implemented & Verified** |
| `drifter_sheet` | `creatures/drifter` | Translucent floating canopy organism acting as a predictable moving traversal platform | `160×104` per frame (`12 frames`) | Transparent Canvas Atlas (`PNG`) | `glide` (8f), `wake_harmonize` (4f) | Custom Multi-Part Painterly Rig (`AtlasBuilder.ts`) | **Implemented & Verified** |
| `bloom_platform_sheet` | `objects/flowers` | Wake-reactive flower bud that unfurls into a temporary (`5.0s`, refreshable) golden platform | `140×120` per frame (`16 frames`) | Transparent Canvas Atlas (`PNG`) | `dormant` (4f), `awakening` (4f), `active` (4f), `closing` (4f) | Custom Multi-Part Painterly Rig (`AtlasBuilder.ts`) | **Implemented & Verified** |
| `root_bridge_sheet` | `objects/roots` | Dormant recessed root tendrils that uncoil into a permanent walkable bridge upon Wake pulse | `260×84` per frame (`10 frames`) | Transparent Canvas Atlas (`PNG`) | `recessed` (2f), `extending` (6f), `extended` (2f) | Custom Multi-Part Painterly Rig (`AtlasBuilder.ts`) | **Implemented & Verified** |
| `checkpoint_cairn_sheet` | `objects/checkpoints` | Resonance Cairn checkpoint that ignites with Sap Gold light on proximity or Wake pulse | `96×136` per frame (`10 frames`) | Transparent Canvas Atlas (`PNG`) | `dormant` (2f), `activating` (4f), `active` (4f) | Custom Multi-Part Painterly Rig (`AtlasBuilder.ts`) | **Implemented & Verified** |
| `ancient_bloom_sheet` | `objects/flowers` | Beat 7 chapter restoration landmark atop the canopy summit | `280×260` per frame (`12 frames`) | Transparent Canvas Atlas (`PNG`) | `sleeping` (4f), `restoring` (4f), `radiant` (4f) | Custom Multi-Part Painterly Rig (`AtlasBuilder.ts`) | **Implemented & Verified** |
| `hazard_bramble_tex` | `environments/terrain` | Ember Coral (`#E98372`) thorn brambles with unmistakable silhouette and motion telegraph | `128×56` | Transparent Canvas (`PNG`) | Animated warning shimmer | Custom Painterly Brush Generator (`AtlasBuilder.ts`) | **Implemented & Verified** |
| `vfx_wake_ring` & `vfx_spore` | `effects/wake` & `particles` | Expanding Wake Mint resonance ring, floating pollen motes, and landing dust puffs | `64×64` / `256×256` | Transparent Additive Sprite | Bounded deterministic particle emitters | Custom Shader/Canvas Generator (`AtlasBuilder.ts`) | **Implemented & Verified** |
| `veilgrove_audio_synth` | `audio/music` & `sfx` | Ambient Veilgrove harmonic pad, footsteps, jump, land, Wake pulse chime, bloom open, root rumble, checkpoint, hazard, and restoration chord | Procedural Web Audio | Web Audio API | Dynamic state-driven audio synthesis with separate Music & SFX volume sliders | Custom Multi-Oscillator Synth (`AudioManager.ts`) | **Implemented & Verified** |
