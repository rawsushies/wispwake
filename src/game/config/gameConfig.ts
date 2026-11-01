export const GENERATED_ASSETS = {
  bgCanopyFarSky: new URL('../../assets/images/bg_canopy_far_sky_1793515701725.jpg', import.meta.url).href,
  envDistantCanopy: new URL('../../assets/images/env_distant_canopy_silhouettes_1793518606630.jpg', import.meta.url).href,
  bgCanopyGiantRoots: new URL('../../assets/images/bg_canopy_giant_roots_1793515703954.jpg', import.meta.url).href,
  envNearTwistedRoots: new URL('../../assets/images/env_near_twisted_roots_foliage_1793518606409.jpg', import.meta.url).href,
  bgMoonlitMarsh: new URL('../../assets/images/bg_moonlit_marsh_plate_1793520808533.jpg', import.meta.url).href,
  bgHollowBelow: new URL('../../assets/images/bg_hollow_below_plate_1793520810711.jpg', import.meta.url).href,
  bgWindwardRuins: new URL('../../assets/images/bg_windward_ruins_plate_1793520811669.jpg', import.meta.url).href,
  refNimaPipConcept: new URL('../../assets/images/ref_nima_pip_concept_1793515706089.jpg', import.meta.url).href,
  refAncientBloomShrine: new URL('../../assets/images/ref_ancient_bloom_shrine_1793515704899.jpg', import.meta.url).href,
  nimaSideMaster: new URL('../../assets/images/nima_side_gameplay_master_1793518602554.jpg', import.meta.url).href,
  nimaRunContact: new URL('../../assets/images/nima_run_contact_pose_1793520804478.jpg', import.meta.url).href,
  nimaRunPassing: new URL('../../assets/images/nima_run_passing_pose_1793520806672.jpg', import.meta.url).href,
  pipMaster: new URL('../../assets/images/pip_gameplay_master_1793518604109.jpg', import.meta.url).href,
} as const;

export type CampaignChapterId =
  | 'sleeping_canopy'
  | 'moonlit_marsh'
  | 'hollow_below'
  | 'windward_ruins';

export type StoryDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';
export type TrialDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export type LightingQuality = 'low' | 'balanced' | 'high' | 'auto';

export interface AccessibilitySettings {
  musicVolume: number;       // 0.0 to 1.0
  sfxVolume: number;         // 0.0 to 1.0
  muted: boolean;
  screenShake: boolean;      // Disabled by default per Section 11.3
  reducedParticles: boolean; // Reduced-effects mode per Section 10.3 & 11.3
  highContrastCues: boolean; // Extra shape/outline cues on Wake targets
  subtitlesEnabled: boolean; // Pip story & helper dialogue subtitles
  lightingQuality: LightingQuality; // Hybrid 2D/2.5D lighting quality tier
  touchControlsMode: 'auto' | 'always' | 'off'; // Mobile & tablet touch controls
  debugHitboxes: boolean;    // Section 6.3 Debug mode (dev-only)
}

export const DEFAULT_SETTINGS: AccessibilitySettings = {
  musicVolume: 0.65,
  sfxVolume: 0.80,
  muted: false,
  screenShake: false,
  reducedParticles: false,
  highContrastCues: true,
  subtitlesEnabled: true,
  lightingQuality: 'auto',
  touchControlsMode: 'auto',
  debugHitboxes: false,
};

export interface ActiveDialogueBubble {
  id: string;
  speaker: 'Pip';
  text: string;
  worldX: number;
  worldY: number;
  screenX: number;
  screenY: number;
}

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
  chapterId: CampaignChapterId | 'wake_trial';
  chapterTitle: string;
  currentBeatTitle: string;
  currentBeatIndex: number;
  activeCheckpointId: string | null;
  unlockedCheckpointsCount: number;
  totalCheckpointsCount: number;
  restoredCount: number;
  totalRestorable: number;
  discoveredMemoriesCount: number;
  totalMemoriesCount: number;
  chapterCompleted: boolean;
  activeDialogue: ActiveDialogueBubble | null;
  storyDifficulty: StoryDifficulty;
  trialElapsedSec: number;
  trialSeed: string | null;
  trialDifficulty: TrialDifficulty | null;
}
