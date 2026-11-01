import bgCanopyFarSkyUrl from '../../assets/images/bg_canopy_far_sky_1793515701725.jpg';
import bgCanopyGiantRootsUrl from '../../assets/images/bg_canopy_giant_roots_1793515703954.jpg';
import refNimaPipConceptUrl from '../../assets/images/ref_nima_pip_concept_1793515706089.jpg';
import refAncientBloomShrineUrl from '../../assets/images/ref_ancient_bloom_shrine_1793515704899.jpg';
import nimaSideGameplayMasterUrl from '../../assets/images/nima_side_gameplay_master_1793518602554.jpg';
import pipGameplayMasterUrl from '../../assets/images/pip_gameplay_master_1793518604109.jpg';
import envDistantCanopyUrl from '../../assets/images/env_distant_canopy_silhouettes_1793518606630.jpg';
import envNearTwistedRootsUrl from '../../assets/images/env_near_twisted_roots_foliage_1793518606409.jpg';

export const GENERATED_ASSETS = {
  bgCanopyFarSky: bgCanopyFarSkyUrl,
  envDistantCanopy: envDistantCanopyUrl,
  bgCanopyGiantRoots: bgCanopyGiantRootsUrl,
  envNearTwistedRoots: envNearTwistedRootsUrl,
  refNimaPipConcept: refNimaPipConceptUrl,
  refAncientBloomShrine: refAncientBloomShrineUrl,
  nimaSideMaster: nimaSideGameplayMasterUrl,
  pipMaster: pipGameplayMasterUrl,
} as const;

export type LevelMode = 'sleeping_canopy' | 'prototype_sandbox';

export interface AccessibilitySettings {
  musicVolume: number;       // 0.0 to 1.0
  sfxVolume: number;         // 0.0 to 1.0
  muted: boolean;
  screenShake: boolean;      // Disabled by default per Section 11.3
  reducedParticles: boolean; // Reduced-effects mode per Section 10.3 & 11.3
  highContrastCues: boolean; // Extra shape/outline cues on Wake targets
  debugHitboxes: boolean;    // Section 6.3 Debug mode (dev-only)
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
