import { CampaignChapterId, StoryDifficulty } from '../config/gameConfig';
import {
  BiomeTheme,
  LevelDefinition,
  SLEEPING_CANOPY_LEVEL,
} from '../levels/sleepingCanopy/levelData';

export interface CampaignLevelDefinition extends LevelDefinition {
  chapterId: CampaignChapterId;
  chapterNumber: number;
  regionSubtitle: string;
  description: string;
  biomeTheme: BiomeTheme;
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
    'Awaken on a vast tree root alongside Pip, meet Oakhaven the Last Gardener, and use the living seed’s Wake pulse to stir dormant flowers, uncoil bridges, and rekindle the First Bloom Sanctuary.',
  biomeTheme: 'canopy',
};

/**
 * Chapter 02 — The Moonlit Marsh (10 Sub-Areas, 11,800 units)
 */
export const CHAPTER_02_MOONLIT_MARSH: CampaignLevelDefinition = {
  id: 'moonlit_marsh',
  chapterId: 'moonlit_marsh',
  chapterNumber: 2,
  title: 'Chapter 02 · The Moonlit Marsh',
  regionSubtitle: 'Luminous wetlands, flowing tidal channels, and sunken stone arches',
  description:
    'Cross the mist-draped wetlands where gentle and surging water currents carry Nima between sunken piers, gliding marsh Drifters, Mirel the Tide-Watcher, and the Great Wetland Lotus.',
  biomeTheme: 'marsh',
  width: 11800,
  height: 820,
  spawnX: 160,
  spawnY: 440,

  platforms: [
    { id: 'mm_p01_start', x: 40, y: 515, width: 410, height: 185 },
    { id: 'mm_p02_reed_bank', x: 520, y: 475, width: 290, height: 225 },
    { id: 'mm_p03_pier_west', x: 880, y: 445, width: 260, height: 255 },
    { id: 'mm_p04_lily_basin', x: 1180, y: 560, width: 440, height: 140 },
    { id: 'mm_p05_arch_step', x: 1660, y: 425, width: 260, height: 275 },
    { id: 'mm_p06_marsh_terrace', x: 2010, y: 425, width: 280, height: 275 },
    { id: 'mm_p07_current_bed_1', x: 2350, y: 520, width: 520, height: 180 },
    { id: 'mm_p08_current_isle', x: 2940, y: 445, width: 290, height: 255 },
    { id: 'mm_p09_cairn_1', x: 3425, y: 445, width: 410, height: 255 },
    { id: 'mm_p10_drowned_east', x: 3920, y: 410, width: 320, height: 290 },
    { id: 'mm_p11_secret_reeds', x: 3890, y: 255, width: 270, height: 48 },
    { id: 'mm_p12_lagoon_mid', x: 4720, y: 395, width: 240, height: 305 },
    { id: 'mm_p13_cairn_2', x: 5420, y: 420, width: 390, height: 280 },
    { id: 'mm_p14_surge_floor', x: 5890, y: 515, width: 560, height: 185 },
    { id: 'mm_p15_surge_high', x: 6530, y: 415, width: 360, height: 285 },
    { id: 'mm_p16_bell_west', x: 6970, y: 475, width: 310, height: 225 },
    { id: 'mm_p17_bell_secret', x: 7040, y: 635, width: 290, height: 95 },
    { id: 'mm_p18_bell_east', x: 7640, y: 435, width: 320, height: 265 },
    { id: 'mm_p19_tide_hub', x: 8155, y: 435, width: 290, height: 265 },
    { id: 'mm_p20_cairn_3', x: 8640, y: 435, width: 410, height: 265 },
    { id: 'mm_p21_approach_1', x: 9140, y: 405, width: 310, height: 295 },
    { id: 'mm_p22_approach_2', x: 9920, y: 380, width: 280, height: 320 },
    { id: 'mm_p23_approach_3', x: 10380, y: 370, width: 270, height: 330 },
    { id: 'mm_p24_sanctuary', x: 10845, y: 370, width: 580, height: 330 },
  ],

  blooms: [
    { id: 'mm_bloom_01', x: 1310, y: 455 },
    { id: 'mm_bloom_02', x: 1485, y: 405 },
    { id: 'mm_bloom_03', x: 1965, y: 380 },
    { id: 'mm_bloom_04', x: 2610, y: 420 },
    { id: 'mm_bloom_05', x: 2805, y: 390 },
    { id: 'mm_bloom_06', x: 3845, y: 335 },
    { id: 'mm_bloom_07', x: 6085, y: 415 },
    { id: 'mm_bloom_08', x: 6265, y: 380 },
    { id: 'mm_bloom_09', x: 6435, y: 365 },
    { id: 'mm_bloom_10', x: 7375, y: 445 },
    { id: 'mm_bloom_11', x: 7525, y: 395 },
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
    { id: 'mm_current_01', x: 2350, y: 380, width: 560, height: 150, driftVx: 72 },
    { id: 'mm_current_02', x: 5890, y: 370, width: 580, height: 155, driftVx: -68 },
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

  npcs: [
    {
      id: 'npc_marsh_tide_watcher',
      archetype: 'tide_watcher',
      name: 'Mirel',
      title: 'The Tide-Watcher',
      x: 3540,
      y: 445,
      characterJournalId: 'char_tide_watcher',
      questJournalId: 'quest_tide_watcher_chimes',
      questTitle: 'Lanterns of the Tidal Stream',
      greetingLines: [
        'Welcome to the Drowned Archway, little traveler. My lantern has waited many moons to reflect a living seed.',
        'The eastern Twin Tide Span has fallen silent. Carry your Wake light across the lagoon and rekindle the marsh lanterns so the tidal stream can sing.',
      ],
      activeQuestLines: [
        'Watch for the Gloom Moths drifting above the reeds—your Wake pulse will scatter their dust if they swoop too close.',
      ],
      completedQuestLines: [
        'Look how the water-arches shimmer with starlight! Thank you, Nima—the Great Wetland Lotus is ready to bloom.',
      ],
    },
  ],

  enemies: [
    {
      id: 'mm_enemy_moth_01',
      archetype: 'gloom_moth',
      x: 3085,
      y: 330,
      flightRadiusX: 85,
      flightRadiusY: 32,
    },
    {
      id: 'mm_enemy_stalker_01',
      archetype: 'hushed_stalker',
      x: 6710,
      y: 415,
      patrolMinX: 6570,
      patrolMaxX: 6840,
    },
    {
      id: 'mm_enemy_moth_02',
      archetype: 'gloom_moth',
      x: 8300,
      y: 320,
      flightRadiusX: 90,
      flightRadiusY: 34,
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
      subtitle: 'Kindle the Cairn and press F to speak with Mirel the Tide-Watcher.',
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
 * Chapter 03 — The Hollow Below (10 Sub-Areas, 12,200 units)
 */
export const CHAPTER_03_HOLLOW_BELOW: CampaignLevelDefinition = {
  id: 'hollow_below',
  chapterId: 'hollow_below',
  chapterNumber: 3,
  title: 'Chapter 03 · The Hollow Below',
  regionSubtitle: 'Subterranean root caverns, rhythmic spore vents, and echoing shafts',
  description:
    'Descend into the shadowed root caverns beneath the Veilgrove, meeting Bram the Rootkeeper and reading rhythmic spore vents, crumbling stone shelves, and cavern guardians to awaken the Root-Heart.',
  biomeTheme: 'cavern',
  width: 12200,
  height: 860,
  spawnX: 160,
  spawnY: 470,

  platforms: [
    { id: 'hb_p01_start', x: 40, y: 545, width: 410, height: 195 },
    { id: 'hb_p02_descent_step', x: 510, y: 500, width: 290, height: 240 },
    { id: 'hb_p03_shelf_west', x: 870, y: 465, width: 270, height: 275 },
    { id: 'hb_p04_shaft_floor', x: 1210, y: 575, width: 440, height: 165 },
    { id: 'hb_p05_shaft_mid', x: 1730, y: 435, width: 270, height: 305 },
    { id: 'hb_p06_shaft_top', x: 2090, y: 385, width: 280, height: 355 },
    { id: 'hb_p07_shelf_mid', x: 2640, y: 425, width: 270, height: 315 },
    { id: 'hb_p08_cairn_1', x: 3105, y: 425, width: 420, height: 315 },
    { id: 'hb_p09_grotto_low', x: 3610, y: 495, width: 360, height: 245 },
    { id: 'hb_p10_grotto_secret', x: 3920, y: 275, width: 280, height: 48 },
    { id: 'hb_p11_grotto_east', x: 4320, y: 440, width: 330, height: 300 },
    { id: 'hb_p12_vent_walk_1', x: 4740, y: 485, width: 460, height: 255 },
    { id: 'hb_p13_cairn_2', x: 5560, y: 435, width: 410, height: 305 },
    { id: 'hb_p14_debris_run_1', x: 6060, y: 505, width: 520, height: 235 },
    { id: 'hb_p15_debris_run_2', x: 6680, y: 465, width: 460, height: 275 },
    { id: 'hb_p16_vault_west', x: 7230, y: 515, width: 310, height: 225 },
    { id: 'hb_p17_vault_secret', x: 7320, y: 665, width: 290, height: 95 },
    { id: 'hb_p18_vault_east', x: 7940, y: 445, width: 320, height: 295 },
    { id: 'hb_p19_abyss_mid', x: 8740, y: 415, width: 250, height: 325 },
    { id: 'hb_p20_cairn_3', x: 9430, y: 430, width: 410, height: 310 },
    { id: 'hb_p21_vein_1', x: 9930, y: 485, width: 380, height: 255 },
    { id: 'hb_p22_vein_2', x: 10440, y: 410, width: 290, height: 330 },
    { id: 'hb_p23_vein_top', x: 10840, y: 385, width: 270, height: 355 },
    { id: 'hb_p24_sanctuary', x: 11305, y: 385, width: 580, height: 355 },
  ],

  blooms: [
    { id: 'hb_bloom_01', x: 1385, y: 475 },
    { id: 'hb_bloom_02', x: 1565, y: 415 },
    { id: 'hb_bloom_03', x: 2025, y: 365 },
    { id: 'hb_bloom_04', x: 3845, y: 355 },
    { id: 'hb_bloom_05', x: 4065, y: 425 },
    { id: 'hb_bloom_06', x: 4225, y: 390 },
    { id: 'hb_bloom_07', x: 5295, y: 425 },
    { id: 'hb_bloom_08', x: 5455, y: 390 },
    { id: 'hb_bloom_09', x: 7635, y: 465 },
    { id: 'hb_bloom_10', x: 7815, y: 415 },
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
    { id: 'hb_crumble_01', x: 2435, y: 405, width: 144, standWindowSec: 0.9 },
    { id: 'hb_crumble_02', x: 7580, y: 545, width: 144, standWindowSec: 0.9 },
    { id: 'hb_crumble_03', x: 10715, y: 395, width: 144, standWindowSec: 0.85 },
  ],

  sporeVents: [
    { id: 'hb_vent_01', x: 1865, y: 435, burstHeight: 110, cycleSec: 3.8, phaseOffsetSec: 0.0 },
    { id: 'hb_vent_02', x: 3790, y: 495, burstHeight: 115, cycleSec: 3.6, phaseOffsetSec: 1.2 },
    { id: 'hb_vent_03', x: 4850, y: 485, burstHeight: 115, cycleSec: 3.6, phaseOffsetSec: 0.4 },
    { id: 'hb_vent_04', x: 5095, y: 485, burstHeight: 115, cycleSec: 3.6, phaseOffsetSec: 2.2 },
    { id: 'hb_vent_05', x: 10585, y: 410, burstHeight: 115, cycleSec: 3.5, phaseOffsetSec: 0.9 },
  ],

  fallingDebris: [
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

  npcs: [
    {
      id: 'npc_hollow_rootkeeper',
      archetype: 'rootkeeper',
      name: 'Bram',
      title: 'The Rootkeeper',
      x: 3220,
      y: 425,
      characterJournalId: 'char_rootkeeper',
      questJournalId: 'quest_rootkeeper_pact',
      questTitle: 'Echoes of the Deep Pact',
      greetingLines: [
        'Little Pip... and the Seed-Bearer! I remember the hour the Root-Heart gave its last spark to form your wings, Pip.',
        'The Stillness was woven here to keep the world-tree whole until you returned. Awaken the Root-Heart Chamber ahead so the upper conduits can breathe!',
      ],
      activeQuestLines: [
        'In the Deep Root-Vault ahead, a Rootbound Sentinel still tests travelers. Jump over its root-wave or calm its core with a Wake pulse.',
      ],
      completedQuestLines: [
        'The deep arteries pulse with warm gold once more. We shall meet again at the Heart of the Veil!',
      ],
    },
  ],

  enemies: [
    {
      id: 'hb_enemy_stalker_01',
      archetype: 'hushed_stalker',
      x: 4480,
      y: 440,
      patrolMinX: 4355,
      patrolMaxX: 4615,
    },
    {
      id: 'hb_enemy_sentinel_01',
      archetype: 'rootbound_sentinel',
      x: 8100,
      y: 445,
    },
    {
      id: 'hb_enemy_moth_01',
      archetype: 'gloom_moth',
      x: 8865,
      y: 315,
      flightRadiusX: 85,
      flightRadiusY: 32,
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
      subtitle: 'Cross the fractured shelves and press F to speak with Bram the Rootkeeper.',
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
      subtitle: 'Explore the lower vault for Pip’s origin memory and calm the Rootbound Sentinel.',
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
 * Chapter 04 — The Windward Ruins (10 Sub-Areas, 12,800 units)
 */
export const CHAPTER_04_WINDWARD_RUINS: CampaignLevelDefinition = {
  id: 'windward_ruins',
  chapterId: 'windward_ruins',
  chapterNumber: 4,
  title: 'Chapter 04 · The Windward Ruins',
  regionSubtitle: 'High skyward sanctuaries, updraft wind conduits, and the Crown Sanctuary',
  description:
    'Ascend the wind-swept stone towers high in the canopy crown, riding skyward updrafts, ancient root bridges, and cloud Drifters to awaken the Crown Sanctuary and open the way to the Shattered Choir.',
  biomeTheme: 'ruins',
  width: 12800,
  height: 860,
  spawnX: 160,
  spawnY: 460,

  platforms: [
    { id: 'wr_p01_start', x: 40, y: 530, width: 410, height: 210 },
    { id: 'wr_p02_terrace', x: 520, y: 480, width: 300, height: 260 },
    { id: 'wr_p03_pillar', x: 900, y: 440, width: 270, height: 300 },
    { id: 'wr_p04_aqueduct_mid', x: 1365, y: 440, width: 320, height: 300 },
    { id: 'wr_p05_aqueduct_east', x: 2010, y: 395, width: 290, height: 345 },
    { id: 'wr_p06_updraft_launch', x: 2390, y: 465, width: 280, height: 275 },
    { id: 'wr_p07_cairn_1', x: 3060, y: 375, width: 420, height: 365 },
    { id: 'wr_p08_belfry_walk', x: 3580, y: 430, width: 350, height: 310 },
    { id: 'wr_p09_belfry_secret', x: 3950, y: 245, width: 280, height: 48 },
    { id: 'wr_p10_belfry_east', x: 4360, y: 395, width: 320, height: 345 },
    { id: 'wr_p11_cloud_isle', x: 5160, y: 375, width: 240, height: 365 },
    { id: 'wr_p12_cairn_2', x: 5840, y: 395, width: 410, height: 345 },
    { id: 'wr_p13_skystone_mid', x: 6680, y: 420, width: 280, height: 320 },
    { id: 'wr_p14_skystone_east', x: 7340, y: 390, width: 320, height: 350 },
    { id: 'wr_p15_gale_floor', x: 7750, y: 475, width: 480, height: 265 },
    { id: 'wr_p16_cairn_3', x: 8425, y: 475, width: 410, height: 265 },
    { id: 'wr_p17_choir_west', x: 8930, y: 435, width: 310, height: 305 },
    { id: 'wr_p18_choir_secret', x: 9020, y: 615, width: 290, height: 95 },
    { id: 'wr_p19_choir_east', x: 9680, y: 390, width: 330, height: 350 },
    { id: 'wr_p20_ascent_1', x: 10110, y: 370, width: 280, height: 370 },
    { id: 'wr_p21_ascent_2', x: 10920, y: 350, width: 280, height: 390 },
    { id: 'wr_p22_cairn_4', x: 11420, y: 350, width: 340, height: 390 },
    { id: 'wr_p23_sanctuary', x: 11955, y: 350, width: 640, height: 390 },
  ],

  blooms: [
    { id: 'wr_bloom_01', x: 1785, y: 425 },
    { id: 'wr_bloom_02', x: 1925, y: 385 },
    { id: 'wr_bloom_03', x: 2845, y: 445 },
    { id: 'wr_bloom_04', x: 3895, y: 335 },
    { id: 'wr_bloom_05', x: 4095, y: 410 },
    { id: 'wr_bloom_06', x: 4245, y: 375 },
    { id: 'wr_bloom_07', x: 6565, y: 395 },
    { id: 'wr_bloom_08', x: 7245, y: 375 },
    { id: 'wr_bloom_09', x: 9385, y: 425 },
    { id: 'wr_bloom_10', x: 9545, y: 380 },
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
    { id: 'wr_wind_01', x: 2640, y: 240, width: 420, height: 260, driftVx: 78, driftVy: -105 },
    { id: 'wr_wind_02', x: 7810, y: 260, width: 360, height: 215, driftVx: 65, driftVy: -115 },
    { id: 'wr_wind_03', x: 10390, y: 210, width: 520, height: 220, driftVx: 70, driftVy: -65 },
  ],

  crumblingPlatforms: [
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

  enemies: [
    {
      id: 'wr_enemy_moth_01',
      archetype: 'gloom_moth',
      x: 4520,
      y: 295,
      flightRadiusX: 90,
      flightRadiusY: 35,
    },
    {
      id: 'wr_enemy_stalker_01',
      archetype: 'hushed_stalker',
      x: 7500,
      y: 390,
      patrolMinX: 7370,
      patrolMaxX: 7630,
    },
    {
      id: 'wr_enemy_sentinel_01',
      archetype: 'rootbound_sentinel',
      x: 11060,
      y: 350,
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
      subtitle: 'Uncover the Memory Echo below or climb the choir blooms.',
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
      subtitle: 'Release Wake beside the Crown Bloom to open the harmonic bridges to the Shattered Choir.',
      minX: 11850,
      maxX: 12800,
    },
  ],
};

/**
 * Chapter 05 — The Shattered Choir (Milestone 6 New Campaign Chapter — Section 10)
 * 10 Sub-Areas, 24 Platform Formations, 4 Checkpoints, Resonance Bells, Bellkeeper NPC,
 * Parametric Hostile Creatures, and Harmonic Sanctuary Climax.
 */
export const CHAPTER_05_SHATTERED_CHOIR: CampaignLevelDefinition = {
  id: 'shattered_choir',
  chapterId: 'shattered_choir',
  chapterNumber: 5,
  title: 'Chapter 05 · The Shattered Choir',
  regionSubtitle: 'Suspended stone bell sanctuaries, resonance crystals, and silver-green boughs',
  description:
    'Journey across floating stone belfries where Wake pulses ring ancient bronze Resonance Bells, awakening harmonic flower chains and guiding Lyra the Bellkeeper to unseal the path to the Heart.',
  biomeTheme: 'choir',
  width: 13000,
  height: 860,
  spawnX: 160,
  spawnY: 455,

  platforms: [
    // 01. The Silent Nave (x: 40 .. 1160)
    { id: 'sc5_p01_start', x: 40, y: 525, width: 420, height: 215 },
    { id: 'sc5_p02_nave_step', x: 520, y: 480, width: 300, height: 260 },
    { id: 'sc5_p03_nave_arch', x: 890, y: 440, width: 280, height: 300 },

    // 02. First Resonance Belfry (x: 1160 .. 2380)
    { id: 'sc5_p04_belfry_west', x: 1240, y: 440, width: 340, height: 300 },
    { id: 'sc5_p05_belfry_east', x: 1990, y: 400, width: 310, height: 340 },

    // 03. Harmonic Root Span & Cairn 1 + Bellkeeper NPC (x: 2380 .. 3620)
    { id: 'sc5_p06_span_launch', x: 2380, y: 430, width: 300, height: 310 },
    // Root Bridge 1 spans from 2665 to 2893
    { id: 'sc5_p07_cairn_1', x: 2875, y: 430, width: 460, height: 310 },

    // 04. The Silver-Moss Overlook — Optional upper Memory Echo IX (x: 3620 .. 4820)
    { id: 'sc5_p08_moss_low', x: 3430, y: 470, width: 340, height: 270 },
    { id: 'sc5_p09_moss_secret', x: 3840, y: 250, width: 290, height: 48 },
    { id: 'sc5_p10_moss_east', x: 4260, y: 410, width: 340, height: 330 },

    // 05. Choir Drifter Arches & Cairn 2 (x: 4820 .. 6220)
    { id: 'sc5_p11_drifter_hub', x: 5090, y: 385, width: 250, height: 355 },
    { id: 'sc5_p12_cairn_2', x: 5790, y: 405, width: 410, height: 335 },

    // 06. Chime-Wind Gallery (x: 6220 .. 7620)
    { id: 'sc5_p13_wind_launch', x: 6290, y: 465, width: 320, height: 275 },
    { id: 'sc5_p14_wind_mid', x: 6960, y: 380, width: 290, height: 360 },
    { id: 'sc5_p15_wind_east', x: 7420, y: 415, width: 310, height: 325 },

    // 07. The Whispering Undercroft — Sentinel + lower Memory Echo X (x: 7620 .. 8920)
    { id: 'sc5_p16_court_floor', x: 7810, y: 445, width: 480, height: 295 },
    { id: 'sc5_p17_court_secret', x: 7920, y: 625, width: 290, height: 95 },
    // Root Bridge 2 spans from 8275 to 8503
    { id: 'sc5_p18_cairn_3', x: 8485, y: 445, width: 420, height: 295 },

    // 08. Threefold Bell Ascent (x: 8920 .. 10320)
    { id: 'sc5_p19_bell_step_1', x: 8990, y: 415, width: 310, height: 325 },
    { id: 'sc5_p20_bell_step_2', x: 9690, y: 375, width: 310, height: 365 },

    // 09. Resonance Sky-Bridge & Cairn 4 (x: 10320 .. 11850)
    { id: 'sc5_p21_sky_isle', x: 10380, y: 375, width: 280, height: 365 },
    { id: 'sc5_p22_sky_high', x: 11120, y: 350, width: 290, height: 390 },
    { id: 'sc5_p23_cairn_4', x: 11590, y: 350, width: 360, height: 390 },

    // 10. The Grand Carillon Sanctuary (x: 11850 .. 13000)
    // Root Bridge 3 spans from 11935 to 12163
    { id: 'sc5_p24_sanctuary', x: 12145, y: 350, width: 650, height: 390 },
  ],

  blooms: [
    { id: 'sc5_bloom_01', x: 1685, y: 430 },
    { id: 'sc5_bloom_02', x: 1845, y: 395 },
    { id: 'sc5_bloom_03', x: 3785, y: 340 },
    { id: 'sc5_bloom_04', x: 3985, y: 420 },
    { id: 'sc5_bloom_05', x: 4135, y: 385 },
    { id: 'sc5_bloom_06', x: 6785, y: 420 },
    { id: 'sc5_bloom_07', x: 7335, y: 385 },
    { id: 'sc5_bloom_08', x: 9395, y: 395 },
    { id: 'sc5_bloom_09', x: 9555, y: 360 },
    { id: 'sc5_bloom_10', x: 10110, y: 365 },
    { id: 'sc5_bloom_11', x: 10255, y: 345 },
    { id: 'sc5_bloom_12', x: 11485, y: 340 },
  ],

  rootBridges: [
    { id: 'sc5_root_01', x: 2665, y: 442 },
    { id: 'sc5_root_02', x: 8275, y: 457 },
    { id: 'sc5_root_03', x: 11935, y: 362 },
  ],

  drifters: [
    {
      id: 'sc5_drifter_01',
      startX: 4690,
      startY: 395,
      endX: 4995,
      endY: 370,
      cycleDuration: 5.3,
    },
    {
      id: 'sc5_drifter_02',
      startX: 5430,
      startY: 370,
      endX: 5705,
      endY: 395,
      cycleDuration: 5.3,
    },
    {
      id: 'sc5_drifter_03',
      startX: 10750,
      startY: 365,
      endX: 11030,
      endY: 345,
      cycleDuration: 5.1,
    },
  ],

  hazards: [
    { id: 'sc5_haz_01', x: 2140, y: 400, width: 128 },
    { id: 'sc5_haz_02', x: 3600, y: 470, width: 128 },
    { id: 'sc5_haz_03', x: 6450, y: 465, width: 128 },
    { id: 'sc5_haz_04', x: 9145, y: 415, width: 128 },
  ],

  windZones: [
    { id: 'sc5_wind_01', x: 6580, y: 240, width: 390, height: 250, driftVx: 74, driftVy: -108 },
    { id: 'sc5_wind_02', x: 10660, y: 210, width: 460, height: 220, driftVx: 66, driftVy: -68 },
  ],

  crumblingPlatforms: [
    { id: 'sc5_crumble_01', x: 1110, y: 435, width: 144, standWindowSec: 0.9 },
    { id: 'sc5_crumble_02', x: 7660, y: 435, width: 144, standWindowSec: 0.88 },
  ],

  sporeVents: [
    { id: 'sc5_vent_01', x: 7105, y: 380, burstHeight: 115, cycleSec: 3.6, phaseOffsetSec: 0.5 },
  ],

  resonanceBells: [
    {
      id: 'bell_choir_01',
      x: 1490,
      y: 440,
      linkedBloomIds: ['sc5_bloom_01', 'sc5_bloom_02'],
      resonanceDurationSec: 8.0,
    },
    {
      id: 'bell_choir_02',
      x: 9240,
      y: 415,
      linkedBloomIds: ['sc5_bloom_08', 'sc5_bloom_09'],
      resonanceDurationSec: 8.5,
    },
    {
      id: 'bell_choir_03',
      x: 9920,
      y: 375,
      linkedBloomIds: ['sc5_bloom_10', 'sc5_bloom_11'],
      resonanceDurationSec: 8.5,
    },
  ],

  memoryEchoes: [
    {
      id: 'mem_choir_first_note',
      x: 3985,
      y: 210,
      title: 'Memory Echo IX · The Bellkeeper’s First Chord',
      dialogueId: 'memory_choir_01',
    },
    {
      id: 'mem_choir_silent_hymn',
      x: 8065,
      y: 585,
      title: 'Memory Echo X · Hymn of the Silver Moss',
      dialogueId: 'memory_choir_02',
    },
  ],

  npcs: [
    {
      id: 'npc_choir_bellkeeper',
      archetype: 'bellkeeper',
      name: 'Lyra',
      title: 'The Bellkeeper',
      x: 3160,
      y: 430,
      characterJournalId: 'char_bellkeeper',
      questJournalId: 'quest_bellkeeper_harmony',
      questTitle: 'The Threefold Choir Chord',
      greetingLines: [
        'You brought the living seed to the Shattered Choir! Hear how the bronze belfries hum just from your closeness, Nima.',
        'Whenever you release a Wake pulse beside a Resonance Bell, its harmonic wave awakens every linked flower across the chasm. Ring the Threefold Bells ahead to unseal the Heart of the Veil!',
      ],
      activeQuestLines: [
        'Each Resonance Bell stays singing for several seconds—use its golden sound-wave to cross the suspended sanctuaries!',
      ],
      completedQuestLines: [
        'All three harmonic chords are ringing together! Awaken the Grand Carillon Bloom ahead—the Heart of the Veil awaits you!',
      ],
    },
  ],

  enemies: [
    {
      id: 'sc5_enemy_stalker_01',
      archetype: 'hushed_stalker',
      x: 4430,
      y: 410,
      patrolMinX: 4300,
      patrolMaxX: 4560,
    },
    {
      id: 'sc5_enemy_moth_01',
      archetype: 'gloom_moth',
      x: 5215,
      y: 280,
      flightRadiusX: 90,
      flightRadiusY: 34,
    },
    {
      id: 'sc5_enemy_sentinel_01',
      archetype: 'rootbound_sentinel',
      x: 8040,
      y: 445,
    },
  ],

  checkpoint: {
    id: 'cp_choir_01',
    x: 3040,
    y: 430,
  },

  checkpoints: [
    { id: 'cp_choir_01', x: 3040, y: 430 },
    { id: 'cp_choir_02', x: 5990, y: 405 },
    { id: 'cp_choir_03', x: 8685, y: 445 },
    { id: 'cp_choir_04', x: 11755, y: 350 },
  ],

  ancientBloom: {
    id: 'ancient_bloom_choir',
    x: 12520,
    y: 350,
  },

  beats: [
    {
      index: 1,
      title: '01 · The Silent Nave',
      subtitle: 'Step onto the suspended stone sanctuaries of the Shattered Choir.',
      minX: 0,
      maxX: 1180,
    },
    {
      index: 2,
      title: '02 · First Resonance Belfry',
      subtitle: 'Pulse Wake beside the bronze Resonance Bell to awaken the distant choir buds.',
      minX: 1180,
      maxX: 2360,
    },
    {
      index: 3,
      title: '03 · Harmonic Root Span',
      subtitle: 'Uncoil the bridge, kindle the Cairn, and press F to speak with Lyra the Bellkeeper.',
      minX: 2360,
      maxX: 3560,
    },
    {
      index: 4,
      title: '04 · The Silver-Moss Overlook',
      subtitle: 'Climb the high resonance blooms for a Memory Echo or calm the Hushed Stalker.',
      minX: 3560,
      maxX: 4680,
    },
    {
      index: 5,
      title: '05 · Choir Drifter Arches',
      subtitle: 'Transfer between the suspended Drifters while watching the Gloom Moth’s arc.',
      minX: 4680,
      maxX: 6220,
    },
    {
      index: 6,
      title: '06 · Chime-Wind Gallery',
      subtitle: 'Ride the harmonic wind updraft across the floating belfry pillars.',
      minX: 6220,
      maxX: 7650,
    },
    {
      index: 7,
      title: '07 · The Whispering Undercroft',
      subtitle: 'Vault the Rootbound Sentinel’s wave—or descend to the hidden choir vault.',
      minX: 7650,
      maxX: 8920,
    },
    {
      index: 8,
      title: '08 · Threefold Bell Ascent',
      subtitle: 'Ring the paired Resonance Bells in sequence to open the high harmonic flower path.',
      minX: 8920,
      maxX: 10350,
    },
    {
      index: 9,
      title: '09 · Resonance Sky-Bridge',
      subtitle: 'Ride the final choir Drifter and updraft stream to the upper sanctuary.',
      minX: 10350,
      maxX: 11920,
    },
    {
      index: 10,
      title: '10 · The Grand Carillon Sanctuary',
      subtitle: 'Awaken the Grand Choir Bloom to unseal the innermost Heart of the Veil.',
      minX: 11920,
      maxX: 13000,
    },
  ],
};

/**
 * Chapter 06 — The Heart of the Veil (Milestone 6 Final Campaign Chapter — Section 11)
 * 10 Sub-Areas, 25 Platform Formations, 4 Checkpoints, Golden Sap Rivers, Wind Conduits,
 * Resonance Bells, Rootkeeper Vigil, Multi-Stage Heart Guardian Climax, and First Seed Cradle.
 */
export const CHAPTER_06_HEART_OF_VEIL: CampaignLevelDefinition = {
  id: 'heart_of_veil',
  chapterId: 'heart_of_veil',
  chapterNumber: 6,
  title: 'Chapter 06 · The Heart of the Veil',
  regionSubtitle: 'Sacred inner root cathedral, golden sap-rivers, and the First Seed Cradle',
  description:
    'Enter the sacred core of the Veilgrove where golden sap-rivers, thermal updrafts, and resonance bells converge. Calm the Heart Guardians and awaken the First Seed Cradle to unite the world in dawn.',
  biomeTheme: 'heart',
  width: 13400,
  height: 860,
  spawnX: 160,
  spawnY: 455,

  platforms: [
    // 01. Threshold of the Living Core (x: 40 .. 1180)
    { id: 'hv6_p01_start', x: 40, y: 525, width: 420, height: 215 },
    { id: 'hv6_p02_artery_step', x: 520, y: 480, width: 300, height: 260 },
    { id: 'hv6_p03_artery_arch', x: 890, y: 440, width: 280, height: 300 },

    // 02. Golden Sap-River Crossing (x: 1180 .. 2420)
    { id: 'hv6_p04_sap_bed', x: 1240, y: 515, width: 540, height: 225 },
    { id: 'hv6_p05_sap_terrace', x: 1860, y: 430, width: 320, height: 310 },

    // 03. The Rootkeeper's Vigil & Cairn 1 (x: 2420 .. 3680)
    { id: 'hv6_p06_vigil_west', x: 2420, y: 430, width: 300, height: 310 },
    // Root Bridge 1 spans from 2705 to 2933
    { id: 'hv6_p07_cairn_1', x: 2915, y: 430, width: 480, height: 310 },

    // 04. Cradle of the Golden Sap — Optional upper Memory Echo XI (x: 3680 .. 4920)
    { id: 'hv6_p08_vein_low', x: 3490, y: 470, width: 350, height: 270 },
    { id: 'hv6_p09_vein_secret', x: 3910, y: 245, width: 290, height: 48 },
    { id: 'hv6_p10_vein_east', x: 4340, y: 405, width: 340, height: 335 },

    // 05. Heart-Stream Drifters & Cairn 2 (x: 4920 .. 6320)
    { id: 'hv6_p11_heart_isle', x: 5170, y: 380, width: 250, height: 360 },
    { id: 'hv6_p12_cairn_2', x: 5880, y: 400, width: 420, height: 340 },

    // 06. The Convergence Conduit (x: 6320 .. 7760)
    { id: 'hv6_p13_conv_launch', x: 6380, y: 465, width: 340, height: 275 },
    { id: 'hv6_p14_conv_mid', x: 7060, y: 380, width: 300, height: 360 },
    { id: 'hv6_p15_conv_east', x: 7530, y: 415, width: 310, height: 325 },

    // 07. Vault of the First Lullaby — Optional lower Memory Echo XII + Cairn 3 (x: 7760 .. 9120)
    { id: 'hv6_p16_vault_floor', x: 7940, y: 445, width: 460, height: 295 },
    { id: 'hv6_p17_vault_secret', x: 8040, y: 625, width: 290, height: 95 },
    // Root Bridge 2 spans from 8385 to 8613
    { id: 'hv6_p18_cairn_3', x: 8595, y: 445, width: 430, height: 295 },

    // 08. Harmonic Sap Ascent (x: 9120 .. 10420)
    { id: 'hv6_p19_ascent_1', x: 9120, y: 415, width: 320, height: 325 },
    { id: 'hv6_p20_ascent_2', x: 9840, y: 375, width: 320, height: 365 },

    // 09. Sanctuary of the Heart Guardians & Cairn 4 (x: 10420 .. 12120)
    { id: 'hv6_p21_guard_west', x: 10440, y: 375, width: 460, height: 365 },
    { id: 'hv6_p22_guard_east', x: 11360, y: 350, width: 320, height: 390 },
    { id: 'hv6_p23_cairn_4', x: 11810, y: 350, width: 360, height: 390 },

    // 10. The First Seed Cradle (x: 12120 .. 13400)
    // Root Bridge 3 spans from 12155 to 12383
    { id: 'hv6_p24_sanctuary', x: 12365, y: 350, width: 720, height: 390 },
  ],

  blooms: [
    { id: 'hv6_bloom_01', x: 1510, y: 415 },
    { id: 'hv6_bloom_02', x: 1695, y: 385 },
    { id: 'hv6_bloom_03', x: 2295, y: 395 },
    { id: 'hv6_bloom_04', x: 3855, y: 335 },
    { id: 'hv6_bloom_05', x: 4065, y: 415 },
    { id: 'hv6_bloom_06', x: 4215, y: 380 },
    { id: 'hv6_bloom_07', x: 6895, y: 415 },
    { id: 'hv6_bloom_08', x: 7435, y: 385 },
    { id: 'hv6_bloom_09', x: 9545, y: 395 },
    { id: 'hv6_bloom_10', x: 9705, y: 360 },
    { id: 'hv6_bloom_11', x: 10290, y: 355 },
    { id: 'hv6_bloom_12', x: 11710, y: 340 },
  ],

  rootBridges: [
    { id: 'hv6_root_01', x: 2705, y: 442 },
    { id: 'hv6_root_02', x: 8385, y: 457 },
    { id: 'hv6_root_03', x: 12155, y: 362 },
  ],

  drifters: [
    {
      id: 'hv6_drifter_01',
      startX: 4770,
      startY: 390,
      endX: 5075,
      endY: 365,
      cycleDuration: 5.2,
    },
    {
      id: 'hv6_drifter_02',
      startX: 5510,
      startY: 365,
      endX: 5790,
      endY: 390,
      cycleDuration: 5.2,
    },
    {
      id: 'hv6_drifter_03',
      startX: 10985,
      startY: 365,
      endX: 11265,
      endY: 345,
      cycleDuration: 5.0,
    },
  ],

  hazards: [
    { id: 'hv6_haz_01', x: 1510, y: 515, width: 128 },
    { id: 'hv6_haz_02', x: 3660, y: 470, width: 128 },
    { id: 'hv6_haz_03', x: 6550, y: 465, width: 128 },
    { id: 'hv6_haz_04', x: 9280, y: 415, width: 128 },
  ],

  waterCurrents: [
    // Golden sap river current in Sub-area 02
    { id: 'hv6_current_01', x: 1240, y: 365, width: 560, height: 150, driftVx: 74 },
  ],

  windZones: [
    { id: 'hv6_wind_01', x: 6680, y: 235, width: 390, height: 250, driftVx: 76, driftVy: -110 },
    { id: 'hv6_wind_02', x: 10890, y: 205, width: 470, height: 220, driftVx: 68, driftVy: -70 },
  ],

  crumblingPlatforms: [
    { id: 'hv6_crumble_01', x: 2210, y: 420, width: 144, standWindowSec: 0.9 },
    { id: 'hv6_crumble_02', x: 7775, y: 435, width: 144, standWindowSec: 0.88 },
  ],

  sporeVents: [
    { id: 'hv6_vent_01', x: 7210, y: 380, burstHeight: 115, cycleSec: 3.5, phaseOffsetSec: 0.4 },
  ],

  fallingDebris: [
    { id: 'hv6_debris_01', x: 9990, ceilingY: 130, floorY: 375, cycleSec: 3.4, phaseOffsetSec: 0.7 },
  ],

  resonanceBells: [
    {
      id: 'bell_heart_01',
      x: 9385,
      y: 415,
      linkedBloomIds: ['hv6_bloom_09', 'hv6_bloom_10'],
      resonanceDurationSec: 8.5,
    },
    {
      id: 'bell_heart_02',
      x: 10820,
      y: 375,
      linkedBloomIds: ['hv6_bloom_11', 'hv6_bloom_12'],
      resonanceDurationSec: 9.0,
    },
  ],

  memoryEchoes: [
    {
      id: 'mem_heart_sap_cradle',
      x: 4055,
      y: 205,
      title: 'Memory Echo XI · Cradle of the Golden Sap',
      dialogueId: 'memory_heart_01',
    },
    {
      id: 'mem_heart_eternal_dawn',
      x: 8185,
      y: 585,
      title: 'Memory Echo XII · Song of the Waking World',
      dialogueId: 'memory_heart_02',
    },
  ],

  npcs: [
    {
      id: 'npc_heart_rootkeeper',
      archetype: 'rootkeeper',
      name: 'Bram',
      title: 'The Rootkeeper',
      x: 3250,
      y: 430,
      characterJournalId: 'char_rootkeeper',
      questJournalId: 'quest_rootkeeper_pact',
      questTitle: 'Echoes of the Deep Pact',
      greetingLines: [
        'Look around you, Nima—every root bridge you uncoiled and every bell you rang has poured golden sap-light into the Heart of the Veil.',
        'Ahead lies the First Seed Cradle where your seed was born. Calm the final Heart Guardians with your Wake light and bring morning back to our world!',
      ],
      activeQuestLines: [
        'Ring the Resonance Bell in the Guardian Sanctuary to awaken the final sky-blooms!',
      ],
      completedQuestLines: [
        'The Stillness is parting at last. Go forth to the First Seed Cradle, Nima and Pip!',
      ],
    },
  ],

  enemies: [
    {
      id: 'hv6_enemy_stalker_01',
      archetype: 'hushed_stalker',
      x: 4510,
      y: 405,
      patrolMinX: 4380,
      patrolMaxX: 4640,
    },
    {
      id: 'hv6_enemy_moth_01',
      archetype: 'gloom_moth',
      x: 5295,
      y: 275,
      flightRadiusX: 92,
      flightRadiusY: 35,
    },
    {
      id: 'hv6_enemy_sentinel_01',
      archetype: 'rootbound_sentinel',
      x: 8170,
      y: 445,
    },
    {
      id: 'hv6_enemy_sentinel_climax',
      archetype: 'rootbound_sentinel',
      x: 10650,
      y: 375,
    },
  ],

  checkpoint: {
    id: 'cp_heart_01',
    x: 3120,
    y: 430,
  },

  checkpoints: [
    { id: 'cp_heart_01', x: 3120, y: 430 },
    { id: 'cp_heart_02', x: 6090, y: 400 },
    { id: 'cp_heart_03', x: 8810, y: 445 },
    { id: 'cp_heart_04', x: 11975, y: 350 },
  ],

  ancientBloom: {
    id: 'ancient_bloom_heart',
    x: 12780,
    y: 350,
  },

  beats: [
    {
      index: 1,
      title: '01 · Threshold of the Living Core',
      subtitle: 'Enter the sacred innermost root cathedral of the Veilgrove.',
      minX: 0,
      maxX: 1180,
    },
    {
      index: 2,
      title: '02 · Golden Sap-River Crossing',
      subtitle: 'Ride the luminous sap-stream and chain the core blossoms.',
      minX: 1180,
      maxX: 2400,
    },
    {
      index: 3,
      title: '03 · The Rootkeeper’s Vigil',
      subtitle: 'Kindle the Cairn and press F to speak with Bram the Rootkeeper.',
      minX: 2400,
      maxX: 3650,
    },
    {
      index: 4,
      title: '04 · Cradle of the Golden Sap',
      subtitle: 'Climb the high sap-vein blooms for Memory Echo XI or cross the lower root arch.',
      minX: 3650,
      maxX: 4750,
    },
    {
      index: 5,
      title: '05 · Heart-Stream Drifters',
      subtitle: 'Ride the paired Heart Drifters across the glowing cathedral nave.',
      minX: 4750,
      maxX: 6320,
    },
    {
      index: 6,
      title: '06 · The Convergence Conduit',
      subtitle: 'Soar up the thermal sap-updraft and time the cavern vent.',
      minX: 6320,
      maxX: 7760,
    },
    {
      index: 7,
      title: '07 · Vault of the First Lullaby',
      subtitle: 'Uncover the final Memory Echo below and uncoil the sanctuary bridge.',
      minX: 7760,
      maxX: 9100,
    },
    {
      index: 8,
      title: '08 · Harmonic Sap Ascent',
      subtitle: 'Ring the Resonance Bell to awaken the high sap-blooms.',
      minX: 9100,
      maxX: 10420,
    },
    {
      index: 9,
      title: '09 · Sanctuary of the Heart Guardians',
      subtitle: 'Calm the Heart Sentinel with Wake, ring the bell, and catch the final Drifter.',
      minX: 10420,
      maxX: 12120,
    },
    {
      index: 10,
      title: '10 · The First Seed Cradle',
      subtitle: 'Release Wake beside the First Seed Cradle to unite the entire Veilgrove in eternal dawn.',
      minX: 12120,
      maxX: 13400,
    },
  ],
};

export const CAMPAIGN_CHAPTERS: CampaignLevelDefinition[] = [
  CHAPTER_01_SLEEPING_CANOPY,
  CHAPTER_02_MOONLIT_MARSH,
  CHAPTER_03_HOLLOW_BELOW,
  CHAPTER_04_WINDWARD_RUINS,
  CHAPTER_05_SHATTERED_CHOIR,
  CHAPTER_06_HEART_OF_VEIL,
];

export function getCampaignChapter(id: CampaignChapterId): CampaignLevelDefinition {
  return CAMPAIGN_CHAPTERS.find((c) => c.chapterId === id) || CHAPTER_01_SLEEPING_CANOPY;
}

/**
 * Applies Story Difficulty scaling across all 6 Campaign Chapters (`easy`, `medium`, `hard`, `extreme`).
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
      cloned.checkpoints = cloned.checkpoints.filter(
        (_, idx, arr) => idx === 1 || idx === arr.length - 1
      );
      cloned.checkpoint = cloned.checkpoints[0];
    }
  }

  return cloned;
}
