# Wispwake — A Journey Through a Sleeping World

A hand-painted 2D cinematic exploration platformer set in the Veilgrove, powered by a decoupled Phaser 3 physics and parallax rendering engine mounted inside a low-occlusion React game shell, complete with an integrated **Veilgrove Art Forger** studio for generating and editing custom 1K/2K/4K world artwork.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and scope decisions have been confirmed and aligned with the canonical *Wispwake — Game Design & Visual Bible (v0.1)*:

- **Confirmed Decision 1 — Hybrid 2D Phaser 3 + React Game Shell**: We will adopt the Visual Bible's canonical 2D hand-painted side-scrolling architecture using **Phaser 3 + Arcade Physics** mounted inside an isolated, non-rerendering full-viewport React container (`960×540` logical resolution scaled responsively with `16:9` safe framing). This resolves the conflict with the generic 3D prompt chip while preserving a crisp React overlay for the Title Screen, Pause/Settings Menu, Debug Telemetry HUD, and Art Forger Drawer.
- **Confirmed Decision 2 — Milestone 0 Baseline + Milestones 1 & 2 First Pass**: Upon approval of this baseline report and asset production plan, our first build execution will deliver **Milestone 1 (Playable Movement Prototype)** and **Milestone 2 (Wake Environmental Interaction System)** together in a cohesive Sleeping Canopy test sanctuary, complete with batch-generated original artwork, composite multi-part character/creature rigs, and toggleable debug hitbox/radius visualization.
- **Confirmed Decision 3 — Pre-Generated Original Artwork + In-App Veilgrove Art Forger Studio**: We will batch-generate core hand-painted environmental backdrops and character reference plates during build execution via `generate_image`, combine them with high-craft multi-part procedural/SVG sprite rigs for fluid 60 FPS animation, and provide an optional **Veilgrove Art Forger** drawer in the Title/Pause menu powered by server-side `gemini-nano-banana-2.1` (prompt creation & image editing) and `gemini-3-pro-image` (1K, 2K, and 4K high-resolution art generation) that can hot-swap custom textures directly into the live game world.

---

## 1. Repository Baseline Inspection Report (Milestone 0)

### 1.1 Existing Architecture & Inventory
- **Framework & Language**: React 19 (`^19.0.1`) + TypeScript (`~7.0.2`) bundled with Vite (`^8.3.0`) and styled with Tailwind CSS v4 (`@tailwindcss/vite ^4.3.3`).
- **Installed Dependencies**: `@google/genai (^2.4.0)`, `express (^4.21.2)`, `lucide-react (^0.546.0)`, `motion (^12.23.24)`, `dotenv`, `tsx`.
- **Entry Points & Scripts**: `index.html` mounts `/src/main.tsx` -> `/src/App.tsx` (currently an empty `<div></div>` scaffold). Available scripts are `dev` (`vite --port=3000 --host=0.0.0.0`), `build`, `preview`, `clean`, and `lint` (`tsc --noEmit`).
- **Existing Assets**: Only the attached specification document (`public/assets/aistudio/Wispwake_Game_Design_Visual_Bible_f2ee6749.pdf`). No game sprites, audio files, or level data exist yet.
- **Implemented vs. Incomplete Features**: Zero game systems exist yet; this is a clean greenfield initialization.

### 1.2 Technical Conflicts & Resolutions
1. **2D Painterly Bible vs. 3D Feature Tag**: Section 1.4 and Section 9.1 of the Visual Bible explicitly state: *"No 3D gameplay... This is not pixel art, not a flat vector game, and not a 3D scene rendered to look 2D."* Confirmed resolution: **Phaser 3 2D WebGL/Canvas** with multi-layer parallax and multi-part articulated 2D character/plant rigs.
2. **Phaser 3 Dependency & Full-Stack Server**: `phaser` is not yet installed in `package.json`, and `@google/genai` requires a server-side Express proxy (`server.ts`) for the Veilgrove Art Forger studio so API keys are never exposed to the browser. We will install `phaser` and configure `server.ts` with Vite middleware on port 3000.
3. **Transparent Multi-Frame Sprite Sheet Constraint**: Because AI image generation produces raster scenes rather than pixel-aligned transparent multi-frame sprite atlases, using raw unmasked AI JPEGs directly as character sprites causes opaque rectangular bounding boxes. We solve this via a **Hybrid Painterly Layer + Articulated Canvas Atlas Pipeline**:
   - **Parallax Environment Plates & Concept Reference Masters** are generated via `generate_image` (and customizable via the in-app Art Forger).
   - **Character, Creature & Interactive Plant Sprite Atlases** are baked at boot time into high-resolution offscreen HTML5 Canvas sprite sheets using multi-part painterly shading, organic bezier brushstrokes, soft radial gradients, and keyframed skeletal kinematics (cloak follow-through, warm seed glow, petal unfurling, and root extension) strictly matching the Visual Bible's exact hex palette and silhouette rules.

---

## 2. User Experience, Visual Direction & World Design

### 2.1 Key Player Flows
1. **Title Screen (The Sleeping Canopy Vista)**: Opens directly into a live, atmospheric Phaser camera pan across the twilight roots of the Veilgrove with drifting mist and floating spores. Features a bespoke inline SVG title lockup (*Wispwake: A Journey Through a Sleeping World*), primary **Play** CTA (`Enter` or `Space`), **Milestone Mode Selector** (Full Sleeping Canopy Slice vs. Movement & Wake Sandbox), **Veilgrove Art Forger** button, **Settings**, and **Credits**, plus a single clean control-hint line (`A/D or Arrows Move · Space/Z Jump · E/X Wake · F1 Debug · Esc Pause`).
2. **First-Play Control Prompt & Awakening (Beats 1–2)**: Nima awakens on an ancient root. A subtle, world-matched control hint fades smoothly once horizontal movement and jumping are performed. Pip hovers nearby with spring-damped motion, subtly orienting toward the first dormant **Bloom Platform** bud to teach the **Wake** (`E` or `X`) pulse.
3. **Wake Environmental Traversal (Beats 3–6)**:
   - **Bloom Crossing**: Pressing Wake emits a soft `Wake Mint (#8FE7C7)` resonance ring (`155` logical units radius, `0.5s` cooldown). Dormant flower buds within range shimmer, unfurl into stable golden-lit platforms for `5.0 seconds` (with a clear visual petal-closing telegraph during the final `1.2 seconds`), and can be refreshed with another pulse.
   - **Root Passage**: Casting Wake near recessed **Root Bridges** permanently uncoils heavy wooden tendrils across wide chasms, creating a persistent walkable route and saving state.
   - **The Drifter & The Hollow**: A translucent bioluminescent **Drifter** glides along a deterministic sine-wave patrol across a misty gap, serving as a predictable moving platform leading into a shadowed hollow where Nima's seed light, Pip's glow, and Ember Coral (`#E98372`) thorn hazards maintain crystal-clear silhouette contrast.
4. **Checkpoint & Deterministic Recovery**: Touching or pulsing a **Resonance Cairn (Checkpoint)** kindles a permanent warm `Sap Gold (#F1C878)` flame. Contacting Ember Coral brambles or falling into the canopy abyss swiftly resets Nima to the active checkpoint in `< 400ms` while restoring temporary platforms and Drifter cycles to a fair, deterministic state.
5. **First Bloom Restoration Payoff (Beat 7)**: Reaching the dormant **Ancient Bloom** landmark at the canopy summit and casting Wake triggers a choreographed restoration cascade: warm golden light washes across the midground foliage, dormant flora bloom in unison, ambient Web Audio swells from sparse stillness into warm harmonic chords, and the **End-of-Slice Restoration Overlay** offers *Replay Slice*, *Continue Free Explore*, or *Return to Title*.
6. **Veilgrove Art Forger Studio (In-App AI Art & Asset Pipeline)**: Accessible from the Title Screen or Pause Menu (`Tab` / Studio button). Players or art directors can:
   - Generate new high-resolution environment layers, concept art, or custom textures using **`gemini-3-pro-image`** with selectable **1K, 2K, or 4K** image size and aspect ratio (`16:9`, `1:1`, `4:3`).
   - Create or edit existing game art using text prompts and reference plates via **`gemini-nano-banana-2.1`**.
   - Apply any generated or edited backdrop directly into the live Phaser parallax scene with one click.

### 2.2 Visual Identity, Palette & Typography
- **Canonical Veilgrove Color System**:
  - **Deep Ink (`#121B2B`)** & **Deep Dusk (`#1D2D43`)**: Deepest shadows, distant canopy silhouettes, and twilight sky masses (60% dominant atmospheric canvas).
  - **Veil Teal (`#294D4D`)**, **Moss Green (`#57725B`)**, & **Soft Leaf (`#78906A`)**: Cool sleeping foliage, midground roots, and readable walkable terrain tops (30% structural surfaces).
  - **Pale Mist (`#A7B8AE`)**: Atmospheric depth separation haze between parallax planes.
  - **Wake Mint (`#8FE7C7`)**, **Sap Gold (`#F1C878`)**, **Spirit Lilac (`#B7A2E8`)**, & **Ember Coral (`#E98372`)**: Strictly reserved 10% focal accent budget for active Wake ripples, Nima's seed and restoration blooms, Pip's ethereal wings, and unmistakable hazard telegraphs.
- **Typography & Low-Occlusion HUD**:
  - **Display Font**: `Cormorant Garamond` / `Fraunces` for storybook chapter titles and the SVG title lockup.
  - **UI & Accessibility Controls**: `Plus Jakarta Sans` for crisp, high-contrast menu buttons, control remapping/prompts, and settings toggles.
  - **Debug & Telemetry Readouts**: `JetBrains Mono` with `tabular-nums` for velocity, coyote/buffer timers, FPS, and active entity states when Debug Mode (`F1`) is enabled.
  - **85%+ Unobstructed Playfield**: During active gameplay, the HUD is virtually invisible—only a subtle corner Pause/Debug affordance and an optional minimal Wake readiness indicator appear, with zero `backdrop-filter` over the active WebGL canvas.

---

## 3. Complete First-Slice Asset Inventory & Production Strategy

### 3.1 Asset Source Classification
To guarantee zero broken images, no unlicensed external rips, and 100% visual cohesion across *The Sleeping Canopy*, assets are divided into three verified tiers:

| Asset ID & Name | Category | Target Dimensions & Format | Animation / States | Production Method | Game Location |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `bg_canopy_far_sky` | Environment (Far Sky) | `1920×1080` JPG/WebP (`16:9`) | Static slow parallax (`0.08x`) | **Priority 1: AI-Generated Original** (`generate_image`) | Sleeping Canopy Layer 0 |
| `bg_canopy_giant_roots` | Environment (Mid/Far) | `1920×1080` JPG/WebP (`16:9`) | Parallax (`0.22x`) + depth mist blend | **Priority 1: AI-Generated Original** (`generate_image`) | Sleeping Canopy Layer 1 |
| `ref_nima_pip_concept` | Character Reference & Title Art | `1024×1024` JPG/PNG (`1:1`) | Reference sheet & Art Studio seed plate | **Priority 1: AI-Generated Original** (`generate_image`) | Title Vignette & Art Forger |
| `ref_ancient_bloom_shrine` | Landmark Reference Art | `1280×960` JPG/PNG (`4:3`) | Dormant vs. Awakened shrine reference | **Priority 1: AI-Generated Original** (`generate_image`) | Beat 7 Landmark & Art Studio |
| `nima_atlas` | Character Sprite Sheet | `1024×1024` Transparent PNG Atlas (`96×112` per frame, `88px` visible height) | `idle` (8f), `run` (10f), `jump_start` (3f), `rise` (3f), `fall` (3f), `land` (4f), `wake_cast` (6f), `respawn` (4f) | **Priority 3: Multi-Part Painterly Canvas Rig** (Consistent silhouette, leaf cloak, glowing chest seed) | `Player.ts` / Gameplay Plane |
| `pip_atlas` | Companion Sprite Sheet | `512×256` Transparent PNG Atlas (`48×48` per frame) | `hover` (6f), `follow` (6f), `curious` (4f), `wake_react` (6f), `rest` (4f) | **Priority 3: Multi-Part Painterly Canvas Rig** (Moth-like translucent lilac/gold wings) | `Pip.ts` / Gameplay Plane |
| `drifter_atlas` | Creature Sprite Sheet | `512×256` Transparent PNG Atlas (`128×96` per frame) | `glide_pulse` (8f), `wake_resonance` (4f) | **Priority 3: Multi-Part Painterly Canvas Rig** (Translucent canopy jellyfish/moth organism) | Beat 5 (`Drifter.ts`) |
| `bloom_platform_atlas` | Interactive Object | `768×256` Transparent PNG Atlas (`128×128` per frame) | `dormant_bud` (4f), `awakening` (5f), `active_bloom` (6f), `closing_warn` (4f) | **Priority 3: Multi-Part Painterly Canvas Rig** (`Wake Mint` veins + `Sap Gold` petals) | Beats 2, 3, 6 (`BloomPlatform.ts`) |
| `root_bridge_atlas` | Interactive Object | `1024×256` Transparent PNG Atlas (`256×96` per frame) | `recessed` (2f), `extending` (8f), `extended_solid` (2f) | **Priority 3: Multi-Part Painterly Canvas Rig** (Twisted bark tendrils + glowing nodes) | Beat 4 (`RootBridge.ts`) |
| `checkpoint_cairn_atlas` | Interactive Object | `512×256` Transparent PNG Atlas (`96×128` per frame) | `unlit` (2f), `igniting` (5f), `lit_loop` (6f) | **Priority 3: Multi-Part Painterly Canvas Rig** | Beat 4/5 Boundary (`Checkpoint.ts`) |
| `ancient_bloom_atlas` | Chapter Landmark | `1024×512` Transparent PNG Atlas (`256×256` per frame) | `sleeping` (4f), `restoring` (8f), `radiant` (6f) | **Priority 3: Multi-Part Painterly Canvas Rig** | Beat 7 (`AncientBloom.ts`) |
| `terrain_tiles_canopy` | Playable Terrain & Hazards |Modular textures (`256×128`, `128×64`) | Mossy root platforms (clear top edge, dark bark underside) + `Ember Coral` bramble hazards | **Priority 3: Painterly Procedural Brush Engine** | Gameplay Collision Plane |
| `vfx_particles` | Visual Effects | `256×256` Transparent Atlas | Wake ripple ring, floating pollen, landing dust, bloom glow | **Priority 3: Custom Additive/Alpha Sprites** | `WakeSystem.ts` & Atmosphere |
| `audio_synth_engine` | Music & SFX | Procedural Web Audio API | Ambient Veilgrove pad, footsteps, jump, land, Wake chime, bloom open, root rumble, restoration chord | **Priority 3: Multi-Oscillator Web Audio Synthesizer** (Zero external licensing risk) | `AudioManager.ts` |

### 3.2 Production-Ready Image Generation Prompts
During the build phase, we will execute a single parallel batch of `generate_image` calls using these exact Visual Bible prompts, and expose them as preset templates inside the **Veilgrove Art Forger**:

1. **`bg_canopy_far_sky` (`16:9`)**:
   > *"Hand-painted 2D fantasy storybook illustration of a vast twilight forest canopy called the Veilgrove, colossal ancient tree silhouettes reaching into a deep dusk sky (#121B2B and #1D2D43), soft atmospheric pale mist (#A7B8AE) drifting between distant branches, painterly gouache and watercolor brush textures, restrained cinematic lighting, no characters, no foreground platforms, wide side-scrolling background plate."*
2. **`bg_canopy_giant_roots` (`16:9`)**:
   > *"Hand-painted 2D side-scrolling midground environment illustration of immense sweeping ancient tree roots and hanging moss in a sleeping magical forest, cool Veil Teal (#294D4D) and Moss Green (#57725B) foliage with subtle shafts of twilight mist, rich organic brushwork like an animated storybook painting, clear depth separation, no text or UI."*
3. **`ref_nima_pip_concept` (`1:1`)**:
   > *"Hand-painted 2D game character concept sheet of Nima, a small curious wanderer with a slightly oversized head, wearing a readable leaf-shaped forest cloak in soft moss tones, cradling a warm glowing golden seed (#F1C878) near the chest, accompanied by Pip, a tiny luminous moth-like companion creature with Spirit Lilac (#B7A2E8) and Wake Mint (#8FE7C7) wings, set against a dark Night Ink (#121B2B) background, storybook fantasy art style."*
4. **`ref_ancient_bloom_shrine` (`4:3`)**:
   > *"Hand-painted 2D fantasy environmental illustration of the Ancient Bloom landmark resting atop intertwined giant roots in the Veilgrove, a monumental bioluminescent lotus-like forest flower radiating warm Sap Gold (#F1C878) and Wake Mint (#8FE7C7) light into a cool twilight grove (#1D2D43), organic painterly brushwork, atmospheric restoration glow."*

---

## 4. Key Product Decisions & Technical Trade-Offs

- **Decision 1: Centralizing Physics & Tuning Values (`physicsTuning.ts`)**
  - *Chosen Approach*: All numerical movement, camera, and Wake parameters specified in Sections 6.1 and 7.2 of the Visual Bible (`referenceWidth: 960`, `referenceHeight: 540`, `moveSpeed: 255`, `groundAcceleration: 1900`, `groundDeceleration: 2100`, `airAcceleration: 1050`, `jumpVelocity: -565`, `gravity: 1450`, `coyoteTime: 0.10`, `jumpBufferTime: 0.12`, `maxFallSpeed: 900`, `wakeRadius: 155`, `wakeCooldown: 0.50`) are stored in a single typed configuration module and live-tunable in the Debug Overlay (`F1`).
  - *Why*: Ensures frame-rate-independent movement feel, crisp variable jump height (releasing Jump early damps upward velocity smoothly without snapping), and effortless playtest tuning.
- **Decision 2: Strict Separation of Collision Geometry & Painted Art**
  - *Chosen Approach*: Platforms, Root Bridges, Bloom Platforms, and Hazards use explicit Arcade Physics bounding boxes with trimmed hitboxes (`Nima` collision body is `36×74` logical units centered inside her `88px` tall painted sprite, excluding her flowing cloak tip and seed halo).
  - *Why*: Prevents the classic platformer defect where players fall through painted edges or snag on decorative foliage. Pressing `F1` renders player hitboxes, platform collision bounds, and the `155px` Wake interaction radius in real time.
- **Decision 3: Server-Side Gemini Proxy for the Veilgrove Art Forger**
  - *Chosen Approach*: Express server (`server.ts`) exposes `/api/art/generate` (`gemini-3-pro-image` with `1K`, `2K`, `4K` resolution selector) and `/api/art/edit` (`gemini-nano-banana-2.1` for text-guided creation and image editing). Before invoking paid image models, the UI triggers `show_aistudio_ui` (`paid_model_flow`) or gracefully informs the user if a paid key is needed.
  - *Why*: Satisfies the attached image creation/editing requirements while keeping API keys strictly server-side and integrating directly with `ASSET_MANIFEST.md` and live Phaser texture hot-swapping.

---

## 5. Technical Architecture & Implementation Roadmap

### 5.1 System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        React Full-Viewport Game Shell                        │
│  ┌────────────────────┐  ┌────────────────────────┐  ┌────────────────────┐  │
│  │ Title / Pause /    │  │ Debug & Physics Tuner  │  │ Veilgrove Art      │  │
│  │ End-of-Slice Menus │  │ Overlay (F1 Hitboxes)  │  │ Forger Drawer (AI) │  │
│  └─────────┬──────────┘  └───────────┬────────────┘  └─────────┬──────────┘  │
└────────────┼─────────────────────────┼─────────────────────────┼─────────────┘
             │ Commands / Events       │ Live Config             │ Texture Swap
             ▼                         ▼                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                Phaser 3 Game Engine (960×540 Logical Canvas)                 │
│  ┌────────────────────┐  ┌────────────────────────┐  ┌────────────────────┐  │
│  │ Boot & Preload     │  │ Procedural & AI Texture│  │ AudioManager       │  │
│  │ Atlas Generator    │  │ Compositor             │  │ (Web Audio Synth)  │  │
│  └─────────┬──────────┘  └───────────┬────────────┘  └─────────┬──────────┘  │
│            └─────────────────────────┼─────────────────────────┘             │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                 GameplayScene (The Sleeping Canopy)                    │  │
│  │  • 6-Layer Parallax Compositor (Far Sky -> Mid Roots -> Foreground)   │  │
│  │  • PlayerController (Accel/Decel, Variable Jump, Coyote, Jump Buffer) │  │
│  │  • CompanionController (Pip Spring Follow, Curiosity Target Look-Ahead)│  │
│  │  • WakeSystem (155u Pulse Ring, Cooldown, Target Eligibility & Events)│  │
│  │  • Interactables: BloomPlatform (5s timer) · RootBridge (Persistent)  │  │
│  │                   Drifter (Sine Patrol) · Checkpoint · AncientBloom   │  │
│  │  • CameraController (42% X / 58% Y Framing, Look-Ahead, Deadzone)     │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
                                       ▲
                                       │ REST (/api/art/generate & /api/art/edit)
┌──────────────────────────────────────┴───────────────────────────────────────┐
│             Express Backend Server (server.ts · @google/genai)               │
│  • POST /api/art/generate -> gemini-3-pro-image (1K / 2K / 4K, Aspect Ratio) │
│  • POST /api/art/edit     -> gemini-nano-banana-2.1 (Text + Image Editing)   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Interactive Component & State Mapping
- **PlayerController (`Player.ts` & `PlayerController.ts`)**: Reads keyboard state (`A/D`, `Left/Right`, `Space/Z`, `E/X`) once per frame into an intent structure. Applies `groundAcceleration` (`1900 u/s²`) and `groundDeceleration` (`2100 u/s²`) on solid terrain, and `airAcceleration` (`1050 u/s²`) airborne. Maintains `coyoteTimer` (`0.10s` after leaving ground without jumping) and `jumpBufferTimer` (`0.12s` prior to landing). Releasing Jump while `velocity.y < 0` multiplies vertical velocity by `0.52` for smooth variable jump height.
- **WakeSystem (`WakeSystem.ts`)**: Triggered on `E` or `X` when `cooldownTimer <= 0`. Emits an expanding `Wake Mint (#8FE7C7)` wave sprite and queries all registered `WakeInteractable` entities within `155` logical units. Valid targets within `240` units display a subtle proximity resonance outline and draw Pip's curiosity gaze so color is never the sole indicator.
- **Interactables & Level Flow (`sleepingCanopy/levelData.ts`)**:
  - **Beat 1 (Awakening)**: Safe giant root terrace (`x: 100..650`) introducing movement and jump feel.
  - **Beat 2 & 3 (First Light & Bloom Crossing)**: Dormant `BloomPlatform` buds (`x: 720..1350`) that open for `5.0s` when pulsed by Wake, allowing Nima to cross the first canopy gap.
  - **Beat 4 (Root Passage & Checkpoint)**: A recessed `RootBridge` (`x: 1450..1850`) that permanently extends across a deep chasm upon Wake activation, leading to the **Resonance Cairn Checkpoint** (`x: 1950`).
  - **Beat 5 (The Drifter)**: A gentle translucent `Drifter` (`x: 2100..2650`) gliding horizontally across a wide misty expanse; pulsing Wake near the Drifter harmonizes its glow and briefly steadies its drift.
  - **Beat 6 (The Hollow)**: A shadowed root cavern (`x: 2750..3450`) combining chained `BloomPlatform` jumps, a secondary `RootBridge`, and `Ember Coral` bramble hazards with clear silhouette contrast.
  - **Beat 7 (First Bloom Landmark)**: The monumental **Ancient Bloom** (`x: 3650..4000`). Casting Wake triggers the chapter restoration event, transforming canopy lighting from muted dusk to warm `Sap Gold`, blooming surrounding flora, and persisting completion in `SaveManager` (`localStorage` schema `v1`).

### 5.3 Milestones 1 & 2 Verification & Acceptance Gates
1. **Build & Type Verification**: `npm run lint` (`tsc --noEmit`) and `npm run build` pass with zero errors.
2. **Movement & Physics Gate (Milestone 1)**:
   - Variable jump height works smoothly (tap vs. hold).
   - Coyote time (`0.10s`) and jump input buffering (`0.12s`) trigger reliably at edge takeoffs and landings.
   - Collision bounds align strictly to Nima's body (`36×74`), verified via `F1` Debug Hitbox overlay.
   - Camera frames Nima at ~42% from left, ~58% from top with smooth exponential damping and look-ahead.
3. **Wake & Environmental Interaction Gate (Milestone 2)**:
   - Wake pulse (`E`/`X`) respects the `155u` radius and `0.50s` cooldown.
   - `BloomPlatform` transitions cleanly across `dormant -> awakening -> active (5s) -> closing warning -> dormant` and refreshes on re-pulse.
   - `RootBridge` transitions from `recessed -> extending -> permanent walkable solid` and persists across checkpoint respawns.
   - `ASSET_MANIFEST.md` documents every generated and procedural asset accurately.
