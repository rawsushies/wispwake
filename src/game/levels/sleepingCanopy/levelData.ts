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

export interface BeatZone {
  index: number;
  title: string;
  subtitle: string;
  minX: number;
  maxX: number;
}

export interface LevelDefinition {
  id: string;
  title: string;
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
  platforms: PlatformSpec[];
  blooms: BloomSpec[];
  rootBridges: RootBridgeSpec[];
  drifters: DrifterSpec[];
  hazards: HazardSpec[];
  checkpoint: {
    id: string;
    x: number;
    y: number;
  };
  ancientBloom: {
    id: string;
    x: number;
    y: number;
  };
  beats: BeatZone[];
}

/**
 * Chapter 01 — The Sleeping Canopy (Section 8.1 & 8.2 Beat-by-beat layout):
 * Beat 1: Awakening — Nima stands on a giant root; movement is introduced (Safe space, clear route, no hazard)
 * Beat 2: First Light — Pip draws attention to a reachable flower bud to teach Wake
 * Beat 3: Bloom Crossing — Flower opens into a temporary platform; teaches timing & jumping with generous landing space
 * Beat 4: Root Passage — A dormant root bridge extends permanently after Wake; leads to Checkpoint Cairn
 * Beat 5: The Drifter — A floating translucent creature crosses a misty canopy gap
 * Beat 6: The Hollow — A darker passage requiring shape reading, chained Bloom platforms, and clearing Ember Coral brambles
 * Beat 7: First Bloom — Nima awakens the Ancient Bloom landmark and the canopy transforms
 */
export const SLEEPING_CANOPY_LEVEL: LevelDefinition = {
  id: 'sleeping_canopy',
  title: 'Chapter 01 · The Sleeping Canopy',
  width: 4400,
  height: 760,
  spawnX: 160,
  spawnY: 430,

  platforms: [
    // Beat 1: Awakening — Safe giant root terrace with a gentle step-up to practice jumping
    { id: 'plat_b1_start', x: 40, y: 500, width: 420, height: 140 },
    { id: 'plat_b1_step', x: 440, y: 455, width: 290, height: 185 },

    // Beat 2: First Light — Safe floor below the first practice Bloom bud so missing a jump never punishes
    { id: 'plat_b2_safe_basin', x: 710, y: 510, width: 320, height: 130 },
    { id: 'plat_b2_upper_ledge', x: 960, y: 390, width: 230, height: 250 },

    // Beat 3: Bloom Crossing — Generous safety floor below the first two-bloom sequence, then landing terrace
    { id: 'plat_b3_safety_floor', x: 1170, y: 560, width: 390, height: 120 },
    { id: 'plat_b3_mid_pillar', x: 1520, y: 420, width: 240, height: 220 },

    // Beat 4: Root Passage — Chasm before the recessed Root Bridge -> Checkpoint Sanctuary Terrace
    { id: 'plat_b4_bridge_recv', x: 1965, y: 420, width: 350, height: 220 },

    // Beat 5: The Drifter — Wide misty gap traversed via the gliding Drifter organism
    { id: 'plat_b5_east_bank', x: 2770, y: 395, width: 280, height: 245 },

    // Beat 6: The Hollow — Shadowed multi-tiered passage with Ember Coral brambles and elevated Wake blooms
    { id: 'plat_b6_hollow_low', x: 3030, y: 475, width: 430, height: 165 },
    { id: 'plat_b6_hollow_high', x: 3420, y: 375, width: 220, height: 265 },

    // Beat 7: First Bloom Sanctuary — Receives the second Root Bridge and hosts the Ancient Bloom landmark
    { id: 'plat_b7_sanctuary', x: 3845, y: 375, width: 480, height: 265 },
  ],

  blooms: [
    // Beat 2: First Light — Reachable introductory flower bud lifting Nima to plat_b2_upper_ledge
    { id: 'bloom_b2_intro', x: 865, y: 435 },

    // Beat 3: Bloom Crossing — Two sequential flower platforms across the canopy basin
    { id: 'bloom_b3_first', x: 1295, y: 405 },
    { id: 'bloom_b3_second', x: 1425, y: 365 },

    // Beat 6: The Hollow — Two elevated flower buds allowing Nima to vault cleanly over the Ember Coral brambles
    { id: 'bloom_b6_hollow_1', x: 3175, y: 390 },
    { id: 'bloom_b6_hollow_2', x: 3320, y: 345 },
  ],

  rootBridges: [
    // Beat 4: Root Passage — Extends from plat_b3_mid_pillar (x: 1745) across to plat_b4_bridge_recv (x: 1965)
    { id: 'root_b4_main', x: 1742, y: 432 },

    // Beat 6/7 Transition — Extends from plat_b6_hollow_high (x: 3625) to plat_b7_sanctuary (x: 3845)
    { id: 'root_b6_summit', x: 3622, y: 387 },
  ],

  drifters: [
    // Beat 5: The Drifter — Predictable moving traversal organism carrying Nima from x: 2370 to x: 2690
    {
      id: 'drifter_b5_canopy',
      startX: 2390,
      startY: 395,
      endX: 2695,
      endY: 375,
      cycleDuration: 6.2,
    },
  ],

  hazards: [
    // Beat 6: The Hollow — Readable Ember Coral bramble patches on the lower hollow floor (vaulted over via Blooms)
    { id: 'hazard_b6_thorns_1', x: 3180, y: 475, width: 128 },
    { id: 'hazard_b6_thorns_2', x: 3325, y: 475, width: 128 },
  ],

  checkpoint: {
    id: 'checkpoint_canopy_mid',
    x: 2135,
    y: 420,
  },

  ancientBloom: {
    id: 'ancient_bloom_canopy',
    x: 4110,
    y: 375,
  },

  beats: [
    {
      index: 1,
      title: 'Beat 1 · Awakening',
      subtitle: 'Move with A/D or Arrows. Hold Space or Z for a higher jump.',
      minX: 0,
      maxX: 700,
    },
    {
      index: 2,
      title: 'Beat 2 · First Light',
      subtitle: 'Approach the dormant bud and press E or X to release Wake.',
      minX: 700,
      maxX: 1150,
    },
    {
      index: 3,
      title: 'Beat 3 · Bloom Crossing',
      subtitle: 'Awakened blooms remain open briefly. Pulse Wake in mid-air to refresh or chain them.',
      minX: 1150,
      maxX: 1650,
    },
    {
      index: 4,
      title: 'Beat 4 · Root Passage',
      subtitle: 'Pulse the coiled roots to extend a permanent bridge toward the Resonance Cairn.',
      minX: 1650,
      maxX: 2280,
    },
    {
      index: 5,
      title: 'Beat 5 · The Drifter',
      subtitle: 'Step onto the translucent Drifter’s mossy crown to cross the chasm.',
      minX: 2280,
      maxX: 2980,
    },
    {
      index: 6,
      title: 'Beat 6 · The Hollow',
      subtitle: 'Use Wake blooms to vault safely above the Ember Coral brambles.',
      minX: 2980,
      maxX: 3780,
    },
    {
      index: 7,
      title: 'Beat 7 · First Bloom',
      subtitle: 'Release Wake beside the Ancient Bloom to restore warmth to the canopy.',
      minX: 3780,
      maxX: 4400,
    },
  ],
};

/**
 * Compact Movement & Wake Prototype Sandbox (Milestones 1 & 2 rapid test room)
 * Places all core mechanics (step-ups, variable jump gap, BloomPlatform, RootBridge, Drifter, Checkpoint, and Landmark)
 * in a focused 1,800-unit test sanctuary for rapid QA inspection.
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
