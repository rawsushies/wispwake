import { CampaignChapterId } from '../config/gameConfig';
import {
  LevelDefinition,
  SLEEPING_CANOPY_LEVEL,
} from '../levels/sleepingCanopy/levelData';

export interface CampaignLevelDefinition extends LevelDefinition {
  chapterId: CampaignChapterId;
  chapterNumber: number;
  regionSubtitle: string;
  description: string;
  biomeTheme: 'canopy' | 'marsh' | 'cavern' | 'ruins';
}

/**
 * Chapter 01 — The Sleeping Canopy
 * Introduces Nima & Pip, teaches movement, variable jump, Wake blooms, persistent root bridges, and the Drifter.
 */
export const CHAPTER_01_SLEEPING_CANOPY: CampaignLevelDefinition = {
  ...SLEEPING_CANOPY_LEVEL,
  chapterId: 'sleeping_canopy',
  chapterNumber: 1,
  regionSubtitle: 'Ancient roots, twilight forest, and the first glowing blooms',
  description:
    'Awaken on a vast tree root alongside Pip and use the living seed’s Wake pulse to stir dormant flowers and uncoil ancient bridges.',
  biomeTheme: 'canopy',
};

/**
 * Chapter 02 — The Moonlit Marsh (Section 05: Reflective dark water, blue-green reeds, glowing water flowers, submerged arches)
 */
export const CHAPTER_02_MOONLIT_MARSH: CampaignLevelDefinition = {
  id: 'moonlit_marsh',
  chapterId: 'moonlit_marsh',
  chapterNumber: 2,
  title: 'Chapter 02 · The Moonlit Marsh',
  regionSubtitle: 'Luminous wetlands, reflective dark pools, and sunken stone arches',
  description:
    'Cross the mist-draped wetlands where sunken walkways and sleeping water blossoms rest above deep reflective pools.',
  biomeTheme: 'marsh',
  width: 4600,
  height: 780,
  spawnX: 160,
  spawnY: 420,

  platforms: [
    // Beat 1: Marsh Edge Bank
    { id: 'mm_plat_1', x: 40, y: 500, width: 410, height: 160 },
    { id: 'mm_plat_2', x: 510, y: 465, width: 270, height: 195 },

    // Beat 2: Sunken Lily Basin (Safety reed bed below + elevated stone pier)
    { id: 'mm_plat_basin', x: 810, y: 555, width: 440, height: 130 },
    { id: 'mm_plat_pier_1', x: 1290, y: 410, width: 260, height: 250 },

    // Beat 3: Submerged Stone Archway & Root Bridge Anchor
    { id: 'mm_plat_arch_west', x: 1640, y: 440, width: 250, height: 220 },
    { id: 'mm_plat_checkpoint', x: 2105, y: 440, width: 380, height: 220 },

    // Beat 4: Twin Drifter Lagoon
    { id: 'mm_plat_mid_isle', x: 2880, y: 410, width: 220, height: 250 },
    { id: 'mm_plat_east_shore', x: 3490, y: 465, width: 410, height: 195 },

    // Beat 5: Marsh Lotus Sanctuary
    { id: 'mm_plat_sanctuary', x: 4115, y: 390, width: 440, height: 270 },
  ],

  blooms: [
    { id: 'mm_bloom_1', x: 945, y: 455 },
    { id: 'mm_bloom_2', x: 1125, y: 405 },
    { id: 'mm_bloom_3', x: 1590, y: 370 },
    { id: 'mm_bloom_4', x: 3630, y: 380 },
    { id: 'mm_bloom_5', x: 3775, y: 345 },
  ],

  rootBridges: [
    { id: 'mm_root_1', x: 1875, y: 452 },
    { id: 'mm_root_2', x: 3885, y: 402 },
  ],

  drifters: [
    {
      id: 'mm_drifter_1',
      startX: 2565,
      startY: 425,
      endX: 2805,
      endY: 405,
      cycleDuration: 5.6,
    },
    {
      id: 'mm_drifter_2',
      startX: 3180,
      startY: 405,
      endX: 3415,
      endY: 435,
      cycleDuration: 5.8,
    },
  ],

  hazards: [
    { id: 'mm_haz_1', x: 1035, y: 555, width: 128 },
    { id: 'mm_haz_2', x: 3640, y: 465, width: 128 },
    { id: 'mm_haz_3', x: 3775, y: 465, width: 128 },
  ],

  checkpoint: {
    id: 'checkpoint_marsh_arch',
    x: 2285,
    y: 440,
  },

  ancientBloom: {
    id: 'ancient_bloom_marsh',
    x: 4345,
    y: 390,
  },

  beats: [
    {
      index: 1,
      title: 'Beat 1 · Still Waters',
      subtitle: 'Follow the glowing reed banks into the Moonlit Marsh.',
      minX: 0,
      maxX: 780,
    },
    {
      index: 2,
      title: 'Beat 2 · Sunken Blossoms',
      subtitle: 'Chain Wake pulses across the sleeping water flowers.',
      minX: 780,
      maxX: 1600,
    },
    {
      index: 3,
      title: 'Beat 3 · The Drowned Arch',
      subtitle: 'Uncoil the wetland root bridge and kindle the marsh lantern.',
      minX: 1600,
      maxX: 2480,
    },
    {
      index: 4,
      title: 'Beat 4 · Lagoon Drifters',
      subtitle: 'Ride the twin marsh Drifters across the reflective deep.',
      minX: 2480,
      maxX: 3480,
    },
    {
      index: 5,
      title: 'Beat 5 · The Marsh Lotus',
      subtitle: 'Vault the marsh thorns and awaken the Great Wetland Lotus.',
      minX: 3480,
      maxX: 4600,
    },
  ],
};

/**
 * Chapter 03 — The Hollow Below (Section 05: Underground giant roots, glowing mushrooms, vertical shafts, bioluminescent pools)
 */
export const CHAPTER_03_HOLLOW_BELOW: CampaignLevelDefinition = {
  id: 'hollow_below',
  chapterId: 'hollow_below',
  chapterNumber: 3,
  title: 'Chapter 03 · The Hollow Below',
  regionSubtitle: 'Subterranean root caverns, glowing fungi, and echoing shafts',
  description:
    'Descend into the shadowed root caverns beneath the Veilgrove where Nima’s seed and bioluminescent mushrooms light vertical climbs.',
  biomeTheme: 'cavern',
  width: 4700,
  height: 820,
  spawnX: 160,
  spawnY: 460,

  platforms: [
    // Beat 1: Cavern Descent Ledge
    { id: 'hb_plat_1', x: 40, y: 540, width: 390, height: 170 },
    { id: 'hb_plat_2', x: 490, y: 495, width: 280, height: 215 },

    // Beat 2: Vertical Spore Shaft
    { id: 'hb_plat_shaft_base', x: 830, y: 565, width: 360, height: 145 },
    { id: 'hb_plat_shaft_top', x: 1320, y: 370, width: 290, height: 340 },

    // Beat 3: Mushroom Grotto & Root Span
    { id: 'hb_plat_grotto_1', x: 1720, y: 425, width: 260, height: 285 },
    { id: 'hb_plat_checkpoint', x: 2195, y: 425, width: 390, height: 285 },

    // Beat 4: Echoing Abyss & Cavern Drifter
    { id: 'hb_plat_abyss_ledge', x: 2680, y: 485, width: 360, height: 225 },
    { id: 'hb_plat_east_pillar', x: 3560, y: 410, width: 260, height: 300 },

    // Beat 5: Root-Heart Chamber
    { id: 'hb_plat_sanctuary', x: 4035, y: 410, width: 520, height: 300 },
  ],

  blooms: [
    // Vertical ascending chain in Beat 2
    { id: 'hb_bloom_1', x: 985, y: 480 },
    { id: 'hb_bloom_2', x: 1145, y: 415 },
    // Grotto gap hop
    { id: 'hb_bloom_3', x: 1665, y: 385 },
    // Abyss thorn bypass
    { id: 'hb_bloom_4', x: 2850, y: 400 },
    { id: 'hb_bloom_5', x: 3465, y: 395 },
  ],

  rootBridges: [
    { id: 'hb_root_1', x: 1965, y: 437 },
    { id: 'hb_root_2', x: 3805, y: 422 },
  ],

  drifters: [
    {
      id: 'hb_drifter_1',
      startX: 3120,
      startY: 455,
      endX: 3380,
      endY: 415,
      cycleDuration: 5.8,
    },
  ],

  hazards: [
    { id: 'hb_haz_1', x: 1010, y: 565, width: 128 },
    { id: 'hb_haz_2', x: 2855, y: 485, width: 128 },
  ],

  checkpoint: {
    id: 'checkpoint_hollow_grotto',
    x: 2380,
    y: 425,
  },

  ancientBloom: {
    id: 'ancient_bloom_hollow',
    x: 4310,
    y: 410,
  },

  beats: [
    {
      index: 1,
      title: 'Beat 1 · Into the Roots',
      subtitle: 'Let Nima’s seed light guide your steps through the deep cavern.',
      minX: 0,
      maxX: 800,
    },
    {
      index: 2,
      title: 'Beat 2 · The Spore Shaft',
      subtitle: 'Awaken the ascending cavern buds to climb out of the pit.',
      minX: 800,
      maxX: 1680,
    },
    {
      index: 3,
      title: 'Beat 3 · Luminous Grotto',
      subtitle: 'Extend the subterranean root bridge to reach the grotto lantern.',
      minX: 1680,
      maxX: 2620,
    },
    {
      index: 4,
      title: 'Beat 4 · The Echoing Abyss',
      subtitle: 'Clear the cavern thorns and ride the deep Drifter across the void.',
      minX: 2620,
      maxX: 3950,
    },
    {
      index: 5,
      title: 'Beat 5 · Root-Heart Chamber',
      subtitle: 'Awaken the Root-Heart Bloom to restore pulse to the lower tree.',
      minX: 3950,
      maxX: 4700,
    },
  ],
};

/**
 * Chapter 04 — The Windward Ruins (Section 05: Ancient elevated ruins, broken bridges, open skies, wind-driven foliage, climax)
 */
export const CHAPTER_04_WINDWARD_RUINS: CampaignLevelDefinition = {
  id: 'windward_ruins',
  chapterId: 'windward_ruins',
  chapterNumber: 4,
  title: 'Chapter 04 · The Windward Ruins',
  regionSubtitle: 'High skyward sanctuaries, broken root-wrapped arches, and the Crown Bloom',
  description:
    'Ascend the wind-swept stone towers high in the canopy crown and awaken the Great Bloom to unite the Veilgrove.',
  biomeTheme: 'ruins',
  width: 4850,
  height: 820,
  spawnX: 160,
  spawnY: 450,

  platforms: [
    // Beat 1: Skyward Terrace
    { id: 'wr_plat_1', x: 40, y: 530, width: 410, height: 180 },
    { id: 'wr_plat_2', x: 520, y: 475, width: 310, height: 235 },

    // Beat 2: Broken Aqueduct & Root Span
    { id: 'wr_plat_arch_west', x: 910, y: 430, width: 270, height: 280 },
    { id: 'wr_plat_arch_east', x: 1395, y: 430, width: 320, height: 280 },

    // Beat 3: Windward Belfry & Checkpoint
    { id: 'wr_plat_belfry', x: 2040, y: 390, width: 390, height: 320 },

    // Beat 4: Sky Drifter Ascent
    { id: 'wr_plat_cloud_pillar', x: 3020, y: 375, width: 260, height: 335 },
    { id: 'wr_plat_high_walk', x: 3690, y: 435, width: 360, height: 275 },

    // Beat 5: The Crown Sanctuary
    { id: 'wr_plat_sanctuary', x: 4265, y: 365, width: 520, height: 345 },
  ],

  blooms: [
    { id: 'wr_bloom_1', x: 1810, y: 415 },
    { id: 'wr_bloom_2', x: 1945, y: 375 },
    { id: 'wr_bloom_3', x: 2925, y: 365 },
    { id: 'wr_bloom_4', x: 3860, y: 355 },
  ],

  rootBridges: [
    { id: 'wr_root_1', x: 1165, y: 442 },
    { id: 'wr_root_2', x: 4035, y: 377 },
  ],

  drifters: [
    {
      id: 'wr_drifter_1',
      startX: 2515,
      startY: 395,
      endX: 2815,
      endY: 365,
      cycleDuration: 5.4,
    },
    {
      id: 'wr_drifter_2',
      startX: 3360,
      startY: 385,
      endX: 3610,
      endY: 420,
      cycleDuration: 5.4,
    },
  ],

  hazards: [
    { id: 'wr_haz_1', x: 1550, y: 430, width: 128 },
    { id: 'wr_haz_2', x: 3865, y: 435, width: 128 },
  ],

  checkpoint: {
    id: 'checkpoint_windward_belfry',
    x: 2225,
    y: 390,
  },

  ancientBloom: {
    id: 'ancient_bloom_windward',
    x: 4540,
    y: 365,
  },

  beats: [
    {
      index: 1,
      title: 'Beat 1 · The Skyward Steps',
      subtitle: 'Climb the wind-swept ruins above the cloud sea.',
      minX: 0,
      maxX: 880,
    },
    {
      index: 2,
      title: 'Beat 2 · The Broken Arch',
      subtitle: 'Pulse the ancient roots to mend the shattered sky bridge.',
      minX: 880,
      maxX: 1750,
    },
    {
      index: 3,
      title: 'Beat 3 · Windward Belfry',
      subtitle: 'Chain the aerial blooms to reach the belfry lantern.',
      minX: 1750,
      maxX: 2450,
    },
    {
      index: 4,
      title: 'Beat 4 · Cloudroot Crossing',
      subtitle: 'Ride the sky Drifters across the open cloud valley.',
      minX: 2450,
      maxX: 4000,
    },
    {
      index: 5,
      title: 'Beat 5 · The Crown Sanctuary',
      subtitle: 'Awaken the Great Crown Bloom and restore light to the Veilgrove.',
      minX: 4000,
      maxX: 4850,
    },
  ],
};

export const CAMPAIGN_CHAPTERS: CampaignLevelDefinition[] = [
  CHAPTER_01_SLEEPING_CANOPY,
  CHAPTER_02_MOONLIT_MARSH,
  CHAPTER_03_HOLLOW_BELOW,
  CHAPTER_04_WINDWARD_RUINS,
];

export function getCampaignChapter(id: CampaignChapterId): CampaignLevelDefinition {
  return CAMPAIGN_CHAPTERS.find((c) => c.chapterId === id) || CHAPTER_01_SLEEPING_CANOPY;
}
