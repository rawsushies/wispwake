import { CampaignChapterId } from '../config/gameConfig';
import { SaveManager } from './SaveManager';

export type JournalCategory =
  | 'STORY'
  | 'MEMORIES'
  | 'CHARACTERS'
  | 'PLACES'
  | 'CREATURES'
  | 'QUESTS';

export interface JournalEntryDefinition {
  id: string;
  category: JournalCategory;
  title: string;
  subtitle: string;
  chapterLabel: string;
  chapterId?: CampaignChapterId;
  summary: string;
  loreBody: string;
  quote?: string;
  discoveryHint: string;
  accentColor: string;
}

export interface JournalEntryView extends JournalEntryDefinition {
  unlocked: boolean;
  unread: boolean;
}

export const JOURNAL_CATEGORIES: Array<{ id: JournalCategory; label: string }> = [
  { id: 'STORY', label: 'Story' },
  { id: 'MEMORIES', label: 'Memories' },
  { id: 'CHARACTERS', label: 'Characters' },
  { id: 'PLACES', label: 'Places' },
  { id: 'CREATURES', label: 'Creatures' },
  { id: 'QUESTS', label: 'Quests' },
];

export const JOURNAL_ENTRIES: JournalEntryDefinition[] = [
  // ===========================================================================
  // 1. STORY ENTRIES (Chapters 01 - 06)
  // ===========================================================================
  {
    id: 'story_ch01_awakening',
    category: 'STORY',
    title: 'I · A Seed in the Sleeping Canopy',
    subtitle: 'Chapter 01 · The First Awakening',
    chapterLabel: 'Chapter 01',
    chapterId: 'sleeping_canopy',
    summary: 'Nima awakens upon an elder canopy bough holding a warm living seed alongside Pip.',
    loreBody:
      'When the quiet hush known as the Stillness settled across the Veilgrove, the colossal world-tree folded its blossoms and drew its sap-light inward. Nima awoke beneath the twilight leaves carrying a warm golden seed, greeted by Pip—a luminous wisp drawn to its gentle pulse.',
    quote: '“Only gentle footsteps can wake a sleeping world without frightening it.”',
    discoveryHint: 'Begin your journey in Chapter 01: The Sleeping Canopy.',
    accentColor: '#8FE7C7',
  },
  {
    id: 'story_ch02_marsh',
    category: 'STORY',
    title: 'II · Reflections of the Moonlit Marsh',
    subtitle: 'Chapter 02 · The Tidal Channels',
    chapterLabel: 'Chapter 02',
    chapterId: 'moonlit_marsh',
    summary: 'The first canopy roots send golden sap-light down into the reflective wetlands.',
    loreBody:
      'Below the canopy boughs, the Moonlit Marsh mirrors the stars in silent pools. By riding the glowing tidal currents and rekindling the Sunken Bell arches, Nima and Pip restore the flow of liquid starlight between the wetlands and the Great Lotus.',
    quote: '“Every ripple in the marsh is a heartbeat waiting for the Crown to answer.”',
    discoveryHint: 'Enter or restore Chapter 02: The Moonlit Marsh.',
    accentColor: '#8FE7C7',
  },
  {
    id: 'story_ch03_hollow',
    category: 'STORY',
    title: 'III · The Pact of the Hollow Below',
    subtitle: 'Chapter 03 · Subterranean Root Caverns',
    chapterLabel: 'Chapter 03',
    chapterId: 'hollow_below',
    summary: 'Deep beneath the marsh, Pip remembers the true purpose of the Stillness.',
    loreBody:
      'Descending into the echoing root caverns of the Hollow Below, Pip discovers that the Stillness was never a curse. When ancient fractures threatened the Veilgrove, the Great Tree wove a protective slumber to preserve its life until a Seed-Bearer could mend the deep roots.',
    quote: '“From the last spark of the Root-Heart, a tiny wisp was born to guide the Seed-Bearer home.”',
    discoveryHint: 'Enter or restore Chapter 03: The Hollow Below.',
    accentColor: '#B7A2E8',
  },
  {
    id: 'story_ch04_ruins',
    category: 'STORY',
    title: 'IV · Ascent of the Windward Ruins',
    subtitle: 'Chapter 04 · Skyward Conduits',
    chapterLabel: 'Chapter 04',
    chapterId: 'windward_ruins',
    summary: 'Warm updrafts carry Nima and Pip above the cloud sea toward the high ruins.',
    loreBody:
      'With the lower roots rekindled, warm thermal updrafts rise through the weathered stone towers of the Windward Ruins. Nima leaps across skyward wind conduits and cloud Drifters, awakening the Crown Sanctuary only to hear a fractured harmonic chord echoing from the Shattered Choir.',
    quote: '“Four rivers of sap-light rose toward the sky, waiting for the Choir to sing them into one.”',
    discoveryHint: 'Enter or restore Chapter 04: The Windward Ruins.',
    accentColor: '#F1C878',
  },
  {
    id: 'story_ch05_choir',
    category: 'STORY',
    title: 'V · Harmony of the Shattered Choir',
    subtitle: 'Chapter 05 · Suspended Bell Sanctuaries',
    chapterLabel: 'Chapter 05',
    chapterId: 'shattered_choir',
    summary: 'Ancient resonance bells awaken in sequence to open the sealed path to the Heart.',
    loreBody:
      'Suspended between silver-green boughs and twilight stone arches, the Shattered Choir once harmonized the pulse of every root and leaf in the Veilgrove. Guided by the Bellkeeper, Nima rings the dormant sanctuaries with Wake pulses, aligning the harmonic bridges that lead inward to the tree’s core.',
    quote: '“A bell does not force the wind to listen; it offers a note the forest remembers.”',
    discoveryHint: 'Reach Chapter 05: The Shattered Choir.',
    accentColor: '#B7A2E8',
  },
  {
    id: 'story_ch06_heart',
    category: 'STORY',
    title: 'VI · Dawn at the Heart of the Veil',
    subtitle: 'Chapter 06 · The Innermost Root Sanctuary',
    chapterLabel: 'Chapter 06',
    chapterId: 'heart_of_veil',
    summary: 'Nima and Pip enter the sacred core of the Veilgrove to heal the Stillness at its source.',
    loreBody:
      'Within the Heart of the Veil, rivers of golden sap-light converge around the First Seed Cradle. Facing the hushed guardians born from the tree’s protective fear, Nima uses the warmth of Wake to calm the core and unite the entire Veilgrove in living dawn.',
    quote: '“When the Heart remembers warmth, the Stillness becomes a morning song.”',
    discoveryHint: 'Reach Chapter 06: The Heart of the Veil.',
    accentColor: '#F1C878',
  },

  // ===========================================================================
  // 2. MEMORY ECHOES (12 Secret Lore Shrines across Chapters 01 - 06)
  // ===========================================================================
  {
    id: 'journal_mem_canopy_bough_song',
    category: 'MEMORIES',
    title: 'Memory Echo I · The Seed-Keepers’ Lullaby',
    subtitle: 'Sleeping Canopy · Broken Canopy Overlook',
    chapterLabel: 'Chapter 01',
    chapterId: 'sleeping_canopy',
    summary: 'A crystal memory of the night the outer boughs were sung to sleep.',
    loreBody:
      '“When the outer winds grew cold and the sap began to thin, the Seed-Keepers sang the canopy to sleep so not a single leaf would wither before spring.”',
    discoveryHint: 'Climb the high Wake blooms in Sub-Area 04 of The Sleeping Canopy.',
    accentColor: '#8FE7C7',
  },
  {
    id: 'journal_mem_canopy_hollow_whisper',
    category: 'MEMORIES',
    title: 'Memory Echo II · Why the Canopy Closed Its Eyes',
    subtitle: 'Sleeping Canopy · The Lower Hollow Alcove',
    chapterLabel: 'Chapter 01',
    chapterId: 'sleeping_canopy',
    summary: 'A quiet reflection hidden in the deep basin of the canopy.',
    loreBody:
      '“The youngest seed was placed in a child’s hands—because only gentle footsteps can wake a sleeping world without frightening it.”',
    discoveryHint: 'Explore the lower secret alcove in Sub-Area 07 of The Sleeping Canopy.',
    accentColor: '#8FE7C7',
  },
  {
    id: 'journal_mem_marsh_reed_chime',
    category: 'MEMORIES',
    title: 'Memory Echo III · Reflection of the Tide-Watchers',
    subtitle: 'Moonlit Marsh · Upper Reed Sanctuary',
    chapterLabel: 'Chapter 02',
    chapterId: 'moonlit_marsh',
    summary: 'How the Tide-Watchers preserved starlight in the wetland pools.',
    loreBody:
      '“The Tide-Watchers poured liquid starlight into the marsh so the roots could drink even in the longest night.”',
    discoveryHint: 'Ascend above the Drowned Archway in Sub-Area 04 of The Moonlit Marsh.',
    accentColor: '#8FE7C7',
  },
  {
    id: 'journal_mem_marsh_sunken_bell',
    category: 'MEMORIES',
    title: 'Memory Echo IV · The Bell Beneath the Stillness',
    subtitle: 'Moonlit Marsh · Sunken Bell Basin',
    chapterLabel: 'Chapter 02',
    chapterId: 'moonlit_marsh',
    summary: 'An echo of the underwater chimes that once answered the high Choir.',
    loreBody:
      '“Listen closely to the sunken bell: every ripple in the marsh is a heartbeat waiting for the Crown to answer.”',
    discoveryHint: 'Descend beneath the Sunken Bell Shrine in Sub-Area 07 of The Moonlit Marsh.',
    accentColor: '#8FE7C7',
  },
  {
    id: 'journal_mem_hollow_root_pact',
    category: 'MEMORIES',
    title: 'Memory Echo V · The Pact of the Deep Roots',
    subtitle: 'The Hollow Below · Luminous Fungus Grotto',
    chapterLabel: 'Chapter 03',
    chapterId: 'hollow_below',
    summary: 'The vow made by the subterranean roots to support the world above.',
    loreBody:
      '“Deep in the Hollow, the elder roots bound their strength together, promising to hold the sky towers aloft until dawn.”',
    discoveryHint: 'Reach the upper fungal shelf in Sub-Area 04 of The Hollow Below.',
    accentColor: '#B7A2E8',
  },
  {
    id: 'journal_mem_hollow_first_seed',
    category: 'MEMORIES',
    title: 'Memory Echo VI · Where Pip Was Born',
    subtitle: 'The Hollow Below · Deep Root-Vault',
    chapterLabel: 'Chapter 03',
    chapterId: 'hollow_below',
    summary: 'The origin of Pip from the last waking spark of the Root-Heart.',
    loreBody:
      '“From the last spark of the Root-Heart, a tiny wisp was born—to guide the Seed-Bearer home when the time came.”',
    discoveryHint: 'Explore the lower vault in Sub-Area 07 of The Hollow Below.',
    accentColor: '#B7A2E8',
  },
  {
    id: 'journal_mem_ruins_sky_watch',
    category: 'MEMORIES',
    title: 'Memory Echo VII · The Watchers of the Crown',
    subtitle: 'Windward Ruins · High Belfry Overlook',
    chapterLabel: 'Chapter 04',
    chapterId: 'windward_ruins',
    summary: 'A memory of the sky-keepers who tended the wind conduits.',
    loreBody:
      '“From these windward belfries, the First Choir watched four rivers of sap-light unite the canopy, marsh, cavern, and sky.”',
    discoveryHint: 'Climb the high belfry blooms in Sub-Area 04 of The Windward Ruins.',
    accentColor: '#F1C878',
  },
  {
    id: 'journal_mem_ruins_final_vow',
    category: 'MEMORIES',
    title: 'Memory Echo VIII · The Promise of Wispwake',
    subtitle: 'Windward Ruins · Spire Undercroft',
    chapterLabel: 'Chapter 04',
    chapterId: 'windward_ruins',
    summary: 'The bond between the Seed-Bearer and the wisp companion.',
    loreBody:
      '“The Stillness is ending, Nima. When the Crown Bloom opens, the seed and the wisp will shine as one forever.”',
    discoveryHint: 'Search beneath the Spire of the First Choir in Sub-Area 08 of The Windward Ruins.',
    accentColor: '#F1C878',
  },
  {
    id: 'journal_mem_choir_first_note',
    category: 'MEMORIES',
    title: 'Memory Echo IX · The Bellkeeper’s First Chord',
    subtitle: 'The Shattered Choir · Upper Belfry Terrace',
    chapterLabel: 'Chapter 05',
    chapterId: 'shattered_choir',
    summary: 'How the great bronze bells were tuned to the breathing of the leaves.',
    loreBody:
      '“We cast no clappers of iron; our bells ring only when touched by the living warmth of a waking seed.”',
    discoveryHint: 'Discover the high resonance alcove in Sub-Area 04 of The Shattered Choir.',
    accentColor: '#B7A2E8',
  },
  {
    id: 'journal_mem_choir_silent_hymn',
    category: 'MEMORIES',
    title: 'Memory Echo X · Hymn of the Silver Moss',
    subtitle: 'The Shattered Choir · Whispering Nave',
    chapterLabel: 'Chapter 05',
    chapterId: 'shattered_choir',
    summary: 'Why the Choir hushed its bells to protect the Heart.',
    loreBody:
      '“When the last note faded into silver moss, the sanctuary gates sealed so no cold wind could reach the Heart of the Veil.”',
    discoveryHint: 'Explore the lower choir vault in Sub-Area 07 of The Shattered Choir.',
    accentColor: '#B7A2E8',
  },
  {
    id: 'journal_mem_heart_sap_cradle',
    category: 'MEMORIES',
    title: 'Memory Echo XI · Cradle of the Golden Sap',
    subtitle: 'The Heart of the Veil · Luminous Vein Overlook',
    chapterLabel: 'Chapter 06',
    chapterId: 'heart_of_veil',
    summary: 'The chamber where Nima’s seed was first nurtured.',
    loreBody:
      '“Before the tree closed its eyes, it placed its brightest warmth inside a single golden seed and entrusted it to the upper boughs.”',
    discoveryHint: 'Climb the golden sap-vein blooms in Sub-Area 04 of The Heart of the Veil.',
    accentColor: '#F1C878',
  },
  {
    id: 'journal_mem_heart_eternal_dawn',
    category: 'MEMORIES',
    title: 'Memory Echo XII · Song of the Waking World',
    subtitle: 'The Heart of the Veil · Inner Sanctuary',
    chapterLabel: 'Chapter 06',
    chapterId: 'heart_of_veil',
    summary: 'The final memory of the Veilgrove’s renewal.',
    loreBody:
      '“Sleep was our shelter, not our ending. Through Nima’s courage and Pip’s light, the Veilgrove breathes in eternal dawn.”',
    discoveryHint: 'Uncover the deep sanctuary memory in Sub-Area 08 of The Heart of the Veil.',
    accentColor: '#F1C878',
  },

  // ===========================================================================
  // 3. CHARACTERS (Protagonists & Friendly Veilgrove Dwellers)
  // ===========================================================================
  {
    id: 'char_nima',
    category: 'CHARACTERS',
    title: 'Nima · The Seed-Bearer',
    subtitle: 'Protagonist · Explorer of the Veilgrove',
    chapterLabel: 'All Chapters',
    summary: 'A nimble child in a leaf-green cloak who carries the last warm living seed.',
    loreBody:
      'Curious, gentle, and steadfast, Nima awoke in the Sleeping Canopy holding a living golden seed at her chest. Though small beside the colossal roots and stone sanctuaries of the Veilgrove, her footsteps and Wake pulses rekindle dormant flora and calm the hushed creatures of the forest.',
    discoveryHint: 'Unlocked from the start of the journey.',
    accentColor: '#F1C878',
  },
  {
    id: 'char_pip',
    category: 'CHARACTERS',
    title: 'Pip · Luminous Wisp Companion',
    subtitle: 'Companion · Spirit of the Root-Heart',
    chapterLabel: 'All Chapters',
    summary: 'A small bioluminescent spirit born from the last waking spark of the Veilgrove.',
    loreBody:
      'Floating beside Nima’s shoulder in a soft halo of mint and gold light, Pip senses dormant Wake targets, remembers fragments of the forest’s lullaby, and resonates whenever Nima releases a Wake pulse.',
    discoveryHint: 'Unlocked from the start of the journey.',
    accentColor: '#8FE7C7',
  },
  {
    id: 'char_last_gardener',
    category: 'CHARACTERS',
    title: 'Oakhaven · The Last Gardener',
    subtitle: 'Friendly Dweller · The Sleeping Canopy',
    chapterLabel: 'Chapter 01',
    chapterId: 'sleeping_canopy',
    summary: 'A moss-cloaked botanical caretaker who tended the first canopy buds before the Stillness.',
    loreBody:
      'Draped in woven fern-cloth and carrying a pruning staff of living amber, the Last Gardener stayed awake near the Hanging Roots to watch over the canopy seedlings. He teaches travelers how the temporary blooms and permanent root bridges share the same sap-network.',
    quote: '“Every bud you wake remembers the sun, little Seed-Bearer.”',
    discoveryHint: 'Speak with The Last Gardener in Chapter 01: The Sleeping Canopy.',
    accentColor: '#8FE7C7',
  },
  {
    id: 'char_tide_watcher',
    category: 'CHARACTERS',
    title: 'Mirel · The Tide-Watcher',
    subtitle: 'Friendly Dweller · The Moonlit Marsh',
    chapterLabel: 'Chapter 02',
    chapterId: 'moonlit_marsh',
    summary: 'A lantern-bearing keeper of the wetland currents and sunken water-arches.',
    loreBody:
      'Standing beside the Drowned Archway with a reed-glass chime lantern, Mirel listens to the rhythm of the marsh tides. She explains how the water currents carry starlight down toward the subterranean roots.',
    quote: '“Do not fight the marsh current—leap with its song and the reeds will catch you.”',
    discoveryHint: 'Speak with The Tide-Watcher in Chapter 02: The Moonlit Marsh.',
    accentColor: '#8FE7C7',
  },
  {
    id: 'char_rootkeeper',
    category: 'CHARACTERS',
    title: 'Bram · The Rootkeeper',
    subtitle: 'Friendly Dweller · The Hollow Below & Heart of the Veil',
    chapterLabel: 'Chapter 03 & 06',
    chapterId: 'hollow_below',
    summary: 'An ancient lore-warden who guards the deep root-veins and remembers Pip’s birth.',
    loreBody:
      'With a mantle of glowing polypore shelves and a resonance tuning rod, the Rootkeeper tends the deep arteries of the world-tree. He witnessed the forging of the Root Pact and guides Nima toward both the Root-Heart and the innermost Heart of the Veil.',
    quote: '“The deep roots did not break, Nima—they held their breath waiting for your seed.”',
    discoveryHint: 'Speak with The Rootkeeper in Chapter 03: The Hollow Below.',
    accentColor: '#B7A2E8',
  },
  {
    id: 'char_bellkeeper',
    category: 'CHARACTERS',
    title: 'Lyra · The Bellkeeper',
    subtitle: 'Friendly Dweller · Windward Ruins & The Shattered Choir',
    chapterLabel: 'Chapter 04 & 05',
    chapterId: 'shattered_choir',
    summary: 'Custodian of the suspended bell sanctuaries and harmonic resonance crystals.',
    loreBody:
      'Clothed in twilight violet vestments adorned with bronze chime-feathers, Lyra keeps vigil over the Shattered Choir. When Nima arrives with the living seed, Lyra reveals how Wake pulses can ring the great stone bells and reopen the harmonic gate to the Heart.',
    quote: '“Strike the silence with warmth, and the whole Choir will sing the path open.”',
    discoveryHint: 'Speak with The Bellkeeper in Chapter 04 or Chapter 05.',
    accentColor: '#F1C878',
  },

  // ===========================================================================
  // 4. PLACES (6 Interconnected Regions of the Veilgrove)
  // ===========================================================================
  {
    id: 'place_sleeping_canopy',
    category: 'PLACES',
    title: 'The Sleeping Canopy',
    subtitle: 'Region I · Twilight Boughs & Giant Roots',
    chapterLabel: 'Chapter 01',
    chapterId: 'sleeping_canopy',
    summary: 'The upper-middle boughs where giant moss-draped roots cradle the first sleeping buds.',
    loreBody:
      'A serene forest expanse of layered canopy silhouettes, curling fern-buds, and gentle Drifters gliding through firefly mist.',
    discoveryHint: 'Explore Chapter 01: The Sleeping Canopy.',
    accentColor: '#8FE7C7',
  },
  {
    id: 'place_moonlit_marsh',
    category: 'PLACES',
    title: 'The Moonlit Marsh',
    subtitle: 'Region II · Luminous Wetlands & Sunken Arches',
    chapterLabel: 'Chapter 02',
    chapterId: 'moonlit_marsh',
    summary: 'Mist-veiled lagoons and flowing tidal streams beneath the lower roots.',
    loreBody:
      'Fed by condensation from the canopy above, the Moonlit Marsh channels glowing water currents through drowned stone viaducts toward the Great Wetland Lotus.',
    discoveryHint: 'Reach Chapter 02: The Moonlit Marsh.',
    accentColor: '#8FE7C7',
  },
  {
    id: 'place_hollow_below',
    category: 'PLACES',
    title: 'The Hollow Below',
    subtitle: 'Region III · Subterranean Root Caverns',
    chapterLabel: 'Chapter 03',
    chapterId: 'hollow_below',
    summary: 'Echoing root shafts, rhythmic spore vents, and bioluminescent fungal vaults.',
    loreBody:
      'Beneath the wetlands lie the great structural root-vaults that anchor the Veilgrove. Thermal spore vents and ancient stone shelves guard the chamber where Pip was born.',
    discoveryHint: 'Reach Chapter 03: The Hollow Below.',
    accentColor: '#B7A2E8',
  },
  {
    id: 'place_windward_ruins',
    category: 'PLACES',
    title: 'The Windward Ruins',
    subtitle: 'Region IV · High Skyward Sanctuaries',
    chapterLabel: 'Chapter 04',
    chapterId: 'windward_ruins',
    summary: 'Weathered stone observatories rising above the canopy cloud sea.',
    loreBody:
      'Carved into the highest wind-swept limbs of the world-tree, these ruins harness thermal updrafts and gale conduits to carry travelers toward the skyward sanctuaries.',
    discoveryHint: 'Reach Chapter 04: The Windward Ruins.',
    accentColor: '#F1C878',
  },
  {
    id: 'place_shattered_choir',
    category: 'PLACES',
    title: 'The Shattered Choir',
    subtitle: 'Region V · Suspended Stone Bell Sanctuaries',
    chapterLabel: 'Chapter 05',
    chapterId: 'shattered_choir',
    summary: 'Floating stone belfries, colossal bronze bells, and harmonic crystal bridges.',
    loreBody:
      'An awe-inspiring acoustic cathedral suspended among silver-green boughs. When struck by a Wake pulse, its resonance bells send visible sound-waves that awaken harmonic platforms in rhythmic sequence.',
    discoveryHint: 'Reach Chapter 05: The Shattered Choir.',
    accentColor: '#B7A2E8',
  },
  {
    id: 'place_heart_of_veil',
    category: 'PLACES',
    title: 'The Heart of the Veil',
    subtitle: 'Region VI · Sacred Innermost Root Sanctuary',
    chapterLabel: 'Chapter 06',
    chapterId: 'heart_of_veil',
    summary: 'Cathedral root arches and glowing rivers of golden-mint sap at the core of the world.',
    loreBody:
      'The living heart of the Veilgrove where all sap-veins, memories, and harmonic chords converge around the First Seed Cradle.',
    discoveryHint: 'Reach Chapter 06: The Heart of the Veil.',
    accentColor: '#F1C878',
  },

  // ===========================================================================
  // 5. CREATURES (Passive & Hostile Forest Organisms)
  // ===========================================================================
  {
    id: 'creature_drifter',
    category: 'CREATURES',
    title: 'Canopy Drifter',
    subtitle: 'Gentle Organism · Walkable Mossy Bell',
    chapterLabel: 'All Chapters',
    summary: 'A translucent, jellyfish-like forest organism that carries Nima across chasms.',
    loreBody:
      'Drifters glide along steady air and water currents throughout the Veilgrove. Their firm, moss-cushioned crowns support Nima’s weight, and a Wake pulse causes them to hum with golden light and slow their pace.',
    discoveryHint: 'Encountered in Chapter 01: The Sleeping Canopy.',
    accentColor: '#8FE7C7',
  },
  {
    id: 'creature_hushed_stalker',
    category: 'CREATURES',
    title: 'Hushed Stalker',
    subtitle: 'Restless Ground Creature · Telegraphed Charge',
    chapterLabel: 'Chapters 01–06',
    summary: 'A shadow-barked quadruped agitated by the Stillness that patrols root ledges.',
    loreBody:
      'Born from tangled briar-bark and restless shadow, Hushed Stalkers pace back and forth along wide platforms. When they spot a traveler, their eyes flare ember-coral and they crouch in a clear telegraph before lunging forward. Releasing a Wake pulse interrupts their charge and calms them into a brief stunned slumber.',
    discoveryHint: 'Encounter a Hushed Stalker on the forest ledges.',
    accentColor: '#E98372',
  },
  {
    id: 'creature_gloom_moth',
    category: 'CREATURES',
    title: 'Gloom Moth',
    subtitle: 'Parametric Aerial Creature · Swoop Telegraph',
    chapterLabel: 'Chapters 02–06',
    summary: 'A nocturnal spore-winged moth that glides along figure-eight and elliptical air currents.',
    loreBody:
      'Gloom Moths trace mathematical figure-eight paths above chasms and waterways. When Nima passes beneath their patrol arc, their wings shimmer warning-amber before executing a curved swoop. A timely Wake pulse scatters their dark dust and pushes them gently back onto their high perch.',
    discoveryHint: 'Encounter a Gloom Moth in the marsh, caverns, or sky ruins.',
    accentColor: '#B7A2E8',
  },
  {
    id: 'creature_rootbound_sentinel',
    category: 'CREATURES',
    title: 'Rootbound Sentinel',
    subtitle: 'Ancient Sanctuary Guardian · Ground Resonance Wave',
    chapterLabel: 'Chapters 03–06',
    summary: 'A solemn stone-and-root guardian that tests travelers with telegraphed root-waves.',
    loreBody:
      'Carved to protect the sacred chambers of the Hollow, the Choir, and the Heart, Rootbound Sentinels channel rhythmic ground pulses along their platform. Their core carapace deflects contact until a Wake pulse resonates with their chest rune, temporarily opening their harmonic core and calming their barrier.',
    discoveryHint: 'Encounter a Rootbound Sentinel in the deep caverns, Choir, or Heart.',
    accentColor: '#F1C878',
  },

  // ===========================================================================
  // 6. QUESTS & DISCOVERIES (Friendly NPC Side Tasks)
  // ===========================================================================
  {
    id: 'quest_gardener_bridges',
    category: 'QUESTS',
    title: 'The Gardener’s Root-Link',
    subtitle: 'Given by Oakhaven · The Last Gardener (Chapter 01)',
    chapterLabel: 'Chapter 01',
    chapterId: 'sleeping_canopy',
    summary: 'Uncoil the ancient Root Bridges of the Sleeping Canopy to restore the sap-trail.',
    loreBody:
      'Oakhaven asked Nima to awaken the dormant Root Bridges across the Sleeping Canopy so the upper boughs can share warmth again. Speaking with Oakhaven or uncoiling the canopy bridges fulfills his wish.',
    discoveryHint: 'Speak with The Last Gardener in Chapter 01.',
    accentColor: '#8FE7C7',
  },
  {
    id: 'quest_tide_watcher_chimes',
    category: 'QUESTS',
    title: 'Lanterns of the Tidal Stream',
    subtitle: 'Given by Mirel · The Tide-Watcher (Chapter 02)',
    chapterLabel: 'Chapter 02',
    chapterId: 'moonlit_marsh',
    summary: 'Kindle the marsh Resonance Cairns and listen to the sunken wetland echoes.',
    loreBody:
      'Mirel tends the drowned viaducts of the Moonlit Marsh and asks Nima to carry her seed-light to the eastern Lotus Sanctuary so the tidal pools can mirror the stars once more.',
    discoveryHint: 'Speak with The Tide-Watcher in Chapter 02.',
    accentColor: '#8FE7C7',
  },
  {
    id: 'quest_rootkeeper_pact',
    category: 'QUESTS',
    title: 'Echoes of the Deep Pact',
    subtitle: 'Given by Bram · The Rootkeeper (Chapter 03)',
    chapterLabel: 'Chapter 03',
    chapterId: 'hollow_below',
    summary: 'Awaken the Root-Heart Chamber and uncover the memory of Pip’s birth.',
    loreBody:
      'Deep in the Hollow Below, Bram asks Nima to rekindle the subterranean lanterns and witness the truth of why the Veilgrove entered its protective slumber.',
    discoveryHint: 'Speak with The Rootkeeper in Chapter 03.',
    accentColor: '#B7A2E8',
  },
  {
    id: 'quest_bellkeeper_harmony',
    category: 'QUESTS',
    title: 'The Threefold Choir Chord',
    subtitle: 'Given by Lyra · The Bellkeeper (Chapter 05)',
    chapterLabel: 'Chapter 05',
    chapterId: 'shattered_choir',
    summary: 'Ring the Resonance Bells of the Shattered Choir with Wake to unseal the Heart of the Veil.',
    loreBody:
      'Lyra awaits a Seed-Bearer whose Wake pulse can ring the suspended bronze bells in harmony, realigning the floating sanctuaries and opening the innermost root gate.',
    discoveryHint: 'Speak with The Bellkeeper in Chapter 05.',
    accentColor: '#F1C878',
  },
];

export class StoryJournalManager {
  public static unlockEntry(entryId: string): boolean {
    const exists = JOURNAL_ENTRIES.some((e) => e.id === entryId);
    if (!exists) return false;
    return SaveManager.unlockJournalEntry(entryId);
  }

  public static unlockForChapterVisit(chapterId: CampaignChapterId): void {
    const map: Record<CampaignChapterId, string[]> = {
      sleeping_canopy: ['story_ch01_awakening', 'place_sleeping_canopy', 'creature_drifter'],
      moonlit_marsh: ['story_ch02_marsh', 'place_moonlit_marsh'],
      hollow_below: ['story_ch03_hollow', 'place_hollow_below'],
      windward_ruins: ['story_ch04_ruins', 'place_windward_ruins'],
      shattered_choir: ['story_ch05_choir', 'place_shattered_choir'],
      heart_of_veil: ['story_ch06_heart', 'place_heart_of_veil'],
    };
    for (const id of map[chapterId] || []) {
      this.unlockEntry(id);
    }
  }

  public static getEntriesByCategory(category: JournalCategory): JournalEntryView[] {
    const saved = SaveManager.get();
    const unlockedSet = new Set(saved.unlockedJournalIds);
    const readSet = new Set(saved.readJournalIds);

    return JOURNAL_ENTRIES.filter((e) => e.category === category).map((entry) => {
      const unlocked = unlockedSet.has(entry.id);
      return {
        ...entry,
        unlocked,
        unread: unlocked && !readSet.has(entry.id),
      };
    });
  }

  public static getAllEntries(): JournalEntryView[] {
    const saved = SaveManager.get();
    const unlockedSet = new Set(saved.unlockedJournalIds);
    const readSet = new Set(saved.readJournalIds);

    return JOURNAL_ENTRIES.map((entry) => {
      const unlocked = unlockedSet.has(entry.id);
      return {
        ...entry,
        unlocked,
        unread: unlocked && !readSet.has(entry.id),
      };
    });
  }

  public static getUnreadCount(): number {
    const saved = SaveManager.get();
    const readSet = new Set(saved.readJournalIds);
    return saved.unlockedJournalIds.filter((id) => !readSet.has(id)).length;
  }

  public static getCategoryUnreadCount(category: JournalCategory): number {
    return this.getEntriesByCategory(category).filter((e) => e.unread).length;
  }

  public static markRead(entryId: string): void {
    SaveManager.markJournalEntryRead(entryId);
  }

  public static markAllRead(): void {
    SaveManager.markAllJournalEntriesRead();
  }
}
