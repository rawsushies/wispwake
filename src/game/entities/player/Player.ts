import Phaser from 'phaser';
import { activePhysicsTuning } from '../../config/physicsTuning';
import { AudioManager } from '../../systems/AudioManager';
import { InputManager, UnifiedInputState } from '../../systems/InputManager';

export type PlayerAnimState =
  | 'idle'
  | 'run'
  | 'jump_start'
  | 'rise'
  | 'fall'
  | 'land'
  | 'wake_cast'
  | 'respawn';

/**
 * Player entity and controller (Milestone 6 Update):
 * - Uses `InputManager` to read combined Keyboard, Mobile Touch, and Gamepad inputs
 *   including dedicated NPC Interact (`F` / touch button / gamepad button).
 * - Fixes Drifter passenger carrying lifecycle so `ridingMovingSurface` persists across
 *   the frame and tracks `prevBottom` for swept one-way landing detection.
 */
export class Player {
  public readonly sprite: Phaser.Physics.Arcade.Sprite;
  public readonly body: Phaser.Physics.Arcade.Body;
  private readonly scene: Phaser.Scene;

  public facing: 1 | -1 = 1;
  public coyoteTimer = 0;
  public jumpBufferTimer = 0;
  public isJumping = false;
  public wasGrounded = false;
  public animState: PlayerAnimState = 'idle';
  public respawnProtectionTimer = 0;

  public ridingMovingSurface = false;
  public prevBottom = 0;
  private carriedThisFrame = false;
  private externalVelocityX = 0;
  private externalVelocityY = 0;

  private landAnimTimer = 0;
  private wakeCastAnimTimer = 0;
  private respawnAnimTimer = 0;
  private footstepTimer = 0;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private keyZ?: Phaser.Input.Keyboard.Key;
  private keySpace?: Phaser.Input.Keyboard.Key;
  private keyE?: Phaser.Input.Keyboard.Key;
  private keyX?: Phaser.Input.Keyboard.Key;
  private keyF?: Phaser.Input.Keyboard.Key;

  /**
   * Computes the exact sprite center Y so Nima's physics body bottom (`sprite.y + 44`)
   * rests safely `marginPx` above `platformTopY`.
   */
  public static getSafeCenterYForPlatformTop(platformTopY: number, marginPx = 4): number {
    return platformTopY - 44 - marginPx;
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.registerAnimations(scene);

    this.sprite = scene.physics.add.sprite(x, y, 'nima_sheet', 0);
    this.sprite.setDepth(20);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;

    this.syncHitbox();
    this.body.setGravityY(activePhysicsTuning.gravity);
    this.body.setMaxVelocity(activePhysicsTuning.moveSpeed * 1.8, activePhysicsTuning.maxFallSpeed);
    this.body.setCollideWorldBounds(false);
    this.prevBottom = this.body.bottom;

    this.setupInputs();
    this.sprite.play('nima_idle');
  }

  public syncHitbox(): void {
    const w = activePhysicsTuning.hitboxWidth;
    const h = activePhysicsTuning.hitboxHeight;
    this.body.setSize(w, h);
    this.body.setOffset((96 - w) * 0.5, 100 - h);
  }

  private setupInputs(): void {
    const kb = this.scene.input.keyboard;
    if (!kb) return;

    this.cursors = kb.createCursorKeys();
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A, false);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D, false);
    this.keyZ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z, false);
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE, false);
    this.keyE = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E, false);
    this.keyX = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X, false);
    this.keyF = kb.addKey(Phaser.Input.Keyboard.KeyCodes.F, false);
  }

  private registerAnimations(scene: Phaser.Scene): void {
    if (scene.anims.exists('nima_idle')) return;

    scene.anims.create({
      key: 'nima_idle',
      frames: scene.anims.generateFrameNumbers('nima_sheet', { start: 0, end: 7 }),
      frameRate: 8,
      repeat: -1,
    });

    scene.anims.create({
      key: 'nima_run',
      frames: scene.anims.generateFrameNumbers('nima_sheet', { start: 8, end: 17 }),
      frameRate: 15,
      repeat: -1,
    });

    scene.anims.create({
      key: 'nima_jump_start',
      frames: scene.anims.generateFrameNumbers('nima_sheet', { start: 18, end: 20 }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: 'nima_rise',
      frames: scene.anims.generateFrameNumbers('nima_sheet', { start: 21, end: 23 }),
      frameRate: 10,
      repeat: -1,
    });

    scene.anims.create({
      key: 'nima_fall',
      frames: scene.anims.generateFrameNumbers('nima_sheet', { start: 24, end: 26 }),
      frameRate: 10,
      repeat: -1,
    });

    scene.anims.create({
      key: 'nima_land',
      frames: scene.anims.generateFrameNumbers('nima_sheet', { start: 27, end: 30 }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: 'nima_wake_cast',
      frames: scene.anims.generateFrameNumbers('nima_sheet', { start: 31, end: 36 }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: 'nima_respawn',
      frames: scene.anims.generateFrameNumbers('nima_sheet', { start: 37, end: 40 }),
      frameRate: 12,
      repeat: 0,
    });
  }

  public readIntent(): UnifiedInputState {
    return InputManager.sampleFrame(this.cursors, {
      keyA: this.keyA,
      keyD: this.keyD,
      keyZ: this.keyZ,
      keySpace: this.keySpace,
      keyE: this.keyE,
      keyX: this.keyX,
      keyF: this.keyF,
    });
  }

  public clearInputs(): void {
    InputManager.clearAll();
  }

  public triggerWakeAnimation(): void {
    this.wakeCastAnimTimer = 0.34;
    this.sprite.play('nima_wake_cast', true);
    this.animState = 'wake_cast';
  }

  public isRespawnProtected(): boolean {
    return this.respawnProtectionTimer > 0;
  }

  public isGrounded(): boolean {
    return Boolean(
      this.body.blocked.down || this.body.touching.down || this.ridingMovingSurface
    );
  }

  /**
   * Called at the start of GameplayScene.update() before Drifters update
   * so swept collision knows Nima's previous foot height.
   */
  public beginFrameCarryCheck(): void {
    this.carriedThisFrame = false;
  }

  /**
   * Called by kinematic moving platforms (`Drifter`) to carry Nima smoothly in X and Y
   * and lock her feet cleanly to the moving surface top without falling through.
   */
  public carryOnMovingSurface(deltaX: number, surfaceTopY: number): void {
    if (this.isJumping && this.body.velocity.y < -35) return;

    const targetSpriteX = this.sprite.x + deltaX;
    const targetSpriteY = Player.getSafeCenterYForPlatformTop(surfaceTopY, 0);

    this.sprite.setPosition(targetSpriteX, targetSpriteY);
    this.body.x = targetSpriteX - this.body.width * 0.5;
    this.body.y = surfaceTopY - this.body.height;
    this.body.prev.x = this.body.x;
    this.body.prev.y = this.body.y;
    if (this.body.velocity.y > 0) {
      this.body.velocity.y = 0;
    }
    this.body.blocked.down = true;
    this.ridingMovingSurface = true;
    this.carriedThisFrame = true;
  }

  /**
   * Called by environmental wind or water current zones to apply a readable, deterministic drift.
   */
  public setExternalEnvironmentalDrift(vx: number, vy: number): void {
    this.externalVelocityX = vx;
    this.externalVelocityY = vy;
  }

  /**
   * Reliable Physics Respawn:
   * - Synchronizes sprite & Arcade Physics body via `body.reset(safeX, safeY)`.
   * - Clears velocity, acceleration, jump state, coyote/buffer timers, and input history.
   * - Grants 0.90s respawn protection so hazards cannot re-trigger during respawn.
   */
  public respawnAt(safeX: number, safeY: number): void {
    this.syncHitbox();
    this.sprite.setPosition(safeX, safeY);
    this.body.reset(safeX, safeY);
    this.body.setVelocity(0, 0);
    this.body.setAcceleration(0, 0);
    this.body.setGravityY(activePhysicsTuning.gravity);
    this.prevBottom = this.body.bottom;

    this.coyoteTimer = activePhysicsTuning.coyoteTime;
    this.jumpBufferTimer = 0;
    this.isJumping = false;
    this.wasGrounded = true;
    this.ridingMovingSurface = false;
    this.carriedThisFrame = false;
    this.externalVelocityX = 0;
    this.externalVelocityY = 0;
    this.respawnProtectionTimer = 0.9;
    this.respawnAnimTimer = 0.35;
    this.landAnimTimer = 0;
    this.wakeCastAnimTimer = 0;

    this.clearInputs();
    this.sprite.play('nima_respawn', true);
    this.animState = 'respawn';
  }

  public update(
    dt: number,
    onWakeRequested: () => void,
    onLandDust: (x: number, y: number) => void,
    onInteractRequested?: () => void
  ): void {
    const tuning = activePhysicsTuning;
    this.ridingMovingSurface = this.carriedThisFrame;
    this.body.setGravityY(this.ridingMovingSurface ? 0 : tuning.gravity);
    this.body.setMaxVelocity(tuning.moveSpeed * 1.8, tuning.maxFallSpeed);

    if (this.respawnProtectionTimer > 0) {
      this.respawnProtectionTimer = Math.max(0, this.respawnProtectionTimer - dt);
    }

    const intent = this.readIntent();
    const grounded = Boolean(
      this.body.blocked.down || this.body.touching.down || this.ridingMovingSurface
    );

    if (grounded && !this.wasGrounded && this.body.velocity.y >= 0) {
      this.isJumping = false;
      this.landAnimTimer = 0.16;
      AudioManager.playLand(0.65);
      onLandDust(this.sprite.x, this.body.bottom);
    }

    if (grounded) {
      this.coyoteTimer = tuning.coyoteTime;
      if (this.body.velocity.y >= 0) {
        this.isJumping = false;
      }
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (intent.jumpJustPressed) {
      this.jumpBufferTimer = tuning.jumpBufferTime;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    let vx = this.body.velocity.x - this.externalVelocityX;
    const targetSpeed = intent.moveX * tuning.moveSpeed;

    if (intent.moveX !== 0) {
      this.facing = intent.moveX > 0 ? 1 : -1;
      this.sprite.setFlipX(this.facing < 0);

      const accel = grounded ? tuning.groundAcceleration : tuning.airAcceleration;
      const turnMultiplier =
        grounded && Math.sign(vx) !== 0 && Math.sign(vx) !== intent.moveX ? 1.35 : 1.0;
      const step = accel * turnMultiplier * dt;

      if (vx < targetSpeed) {
        vx = Math.min(targetSpeed, vx + step);
      } else if (vx > targetSpeed) {
        vx = Math.max(targetSpeed, vx - step);
      }

      if (grounded) {
        this.footstepTimer -= dt;
        if (this.footstepTimer <= 0) {
          AudioManager.playFootstep();
          this.footstepTimer = 0.28;
        }
      }
    } else {
      const decel = grounded ? tuning.groundDeceleration : tuning.airDeceleration;
      const step = decel * dt;
      if (vx > 0) {
        vx = Math.max(0, vx - step);
      } else if (vx < 0) {
        vx = Math.min(0, vx + step);
      }
      this.footstepTimer = 0.05;
    }

    this.body.setVelocityX(vx + this.externalVelocityX);

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && !this.isJumping) {
      this.body.setGravityY(tuning.gravity);
      this.body.setVelocityY(tuning.jumpVelocity);
      this.isJumping = true;
      this.ridingMovingSurface = false;
      this.carriedThisFrame = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      AudioManager.playJump();
      onLandDust(this.sprite.x, this.body.bottom);
    }

    if (intent.jumpJustReleased && this.body.velocity.y < 0) {
      this.body.setVelocityY(this.body.velocity.y * tuning.jumpCutMultiplier);
    }

    if (!grounded && this.externalVelocityY !== 0) {
      this.body.setVelocityY(
        Phaser.Math.Clamp(
          this.body.velocity.y + this.externalVelocityY * dt,
          tuning.jumpVelocity * 1.15,
          tuning.maxFallSpeed
        )
      );
    }

    if (this.body.velocity.y > tuning.maxFallSpeed) {
      this.body.setVelocityY(tuning.maxFallSpeed);
    }

    if (intent.wakeJustPressed) {
      onWakeRequested();
    }

    if (intent.interactJustPressed && onInteractRequested) {
      onInteractRequested();
    }

    this.updateAnimationState(dt, grounded, vx, this.body.velocity.y);
    this.wasGrounded = grounded;
    this.prevBottom = this.body.bottom;
    this.externalVelocityX = 0;
    this.externalVelocityY = 0;
  }

  private updateAnimationState(dt: number, grounded: boolean, vx: number, vy: number): void {
    if (this.respawnAnimTimer > 0) {
      this.respawnAnimTimer -= dt;
      return;
    }

    if (this.wakeCastAnimTimer > 0) {
      this.wakeCastAnimTimer -= dt;
      return;
    }

    if (this.landAnimTimer > 0) {
      this.landAnimTimer -= dt;
      if (Math.abs(vx) > 35 && grounded) {
        this.landAnimTimer = 0;
      } else {
        if (this.animState !== 'land') {
          this.animState = 'land';
          this.sprite.play('nima_land', true);
        }
        return;
      }
    }

    if (!grounded) {
      if (vy < -420) {
        if (this.animState !== 'jump_start') {
          this.animState = 'jump_start';
          this.sprite.play('nima_jump_start', true);
        }
      } else if (vy < 20) {
        if (this.animState !== 'rise') {
          this.animState = 'rise';
          this.sprite.play('nima_rise', true);
        }
      } else {
        if (this.animState !== 'fall') {
          this.animState = 'fall';
          this.sprite.play('nima_fall', true);
        }
      }
    } else {
      if (Math.abs(vx) > 18) {
        if (this.animState !== 'run') {
          this.animState = 'run';
          this.sprite.play('nima_run', true);
        }
      } else {
        if (this.animState !== 'idle') {
          this.animState = 'idle';
          this.sprite.play('nima_idle', true);
        }
      }
    }
  }
}
