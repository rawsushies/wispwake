/**
 * Canonical color palette from Section 9.3 of the Wispwake Game Design & Visual Bible.
 */
export const VEILGROVE_PALETTE = {
  nightInk: '#121B2B',     // Deepest shadows, distant silhouettes
  deepDusk: '#1D2D43',     // Dark sky and shadow masses
  veilTeal: '#294D4D',     // Main cool foliage and environment
  mossGreen: '#57725B',    // Midground foliage and terrain
  softLeaf: '#78906A',     // Lit vegetation and readable organic forms
  paleMist: '#A7B8AE',     // Atmospheric haze and distant highlights
  wakeMint: '#8FE7C7',     // Interactive magic and active routes
  sapGold: '#F1C878',      // Warm focal lights and restoration
  spiritLilac: '#B7A2E8',  // Rare magical accents and Pip variations
  emberCoral: '#E98372',   // Hazards and urgent feedback, used sparingly
} as const;

export const VEILGROVE_HEX = {
  nightInk: 0x121b2b,
  deepDusk: 0x1d2d43,
  veilTeal: 0x294d4d,
  mossGreen: 0x57725b,
  softLeaf: 0x78906a,
  paleMist: 0xa7b8ae,
  wakeMint: 0x8fe7c7,
  sapGold: 0xf1c878,
  spiritLilac: 0xb7a2e8,
  emberCoral: 0xe98372,
} as const;
