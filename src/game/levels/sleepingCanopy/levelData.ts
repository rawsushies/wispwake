export interface PlatformSpec {
  id: string;
  x: number;      // Top-left X
  y: number;      // Top-left Y
  width: number;
  height: number;
}

export interface BloomSpec {
  id: string;
  x: number;      // Center X
  y: number;      // Center Y
  customDuration?: number;
}

export interface RootBridgeSpec {
  id: string;
  x: number;      // Left anchor X
  y: number;      // Center Y
}

export interface DrifterSpec {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  cycleDuration: number;
}

export interface HazardSpec {
  id: string;
  x: number;      // Center X
  y: number;      // Bottom Y resting on platform
  width: number;
}

export interface CheckpointSpec {
  id: string;
  x: number;      // Center X on supporting platform
  y: number;      // Supporting platform top Y
}

export interface WaterCurrentSpec {
  id: string;
  x: number;      // Left X
  y: number;      // Top Y
  width: number;
  height: number;
  driftVx: number; // Horizontal drift velocity (px/sec)
}

export interface WindZoneSpec {
  id: string;
  x: number;      // Left X
  y: number;      // Top Y
  width: number;
  height: number;
  driftVx: number; // Horizontal wind drift (px/sec)
  driftVy: number; // Vertical updraft/downdraft velocity (px/sec)
}

export interface CrumblingPlatformSpec {
  id: string;
  x: number;      // Top-left X
  y: number;      // Top-left Y
  width: number;  // Visual & physics width (default 144)
  standWindowSec?: number; // Escape window before collapse
  respawnSec?: number;     // Reform timer
}

export interface SporeVentSpec {
  id: string;
  x: number;      // Center X
  y: number;      // Supporting platform top Y
  burstHeight: number;
  cycleSec: number;
  phaseOffsetSec: number;
}

export interface FallingDebrisSpec {
  id: string;
  x: number;      // Center X
  ceilingY: number;
  floorY: number;
  cycleSec: number;
  phaseOffsetSec: number;
}

export interface MemoryEchoSpec {
  id: string;
  x: number;
  y: number;
  dialogueId: string;
  title: string;
}

export interface BeatZone {
  index: number;
  title: string;
  subtitle: string;
  minX: number;
  maxX: number;
}

export type BiomeTheme = 'canopy' | 'marsh' | 'cavern' | 'ruins';

export interface LevelDefinition {
  id: string;
  title: string;
  biomeTheme?: BiomeTheme;
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
  platforms: PlatformSpec[];
  blooms: BloomSpec[];
  rootBridges: RootBridgeSpec[];
  drifters: DrifterSpec[];
  hazards: HazardSpec[];
  checkpoint: CheckpointSpec;
  checkpoints?: CheckpointSpec[];
  waterCurrents?: WaterCurrentSpec[];
  windZones?: WindZoneSpec[];
  crumblingPlatforms?: CrumblingPlatformSpec[];
  sporeVents?: SporeVentSpec[];
  fallingDebris?: FallingDebrisSpec[];
  memoryEchoes?: MemoryEchoSpec[];
  ancientBloom: {
    id: string;
    x: number;
    y: number;
  };
  beats: BeatZone[];
}

/**
 * Chapter 01 — The Sleeping Canopy (Milestone 5 Expanded 10-Sub-Area Adventure — Section 09):
 * 01. The First Awakening — Safe giant root terraces introducing walking, jumping, and Pip's guidance
 * 02. The Dormant Garden — Awakened flower buds and the first safety-floored Bloom crossing
 * 03. The Hanging Roots — Elevated root-steps, first permanent Root Bridge, and the First Resonance Cairn
 * 04. The Broken Canopy — Multi-tiered split canopy with an upper secret Memory Echo overlook
 * 05. The Drifter Passage — Luminous canopy chasm crossed via two gentle translucent Drifters
 * 06. The Thorn Corridor — Dormant Ember Coral brambles bypassed via timed aerial Bloom vaults
 * 07. The Lower Hollow — Deep twilight basin with a hidden lower Memory Echo sanctuary and ascending blooms
 * 08. The Ancient Root Network — Interlocking Root Bridges and Crumbling Bark Ledges leading to the Third Cairn
 * 09. The Final Canopy Ascent — Climbing vertical canopy boughs, Drifter transfer, and high-altitude blooms
 * 10. The First Bloom Sanctuary — Grand bough hosting the Fourth Cairn and the Ancient Canopy Bloom
 */
export const SLEEPING_CANOPY_LEVEL: LevelDefinition = {
  id: 'sleeping_canopy',
  title: 'Chapter 01 · The Sleeping Canopy',
  biomeTheme: 'canopy',
  width: 11200,
  height: 820,
  spawnX: 160,
  spawnY: 450,

  platforms: [
    // 01. The First Awakening (x: 40 .. 1080)
    { id: 'sc_p01_start', x: 40, y: 520, width: 420, height: 180 },
    { id: 'sc_p02_step', x: 440, y: 475, width: 290, height: 225 },
    { id: 'sc_p03_bough', x: 790, y: 440, width: 290, height: 260 },

    // 02. The Dormant Garden (x: 1080 .. 2140)
    { id: 'sc_p04_garden_floor', x: 1060, y: 535, width: 390, height: 165 },
    { id: 'sc_p05_garden_mid', x: 1380, y: 420, width: 250, height: 280 },
    { id: 'sc_p06_garden_basin', x: 1610, y: 565, width: 380, height: 135 },
    { id: 'sc_p07_garden_east', x: 1940, y: 430, width: 250, height: 270 },

    // 03. The Hanging Roots (x: 2140 .. 3180)
    { id: 'sc_p08_hanging_west', x: 2270, y: 395, width: 250, height: 305 },
    // Root Bridge 1 spans from x: 2505 to x: 2733
    { id: 'sc_p09_cairn_1', x: 2715, y: 395, width: 420, height: 305 },

    // 04. The Broken Canopy (x: 3180 .. 4320) — Main route + optional upper Memory Echo route
    { id: 'sc_p10_broken_low', x: 3220, y: 465, width: 310, height: 235 },
    { id: 'sc_p11_broken_mid', x: 3610, y: 430, width: 280, height: 270 },
    { id: 'sc_p12_secret_upper', x: 3560, y: 270, width: 280, height: 48 },
    { id: 'sc_p13_broken_east', x: 3980, y: 410, width: 310, height: 290 },

    // 05. The Drifter Passage (x: 4320 .. 5540)
    // Drifter 1 (4370 -> 4680), center isle (4740..4980), Drifter 2 (5040 -> 5330)
    { id: 'sc_p14_drifter_isle', x: 4740, y: 390, width: 240, height: 310 },
    { id: 'sc_p15_cairn_2', x: 5385, y: 410, width: 390, height: 290 },

    // 06. The Thorn Corridor (x: 5540 .. 6680)
    { id: 'sc_p16_thorn_walk_1', x: 5850, y: 485, width: 440, height: 215 },
    { id: 'sc_p17_thorn_walk_2', x: 6360, y: 455, width: 390, height: 245 },

    // 07. The Lower Hollow (x: 6680 .. 7860) — Deep hollow + optional lower Memory Echo alcove
    { id: 'sc_p18_hollow_descent', x: 6820, y: 525, width: 320, height: 175 },
    { id: 'sc_p19_hollow_secret', x: 6880, y: 645, width: 280, height: 95 },
    { id: 'sc_p20_hollow_floor', x: 7210, y: 555, width: 360, height: 155 },
    { id: 'sc_p21_hollow_exit', x: 7650, y: 425, width: 280, height: 275 },

    // 08. The Ancient Root Network (x: 7860 .. 9020)
    // Root Bridge 2 spans from x: 7915 to x: 8143
    { id: 'sc_p22_network_hub', x: 8125, y: 425, width: 290, height: 275 },
    // Root Bridge 3 spans from x: 8400 to x: 8628
    { id: 'sc_p23_cairn_3', x: 8610, y: 425, width: 390, height: 275 },

    // 09. The Final Canopy Ascent (x: 9020 .. 10240)
    { id: 'sc_p24_ascent_1', x: 9080, y: 390, width: 260, height: 310 },
    { id: 'sc_p25_ascent_2', x: 9430, y: 350, width: 260, height: 350 },
    // Drifter 3 (9760 -> 10040)
    { id: 'sc_p26_ascent_top', x: 10100, y: 350, width: 280, height: 350 },

    // 10. The First Bloom Sanctuary (x: 10240 .. 11200)
    // Root Bridge 4 spans from x: 10365 to x: 10593
    { id: 'sc_p27_sanctuary', x: 10575, y: 350, width: 540, height: 350 },
  ],

  blooms: [
    // Sub-area 02: Intro & double-bloom garden crossing
    { id: 'sc_bloom_01', x: 1255, y: 455 },
    { id: 'sc_bloom_02', x: 1715, y: 430 },
    { id: 'sc_bloom_03', x: 1845, y: 395 },

    // Sub-area 03: Step up to hanging roots
    { id: 'sc_bloom_04', x: 2215, y: 390 },

    // Sub-area 04: Broken Canopy main + upper secret Memory Echo access
    { id: 'sc_bloom_05', x: 3495, y: 345 },
    { id: 'sc_bloom_06', x: 3905, y: 385 },

    // Sub-area 06: Thorn Corridor vaults
    { id: 'sc_bloom_07', x: 6000, y: 395 },
    { id: 'sc_bloom_08', x: 6155, y: 365 },
    { id: 'sc_bloom_09', x: 6555, y: 365 },

    // Sub-area 07: Lower Hollow ascent (Bloom walkable top is at y - 44)
    { id: 'sc_bloom_10', x: 7090, y: 615 },
    { id: 'sc_bloom_11', x: 7390, y: 525 },
    { id: 'sc_bloom_12', x: 7535, y: 465 },

    // Sub-area 09: Final Canopy Ascent
    { id: 'sc_bloom_13', x: 9365, y: 345 },
  ],

  rootBridges: [
    { id: 'sc_root_01', x: 2505, y: 407 },
    { id: 'sc_root_02', x: 7915, y: 437 },
    { id: 'sc_root_03', x: 8400, y: 437 },
    { id: 'sc_root_04', x: 10365, y: 362 },
  ],

  drifters: [
    {
      id: 'sc_drifter_01',
      startX: 4375,
      startY: 395,
      endX: 4665,
      endY: 375,
      cycleDuration: 5.8,
    },
    {
      id: 'sc_drifter_02',
      startX: 5055,
      startY: 375,
      endX: 5315,
      endY: 395,
      cycleDuration: 5.8,
    },
    {
      id: 'sc_drifter_03',
      startX: 9765,
      startY: 345,
      endX: 10025,
      endY: 335,
      cycleDuration: 5.6,
    },
  ],

  hazards: [
    // Sub-area 06: Thorn Corridor
    { id: 'sc_haz_01', x: 6005, y: 485, width: 128 },
    { id: 'sc_haz_02', x: 6155, y: 485, width: 128 },
    { id: 'sc_haz_03', x: 6555, y: 455, width: 128 },
    // Sub-area 07: Lower Hollow floor bramble
    { id: 'sc_haz_04', x: 7390, y: 555, width: 128 },
  ],

  crumblingPlatforms: [
    // Sub-area 04 & 09 gentle introductory ancient bark ledges
    { id: 'sc_crumble_01', x: 3115, y: 435, width: 144, standWindowSec: 1.05 },
    { id: 'sc_crumble_02', x: 8965, y: 410, width: 144, standWindowSec: 1.0 },
  ],

  memoryEchoes: [
    {
      id: 'mem_canopy_bough_song',
      x: 3700,
      y: 230,
      title: 'Memory Echo I · The Seed-Keepers’ Lullaby',
      dialogueId: 'memory_canopy_01',
    },
    {
      id: 'mem_canopy_hollow_whisper',
      x: 7020,
      y: 605,
      title: 'Memory Echo II · Why the Canopy Closed Its Eyes',
      dialogueId: 'memory_canopy_02',
    },
  ],

  checkpoint: {
    id: 'cp_canopy_01',
    x: 2910,
    y: 395,
  },

  checkpoints: [
    { id: 'cp_canopy_01', x: 2910, y: 395 },
    { id: 'cp_canopy_02', x: 5560, y: 410 },
    { id: 'cp_canopy_03', x: 8795, y: 425 },
    { id: 'cp_canopy_04', x: 10680, y: 350 },
  ],

  ancientBloom: {
    id: 'ancient_bloom_canopy',
    x: 10910,
    y: 350,
  },

  beats: [
    {
      index: 1,
      title: '01 · The First Awakening',
      subtitle: 'Move with A/D or Arrows. Hold Space or Z for a higher jump across the root terraces.',
      minX: 0,
      maxX: 1050,
    },
    {
      index: 2,
      title: '02 · The Dormant Garden',
      subtitle: 'Press E or X near sleeping buds to release Wake and open temporary flower platforms.',
      minX: 1050,
      maxX: 2150,
    },
    {
      index: 3,
      title: '03 · The Hanging Roots',
      subtitle: 'Uncoil the ancient Root Bridge with Wake and kindle the first Resonance Cairn.',
      minX: 2150,
      maxX: 3150,
    },
    {
      index: 4,
      title: '04 · The Broken Canopy',
      subtitle: 'Cross the split boughs—or climb the high blooms to discover a hidden Memory Echo.',
      minX: 3150,
      maxX: 4320,
    },
    {
      index: 5,
      title: '05 · The Drifter Passage',
      subtitle: 'Step onto the gliding Drifters’ mossy bells to cross the luminous canopy chasm.',
      minX: 4320,
      maxX: 5750,
    },
    {
      index: 6,
      title: '06 · The Thorn Corridor',
      subtitle: 'Chain Wake blooms in mid-air to vault cleanly over the Ember Coral brambles.',
      minX: 5750,
      maxX: 6780,
    },
    {
      index: 7,
      title: '07 · The Lower Hollow',
      subtitle: 'Descend into the twilight hollow and awaken the ascending buds to climb back out.',
      minX: 6780,
      maxX: 7880,
    },
    {
      index: 8,
      title: '08 · The Ancient Root Network',
      subtitle: 'Link the great coiling root bridges to reunite the sundered canopy walkways.',
      minX: 7880,
      maxX: 9020,
    },
    {
      index: 9,
      title: '09 · The Final Canopy Ascent',
      subtitle: 'Climb the high boughs and ride the upper Drifter toward the Sanctuary.',
      minX: 9020,
      maxX: 10350,
    },
    {
      index: 10,
      title: '10 · The First Bloom Sanctuary',
      subtitle: 'Release Wake beside the Ancient Bloom to restore warmth to the Sleeping Canopy.',
      minX: 10350,
      maxX: 11200,
    },
  ],
};

/**
 * Compact Movement & Wake Prototype Sandbox (Milestones 1 & 2 rapid test room)
 */
export const PROTOTYPE_SANDBOX_LEVEL: LevelDefinition = {
  id: 'prototype_sandbox',
  title: 'Milestones 1 & 2 · Movement & Wake Test Room',
  width: 2100,
  height: 700,
  spawnX: 150,
  spawnY: 420,

  platforms: [
    { id: 'sb_plat_1', x: 40, y: 490, width: 480, height: 150 },
    { id: 'sb_plat_step', x: 320, y: 415, width: 160, height: 75 },
    { id: 'sb_plat_2', x: 680, y: 450, width: 320, height: 190 },
    { id: 'sb_plat_3', x: 1215, y: 450, width: 310, height: 190 },
    { id: 'sb_plat_4', x: 1650, y: 390, width: 410, height: 250 },
  ],

  blooms: [
    { id: 'sb_bloom_1', x: 595, y: 440 },
    { id: 'sb_bloom_2', x: 840, y: 355 },
  ],

  rootBridges: [
    { id: 'sb_root_1', x: 990, y: 462 },
  ],

  drifters: [
    {
      id: 'sb_drifter_1',
      startX: 1560,
      startY: 425,
      endX: 1610,
      endY: 395,
      cycleDuration: 4.5,
    },
  ],

  hazards: [
    { id: 'sb_hazard_1', x: 840, y: 450, width: 128 },
  ],

  checkpoint: {
    id: 'sb_checkpoint',
    x: 1350,
    y: 450,
  },

  checkpoints: [
    { id: 'sb_checkpoint', x: 1350, y: 450 },
  ],

  ancientBloom: {
    id: 'sb_ancient_bloom',
    x: 1880,
    y: 390,
  },

  beats: [
    {
      index: 1,
      title: 'Milestone 1 · Movement & Jump Feel',
      subtitle: 'Test variable jump height, 0.10s coyote time, and 0.12s jump input buffer.',
      minX: 0,
      maxX: 520,
    },
    {
      index: 2,
      title: 'Milestone 2 · Bloom & Root Bridge',
      subtitle: 'Press E or X to open the temporary Bloom Platform (5.2s) and permanent Root Bridge.',
      minX: 520,
      maxX: 1450,
    },
    {
      index: 3,
      title: 'Milestone 2 · Checkpoint, Drifter & Restoration',
      subtitle: 'Activate the Checkpoint Cairn, ride the Drifter, and awaken the Ancient Bloom.',
      minX: 1450,
      maxX: 2100,
    },
  ],
};
