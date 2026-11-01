import { CampaignChapterId, StoryDifficulty } from '../config/gameConfig';
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
 * Chapter 01 — The Sleeping Canopy (10 Sub-Areas, 11,200 units)
 */
export const CHAPTER_01_SLEEPING_CANOPY: CampaignLevelDefinition = {
  ...SLEEPING_CANOPY_LEVEL,
  chapterId: 'sleeping_canopy',
  chapterNumber: 1,
  regionSubtitle: 'Ancient roots, twilight forest, and the first glowing blooms',
  description:
    'Awaken on a vast tree root alongside Pip and use the living seed’s Wake pulse to stir dormant flowers, uncoil ancient bridges, and rekindle the First Bloom Sanctuary.',
  biomeTheme: 'canopy',
};

/**
 * Chapter 02 — The Moonlit Marsh (Milestone 5 Expanded 10-Sub-Area Adventure — Section 10)
 * Introduces Water Currents, drifting lily organisms, sunken stone arches, and the Marsh Lotus.
 */
export const CHAPTER_02_MOONLIT_MARSH: CampaignLevelDefinition = {
  id: 'moonlit_marsh',
  chapterId: 'moonlit_marsh',
  chapterNumber: 2,
  title: 'Chapter 02 · The Moonlit Marsh',
  regionSubtitle: 'Luminous wetlands, flowing tidal channels, and sunken stone arches',
  description:
    'Cross the mist-draped wetlands where gentle and surging water currents carry Nima between sunken piers, gliding marsh Drifters, and the Great Wetland Lotus.',
  biomeTheme: 'marsh',
  width: 11800,
  height: 820,
  spawnX: 160,
  spawnY: 440,

  platforms: [
    // 01. Still Waters Edge (x: 40 .. 1100)
    { id: 'mm_p01_start', x: 40, y: 515, width: 410, height: 185 },
    { id: 'mm_p02_reed_bank', x: 520, y: 475, width: 290, height: 225 },
    { id: 'mm_p03_pier_west', x: 880, y: 445, width: 260, height: 255 },

    // 02. Sunken Blossoms (x: 1100 .. 2250)
    { id: 'mm_p04_lily_basin', x: 1180, y: 560, width: 440, height: 140 },
    { id: 'mm_p05_arch_step', x: 1660, y: 425, width: 260, height: 275 },
    { id: 'mm_p06_marsh_terrace', x: 2010, y: 425, width: 280, height: 275 },

    // 03. The Flowing Shallows — Water Current introduction (x: 2250 .. 3400)
    { id: 'mm_p07_current_bed_1', x: 2350, y: 520, width: 520, height: 180 },
    { id: 'mm_p08_current_isle', x: 2940, y: 445, width: 290, height: 255 },

    // 04. The Drowned Archway & Cairn 1 (x: 3400 .. 4450)
    // Root Bridge 1 spans from x: 3215 to x: 3443
    { id: 'mm_p09_cairn_1', x: 3425, y: 445, width: 410, height: 255 },
    { id: 'mm_p10_drowned_east', x: 3920, y: 410, width: 320, height: 290 },
    { id: 'mm_p11_secret_reeds', x: 3890, y: 255, width: 270, height: 48 },

    // 05. Lagoon Drifters (x: 4450 .. 5800)
    { id: 'mm_p12_lagoon_mid', x: 4720, y: 395, width: 240, height: 305 },
    { id: 'mm_p13_cairn_2', x: 5420, y: 420, width: 390, height: 280 },

    // 06. The Reed Current Gauntlet (x: 5800 .. 7050)
    { id: 'mm_p14_surge_floor', x: 5890, y: 515, width: 560, height: 185 },
    { id: 'mm_p15_surge_high', x: 6530, y: 415, width: 360, height: 285 },

    // 07. The Sunken Bell Shrine — Optional lower Memory Echo (x: 7050 .. 8250)
    { id: 'mm_p16_bell_west', x: 6970, y: 475, width: 310, height: 225 },
    { id: 'mm_p17_bell_secret', x: 7040, y: 635, width: 290, height: 95 },
    { id: 'mm_p18_bell_east', x: 7640, y: 435, width: 320, height: 265 },

    // 08. Twin Tide Span & Cairn 3 (x: 8250 .. 9450)
    // Root Bridge 2 spans from x: 7945 to x: 8173
    { id: 'mm_p19_tide_hub', x: 8155, y: 435, width: 290, height: 265 },
    // Root Bridge 3 spans from x: 8430 to x: 8658
    { id: 'mm_p20_cairn_3', x: 8640, y: 435, width: 410, height: 265 },

    // 09. Lotus Approach (x: 9450 .. 10800)
    { id: 'mm_p21_approach_1', x: 9140, y: 405, width: 310, height: 295 },
    { id: 'mm_p22_approach_2', x: 9920, y: 380, width: 280, height: 320 },
    { id: 'mm_p23_approach_3', x: 10380, y: 370, width: 270, height: 330 },

    // 10. The Marsh Lotus Sanctuary (x: 10800 .. 11800)
    // Root Bridge 4 spans from x: 10635 to x: 10863
    { id: 'mm_p24_sanctuary', x: 10845, y: 370, width: 580, height: 330 },
  ],

  blooms: [
    // Sub-area 02: Sunken Blossoms
    { id: 'mm_bloom_01', x: 1310, y: 455 },
    { id: 'mm_bloom_02', x: 1485, y: 405 },
    { id: 'mm_bloom_03', x: 1965, y: 380 },

    // Sub-area 03: Flowing Shallows
    { id: 'mm_bloom_04', x: 2610, y: 420 },
    { id: 'mm_bloom_05', x: 2805, y: 390 },

    // Sub-area 04: Secret upper reed shrine access
    { id: 'mm_bloom_06', x: 3845, y: 335 },

    // Sub-area 06: Reed Current Gauntlet
    { id: 'mm_bloom_07', x: 6085, y: 415 },
    { id: 'mm_bloom_08', x: 6265, y: 380 },
    { id: 'mm_bloom_09', x: 6435, y: 365 },

    // Sub-area 07: Sunken Bell Shrine climb
    { id: 'mm_bloom_10', x: 7375, y: 445 },
    { id: 'mm_bloom_11', x: 7525, y: 395 },

    // Sub-area 09: Lotus Approach
    { id: 'mm_bloom_12', x: 10290, y: 345 },
  ],

  rootBridges: [
    { id: 'mm_root_01', x: 3215, y: 457 },
    { id: 'mm_root_02', x: 7945, y: 447 },
    { id: 'mm_root_03', x: 8430, y: 447 },
    { id: 'mm_root_04', x: 10635, y: 382 },
  ],

  drifters: [
    {
      id: 'mm_drifter_01',
      startX: 4325,
      startY: 405,
      endX: 4635,
      endY: 380,
      cycleDuration: 5.5,
    },
    {
      id: 'mm_drifter_02',
      startX: 5050,
      startY: 380,
      endX: 5335,
      endY: 405,
      cycleDuration: 5.6,
    },
    {
      id: 'mm_drifter_03',
      startX: 9540,
      startY: 395,
      endX: 9835,
      endY: 365,
      cycleDuration: 5.2,
    },
  ],

  hazards: [
    { id: 'mm_haz_01', x: 1395, y: 560, width: 128 },
    { id: 'mm_haz_02', x: 2610, y: 520, width: 128 },
    { id: 'mm_haz_03', x: 6090, y: 515, width: 128 },
    { id: 'mm_haz_04', x: 6275, y: 515, width: 128 },
    { id: 'mm_haz_05', x: 9295, y: 405, width: 128 },
  ],

  waterCurrents: [
    // Sub-area 03: Eastward tidal stream helping carry long jumps
    { id: 'mm_current_01', x: 2350, y: 380, width: 560, height: 150, driftVx: 72 },
    // Sub-area 06: Westward counter-current requiring clean Bloom hops above the stream
    { id: 'mm_current_02', x: 5890, y: 370, width: 580, height: 155, driftVx: -68 },
    // Sub-area 09: Gentle tailwind stream before Drifter 3
    { id: 'mm_current_03', x: 9120, y: 290, width: 420, height: 130, driftVx: 64 },
  ],

  crumblingPlatforms: [
    { id: 'mm_crumble_01', x: 1850, y: 425, width: 144, standWindowSec: 0.95 },
    { id: 'mm_crumble_02', x: 7305, y: 495, width: 144, standWindowSec: 0.95 },
    { id: 'mm_crumble_03', x: 10190, y: 375, width: 144, standWindowSec: 0.9 },
  ],

  memoryEchoes: [
    {
      id: 'mem_marsh_reed_chime',
      x: 4025,
      y: 215,
      title: 'Memory Echo III · Reflection of the Tide-Watchers',
      dialogueId: 'memory_marsh_01',
    },
    {
      id: 'mem_marsh_sunken_bell',
      x: 7185,
      y: 595,
      title: 'Memory Echo IV · The Bell Beneath the Stillness',
      dialogueId: 'memory_marsh_02',
    },
  ],

  checkpoint: {
    id: 'cp_marsh_01',
    x: 3620,
    y: 445,
  },

  checkpoints: [
    { id: 'cp_marsh_01', x: 3620, y: 445 },
    { id: 'cp_marsh_02', x: 5610, y: 420 },
    { id: 'cp_marsh_03', x: 8830, y: 435 },
    { id: 'cp_marsh_04', x: 10960, y: 370 },
  ],

  ancientBloom: {
    id: 'ancient_bloom_marsh',
    x: 11210,
    y: 370,
  },

  beats: [
    {
      index: 1,
      title: '01 · Still Waters Edge',
      subtitle: 'Follow the glowing reed banks into the mist-draped Moonlit Marsh.',
      minX: 0,
      maxX: 1120,
    },
    {
      index: 2,
      title: '02 · Sunken Blossoms',
      subtitle: 'Chain Wake pulses across the sleeping water flowers and mossy ledges.',
      minX: 1120,
      maxX: 2280,
    },
    {
      index: 3,
      title: '03 · The Flowing Shallows',
      subtitle: 'Feel the luminous water current carry your stride across the wetland stream.',
      minX: 2280,
      maxX: 3350,
    },
    {
      index: 4,
      title: '04 · The Drowned Archway',
      subtitle: 'Uncoil the wetland bridge and kindle the first marsh Resonance Cairn.',
      minX: 3350,
      maxX: 4300,
    },
    {
      index: 5,
      title: '05 · Lagoon Drifters',
      subtitle: 'Ride the twin marsh Drifters across the deep reflective lagoon.',
      minX: 4300,
      maxX: 5820,
    },
    {
      index: 6,
      title: '06 · The Reed Current Gauntlet',
      subtitle: 'Use elevated Wake blooms to rise above the westward marsh counter-current.',
      minX: 5820,
      maxX: 6920,
    },
    {
      index: 7,
      title: '07 · The Sunken Bell Shrine',
      subtitle: 'Cross the crumbling reed slabs—or descend to the sunken Memory Echo.',
      minX: 6920,
      maxX: 8050,
    },
    {
      index: 8,
      title: '08 · Twin Tide Span',
      subtitle: 'Awaken the paired wetland root bridges to reach the eastern marsh lantern.',
      minX: 8050,
      maxX: 9100,
    },
    {
      index: 9,
      title: '09 · Lotus Approach',
      subtitle: 'Ride the tidal breeze and final marsh Drifter toward the sanctuary.',
      minX: 9100,
      maxX: 10750,
    },
    {
      index: 10,
      title: '10 · The Marsh Lotus Sanctuary',
      subtitle: 'Release Wake beside the Great Wetland Lotus to part the marsh mists.',
      minX: 10750,
      maxX: 11800,
    },
  ],
};

/**
 * Chapter 03 — The Hollow Below (Milestone 5 Expanded 10-Sub-Area Adventure — Section 11)
 * Introduces Spore Vents, Crumbling Surfaces, Falling Debris, and deep vertical root caverns.
 */
export const CHAPTER_03_HOLLOW_BELOW: CampaignLevelDefinition = {
  id: 'hollow_below',
  chapterId: 'hollow_below',
  chapterNumber: 3,
  title: 'Chapter 03 · The Hollow Below',
  regionSubtitle: 'Subterranean root caverns, rhythmic spore vents, and echoing shafts',
  description:
    'Descend into the shadowed root caverns beneath the Veilgrove, reading rhythmic spore vents, crumbling stone shelves, and falling cavern debris to awaken the Root-Heart.',
  biomeTheme: 'cavern',
  width: 12200,
  height: 860,
  spawnX: 160,
  spawnY: 470,

  platforms: [
    // 01. Into the Root Caverns (x: 40 .. 1120)
    { id: 'hb_p01_start', x: 40, y: 545, width: 410, height: 195 },
    { id: 'hb_p02_descent_step', x: 510, y: 500, width: 290, height: 240 },
    { id: 'hb_p03_shelf_west', x: 870, y: 465, width: 270, height: 275 },

    // 02. The Spore Shaft (x: 1120 .. 2320)
    { id: 'hb_p04_shaft_floor', x: 1210, y: 575, width: 440, height: 165 },
    { id: 'hb_p05_shaft_mid', x: 1730, y: 435, width: 270, height: 305 },
    { id: 'hb_p06_shaft_top', x: 2090, y: 385, width: 280, height: 355 },

    // 03. Crumbling Shelf Passage & Cairn 1 (x: 2320 .. 3580)
    { id: 'hb_p07_shelf_mid', x: 2640, y: 425, width: 270, height: 315 },
    // Root Bridge 1 spans from x: 2895 to x: 3123
    { id: 'hb_p08_cairn_1', x: 3105, y: 425, width: 420, height: 315 },

    // 04. Luminous Fungus Grotto — Optional upper Memory Echo (x: 3580 .. 4750)
    { id: 'hb_p09_grotto_low', x: 3610, y: 495, width: 360, height: 245 },
    { id: 'hb_p10_grotto_secret', x: 3920, y: 275, width: 280, height: 48 },
    { id: 'hb_p11_grotto_east', x: 4320, y: 440, width: 330, height: 300 },

    // 05. The Echoing Vent Chasm & Cairn 2 (x: 4750 .. 6050)
    { id: 'hb_p12_vent_walk_1', x: 4740, y: 485, width: 460, height: 255 },
    { id: 'hb_p13_cairn_2', x: 5560, y: 435, width: 410, height: 305 },

    // 06. Falling Stalactite Gallery (x: 6050 .. 7350)
    { id: 'hb_p14_debris_run_1', x: 6060, y: 505, width: 520, height: 235 },
    { id: 'hb_p15_debris_run_2', x: 6680, y: 465, width: 460, height: 275 },

    // 07. The Deep Root-Vault — Optional lower Memory Echo (x: 7350 .. 8550)
    { id: 'hb_p16_vault_west', x: 7230, y: 515, width: 310, height: 225 },
    { id: 'hb_p17_vault_secret', x: 7320, y: 665, width: 290, height: 95 },
    { id: 'hb_p18_vault_east', x: 7940, y: 445, width: 320, height: 295 },

    // 08. Subterranean Drifter Abyss & Cairn 3 (x: 8550 .. 9850)
    { id: 'hb_p19_abyss_mid', x: 8740, y: 415, width: 250, height: 325 },
    { id: 'hb_p20_cairn_3', x: 9430, y: 430, width: 410, height: 310 },

    // 09. The Heart-Vein Climb (x: 9850 .. 11100)
    { id: 'hb_p21_vein_1', x: 9930, y: 485, width: 380, height: 255 },
    { id: 'hb_p22_vein_2', x: 10440, y: 410, width: 290, height: 330 },
    { id: 'hb_p23_vein_top', x: 10840, y: 385, width: 270, height: 355 },

    // 10. The Root-Heart Chamber (x: 11100 .. 12200)
    // Root Bridge 3 spans from x: 11095 to x: 11323
    { id: 'hb_p24_sanctuary', x: 11305, y: 385, width: 580, height: 355 },
  ],

  blooms: [
    // Sub-area 02: Vertical Spore Shaft climb
    { id: 'hb_bloom_01', x: 1385, y: 475 },
    { id: 'hb_bloom_02', x: 1565, y: 415 },
    { id: 'hb_bloom_03', x: 2025, y: 365 },

    // Sub-area 04: Luminous Grotto + upper secret
    { id: 'hb_bloom_04', x: 3845, y: 355 },
    { id: 'hb_bloom_05', x: 4065, y: 425 },
    { id: 'hb_bloom_06', x: 4225, y: 390 },

    // Sub-area 05: Vent chasm crossing
    { id: 'hb_bloom_07', x: 5295, y: 425 },
    { id: 'hb_bloom_08', x: 5455, y: 390 },

    // Sub-area 07: Deep Root-Vault climb
    { id: 'hb_bloom_09', x: 7635, y: 465 },
    { id: 'hb_bloom_10', x: 7815, y: 415 },

    // Sub-area 09: Heart-Vein climb
    { id: 'hb_bloom_11', x: 10120, y: 395 },
    { id: 'hb_bloom_12', x: 10315, y: 365 },
  ],

  rootBridges: [
    { id: 'hb_root_01', x: 2895, y: 437 },
    { id: 'hb_root_02', x: 6520, y: 477 },
    { id: 'hb_root_03', x: 11095, y: 397 },
  ],

  drifters: [
    {
      id: 'hb_drifter_01',
      startX: 8340,
      startY: 425,
      endX: 8650,
      endY: 395,
      cycleDuration: 5.5,
    },
    {
      id: 'hb_drifter_02',
      startX: 9075,
      startY: 395,
      endX: 9345,
      endY: 415,
      cycleDuration: 5.5,
    },
  ],

  hazards: [
    { id: 'hb_haz_01', x: 1415, y: 575, width: 128 },
    { id: 'hb_haz_02', x: 4965, y: 485, width: 128 },
    { id: 'hb_haz_03', x: 10125, y: 485, width: 128 },
  ],

  crumblingPlatforms: [
    // Sub-area 03: Crumbling Shelf Passage
    { id: 'hb_crumble_01', x: 2435, y: 405, width: 144, standWindowSec: 0.9 },
    // Sub-area 07: Deep Root-Vault
    { id: 'hb_crumble_02', x: 7580, y: 545, width: 144, standWindowSec: 0.9 },
    // Sub-area 09: Heart-Vein step
    { id: 'hb_crumble_03', x: 10715, y: 395, width: 144, standWindowSec: 0.85 },
  ],

  sporeVents: [
    // Sub-area 02, 04, 05, 09 rhythmic cavern vents
    { id: 'hb_vent_01', x: 1865, y: 435, burstHeight: 110, cycleSec: 3.8, phaseOffsetSec: 0.0 },
    { id: 'hb_vent_02', x: 3790, y: 495, burstHeight: 115, cycleSec: 3.6, phaseOffsetSec: 1.2 },
    { id: 'hb_vent_03', x: 4850, y: 485, burstHeight: 115, cycleSec: 3.6, phaseOffsetSec: 0.4 },
    { id: 'hb_vent_04', x: 5095, y: 485, burstHeight: 115, cycleSec: 3.6, phaseOffsetSec: 2.2 },
    { id: 'hb_vent_05', x: 10585, y: 410, burstHeight: 115, cycleSec: 3.5, phaseOffsetSec: 0.9 },
  ],

  fallingDebris: [
    // Sub-area 06: Falling Stalactite Gallery
    { id: 'hb_debris_01', x: 6230, ceilingY: 160, floorY: 505, cycleSec: 3.6, phaseOffsetSec: 0.3 },
    { id: 'hb_debris_02', x: 6410, ceilingY: 160, floorY: 505, cycleSec: 3.6, phaseOffsetSec: 2.1 },
    { id: 'hb_debris_03', x: 6840, ceilingY: 150, floorY: 465, cycleSec: 3.4, phaseOffsetSec: 1.0 },
    { id: 'hb_debris_04', x: 7010, ceilingY: 150, floorY: 465, cycleSec: 3.4, phaseOffsetSec: 2.7 },
  ],

  memoryEchoes: [
    {
      id: 'mem_hollow_root_pact',
      x: 4060,
      y: 235,
      title: 'Memory Echo V · The Pact of the Deep Roots',
      dialogueId: 'memory_hollow_01',
    },
    {
      id: 'mem_hollow_first_seed',
      x: 7465,
      y: 625,
      title: 'Memory Echo VI · Where Pip Was Born',
      dialogueId: 'memory_hollow_02',
    },
  ],

  checkpoint: {
    id: 'cp_hollow_01',
    x: 3310,
    y: 425,
  },

  checkpoints: [
    { id: 'cp_hollow_01', x: 3310, y: 425 },
    { id: 'cp_hollow_02', x: 5760, y: 435 },
    { id: 'cp_hollow_03', x: 9630, y: 430 },
    { id: 'cp_hollow_04', x: 11430, y: 385 },
  ],

  ancientBloom: {
    id: 'ancient_bloom_hollow',
    x: 11680,
    y: 385,
  },

  beats: [
    {
      index: 1,
      title: '01 · Into the Root Caverns',
      subtitle: 'Let Nima’s seed light guide your steps into the deep root chambers.',
      minX: 0,
      maxX: 1150,
    },
    {
      index: 2,
      title: '02 · The Spore Shaft',
      subtitle: 'Awaken the ascending cavern buds and watch the rhythmic spore vent telegraph.',
      minX: 1150,
      maxX: 2380,
    },
    {
      index: 3,
      title: '03 · Crumbling Shelf Passage',
      subtitle: 'Keep moving across ancient fractured shelves before they give way.',
      minX: 2380,
      maxX: 3560,
    },
    {
      index: 4,
      title: '04 · Luminous Fungus Grotto',
      subtitle: 'Time the spore bursts—or climb to the upper shelf to uncover a Memory Echo.',
      minX: 3560,
      maxX: 4700,
    },
    {
      index: 5,
      title: '05 · The Echoing Vent Chasm',
      subtitle: 'Read the glowing amber rumble of the twin vents and chain the chasm blooms.',
      minX: 4700,
      maxX: 6020,
    },
    {
      index: 6,
      title: '06 · Falling Stalactite Gallery',
      subtitle: 'Watch for falling dust trails overhead and sprint between stalactite impacts.',
      minX: 6020,
      maxX: 7200,
    },
    {
      index: 7,
      title: '07 · The Deep Root-Vault',
      subtitle: 'Explore the lower vault for Pip’s origin memory or ascend the cavern buds.',
      minX: 7200,
      maxX: 8280,
    },
    {
      index: 8,
      title: '08 · Subterranean Drifter Abyss',
      subtitle: 'Transfer cleanly between the deep cavern Drifters above the glowing void.',
      minX: 8280,
      maxX: 9880,
    },
    {
      index: 9,
      title: '09 · The Heart-Vein Climb',
      subtitle: 'Combine Wake blooms, vent timing, and crumbling ledges on the final ascent.',
      minX: 9880,
      maxX: 11150,
    },
    {
      index: 10,
      title: '10 · The Root-Heart Chamber',
      subtitle: 'Release Wake beside the Root-Heart Bloom to restore pulse to the lower world.',
      minX: 11150,
      maxX: 12200,
    },
  ],
};

/**
 * Chapter 04 — The Windward Ruins (Milestone 5 Expanded 10-Sub-Area Climax — Section 12)
 * Introduces Wind Zones (horizontal gusts & vertical updrafts), sky-stone crumbling ledges,
 * multi-stage Drifter transfers, and the Great Crown Bloom ending.
 */
export const CHAPTER_04_WINDWARD_RUINS: CampaignLevelDefinition = {
  id: 'windward_ruins',
  chapterId: 'windward_ruins',
  chapterNumber: 4,
  title: 'Chapter 04 · The Windward Ruins',
  regionSubtitle: 'High skyward sanctuaries, updraft wind conduits, and the Great Crown Bloom',
  description:
    'Ascend the wind-swept stone towers high in the canopy crown, riding skyward updrafts, ancient root bridges, and cloud Drifters to awaken the Great Crown Bloom.',
  biomeTheme: 'ruins',
  width: 12800,
  height: 860,
  spawnX: 160,
  spawnY: 460,

  platforms: [
    // 01. The Skyward Steps (x: 40 .. 1150)
    { id: 'wr_p01_start', x: 40, y: 530, width: 410, height: 210 },
    { id: 'wr_p02_terrace', x: 520, y: 480, width: 300, height: 260 },
    { id: 'wr_p03_pillar', x: 900, y: 440, width: 270, height: 300 },

    // 02. The Broken Aqueduct (x: 1150 .. 2350)
    // Root Bridge 1 spans from x: 1155 to x: 1383
    { id: 'wr_p04_aqueduct_mid', x: 1365, y: 440, width: 320, height: 300 },
    { id: 'wr_p05_aqueduct_east', x: 2010, y: 395, width: 290, height: 345 },

    // 03. Updraft Gallery & Cairn 1 (x: 2350 .. 3650)
    { id: 'wr_p06_updraft_launch', x: 2390, y: 465, width: 280, height: 275 },
    { id: 'wr_p07_cairn_1', x: 3060, y: 375, width: 420, height: 365 },

    // 04. Windward Belfry — Optional high Memory Echo (x: 3650 .. 4850)
    { id: 'wr_p08_belfry_walk', x: 3580, y: 430, width: 350, height: 310 },
    { id: 'wr_p09_belfry_secret', x: 3950, y: 245, width: 280, height: 48 },
    { id: 'wr_p10_belfry_east', x: 4360, y: 395, width: 320, height: 345 },

    // 05. Cloudroot Drifter Crossing & Cairn 2 (x: 4850 .. 6250)
    { id: 'wr_p11_cloud_isle', x: 5160, y: 375, width: 240, height: 365 },
    { id: 'wr_p12_cairn_2', x: 5840, y: 395, width: 410, height: 345 },

    // 06. Shattered Sky-Stones (x: 6250 .. 7550)
    { id: 'wr_p13_skystone_mid', x: 6680, y: 420, width: 280, height: 320 },
    { id: 'wr_p14_skystone_east', x: 7340, y: 390, width: 320, height: 350 },

    // 07. The Gale Conduit & Cairn 3 (x: 7550 .. 8950)
    { id: 'wr_p15_gale_floor', x: 7750, y: 475, width: 480, height: 265 },
    // Root Bridge 2 spans from x: 8215 to x: 8443
    { id: 'wr_p16_cairn_3', x: 8425, y: 475, width: 410, height: 265 },

    // 08. Spire of the First Choir — Optional lower Memory Echo (x: 8950 .. 10200)
    { id: 'wr_p17_choir_west', x: 8930, y: 435, width: 310, height: 305 },
    { id: 'wr_p18_choir_secret', x: 9020, y: 615, width: 290, height: 95 },
    { id: 'wr_p19_choir_east', x: 9680, y: 390, width: 330, height: 350 },

    // 09. The Final Sky Ascent & Cairn 4 (x: 10200 .. 11650)
    { id: 'wr_p20_ascent_1', x: 10110, y: 370, width: 280, height: 370 },
    { id: 'wr_p21_ascent_2', x: 10920, y: 350, width: 280, height: 390 },
    { id: 'wr_p22_cairn_4', x: 11420, y: 350, width: 340, height: 390 },

    // 10. The Crown Sanctuary (x: 11650 .. 12800)
    // Root Bridge 3 spans from x: 11745 to x: 11973
    { id: 'wr_p23_sanctuary', x: 11955, y: 350, width: 640, height: 390 },
  ],

  blooms: [
    // Sub-area 02: Broken Aqueduct
    { id: 'wr_bloom_01', x: 1785, y: 425 },
    { id: 'wr_bloom_02', x: 1925, y: 385 },

    // Sub-area 03: Updraft Gallery (Bloom walkable top is at y - 44 = 401)
    { id: 'wr_bloom_03', x: 2845, y: 445 },

    // Sub-area 04: Windward Belfry + secret upper
    { id: 'wr_bloom_04', x: 3895, y: 335 },
    { id: 'wr_bloom_05', x: 4095, y: 410 },
    { id: 'wr_bloom_06', x: 4245, y: 375 },

    // Sub-area 06: Shattered Sky-Stones
    { id: 'wr_bloom_07', x: 6565, y: 395 },
    { id: 'wr_bloom_08', x: 7245, y: 375 },

    // Sub-area 08: Spire of the First Choir
    { id: 'wr_bloom_09', x: 9385, y: 425 },
    { id: 'wr_bloom_10', x: 9545, y: 380 },

    // Sub-area 09: Final Sky Ascent
    { id: 'wr_bloom_11', x: 10825, y: 345 },
    { id: 'wr_bloom_12', x: 11315, y: 335 },
  ],

  rootBridges: [
    { id: 'wr_root_01', x: 1155, y: 452 },
    { id: 'wr_root_02', x: 8215, y: 487 },
    { id: 'wr_root_03', x: 11745, y: 362 },
  ],

  drifters: [
    {
      id: 'wr_drifter_01',
      startX: 4770,
      startY: 385,
      endX: 5075,
      endY: 360,
      cycleDuration: 5.2,
    },
    {
      id: 'wr_drifter_02',
      startX: 5490,
      startY: 360,
      endX: 5755,
      endY: 385,
      cycleDuration: 5.2,
    },
    {
      id: 'wr_drifter_03',
      startX: 10475,
      startY: 360,
      endX: 10735,
      endY: 340,
      cycleDuration: 5.0,
    },
  ],

  hazards: [
    { id: 'wr_haz_01', x: 1525, y: 440, width: 128 },
    { id: 'wr_haz_02', x: 3755, y: 430, width: 128 },
    { id: 'wr_haz_03', x: 7920, y: 475, width: 128 },
    { id: 'wr_haz_04', x: 8080, y: 475, width: 128 },
  ],

  windZones: [
    // Sub-area 03: Updraft & tailwind lifting Nima across the sky gap to Cairn 1
    { id: 'wr_wind_01', x: 2640, y: 240, width: 420, height: 260, driftVx: 78, driftVy: -105 },
    // Sub-area 07: Gale Conduit updraft lifting Nima cleanly over the twin bramble patches
    { id: 'wr_wind_02', x: 7810, y: 260, width: 360, height: 215, driftVx: 65, driftVy: -115 },
    // Sub-area 09: High-altitude tailwind assisting the final Drifter & Bloom ascent
    { id: 'wr_wind_03', x: 10390, y: 210, width: 520, height: 220, driftVx: 70, driftVy: -65 },
  ],

  crumblingPlatforms: [
    // Sub-area 06: Shattered Sky-Stones
    { id: 'wr_crumble_01', x: 6340, y: 405, width: 144, standWindowSec: 0.85 },
    { id: 'wr_crumble_02', x: 7040, y: 395, width: 144, standWindowSec: 0.85 },
  ],

  sporeVents: [
    { id: 'wr_vent_01', x: 6820, y: 420, burstHeight: 115, cycleSec: 3.5, phaseOffsetSec: 0.6 },
  ],

  fallingDebris: [
    { id: 'wr_debris_01', x: 9835, ceilingY: 130, floorY: 390, cycleSec: 3.4, phaseOffsetSec: 0.8 },
  ],

  memoryEchoes: [
    {
      id: 'mem_ruins_sky_watch',
      x: 4090,
      y: 205,
      title: 'Memory Echo VII · The Watchers of the Crown',
      dialogueId: 'memory_ruins_01',
    },
    {
      id: 'mem_ruins_final_vow',
      x: 9165,
      y: 575,
      title: 'Memory Echo VIII · The Promise of Wispwake',
      dialogueId: 'memory_ruins_02',
    },
  ],

  checkpoint: {
    id: 'cp_ruins_01',
    x: 3260,
    y: 375,
  },

  checkpoints: [
    { id: 'cp_ruins_01', x: 3260, y: 375 },
    { id: 'cp_ruins_02', x: 6035, y: 395 },
    { id: 'cp_ruins_03', x: 8630, y: 475 },
    { id: 'cp_ruins_04', x: 11580, y: 350 },
  ],

  ancientBloom: {
    id: 'ancient_bloom_windward',
    x: 12360,
    y: 350,
  },

  beats: [
    {
      index: 1,
      title: '01 · The Skyward Steps',
      subtitle: 'Climb the wind-swept ruins rising above the Veilgrove cloud sea.',
      minX: 0,
      maxX: 1140,
    },
    {
      index: 2,
      title: '02 · The Broken Aqueduct',
      subtitle: 'Pulse the ancient roots to mend the shattered sky bridge.',
      minX: 1140,
      maxX: 2350,
    },
    {
      index: 3,
      title: '03 · Updraft Gallery',
      subtitle: 'Leap into the shimmering wind updraft to soar up to the first sky lantern.',
      minX: 2350,
      maxX: 3520,
    },
    {
      index: 4,
      title: '04 · Windward Belfry',
      subtitle: 'Chain the aerial blooms—or ascend to the belfry crown for a Memory Echo.',
      minX: 3520,
      maxX: 4720,
    },
    {
      index: 5,
      title: '05 · Cloudroot Drifter Crossing',
      subtitle: 'Ride the high-altitude Drifters across the open sky valley.',
      minX: 4720,
      maxX: 6260,
    },
    {
      index: 6,
      title: '06 · Shattered Sky-Stones',
      subtitle: 'Sprint and pulse Wake across the crumbling sky-stone slabs.',
      minX: 6260,
      maxX: 7680,
    },
    {
      index: 7,
      title: '07 · The Gale Conduit',
      subtitle: 'Ride the upward gale stream to vault the twin bramble beds and extend the bridge.',
      minX: 7680,
      maxX: 8880,
    },
    {
      index: 8,
      title: '08 · Spire of the First Choir',
      subtitle: 'Uncover the final Memory Echo below or climb the choir blooms.',
      minX: 8880,
      maxX: 10050,
    },
    {
      index: 9,
      title: '09 · The Final Sky Ascent',
      subtitle: 'Combine wind updrafts, sky Drifters, and aerial Wake blooms to reach the summit.',
      minX: 10050,
      maxX: 11850,
    },
    {
      index: 10,
      title: '10 · The Crown Sanctuary',
      subtitle: 'Release Wake beside the Great Crown Bloom to unite the entire Veilgrove in light.',
      minX: 11850,
      maxX: 12800,
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

/**
 * Applies Story Difficulty scaling (Section 13) to a Campaign LevelDefinition without
 * making Nima's movement sluggish or altering her responsive physics constants.
 *
 * - Easy:
 *   - Bloom duration: 6.8s (generous crossing window)
 *   - Crumbling ledge window: 1.35s
 *   - Drifter cycle duration: +15% slower/calmer
 *   - Fewer hazards (removes every second thorn patch / falling debris)
 *   - All 4 checkpoints active
 * - Medium:
 *   - Canonical authored layout (Bloom 5.2s, Crumble 0.95s, all 4 checkpoints)
 * - Hard:
 *   - Bloom duration: 4.1s (requires crisp chaining)
 *   - Crumbling ledge window: 0.72s
 *   - Drifter cycle duration: 10% faster
 *   - Spore vents cycle 12% faster
 * - Extreme:
 *   - Bloom duration: 3.35s (tight mastery timing)
 *   - Crumbling ledge window: 0.56s
 *   - Drifter cycle duration: 18% faster
 *   - Checkpoints reduced to 2 major checkpoints per chapter
 */
export function applyStoryDifficultyToLevel(
  baseLevel: LevelDefinition,
  difficulty: StoryDifficulty
): LevelDefinition {
  const cloned: LevelDefinition = structuredClone(baseLevel);

  const bloomDurMap: Record<StoryDifficulty, number> = {
    easy: 6.8,
    medium: 5.2,
    hard: 4.1,
    extreme: 3.35,
  };

  const crumbleScaleMap: Record<StoryDifficulty, number> = {
    easy: 1.4,
    medium: 1.0,
    hard: 0.78,
    extreme: 0.62,
  };

  const drifterScaleMap: Record<StoryDifficulty, number> = {
    easy: 1.15,
    medium: 1.0,
    hard: 0.9,
    extreme: 0.82,
  };

  cloned.blooms = cloned.blooms.map((b) => ({
    ...b,
    customDuration: bloomDurMap[difficulty],
  }));

  cloned.drifters = cloned.drifters.map((d) => ({
    ...d,
    cycleDuration: Number((d.cycleDuration * drifterScaleMap[difficulty]).toFixed(2)),
  }));

  if (cloned.crumblingPlatforms) {
    cloned.crumblingPlatforms = cloned.crumblingPlatforms.map((c) => ({
      ...c,
      standWindowSec: Number(((c.standWindowSec ?? 0.95) * crumbleScaleMap[difficulty]).toFixed(2)),
    }));
  }

  if (difficulty === 'easy') {
    cloned.hazards = cloned.hazards.filter((_, idx) => idx % 2 === 0);
    if (cloned.fallingDebris) {
      cloned.fallingDebris = cloned.fallingDebris.filter((_, idx) => idx % 2 === 0);
    }
  } else if (difficulty === 'hard' || difficulty === 'extreme') {
    if (cloned.sporeVents) {
      const factor = difficulty === 'extreme' ? 0.82 : 0.9;
      cloned.sporeVents = cloned.sporeVents.map((v) => ({
        ...v,
        cycleSec: Number((v.cycleSec * factor).toFixed(2)),
      }));
    }
    if (difficulty === 'extreme' && cloned.checkpoints && cloned.checkpoints.length >= 3) {
      // Keep mid-chapter and pre-sanctuary checkpoints on Extreme
      cloned.checkpoints = cloned.checkpoints.filter(
        (_, idx, arr) => idx === 1 || idx === arr.length - 1
      );
      cloned.checkpoint = cloned.checkpoints[0];
    }
  }

  return cloned;
}
