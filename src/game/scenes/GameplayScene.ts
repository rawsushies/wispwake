import Phaser from 'phaser';
import {
  ActiveDialogueBubble,
  ActiveNpcDialogueState,
  CampaignChapterId,
  GENERATED_ASSETS,
  NearbyNpcPrompt,
  StoryDifficulty,
  TelemetrySnapshot,
  TrialDifficulty,
} from '../config/gameConfig';
import { activePhysicsTuning } from '../config/physicsTuning';
import { VEILGROVE_HEX } from '../config/palette';
import { AtlasBuilder } from '../systems/AtlasBuilder';
import { TerrainVisualAssembler } from '../systems/TerrainVisualAssembler';
import { LivingEnvironmentSystem } from '../systems/LivingEnvironmentSystem';
import { DynamicLightSource, LightingSystem } from '../systems/LightingSystem';
import { DialogueManager } from '../systems/DialogueManager';
import {
  applyStoryDifficultyToLevel,
  CAMPAIGN_CHAPTERS,
  getCampaignChapter,
} from '../systems/LevelRegistry';
import { WakeTrialsGenerator } from '../systems/WakeTrialsGenerator';
import { EnvironmentalHazardSystem } from '../systems/EnvironmentalHazardSystem';
import { NPCManager } from '../systems/NPCManager';
import { EnemyManager } from '../systems/EnemyManager';
import { PointerDepthParallaxSystem } from '../systems/PointerDepthParallaxSystem';
import { StoryJournalManager } from '../systems/StoryJournalManager';
import { LeaderboardManager } from '../systems/LeaderboardManager';
import { InputManager } from '../systems/InputManager';
import { SaveManager } from '../systems/SaveManager';
import { AudioManager } from '../systems/AudioManager';
import { Player } from '../entities/player/Player';
import { Pip } from '../entities/companion/Pip';
import { Drifter } from '../entities/creatures/Drifter';
import { WakeSystem } from '../systems/WakeSystem';
import { CameraController } from '../systems/CameraController';
import { BloomPlatform } from '../objects/BloomPlatform';
import { RootBridge } from '../objects/RootBridge';
import { Checkpoint } from '../objects/Checkpoint';
import { AncientBloom } from '../objects/AncientBloom';
import { BiomeTheme, LevelDefinition } from '../levels/sleepingCanopy/levelData';

export interface GameplaySceneCallbacks {
  onTelemetry: (snapshot: TelemetrySnapshot) => void;
  onChapterRestored: (
    chapterId: CampaignChapterId | 'wake_trial',
    nextChapterId: CampaignChapterId | null,
    trialTimeSec: number | null
  ) => void;
  onTogglePause: () => void;
  onToggleDebug: () => void;
}

export class GameplayScene extends Phaser.Scene {
  private callbacks?: GameplaySceneCallbacks;
  private activeMode: CampaignChapterId | 'wake_trial' = 'sleeping_canopy';
  private levelDef!: LevelDefinition;
  private isTitleAttractMode = true;
  private attractElapsed = 0;

  // Wake Trials & Run Metrics State
  private trialDifficulty: TrialDifficulty = 'medium';
  private trialSeed = 'ME-48219';
  private trialElapsedSec = 0;
  private chapterElapsedSec = 0;
  private chapterDeaths = 0;

  // Core Entities & Systems
  private player!: Player;
  private pip!: Pip;
  private wakeSystem!: WakeSystem;
  private cameraController!: CameraController;
  private environmentSystem!: LivingEnvironmentSystem;
  private envHazardSystem!: EnvironmentalHazardSystem;
  private npcManager!: NPCManager;
  private enemyManager!: EnemyManager;
  private pointerParallax!: PointerDepthParallaxSystem;
  private lightingSystem!: LightingSystem;
  private dialogueManager!: DialogueManager;
  private latestDialogueBubble: ActiveDialogueBubble | null = null;
  private latestNpcPrompt: NearbyNpcPrompt | null = null;
  private latestNpcDialogue: ActiveNpcDialogueState | null = null;

  // World Groups & Objects
  private staticPlatforms!: Phaser.Physics.Arcade.StaticGroup;
  private platformVisuals: Phaser.GameObjects.Image[] = [];
  private hazardGroup!: Phaser.Physics.Arcade.StaticGroup;
  private blooms: BloomPlatform[] = [];
  private rootBridges: RootBridge[] = [];
  private drifters: Drifter[] = [];
  private checkpoints: Checkpoint[] = [];
  private activeCheckpoint: Checkpoint | null = null;
  private ancientBloom!: AncientBloom;

  private debugGraphics!: Phaser.GameObjects.Graphics;
  private isChapterRestored = false;

  constructor() {
    super({ key: 'GameplayScene' });
  }

  public setCallbacks(cb: GameplaySceneCallbacks): void {
    this.callbacks = cb;
  }

  public preload(): void {
    this.load.image('bg_canopy_far_sky', GENERATED_ASSETS.bgCanopyFarSky);
    this.load.image('bg_moonlit_marsh', GENERATED_ASSETS.bgMoonlitMarsh);
    this.load.image('bg_hollow_below', GENERATED_ASSETS.bgHollowBelow);
    this.load.image('bg_windward_ruins', GENERATED_ASSETS.bgWindwardRuins);
    this.load.image('bg_shattered_choir', GENERATED_ASSETS.bgShatteredChoir);
    this.load.image('bg_heart_of_veil', GENERATED_ASSETS.bgHeartOfVeil);
    this.load.image('env_distant_canopy', GENERATED_ASSETS.envDistantCanopy);
    this.load.image('bg_canopy_giant_roots', GENERATED_ASSETS.bgCanopyGiantRoots);
    this.load.image('env_near_twisted_roots_raw', GENERATED_ASSETS.envNearTwistedRoots);
    this.load.image('nima_master_raw', GENERATED_ASSETS.nimaSideMaster);
    this.load.image('nima_run_contact_raw', GENERATED_ASSETS.nimaRunContact);
    this.load.image('nima_run_passing_raw', GENERATED_ASSETS.nimaRunPassing);
    this.load.image('pip_master_raw', GENERATED_ASSETS.pipMaster);
  }

  public create(): void {
    AtlasBuilder.buildAllAtlases(this);

    const saved = SaveManager.get();
    this.activeMode = saved.currentChapterId || 'sleeping_canopy';
    this.resolveLevelDefinition();
    this.buildLevelWorld();
    this.setupGlobalShortcuts();
  }

  private resolveLevelDefinition(): void {
    if (this.activeMode === 'wake_trial') {
      const built = WakeTrialsGenerator.buildValidatedTrial(this.trialDifficulty, this.trialSeed);
      this.trialSeed = built.seed;
      this.levelDef = built.levelDef;
    } else {
      const baseChapter = getCampaignChapter(this.activeMode);
      const storyDifficulty = SaveManager.getStoryDifficulty();
      this.levelDef = applyStoryDifficultyToLevel(baseChapter, storyDifficulty);
    }
  }

  private setupGlobalShortcuts(): void {
    const kb = this.input.keyboard;
    if (!kb) return;

    kb.on('keydown-ESC', () => {
      if (!this.isTitleAttractMode) {
        if (this.latestNpcDialogue) {
          this.npcManager?.closeActiveDialogue();
          return;
        }
        this.callbacks?.onTogglePause();
      }
    });

    if (import.meta.env.DEV) {
      kb.on('keydown-F1', (e: KeyboardEvent) => {
        e.preventDefault();
        this.callbacks?.onToggleDebug();
      });
    }

    this.game.events.on(Phaser.Core.Events.BLUR, () => {
      InputManager.clearAll();
      if (this.player) {
        this.player.clearInputs();
      }
    });
  }

  private getCurrentBiome(): BiomeTheme {
    if (this.activeMode === 'wake_trial') {
      if (this.trialDifficulty === 'medium') return 'marsh';
      if (this.trialDifficulty === 'hard') return 'cavern';
      if (this.trialDifficulty === 'extreme') return 'ruins';
      return 'canopy';
    }
    return this.levelDef.biomeTheme || 'canopy';
  }

  private buildLevelWorld(): void {
    this.envHazardSystem?.destroy();
    this.npcManager?.destroy();
    this.enemyManager?.destroy();
    this.pointerParallax?.destroy();

    this.children.removeAll(true);
    this.physics.world.colliders.destroy();
    this.platformVisuals = [];
    this.blooms = [];
    this.rootBridges = [];
    this.drifters = [];
    this.checkpoints = [];
    this.activeCheckpoint = null;
    this.trialElapsedSec = 0;
    this.chapterElapsedSec = 0;
    this.chapterDeaths = 0;
    this.latestDialogueBubble = null;
    this.latestNpcPrompt = null;
    this.latestNpcDialogue = null;

    if (this.activeMode !== 'wake_trial') {
      StoryJournalManager.unlockForChapterVisit(this.activeMode);
    }

    const w = this.levelDef.width;
    const h = this.levelDef.height;
    const biome = this.getCurrentBiome();
    this.physics.world.setBounds(0, 0, w, h + 220);

    const chapterSave =
      this.activeMode !== 'wake_trial' ? SaveManager.getChapterProgress(this.activeMode) : null;
    this.isChapterRestored = Boolean(chapterSave?.completed);

    // 1. 6-LAYER LIVING ENVIRONMENT SYSTEM
    this.environmentSystem = new LivingEnvironmentSystem(
      this,
      w,
      h,
      this.levelDef.platforms,
      this.isChapterRestored,
      biome
    );
    this.pointerParallax = new PointerDepthParallaxSystem();

    // 2. GAMEPLAY PLANE: Authored Static Collision Bodies + Organic Terrain Visuals
    this.staticPlatforms = this.physics.add.staticGroup();
    this.levelDef.platforms.forEach((platSpec, idx) => {
      const centerX = platSpec.x + platSpec.width * 0.5;
      const centerY = platSpec.y + platSpec.height * 0.5;

      const zone = this.add.rectangle(centerX, centerY, platSpec.width, platSpec.height, 0x000000, 0);
      this.physics.add.existing(zone, true);
      this.staticPlatforms.add(zone);

      const visual = TerrainVisualAssembler.createOrganicPlatformVisual(
        this,
        platSpec,
        idx,
        this.isChapterRestored,
        biome
      );
      this.platformVisuals.push(visual);
    });

    // 3. Organic Ember Coral Thorn Hazards
    this.hazardGroup = this.physics.add.staticGroup();
    for (const haz of this.levelDef.hazards) {
      const hSprite = this.hazardGroup.create(haz.x, haz.y - 22, 'hazard_bramble') as Phaser.Physics.Arcade.Sprite;
      hSprite.setDepth(13.2);
      hSprite.refreshBody();
      const hBody = hSprite.body as Phaser.Physics.Arcade.StaticBody;
      hBody.setSize(haz.width - 28, 22);
      hBody.setOffset(14, 28);
    }

    // 4. Wake System & Wake-Reactive Objects
    this.wakeSystem = new WakeSystem(this);

    for (const bSpec of this.levelDef.blooms) {
      const bloom = new BloomPlatform(this, bSpec.id, bSpec.x, bSpec.y, bSpec.customDuration);
      this.blooms.push(bloom);
      this.wakeSystem.register(bloom);
    }

    for (const rSpec of this.levelDef.rootBridges) {
      const alreadyExtended = Boolean(chapterSave?.activatedRootBridgeIds.includes(rSpec.id));
      const bridge = new RootBridge(
        this,
        this.activeMode,
        rSpec.id,
        rSpec.x,
        rSpec.y,
        alreadyExtended
      );
      this.rootBridges.push(bridge);
      this.wakeSystem.register(bridge);
    }

    for (const dSpec of this.levelDef.drifters) {
      const drifter = new Drifter(
        this,
        dSpec.id,
        dSpec.startX,
        dSpec.startY,
        dSpec.endX,
        dSpec.endY,
        dSpec.cycleDuration
      );
      this.drifters.push(drifter);
      this.wakeSystem.register(drifter);
    }

    // Multi-Checkpoint Array with Supporting Platform Bound Clamping
    const cpSpecs =
      this.levelDef.checkpoints && this.levelDef.checkpoints.length > 0
        ? this.levelDef.checkpoints
        : [this.levelDef.checkpoint];

    for (const cpSpec of cpSpecs) {
      const hostPlat = this.levelDef.platforms.find(
        (p) => cpSpec.x >= p.x - 16 && cpSpec.x <= p.x + p.width + 16
      );
      const isCpUnlocked = Boolean(
        chapterSave &&
          (chapterSave.unlockedCheckpointIds.includes(cpSpec.id) ||
            chapterSave.activeCheckpointId === cpSpec.id)
      );
      const cp = new Checkpoint(
        this,
        this.activeMode,
        cpSpec.id,
        cpSpec.x,
        hostPlat ? hostPlat.y : cpSpec.y,
        isCpUnlocked,
        hostPlat ? hostPlat.x : undefined,
        hostPlat ? hostPlat.x + hostPlat.width : undefined
      );
      this.checkpoints.push(cp);
      this.wakeSystem.register(cp);

      if (chapterSave && chapterSave.activeCheckpointId === cpSpec.id) {
        this.activeCheckpoint = cp;
      }
    }

    if (!this.activeCheckpoint) {
      const unlockedList = this.checkpoints.filter((c) => c.isActivated);
      if (unlockedList.length > 0) {
        this.activeCheckpoint = unlockedList[unlockedList.length - 1];
      }
    }

    const abSpec = this.levelDef.ancientBloom;
    this.ancientBloom = new AncientBloom(
      this,
      this.activeMode,
      abSpec.id,
      abSpec.x,
      abSpec.y,
      this.isChapterRestored,
      () => this.handleChapterRestoration()
    );
    this.wakeSystem.register(this.ancientBloom);

    // 5. Safe Player (Nima) & Companion (Pip) Spawn
    const firstPlatTop = this.levelDef.platforms[0]?.y ?? this.levelDef.spawnY + 44;
    let spawnX = this.levelDef.spawnX;
    let spawnY = Player.getSafeCenterYForPlatformTop(firstPlatTop, 4);

    if (this.activeCheckpoint) {
      spawnX = this.activeCheckpoint.spawnX;
      spawnY = this.activeCheckpoint.spawnY;
    }

    this.player = new Player(this, spawnX, spawnY);
    this.pip = new Pip(this, spawnX - 32, spawnY - 44);

    // 6. Dialogue, NPCs, Enemies, Lighting, and Environmental Hazard Systems
    this.dialogueManager = new DialogueManager(this, this.activeMode);
    this.lightingSystem = new LightingSystem(this, biome, this.levelDef.platforms, this.isChapterRestored);

    this.npcManager = new NPCManager(this, this.activeMode, this.levelDef.npcs || []);

    this.enemyManager = new EnemyManager(
      this,
      this.levelDef.enemies || [],
      SaveManager.getStoryDifficulty(),
      () => {
        if (!this.player.isRespawnProtected()) {
          this.triggerHazardRespawn();
        }
      }
    );

    this.envHazardSystem = new EnvironmentalHazardSystem(
      this,
      this.levelDef,
      this.player,
      this.wakeSystem,
      () => {
        if (!this.player.isRespawnProtected()) {
          this.triggerHazardRespawn();
        }
      },
      (memSpec) => {
        this.dialogueManager.triggerById(memSpec.dialogueId);
        this.npcManager.notifyPlayerWorldProgress();
      },
      (bellSpec) => {
        const linkedIds = bellSpec.linkedBloomIds || [];
        for (const bloom of this.blooms) {
          if (linkedIds.includes(bloom.id)) {
            bloom.onWakeActivated();
          }
        }
        this.npcManager.notifyPlayerWorldProgress();
      }
    );

    // 7. Physics Colliders
    this.physics.add.collider(this.player.sprite, this.staticPlatforms);

    for (const bloom of this.blooms) {
      this.physics.add.collider(this.player.sprite, bloom.sprite);
    }
    for (const bridge of this.rootBridges) {
      this.physics.add.collider(this.player.sprite, bridge.sprite);
    }
    for (const drifter of this.drifters) {
      this.physics.add.collider(this.player.sprite, drifter.sprite);
    }

    this.physics.add.overlap(this.player.sprite, this.hazardGroup, () => {
      if (!this.player.isRespawnProtected()) {
        this.triggerHazardRespawn();
      }
    });

    // 8. Responsive Camera Controller (Landscape & Portrait)
    this.cameraController = new CameraController(this, w, h, spawnX, spawnY);

    // 9. Debug Hitbox & Radius Overlay Graphics
    this.debugGraphics = this.add.graphics();
    this.debugGraphics.setDepth(50);
  }

  private spawnLandingDust(x: number, y: number): void {
    if (SaveManager.get().settings.reducedParticles) return;

    for (const side of [-1, 1]) {
      const dust = this.add.image(x + side * 6, y - 2, 'vfx_spore');
      dust.setDepth(21);
      dust.setScale(0.28);
      dust.setAlpha(0.6);
      this.tweens.add({
        targets: dust,
        x: x + side * (16 + Math.random() * 10),
        y: y - 8 - Math.random() * 6,
        alpha: 0,
        scale: 0.1,
        duration: 240,
        ease: 'Quad.Out',
        onComplete: () => dust.destroy(),
      });
    }
  }

  private handleWakeAction(): void {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y - 10;

    const didFire = this.wakeSystem.tryTriggerWake(px, py);
    if (didFire) {
      for (const cp of this.checkpoints) {
        if (
          cp.isActivated &&
          Phaser.Math.Distance.Between(px, py, cp.sprite.x, cp.sprite.y - 36) <=
            activePhysicsTuning.wakeRadius + 24
        ) {
          this.activeCheckpoint = cp;
        }
      }

      this.enemyManager?.onWakePulse(px, py, activePhysicsTuning.wakeRadius);

      const hasExtendedBridge = this.rootBridges.some((b) => b.state !== 'recessed');
      if (hasExtendedBridge) {
        this.npcManager?.notifyPlayerWorldProgress();
      }

      this.player.triggerWakeAnimation();
      this.pip.triggerWakeReaction();
      this.environmentSystem.onWakePulse(px, py, activePhysicsTuning.wakeRadius);
      this.lightingSystem.spawnWakeLightPulse(px, py, activePhysicsTuning.wakeRadius);
      this.dialogueManager.notifyWakeUsed();
      this.cameraController.triggerSubtleShake(110, 0.0018);
    }
  }

  private triggerHazardRespawn(): void {
    if (this.player.isRespawnProtected()) return;

    this.chapterDeaths++;
    AudioManager.playHazardRespawn();
    this.cameraController.triggerSubtleShake(160, 0.003);

    for (const bloom of this.blooms) {
      bloom.setDormant();
    }
    for (const drifter of this.drifters) {
      drifter.resetDeterministic();
    }
    this.envHazardSystem?.resetAllTransientHazards();
    this.enemyManager?.resetAllEnemies();

    const firstPlatTop = this.levelDef.platforms[0]?.y ?? this.levelDef.spawnY + 44;
    const defaultSafeY = Player.getSafeCenterYForPlatformTop(firstPlatTop, 4);

    const respawnX = this.activeCheckpoint ? this.activeCheckpoint.spawnX : this.levelDef.spawnX;
    const respawnY = this.activeCheckpoint ? this.activeCheckpoint.spawnY : defaultSafeY;

    this.player.respawnAt(respawnX, respawnY);
    this.pip.snapToPlayer(this.player);
    this.cameraController.snapTo(respawnX, respawnY);
  }

  private handleChapterRestoration(): void {
    this.isChapterRestored = true;
    this.cameraController.triggerSubtleShake(320, 0.0025);

    this.environmentSystem.triggerGrandRestoration();
    this.lightingSystem.setRestored(true);
    this.pip.triggerWakeReaction();
    this.dialogueManager.triggerEvent('chapter_restored');

    const biome = this.getCurrentBiome();
    this.platformVisuals.forEach((v) => v.destroy());
    this.platformVisuals = [];
    this.levelDef.platforms.forEach((platSpec, idx) => {
      const visual = TerrainVisualAssembler.createOrganicPlatformVisual(this, platSpec, idx, true, biome);
      this.platformVisuals.push(visual);
    });

    for (const bloom of this.blooms) {
      bloom.onWakeActivated();
    }

    let nextChapId: CampaignChapterId | null = null;
    let finishedTrialSec: number | null = null;

    if (this.activeMode === 'wake_trial') {
      finishedTrialSec = Number(this.trialElapsedSec.toFixed(2));
      SaveManager.recordTrialCompletion(this.trialDifficulty, finishedTrialSec, this.trialSeed);
      LeaderboardManager.recordCompletedRun({
        mode: 'wake_trial',
        targetId: 'wake_trial',
        difficulty: this.trialDifficulty,
        seed: this.trialSeed,
        completionTimeSec: finishedTrialSec,
        deaths: this.chapterDeaths,
      });
    } else {
      StoryJournalManager.unlockForChapterVisit(this.activeMode);
      LeaderboardManager.recordCompletedRun({
        mode: 'story_chapter',
        targetId: this.activeMode,
        difficulty: SaveManager.getStoryDifficulty(),
        seed: null,
        completionTimeSec: Number(Math.max(12, this.chapterElapsedSec).toFixed(2)),
        deaths: this.chapterDeaths,
      });

      const idx = CAMPAIGN_CHAPTERS.findIndex((c) => c.chapterId === this.activeMode);
      if (idx >= 0 && idx < CAMPAIGN_CHAPTERS.length - 1) {
        nextChapId = CAMPAIGN_CHAPTERS[idx + 1].chapterId;
      }
    }

    const completedMode = this.activeMode;
    this.time.delayedCall(1500, () => {
      this.callbacks?.onChapterRestored(completedMode, nextChapId, finishedTrialSec);
    });
  }

  private collectWorldLights(): DynamicLightSource[] {
    const lights: DynamicLightSource[] = [];

    for (const bloom of this.blooms) {
      const isOpen = bloom.state === 'active' || bloom.state === 'awakening';
      lights.push({
        x: bloom.sprite.x,
        y: bloom.sprite.y - 6,
        radius: isOpen ? 165 : 75,
        colorHex: isOpen ? '143, 231, 199' : '183, 162, 232',
        intensity: isOpen ? 0.78 : 0.32,
      });
    }

    for (const bridge of this.rootBridges) {
      if (bridge.state !== 'recessed') {
        lights.push({
          x: bridge.sprite.x + 110,
          y: bridge.sprite.y,
          radius: 155,
          colorHex: '241, 200, 120',
          intensity: 0.58,
        });
      }
    }

    for (const cp of this.checkpoints) {
      lights.push({
        x: cp.sprite.x,
        y: cp.sprite.y - 24,
        radius: cp.isActivated ? 195 : 95,
        colorHex: cp.isActivated ? '241, 200, 120' : '143, 231, 199',
        intensity: cp.isActivated ? 0.85 : 0.38,
      });
    }

    if (this.ancientBloom) {
      lights.push({
        x: this.ancientBloom.sprite.x,
        y: this.ancientBloom.sprite.y - 28,
        radius: this.ancientBloom.isRestored ? 280 : 145,
        colorHex: this.ancientBloom.isRestored ? '241, 200, 120' : '183, 162, 232',
        intensity: this.ancientBloom.isRestored ? 0.95 : 0.52,
      });
    }

    return lights;
  }

  public update(_time: number, rawDeltaMs: number): void {
    const dt = Math.min(rawDeltaMs / 1000, 0.05);

    // Priority 2 Fix: Reset Nima's moving-surface flag before kinematic Drifters update and carry her
    if (this.player) {
      this.player.beginFrameCarryCheck();
    }

    for (const drifter of this.drifters) {
      drifter.update(dt, this.isTitleAttractMode ? undefined : this.player);
    }
    for (const bloom of this.blooms) {
      bloom.update(dt);
    }

    if (this.isTitleAttractMode) {
      this.attractElapsed += dt;
      const panX = this.player.sprite.x + 110 + Math.sin(this.attractElapsed * 0.42) * 85;
      const panY = this.player.sprite.y - 22 + Math.cos(this.attractElapsed * 0.35) * 14;
      this.cameraController.snapTo(panX, panY);
      this.pip.update(dt, this.player);
      this.latestDialogueBubble = null;
      this.latestNpcPrompt = null;
      this.latestNpcDialogue = null;
    } else {
      if (!this.isChapterRestored) {
        this.chapterElapsedSec += dt;
        if (this.activeMode === 'wake_trial') {
          this.trialElapsedSec += dt;
        }
      }

      this.envHazardSystem?.update(dt, this.player);
      this.enemyManager?.update(dt, this.player);

      this.player.update(
        dt,
        () => this.handleWakeAction(),
        (x, y) => this.spawnLandingDust(x, y),
        () => {
          this.npcManager?.handleInteractInput();
        }
      );

      if (this.npcManager) {
        const npcState = this.npcManager.update(dt, this.player.sprite.x, this.player.sprite.y);
        this.latestNpcPrompt = npcState.nearbyPrompt;
        this.latestNpcDialogue = npcState.activeDialogue;
      }

      if (this.player.sprite.y > this.levelDef.height + 60) {
        this.triggerHazardRespawn();
      }

      for (const cp of this.checkpoints) {
        const newlyLit = cp.checkProximityActivation(this.player.sprite.x, this.player.sprite.y);
        if (newlyLit) {
          this.activeCheckpoint = cp;
          this.dialogueManager.triggerEvent('checkpoint_reached');
          this.npcManager?.notifyPlayerWorldProgress();
        }
      }

      const nearestHint = this.wakeSystem.update(dt, this.player.sprite.x, this.player.sprite.y);
      this.pip.setCuriosityHint(nearestHint);
      this.pip.update(dt, this.player);

      this.latestDialogueBubble = this.dialogueManager.update(
        dt,
        this.player.sprite.x,
        this.pip.sprite.x,
        this.pip.sprite.y,
        nearestHint !== null
      );

      this.cameraController.update(dt, this.player);
    }

    const pointerOffset = this.pointerParallax
      ? this.pointerParallax.update(dt)
      : { normX: 0, normY: 0 };

    this.environmentSystem.update(
      dt,
      this.cameras.main.scrollX,
      this.player.sprite.x,
      this.player.body.bottom,
      this.player.body.velocity.x,
      pointerOffset.normX,
      pointerOffset.normY
    );

    this.lightingSystem.update(
      dt,
      this.cameras.main.scrollX,
      this.cameras.main.scrollY,
      this.player.sprite.x,
      this.player.sprite.y,
      this.pip.sprite.x,
      this.pip.sprite.y,
      this.collectWorldLights()
    );

    this.renderDebugOverlay();
    this.emitTelemetry();
  }

  private renderDebugOverlay(): void {
    this.debugGraphics.clear();
    if (!import.meta.env.DEV || !SaveManager.get().settings.debugHitboxes) return;

    const tuning = activePhysicsTuning;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y - 10;

    this.debugGraphics.lineStyle(2, 0x10b981, 0.95);
    this.debugGraphics.strokeRect(
      this.player.body.x,
      this.player.body.y,
      this.player.body.width,
      this.player.body.height
    );

    this.debugGraphics.lineStyle(1.5, VEILGROVE_HEX.wakeMint, 0.8);
    this.debugGraphics.strokeCircle(px, py, tuning.wakeRadius);

    this.debugGraphics.lineStyle(1, VEILGROVE_HEX.spiritLilac, 0.45);
    this.debugGraphics.strokeCircle(px, py, tuning.wakeProximityHintRadius);

    this.debugGraphics.lineStyle(1.5, VEILGROVE_HEX.sapGold, 0.75);
    this.staticPlatforms.getChildren().forEach((child) => {
      const b = (child as Phaser.GameObjects.Zone).body as Phaser.Physics.Arcade.StaticBody;
      if (b && b.enable) {
        this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
      }
    });

    for (const bloom of this.blooms) {
      const b = bloom.body;
      this.debugGraphics.lineStyle(2, b.enable ? 0x8fe7c7 : 0x64748b, 0.9);
      this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
    }
    for (const bridge of this.rootBridges) {
      const b = bridge.body;
      this.debugGraphics.lineStyle(2, b.enable ? 0xf1c878 : 0x64748b, 0.9);
      this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
    }
    for (const drifter of this.drifters) {
      const b = drifter.body;
      this.debugGraphics.lineStyle(2, 0xb7a2e8, 0.9);
      this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
    }

    this.debugGraphics.lineStyle(2, VEILGROVE_HEX.emberCoral, 0.95);
    this.hazardGroup.getChildren().forEach((child) => {
      const b = (child as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody;
      if (b) {
        this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
      }
    });
    if (this.enemyManager) {
      for (const eb of this.enemyManager.getDebugBounds()) {
        this.debugGraphics.strokeRect(eb.x, eb.y, eb.w, eb.h);
      }
    }
  }

  private emitTelemetry(): void {
    if (!this.callbacks || !this.player) return;

    const px = this.player.sprite.x;
    let currentBeat = this.levelDef.beats[0];
    for (const beat of this.levelDef.beats) {
      if (px >= beat.minX && px <= beat.maxX) {
        currentBeat = beat;
        break;
      }
    }

    const activeRootCount = this.rootBridges.filter((r) => r.state !== 'recessed').length;
    const unlockedCpCount = this.checkpoints.filter((c) => c.isActivated).length;
    const totalRestorable = this.rootBridges.length + this.checkpoints.length + 1;
    const restoredCount =
      activeRootCount + unlockedCpCount + (this.ancientBloom?.isRestored ? 1 : 0);

    this.callbacks.onTelemetry({
      fps: Math.round(this.game.loop.actualFps || 60),
      playerX: Math.round(this.player.sprite.x),
      playerY: Math.round(this.player.sprite.y),
      velocityX: Math.round(this.player.body.velocity.x),
      velocityY: Math.round(this.player.body.velocity.y),
      grounded: this.player.isGrounded(),
      coyoteRemaining: Number(this.player.coyoteTimer.toFixed(2)),
      jumpBufferRemaining: Number(this.player.jumpBufferTimer.toFixed(2)),
      wakeCooldownRemaining: Number(this.wakeSystem.cooldownRemaining.toFixed(2)),
      animState: this.player.animState,
      chapterId: this.activeMode,
      chapterTitle: this.levelDef.title,
      currentBeatTitle: currentBeat ? `${currentBeat.title} — ${currentBeat.subtitle}` : this.levelDef.title,
      currentBeatIndex: currentBeat ? currentBeat.index : 1,
      activeCheckpointId: this.activeCheckpoint ? this.activeCheckpoint.id : null,
      unlockedCheckpointsCount: unlockedCpCount,
      totalCheckpointsCount: this.checkpoints.length,
      restoredCount,
      totalRestorable,
      discoveredMemoriesCount: this.envHazardSystem ? this.envHazardSystem.getDiscoveredMemoryEchoesCount() : 0,
      totalMemoriesCount: this.envHazardSystem ? this.envHazardSystem.getTotalMemoryEchoesCount() : 0,
      chapterCompleted: this.isChapterRestored,
      activeDialogue: this.latestDialogueBubble,
      nearbyNpcPrompt: this.latestNpcPrompt,
      activeNpcDialogue: this.latestNpcDialogue,
      unreadJournalCount: StoryJournalManager.getUnreadCount(),
      storyDifficulty: SaveManager.getStoryDifficulty(),
      trialElapsedSec: Number(this.trialElapsedSec.toFixed(1)),
      trialSeed: this.activeMode === 'wake_trial' ? this.trialSeed : null,
      trialDifficulty: this.activeMode === 'wake_trial' ? this.trialDifficulty : null,
      chapterDeaths: this.chapterDeaths,
    });
  }

  // --- Public Commands Exposed to React Game Shell ---

  public handleViewportResize(logicalW: number, logicalH: number): void {
    this.cameras.main.setViewport(0, 0, logicalW, logicalH);
    this.cameras.main.setSize(logicalW, logicalH);
    this.environmentSystem?.handleViewportResize(logicalW, logicalH);
    this.lightingSystem?.handleViewportResize(logicalW, logicalH);
    if (this.cameraController && this.player) {
      this.cameraController.onViewportResized(this.player.sprite.x, this.player.sprite.y);
    }
  }

  public triggerNpcInteract(): void {
    this.npcManager?.handleInteractInput();
  }

  public closeNpcDialogue(): void {
    this.npcManager?.closeActiveDialogue();
  }

  public setAttractMode(attract: boolean): void {
    this.isTitleAttractMode = attract;
    if (!attract && this.player) {
      this.cameraController.snapTo(this.player.sprite.x, this.player.sprite.y);
      AudioManager.startAmbience(this.isChapterRestored);
    }
  }

  public setPausedState(paused: boolean): void {
    if (paused) {
      InputManager.clearAll();
      this.physics.world.pause();
    } else {
      this.physics.world.resume();
    }
  }

  public dismissDialogue(): void {
    this.dialogueManager?.dismissCurrent();
  }

  public restartFromCheckpoint(): void {
    this.triggerHazardRespawn();
  }

  public loadCampaignChapter(
    chapterId: CampaignChapterId,
    resetChapterProgress = false,
    storyDifficulty?: StoryDifficulty
  ): void {
    if (storyDifficulty) {
      SaveManager.setStoryDifficulty(storyDifficulty);
    }
    if (resetChapterProgress) {
      SaveManager.resetChapterProgress(chapterId);
    }
    SaveManager.setCurrentChapter(chapterId);
    this.activeMode = chapterId;
    this.resolveLevelDefinition();
    this.buildLevelWorld();
  }

  public startWakeTrial(difficulty: TrialDifficulty, seed?: string): void {
    this.trialDifficulty = difficulty;
    this.trialSeed =
      seed && seed.trim().length > 0
        ? seed.trim().toUpperCase()
        : WakeTrialsGenerator.generateSeedCode(difficulty);
    this.activeMode = 'wake_trial';
    this.resolveLevelDefinition();
    this.buildLevelWorld();
  }
}
