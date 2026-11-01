import { CampaignChapterId } from '../config/gameConfig';

export interface DialogueEntry {
  id: string;
  chapterId: CampaignChapterId | 'any';
  triggerType: 'zone_x' | 'event';
  minX?: number;
  maxX?: number;
  eventKey?:
    | 'chapter_start'
    | 'near_dormant_bloom'
    | 'near_dormant_root'
    | 'puzzle_struggle'
    | 'checkpoint_reached'
    | 'hazard_warning'
    | 'chapter_restored';
  text: string;
  priority: number;       // 1 = ambient hint, 2 = story observation, 3 = key milestone
  durationSec: number;
  oncePerSave: boolean;
}

/**
 * Authored Dialogue & Story Narration Entries for Pip (Section 03).
 * Uses clear, warm, accessible everyday English with zero technical or aerospace jargon.
 */
export const CAMPAIGN_DIALOGUE_ENTRIES: DialogueEntry[] = [
  // =========================================================================
  // CHAPTER 01 — THE SLEEPING CANOPY
  // =========================================================================
  {
    id: 'sc_intro_1',
    chapterId: 'sleeping_canopy',
    triggerType: 'zone_x',
    minX: 60,
    maxX: 380,
    text: "You're awake, Nima! That warm seed you're holding... I could feel its light through the mist.",
    priority: 3,
    durationSec: 5.2,
    oncePerSave: true,
  },
  {
    id: 'sc_first_bud',
    chapterId: 'sleeping_canopy',
    triggerType: 'zone_x',
    minX: 740,
    maxX: 920,
    text: 'That little flower bud is still asleep. Try pressing E or X to send it a Wake pulse.',
    priority: 3,
    durationSec: 5.0,
    oncePerSave: true,
  },
  {
    id: 'sc_bloom_crossing',
    chapterId: 'sleeping_canopy',
    triggerType: 'zone_x',
    minX: 1170,
    maxX: 1380,
    text: "Opened flowers only stay awake for a few seconds. We can pulse again in mid-air to keep them open!",
    priority: 2,
    durationSec: 5.2,
    oncePerSave: true,
  },
  {
    id: 'sc_root_passage',
    chapterId: 'sleeping_canopy',
    triggerType: 'zone_x',
    minX: 1620,
    maxX: 1810,
    text: 'Look how those roots coiled up when the Stillness came. Your seed might wake them up for good.',
    priority: 2,
    durationSec: 5.0,
    oncePerSave: true,
  },
  {
    id: 'sc_checkpoint',
    chapterId: 'sleeping_canopy',
    triggerType: 'zone_x',
    minX: 2040,
    maxX: 2220,
    text: "A stone lantern! Let's light it so we always have a safe place to return to.",
    priority: 2,
    durationSec: 4.5,
    oncePerSave: true,
  },
  {
    id: 'sc_drifter',
    chapterId: 'sleeping_canopy',
    triggerType: 'zone_x',
    minX: 2290,
    maxX: 2520,
    text: "There's a gentle Drifter floating across the gap. Its mossy back is safe to stand on.",
    priority: 2,
    durationSec: 5.0,
    oncePerSave: true,
  },
  {
    id: 'sc_hollow_thorns',
    chapterId: 'sleeping_canopy',
    triggerType: 'zone_x',
    minX: 3020,
    maxX: 3240,
    text: 'Careful, Nima—red thorns ahead. Wake those high buds so we can jump right over them.',
    priority: 2,
    durationSec: 5.0,
    oncePerSave: true,
  },
  {
    id: 'sc_ancient_bloom',
    chapterId: 'sleeping_canopy',
    triggerType: 'zone_x',
    minX: 3860,
    maxX: 4160,
    text: 'The First Bloom! Send it a Wake pulse, Nima—let’s bring warmth back to the canopy!',
    priority: 3,
    durationSec: 5.5,
    oncePerSave: true,
  },

  // =========================================================================
  // CHAPTER 02 — THE MOONLIT MARSH
  // =========================================================================
  {
    id: 'mm_intro',
    chapterId: 'moonlit_marsh',
    triggerType: 'zone_x',
    minX: 60,
    maxX: 420,
    text: 'The Moonlit Marsh... the water used to sing at night, but now even the reeds are quiet.',
    priority: 3,
    durationSec: 5.2,
    oncePerSave: true,
  },
  {
    id: 'mm_lily_chain',
    chapterId: 'moonlit_marsh',
    triggerType: 'zone_x',
    minX: 820,
    maxX: 1120,
    text: 'These water blossoms are spaced farther apart. Hold your jump a little longer to glide between them.',
    priority: 2,
    durationSec: 5.0,
    oncePerSave: true,
  },
  {
    id: 'mm_submerged_arch',
    chapterId: 'moonlit_marsh',
    triggerType: 'zone_x',
    minX: 1850,
    maxX: 2180,
    text: 'Look at the reflections in the dark water. Half of the old walkways sank beneath the marsh.',
    priority: 2,
    durationSec: 4.8,
    oncePerSave: true,
  },
  {
    id: 'mm_twin_drifters',
    chapterId: 'moonlit_marsh',
    triggerType: 'zone_x',
    minX: 2650,
    maxX: 2950,
    text: 'Two Drifters gliding over the deep pool! Wait until they come close before jumping across.',
    priority: 2,
    durationSec: 5.0,
    oncePerSave: true,
  },
  {
    id: 'mm_shrine',
    chapterId: 'moonlit_marsh',
    triggerType: 'zone_x',
    minX: 3920,
    maxX: 4300,
    text: 'The Marsh Lotus is just ahead. One pulse from your seed will wake the whole wetland!',
    priority: 3,
    durationSec: 5.2,
    oncePerSave: true,
  },

  // =========================================================================
  // CHAPTER 03 — THE HOLLOW BELOW
  // =========================================================================
  {
    id: 'hb_intro',
    chapterId: 'hollow_below',
    triggerType: 'zone_x',
    minX: 60,
    maxX: 420,
    text: "We're deep beneath the great tree's roots now. Stay close—your seed light will show us the edges.",
    priority: 3,
    durationSec: 5.4,
    oncePerSave: true,
  },
  {
    id: 'hb_vertical_climb',
    chapterId: 'hollow_below',
    triggerType: 'zone_x',
    minX: 920,
    maxX: 1280,
    text: 'The cavern climbs high here. Wake the buds one by one to reach the upper root ledge.',
    priority: 2,
    durationSec: 5.0,
    oncePerSave: true,
  },
  {
    id: 'hb_mushroom_glow',
    chapterId: 'hollow_below',
    triggerType: 'zone_x',
    minX: 2050,
    maxX: 2420,
    text: 'Even in the darkest caves, these purple mushrooms remember the light.',
    priority: 2,
    durationSec: 4.8,
    oncePerSave: true,
  },
  {
    id: 'hb_chasm_drifter',
    chapterId: 'hollow_below',
    triggerType: 'zone_x',
    minX: 3100,
    maxX: 3420,
    text: 'The floor drops away below us. Let the cave Drifter carry us past the thorn clusters.',
    priority: 2,
    durationSec: 5.0,
    oncePerSave: true,
  },
  {
    id: 'hb_heart_bloom',
    chapterId: 'hollow_below',
    triggerType: 'zone_x',
    minX: 4000,
    maxX: 4360,
    text: 'The Root-Heart Bloom! Wake it, Nima, so the upper ruins can feel the tree breathing again.',
    priority: 3,
    durationSec: 5.4,
    oncePerSave: true,
  },

  // =========================================================================
  // CHAPTER 04 — THE WINDWARD RUINS
  // =========================================================================
  {
    id: 'wr_intro',
    chapterId: 'windward_ruins',
    triggerType: 'zone_x',
    minX: 60,
    maxX: 440,
    text: 'Look how high we are! The Windward Ruins once carried the tree’s light across the whole sky.',
    priority: 3,
    durationSec: 5.4,
    oncePerSave: true,
  },
  {
    id: 'wr_broken_arch',
    chapterId: 'windward_ruins',
    triggerType: 'zone_x',
    minX: 980,
    maxX: 1350,
    text: 'The stone bridge broke long ago, but the ancient roots are still waiting for your Wake pulse.',
    priority: 2,
    durationSec: 5.0,
    oncePerSave: true,
  },
  {
    id: 'wr_sky_drifters',
    chapterId: 'windward_ruins',
    triggerType: 'zone_x',
    minX: 2350,
    maxX: 2720,
    text: 'The wind is strong between these towers. Ride the sky Drifters and wake the flowers along the way!',
    priority: 2,
    durationSec: 5.2,
    oncePerSave: true,
  },
  {
    id: 'wr_summit_climax',
    chapterId: 'windward_ruins',
    triggerType: 'zone_x',
    minX: 4050,
    maxX: 4480,
    text: 'We made it to the Crown Sanctuary! Wake the Great Bloom, Nima—let the whole Veilgrove wake up!',
    priority: 3,
    durationSec: 6.0,
    oncePerSave: true,
  },

  // =========================================================================
  // DYNAMIC CONTEXTUAL HELPER HINTS (When player lingers near a puzzle)
  // =========================================================================
  {
    id: 'helper_puzzle_hint',
    chapterId: 'any',
    triggerType: 'event',
    eventKey: 'puzzle_struggle',
    text: 'See that sleeping plant nearby? Press E or X when we are close to wake it up.',
    priority: 1,
    durationSec: 4.2,
    oncePerSave: false,
  },
  {
    id: 'helper_restored_celebrate',
    chapterId: 'any',
    triggerType: 'event',
    eventKey: 'chapter_restored',
    text: "Look at all those golden lights, Nima! They're coming back to life!",
    priority: 3,
    durationSec: 5.0,
    oncePerSave: false,
  },
];
