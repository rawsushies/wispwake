export type CampaignChapterId =
  | 'sleeping_canopy'
  | 'moonlit_marsh'
  | 'hollow_below'
  | 'windward_ruins'
  | 'shattered_choir'
  | 'heart_of_veil';

export type StoryDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';
export type TrialDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';
export type LightingQuality = 'auto' | 'high' | 'balanced' | 'low';

export const GENERATED_ASSETS = {
  titleBackdrop: new URL('../../assets/images/wispwake_title_backdrop_1793515659880.jpg', import.meta.url).href,
  bgCanopyFarSky: new URL('../../assets/images/bg_canopy_far_sky_plate_1793518595002.jpg', import.meta.url).href,
  bgMoonlitMarsh: new URL('../../assets/images/bg_moonlit_marsh_plate_1793520806438.jpg', import.meta.url).href,
  bgHollowBelow: new URL('../../assets/images/bg_hollow_below_plate_1793520806640.jpg', import.meta.url).href,
  bgWindwardRuins: new URL('../../assets/images/bg_windward_ruins_plate_1793520807474.jpg', import.meta.url).href,
  bgShatteredChoir: new URL('../../assets/images/bg_shattered_choir_plate_1793528889563.jpg', import.meta.url).href,
  bgHeartOfVeil: new URL('../../assets/images/bg_heart_of_veil_plate_1793528890608.jpg', import.meta.url).href,
  wispwakeWorldCreditsArt: new URL('../../assets/images/wispwake_world_credits_art_1793528891474.jpg', import.meta.url).href,
  envDistantCanopy: new URL('../../assets/images/env_distant_canopy_silhouettes_1793515693040.jpg', import.meta.url).href,
  bgCanopyGiantRoots: new URL('../../assets/images/bg_canopy_giant_roots_1793515656534.jpg', import.meta.url).href,
  envNearTwistedRoots: new URL('../../assets/images/env_near_twisted_roots_1793518597776.jpg', import.meta.url).href,
  nimaSideMaster: new URL('../../assets/images/nima_side_gameplay_master_1793518602554.jpg', import.meta.url).href,
  nimaRunContact: new URL('../../assets/images/nima_run_contact_pose_1793520804478.jpg', import.meta.url).href,
  nimaRunPassing: new URL('../../assets/images/nima_run_passing_pose_1793520806672.jpg', import.meta.url).href,
  pipMaster: new URL('../../assets/images/pip_wisp_companion_master_1793518599941.jpg', import.meta.url).href,
  refNimaPipConcept: new URL('../../assets/images/ref_nima_pip_concept_1793515706089.jpg', import.meta.url).href,
  refWakeBloomBridge: new URL('../../assets/images/ref_wake_bloom_bridge_1793515705428.jpg', import.meta.url).href,
  refDrifterCairn: new URL('../../assets/images/ref_drifter_cairn_1793515705434.jpg', import.meta.url).href,
  refAncientBloomShrine: new URL('../../assets/images/ref_ancient_bloom_shrine_1793515706480.jpg', import.meta.url).href,
} as const;

export interface AccessibilitySettings {
  screenShake: boolean;
  reducedParticles: boolean;
  highContrastCues: boolean;
  subtitlesEnabled: boolean;
  lightingQuality: LightingQuality;
  touchControlsMode: 'auto' | 'always' | 'off';
  mouseDepthParallax: boolean;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  debugHitboxes: boolean;
}

export const DEFAULT_SETTINGS: AccessibilitySettings = {
  screenShake: false,
  reducedParticles: false,
  highContrastCues: false,
  subtitlesEnabled: true,
  lightingQuality: 'auto',
  touchControlsMode: 'auto',
  mouseDepthParallax: true,
  musicVolume: 0.7,
  sfxVolume: 0.85,
  muted: false,
  debugHitboxes: false,
};

export interface ActiveDialogueBubble {
  id: string;
  speaker: string;
  text: string;
  worldX: number;
  worldY: number;
  screenX: number;
  screenY: number;
}

export interface NearbyNpcPrompt {
  id: string;
  name: string;
  title: string;
}

export interface ActiveNpcDialogueState {
  id: string;
  speakerName: string;
  speakerTitle: string;
  line: string;
  lineIndex: number;
  totalLines: number;
  questTitle?: string;
  questStatus?: 'available' | 'active' | 'completed';
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
  nearbyNpcPrompt: NearbyNpcPrompt | null;
  activeNpcDialogue: ActiveNpcDialogueState | null;
  unreadJournalCount: number;
  chapterDeaths: number;
  storyDifficulty: StoryDifficulty;
  trialElapsedSec: number;
  trialSeed: string | null;
  trialDifficulty: TrialDifficulty | null;
}
