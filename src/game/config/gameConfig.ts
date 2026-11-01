import bgCanopyFarSkyUrl from '../../assets/images/bg_canopy_far_sky_1793515701725.jpg';
import bgCanopyGiantRootsUrl from '../../assets/images/bg_canopy_giant_roots_1793515703954.jpg';
import refNimaPipConceptUrl from '../../assets/images/ref_nima_pip_concept_1793515706089.jpg';
import refAncientBloomShrineUrl from '../../assets/images/ref_ancient_bloom_shrine_1793515704899.jpg';

export const GENERATED_ASSETS = {
  bgCanopyFarSky: bgCanopyFarSkyUrl,
  bgCanopyGiantRoots: bgCanopyGiantRootsUrl,
  refNimaPipConcept: refNimaPipConceptUrl,
  refAncientBloomShrine: refAncientBloomShrineUrl,
} as const;

export type LevelMode = 'sleeping_canopy' | 'prototype_sandbox';

export interface AccessibilitySettings {
  musicVolume: number;       // 0.0 to 1.0
  sfxVolume: number;         // 0.0 to 1.0
  muted: boolean;
  screenShake: boolean;      // Disabled by default per Section 11.3
  reducedParticles: boolean; // Reduced-effects mode per Section 10.3 & 11.3
  highContrastCues: boolean; // Extra shape/outline cues on Wake targets
  debugHitboxes: boolean;    // Section 6.3 Debug mode (hitboxes, platform bodies, Wake radii)
}

export const DEFAULT_SETTINGS: AccessibilitySettings = {
  musicVolume: 0.65,
  sfxVolume: 0.80,
  muted: false,
  screenShake: false,
  reducedParticles: false,
  highContrastCues: true,
  debugHitboxes: false,
};

export interface TelemetrySnapshot {
  fps: number;
  playerX: number;
  playerY: number;
  velocityX: number;
  velocityY: number;
  grounded: boolean;
  coyoteRemaining: number;
  jumpBufferRemaining: number;
  wakeCooldownRemaining: number;
  animState: string;
  currentBeatTitle: string;
  currentBeatIndex: number;
  activeCheckpointId: string | null;
  restoredCount: number;
  totalRestorable: number;
  chapterCompleted: boolean;
}
