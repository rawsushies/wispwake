import Phaser from 'phaser';
import { GENERATED_ASSETS, LevelMode, TelemetrySnapshot } from '../config/gameConfig';
import { activePhysicsTuning } from '../config/physicsTuning';
import { VEILGROVE_HEX } from '../config/palette';
import { AtlasBuilder } from '../systems/AtlasBuilder';
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
import {
  LevelDefinition,
  PROTOTYPE_SANDBOX_LEVEL,
  SLEEPING_CANOPY_LEVEL,
} from '../levels/sleepingCanopy/levelData';

export interface GameplaySceneCallbacks {
  onTelemetry: (snapshot: TelemetrySnapshot) => void;
  onChapterRestored: () => void;
  onTogglePause: () => void;
  onToggleDebug: () => void;
}

export class GameplayScene extends Phaser.Scene {
  private callbacks?: GameplaySceneCallbacks;
  private levelMode: LevelMode = 'sleeping_canopy';
  private levelDef: LevelDefinition = SLEEPING_CANOPY_LEVEL;
  private isTitleAttractMode = true;
  private attractElapsed = 0;

  // Core Entities & Systems
  private player!: Player;
  private pip!: Pip;
  private wakeSystem!: WakeSystem;
  private cameraController!: CameraController;

  // World Groups & Objects
  private staticPlatforms!: Phaser.Physics.Arcade.StaticGroup;
  private hazardGroup!: Phaser.Physics.Arcade.StaticGroup;
  private blooms: BloomPlatform[] = [];
  private rootBridges: RootBridge[] = [];
  private drifters: Drifter[] = [];
  private checkpoint!: Checkpoint;
  private ancientBloom!: AncientBloom;

  // Parallax & Atmosphere Layers
  private farSkyTile!: Phaser.GameObjects.TileSprite;
  private midRootsTile!: Phaser.GameObjects.TileSprite;
  private mistBands: Phaser.GameObjects.Rectangle[] = [];
  private foregroundSilhouettes: Phaser.GameObjects.Graphics[] = [];
  private ambientSpores: Array<{ sprite: Phaser.GameObjects.Image; baseY: number; speedX: number; phase: number }> = [];
  private restorationWarmGlow!: Phaser.GameObjects.Rectangle;

  // Debug Visualization Graphics
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private isChapterRestored = false;

  constructor() {
    super({ key: 'GameplayScene' });
  }

  public setCallbacks(cb: GameplaySceneCallbacks): void {
    this.callbacks = cb;
  }

  public preload(): void {
    // Load AI-generated hand-painted backdrops with resilient fallback if needed
    this.load.image('bg_canopy_far_sky', GENERATED_ASSETS.bgCanopyFarSky);
    this.load.image('bg_canopy_giant_roots', GENERATED_ASSETS.bgCanopyGiantRoots);
  }

  public create(): void {
    // Build all multi-part painterly character, creature, plant, and terrain atlases
    AtlasBuilder.buildAllAtlases(this);

    const saved = SaveManager.get();
    this.levelMode = saved.levelMode || 'sleeping_canopy';
    this.levelDef = this.levelMode === 'prototype_sandbox' ? PROTOTYPE_SANDBOX_LEVEL : SLEEPING_CANOPY_LEVEL;

    this.buildLevelWorld();
    this.setupGlobalShortcuts();

    // Apply any saved custom Art Forger backdrops
    if (saved.customBackdrops.farSkyDataUrl) {
      this.applyCustomBackdrop('far_sky', saved.customBackdrops.farSkyDataUrl);
    }
    if (saved.customBackdrops.midRootsDataUrl) {
      this.applyCustomBackdrop('mid_roots', saved.customBackdrops.midRootsDataUrl);
    }
  }

  private setupGlobalShortcuts(): void {
    const kb = this.input.keyboard;
    if (!kb) return;

    kb.on('keydown-ESC', () => {
      if (!this.isTitleAttractMode) {
        this.callbacks?.onTogglePause();
      }
    });

    kb.on('keydown-F1', (e: KeyboardEvent) => {
      e.preventDefault();
      this.callbacks?.onToggleDebug();
    });

    // Clear held inputs on window blur per game craft rules
    this.game.events.on(Phaser.Core.Events.BLUR, () => {
      if (this.player) {
        this.player.clearInputs();
      }
    });
  }

  private buildLevelWorld(): void {
    // Clear previous state if rebuilding
    this.children.removeAll(true);
    this.physics.world.colliders.destroy();
    this.blooms = [];
    this.rootBridges = [];
    this.drifters = [];
    this.mistBands = [];
    this.foregroundSilhouettes = [];
    this.ambientSpores = [];

    const w = this.levelDef.width;
    const h = this.levelDef.height;
    this.physics.world.setBounds(0, 0, w, h + 200);

    const saved = SaveManager.get();
    this.isChapterRestored = saved.chapterCompleted && this.levelMode === 'sleeping_canopy';

    // 1. PARALLAX LAYER 0: Far Sky (0.08x scroll factor)
    const skyTexKey = this.textures.exists('custom_far_sky')
      ? 'custom_far_sky'
      : this.textures.exists('bg_canopy_far_sky')
        ? 'bg_canopy_far_sky'
        : '';

    if (skyTexKey) {
      this.farSkyTile = this.add.tileSprite(0, 0, 1920, 1080, skyTexKey);
      this.farSkyTile.setOrigin(0, 0);
      this.farSkyTile.setScrollFactor(0);
      this.farSkyTile.setScale(960 / 1920, 540 / 1080);
      this.farSkyTile.setDepth(1);
      this.farSkyTile.setTint(this.isChapterRestored ? 0xffe8c2 : 0xb8c9d9);
    } else {
      const fallbackSky = this.add.rectangle(0, 0, 960, 540, VEILGROVE_HEX.nightInk).setOrigin(0, 0).setScrollFactor(0);
      fallbackSky.setDepth(1);
    }

    // 2. PARALLAX LAYER 1: Midground Giant Roots & Canopy (0.22x parallax)
    const rootsTexKey = this.textures.exists('custom_mid_roots')
      ? 'custom_mid_roots'
      : this.textures.exists('bg_canopy_giant_roots')
        ? 'bg_canopy_giant_roots'
        : '';

    if (rootsTexKey) {
      this.midRootsTile = this.add.tileSprite(0, 0, 1920, 1080, rootsTexKey);
      this.midRootsTile.setOrigin(0, 0);
      this.midRootsTile.setScrollFactor(0);
      this.midRootsTile.setScale(960 / 1920, 540 / 1080);
      this.midRootsTile.setDepth(2);
      this.midRootsTile.setAlpha(0.72);
      this.midRootsTile.setTint(this.isChapterRestored ? 0xfff0d4 : 0x7ea6a6);
    }

    // 3. PARALLAX LAYER 2: Atmospheric Depth Mist Bands (Separates background painting from collision plane per Section 9.4 & 13.3)
    const mist1 = this.add.rectangle(0, 320, 960, 260, VEILGROVE_HEX.nightInk, 0.55).setOrigin(0, 0).setScrollFactor(0).setDepth(4);
    const mist2 = this.add.rectangle(0, 0, 960, 540, VEILGROVE_HEX.deepDusk, 0.32).setOrigin(0, 0).setScrollFactor(0).setDepth(5);
    this.mistBands.push(mist1, mist2);

    // Warm golden restoration wash layer (alpha 0 while sleeping, transitions to 0.18 on Beat 7 First Bloom)
    this.restorationWarmGlow = this.add
      .rectangle(0, 0, 960, 540, VEILGROVE_HEX.sapGold, this.isChapterRestored ? 0.16 : 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(6);

    // 4. GAMEPLAY PLANE: Authored Static Platforms (Explicit collision geometry separate from background art per Section 6.3 & 13.3)
    this.staticPlatforms = this.physics.add.staticGroup();
    for (const platSpec of this.levelDef.platforms) {
      const texKey = AtlasBuilder.getOrCreatePlatformTexture(
        this,
        platSpec.width,
        platSpec.height,
        this.isChapterRestored
      );
      const centerX = platSpec.x + platSpec.width * 0.5;
      const centerY = platSpec.y + platSpec.height * 0.5;
      const platSprite = this.staticPlatforms.create(centerX, centerY, texKey) as Phaser.Physics.Arcade.Sprite;
      platSprite.setDepth(12);
      platSprite.refreshBody();
    }

    // 5. Hazards (Ember Coral Brambles with unmistakable silhouette & trimmed hitbox)
    this.hazardGroup = this.physics.add.staticGroup();
    for (const haz of this.levelDef.hazards) {
      const hSprite = this.hazardGroup.create(haz.x, haz.y - 20, 'hazard_bramble') as Phaser.Physics.Arcade.Sprite;
      hSprite.setDepth(13);
      hSprite.refreshBody();
      const hBody = hSprite.body as Phaser.Physics.Arcade.StaticBody;
      hBody.setSize(haz.width - 28, 22);
      hBody.setOffset(14, 22);
    }

    // 6. Wake System & Wake-Reactive Objects
    this.wakeSystem = new WakeSystem(this);

    for (const bSpec of this.levelDef.blooms) {
      const bloom = new BloomPlatform(this, bSpec.id, bSpec.x, bSpec.y);
      this.blooms.push(bloom);
      this.wakeSystem.register(bloom);
    }

    for (const rSpec of this.levelDef.rootBridges) {
      const alreadyExtended = saved.activatedRootBridgeIds.includes(rSpec.id);
      const bridge = new RootBridge(this, rSpec.id, rSpec.x, rSpec.y, alreadyExtended);
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

    const cpSpec = this.levelDef.checkpoint;
    const isCpActive = saved.activeCheckpointId === cpSpec.id;
    this.checkpoint = new Checkpoint(this, cpSpec.id, cpSpec.x, cpSpec.y, isCpActive);
    this.wakeSystem.register(this.checkpoint);

    const abSpec = this.levelDef.ancientBloom;
    this.ancientBloom = new AncientBloom(
      this,
      abSpec.id,
      abSpec.x,
      abSpec.y,
      this.isChapterRestored,
      () => this.handleChapterRestoration()
    );
    this.wakeSystem.register(this.ancientBloom);

    // 7. Determine Player Spawn Position (Saved Checkpoint or Level Start)
    let spawnX = this.levelDef.spawnX;
    let spawnY = this.levelDef.spawnY;
    if (isCpActive && saved.checkpointX !== null && saved.checkpointY !== null) {
      spawnX = saved.checkpointX;
      spawnY = saved.checkpointY;
    }

    this.player = new Player(this, spawnX, spawnY);
    this.pip = new Pip(this, spawnX - 32, spawnY - 44);

    // 8. Register Physics Colliders
    this.physics.add.collider(this.player.sprite, this.staticPlatforms);

    for (const bloom of this.blooms) {
      this.physics.add.collider(this.player.sprite, bloom.sprite);
    }
    for (const bridge of this.rootBridges) {
      this.physics.add.collider(this.player.sprite, bridge.sprite);
    }
    for (const drifter of this.drifters) {
      this.physics.add.collider(this.player.sprite, drifter.sprite, () => {
        // Carry Nima horizontally with the Drifter when standing on its bell top
        if (this.player.body.touching.down) {
          this.player.sprite.x += drifter.deltaX;
        }
      });
    }

    this.physics.add.overlap(this.player.sprite, this.hazardGroup, () => {
      this.triggerHazardRespawn();
    });

    // 9. Camera Controller (Close readable framing: 42% from left, 58% from top)
    this.cameraController = new CameraController(this, w, h, spawnX, spawnY);

    // 10. Foreground Framing & Bounded Atmospheric Spores (Never obscures landing edges per Section 9.5 & 9.6)
    this.buildForegroundAndSpores(w, h);

    // 11. Debug Hitbox & Radius Overlay Graphics (Section 6.3)
    this.debugGraphics = this.add.graphics();
    this.debugGraphics.setDepth(50);
  }

  private buildForegroundAndSpores(levelWidth: number, levelHeight: number): void {
    // Non-obscuring top/bottom vignette botanical silhouettes at 1.18x parallax
    for (let x = 180; x < levelWidth; x += 520) {
      const fg = this.add.graphics();
      fg.setDepth(30);
      fg.setScrollFactor(1.15, 1.0);
      fg.fillStyle(VEILGROVE_HEX.nightInk, 0.72);
      // Hanging top canopy fern silhouette (strictly top 45px of frame, never covering platforms)
      fg.fillEllipse(x, -10, 180, 70);
      fg.fillEllipse(x + 90, -14, 120, 50);
      this.foregroundSilhouettes.push(fg);
    }

    // Bounded deterministic floating spores
    const sporeCount = 34;
    for (let i = 0; i < sporeCount; i++) {
      const sx = (i / sporeCount) * levelWidth + Math.random() * 90;
      const sy = 140 + Math.random() * (levelHeight - 240);
      const sprite = this.add.image(sx, sy, 'vfx_spore');
      sprite.setDepth(22);
      sprite.setScale(0.22 + Math.random() * 0.32);
      sprite.setAlpha(0.35 + Math.random() * 0.4);
      sprite.setBlendMode(Phaser.BlendModes.ADD);
      this.ambientSpores.push({
        sprite,
        baseY: sy,
        speedX: 8 + Math.random() * 14,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private spawnLandingDust(x: number, y: number): void {
    if (SaveManager.get().settings.reducedParticles) return;

    for (let side of [-1, 1]) {
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
      this.player.triggerWakeAnimation();
      this.pip.triggerWakeReaction();
      this.cameraController.triggerSubtleShake(110, 0.0018);
    }
  }

  private triggerHazardRespawn(): void {
    AudioManager.playHazardRespawn();
    this.cameraController.triggerSubtleShake(160, 0.003);

    // Reset temporary blooms and Drifter to a fair deterministic state (Section 8.3)
    for (const bloom of this.blooms) {
      bloom.setDormant();
    }
    for (const drifter of this.drifters) {
      drifter.resetDeterministic();
    }

    const saved = SaveManager.get();
    const respawnX =
      this.checkpoint.isActivated && saved.checkpointX !== null ? saved.checkpointX : this.levelDef.spawnX;
    const respawnY =
      this.checkpoint.isActivated && saved.checkpointY !== null ? saved.checkpointY : this.levelDef.spawnY;

    this.player.respawnAt(respawnX, respawnY);
    this.pip.snapToPlayer(this.player);
    this.cameraController.snapTo(respawnX, respawnY);
  }

  private handleChapterRestoration(): void {
    this.isChapterRestored = true;
    this.cameraController.triggerSubtleShake(320, 0.0025);

    // Visibly transform local scene lighting & atmosphere (Section 9.4)
    this.tweens.add({
      targets: this.restorationWarmGlow,
      alpha: 0.2,
      duration: 1800,
      ease: 'Sine.InOut',
    });

    if (this.farSkyTile) {
      this.farSkyTile.setTint(0xffe8c2);
    }
    if (this.midRootsTile) {
      this.midRootsTile.setTint(0xfff0d4);
    }

    // Open all blooms in celebration
    for (const bloom of this.blooms) {
      bloom.onWakeActivated();
    }

    this.time.delayedCall(1400, () => {
      this.callbacks?.onChapterRestored();
    });
  }

  public update(_time: number, rawDeltaMs: number): void {
    // Clamp frame delta time per 60fps simulation guidelines (`Math.min(rawDt, 0.05)`)
    const dt = Math.min(rawDeltaMs / 1000, 0.05);

    // Update Drifters & BloomPlatform timers
    for (const drifter of this.drifters) {
      drifter.update(dt);
    }
    for (const bloom of this.blooms) {
      bloom.update(dt);
    }

    if (this.isTitleAttractMode) {
      // Gentle live-world camera pan around Nima & Pip on the Awakening root during the Title Screen
      this.attractElapsed += dt;
      const panX = this.player.sprite.x + 120 + Math.sin(this.attractElapsed * 0.45) * 95;
      const panY = this.player.sprite.y - 25 + Math.cos(this.attractElapsed * 0.35) * 18;
      this.cameraController.snapTo(panX, panY);
      this.pip.update(dt, this.player);
    } else {
      // Active Gameplay Update
      this.player.update(
        dt,
        () => this.handleWakeAction(),
        (x, y) => this.spawnLandingDust(x, y)
      );

      // Pitfall check (falling out of the canopy returns Nima swiftly to checkpoint per Section 5.4)
      if (this.player.sprite.y > this.levelDef.height + 60) {
        this.triggerHazardRespawn();
      }

      // Check proximity checkpoint activation
      this.checkpoint.checkProximityActivation(this.player.sprite.x, this.player.sprite.y);

      // Update Wake system & pass nearest dormant target hint to Pip
      const nearestHint = this.wakeSystem.update(dt, this.player.sprite.x, this.player.sprite.y);
      this.pip.setCuriosityHint(nearestHint);
      this.pip.update(dt, this.player);

      // Update smooth camera follow
      this.cameraController.update(dt, this.player);
    }

    // Update Parallax TileSprites based on camera scroll
    const cam = this.cameras.main;
    if (this.farSkyTile) {
      this.farSkyTile.tilePositionX = cam.scrollX * 0.08;
    }
    if (this.midRootsTile) {
      this.midRootsTile.tilePositionX = cam.scrollX * 0.22;
    }

    // Update bounded atmospheric spores
    const reducedParticles = SaveManager.get().settings.reducedParticles;
    for (const s of this.ambientSpores) {
      s.sprite.setVisible(!reducedParticles);
      if (!reducedParticles) {
        s.phase += dt * 1.6;
        s.sprite.x += s.speedX * dt;
        s.sprite.y = s.baseY + Math.sin(s.phase) * 14;
        if (s.sprite.x > this.levelDef.width) {
          s.sprite.x = 0;
        }
      }
    }

    // Render Debug Hitboxes & Wake Radii if enabled (Section 6.3)
    this.renderDebugOverlay();

    // Emit Telemetry Snapshot to React HUD
    this.emitTelemetry();
  }

  private renderDebugOverlay(): void {
    this.debugGraphics.clear();
    if (!SaveManager.get().settings.debugHitboxes) return;

    const tuning = activePhysicsTuning;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y - 10;

    // 1. Player Hitbox (Bright Emerald/Mint)
    this.debugGraphics.lineStyle(2, 0x10b981, 0.95);
    this.debugGraphics.strokeRect(
      this.player.body.x,
      this.player.body.y,
      this.player.body.width,
      this.player.body.height
    );

    // 2. Wake Active Radius (Wake Mint) & Proximity Hint Radius (Spirit Lilac)
    this.debugGraphics.lineStyle(1.5, VEILGROVE_HEX.wakeMint, 0.8);
    this.debugGraphics.strokeCircle(px, py, tuning.wakeRadius);

    this.debugGraphics.lineStyle(1, VEILGROVE_HEX.spiritLilac, 0.45);
    this.debugGraphics.strokeCircle(px, py, tuning.wakeProximityHintRadius);

    // 3. Static Platform Bodies (Sap Gold)
    this.debugGraphics.lineStyle(1.5, VEILGROVE_HEX.sapGold, 0.75);
    this.staticPlatforms.getChildren().forEach((child) => {
      const b = (child as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody;
      if (b && b.enable) {
        this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
      }
    });

    // 4. Interactive Object Hitboxes & Centres
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

    // 5. Hazard Hitboxes (Ember Coral)
    this.debugGraphics.lineStyle(2, VEILGROVE_HEX.emberCoral, 0.95);
    this.hazardGroup.getChildren().forEach((child) => {
      const b = (child as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody;
      if (b) {
        this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
      }
    });
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
    const totalRestorable = this.rootBridges.length + 1 + 1; // Bridges + Checkpoint + Ancient Bloom
    const restoredCount =
      activeRootCount + (this.checkpoint?.isActivated ? 1 : 0) + (this.ancientBloom?.isRestored ? 1 : 0);

    this.callbacks.onTelemetry({
      fps: Math.round(this.game.loop.actualFps || 60),
      playerX: Math.round(this.player.sprite.x),
      playerY: Math.round(this.player.sprite.y),
      velocityX: Math.round(this.player.body.velocity.x),
      velocityY: Math.round(this.player.body.velocity.y),
      grounded: Boolean(this.player.body.blocked.down || this.player.body.touching.down),
      coyoteRemaining: Number(this.player.coyoteTimer.toFixed(2)),
      jumpBufferRemaining: Number(this.player.jumpBufferTimer.toFixed(2)),
      wakeCooldownRemaining: Number(this.wakeSystem.cooldownRemaining.toFixed(2)),
      animState: this.player.animState,
      currentBeatTitle: currentBeat ? `${currentBeat.title} — ${currentBeat.subtitle}` : this.levelDef.title,
      currentBeatIndex: currentBeat ? currentBeat.index : 1,
      activeCheckpointId: this.checkpoint?.isActivated ? this.checkpoint.id : null,
      restoredCount,
      totalRestorable,
      chapterCompleted: this.isChapterRestored,
    });
  }

  // --- Public Commands Exposed to React Game Shell ---

  public setAttractMode(attract: boolean): void {
    this.isTitleAttractMode = attract;
    if (!attract && this.player) {
      this.cameraController.snapTo(this.player.sprite.x, this.player.sprite.y);
      AudioManager.startAmbience(this.isChapterRestored);
    }
  }

  public setPausedState(paused: boolean): void {
    if (paused) {
      this.physics.world.pause();
    } else {
      this.physics.world.resume();
    }
  }

  public restartFromCheckpoint(): void {
    this.triggerHazardRespawn();
  }

  public switchLevelMode(mode: LevelMode, resetAllProgress = false): void {
    if (resetAllProgress) {
      SaveManager.resetProgress();
    }
    SaveManager.save({ levelMode: mode });
    this.levelMode = mode;
    this.levelDef = mode === 'prototype_sandbox' ? PROTOTYPE_SANDBOX_LEVEL : SLEEPING_CANOPY_LEVEL;
    this.buildLevelWorld();
  }

  public syncPlayerHitbox(): void {
    if (this.player) {
      this.player.syncHitbox();
    }
  }

  public applyCustomBackdrop(layer: 'far_sky' | 'mid_roots', dataUrl: string): void {
    const texKey = layer === 'far_sky' ? 'custom_far_sky' : 'custom_mid_roots';
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (this.textures.exists(texKey)) {
        this.textures.remove(texKey);
      }
      this.textures.addImage(texKey, img);
      if (layer === 'far_sky' && this.farSkyTile) {
        this.farSkyTile.setTexture(texKey);
        this.farSkyTile.setScale(960 / img.width, 540 / img.height);
        SaveManager.save({
          customBackdrops: {
            ...SaveManager.get().customBackdrops,
            farSkyDataUrl: dataUrl,
          },
        });
      } else if (layer === 'mid_roots' && this.midRootsTile) {
        this.midRootsTile.setTexture(texKey);
        this.midRootsTile.setScale(960 / img.width, 540 / img.height);
        SaveManager.save({
          customBackdrops: {
            ...SaveManager.get().customBackdrops,
            midRootsDataUrl: dataUrl,
          },
        });
      }
    };
    img.src = dataUrl;
  }
}
