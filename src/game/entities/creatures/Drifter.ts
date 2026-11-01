import Phaser from 'phaser';
import { VEILGROVE_HEX } from '../../config/palette';
import { Player } from '../player/Player';
import { AudioManager } from '../../systems/AudioManager';
import { WakeInteractable } from '../../systems/WakeSystem';

/**
 * Gentle Canopy Drifter (Milestone 6 Priority 2 Update — Robust One-Way Collision & Carrying):
 * - Bioluminescent floating forest organism that glides smoothly along a deterministic path.
 * - Top surface acts as a reliable one-way walkable mossy bell (`116x22`, offset `(22, 22)` inside `160x104` sprite).
 * - Fixes the bug where Nima could fall through the Drifter:
 *   1. Explicitly syncs `body.prev` and `body.position` every frame so Phaser's `separateY`
 *      always sees accurate frame-to-frame platform delta.
 *   2. Performs a swept vertical landing and continuous top-surface carrying check so Nima
 *      can land on the Drifter from any jump/fall height, remain grounded for 10+ seconds
 *      across horizontal/vertical motion and reversals, walk left/right across the bell,
 *      jump off cleanly, and jump upward through the underside without snagging.
 */
export class Drifter implements WakeInteractable {
  public readonly id: string;
  public readonly sprite: Phaser.Physics.Arcade.Sprite;
  public readonly body: Phaser.Physics.Arcade.Body;
  private readonly scene: Phaser.Scene;

  private readonly startX: number;
  private readonly startY: number;
  private readonly endX: number;
  private readonly endY: number;
  private readonly cycleDuration: number;

  private elapsed = 0;
  private resonateTimer = 0;
  private bracketGraphics: Phaser.GameObjects.Graphics;

  public prevX: number;
  public prevY: number;
  public prevSurfaceTopY: number;
  public deltaX = 0;
  public deltaY = 0;

  constructor(
    scene: Phaser.Scene,
    id: string,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    cycleDuration = 6.0
  ) {
    this.scene = scene;
    this.id = id;
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.cycleDuration = cycleDuration;
    this.prevX = startX;
    this.prevY = startY;

    this.registerAnimations(scene);

    this.sprite = scene.physics.add.sprite(startX, startY, 'drifter_sheet', 0);
    this.sprite.setDepth(14);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.moves = false;

    // Top mossy bell surface: 116px wide, 22px tall, top at sprite.y - 30
    this.body.setSize(116, 22);
    this.body.setOffset(22, 22);
    this.body.checkCollision.up = true;
    this.body.checkCollision.down = false;
    this.body.checkCollision.left = false;
    this.body.checkCollision.right = false;
    this.body.updateFromGameObject();
    this.body.prev.copy(this.body.position);
    this.prevSurfaceTopY = this.body.top;

    this.bracketGraphics = scene.add.graphics();
    this.bracketGraphics.setDepth(24);

    this.sprite.play('drifter_glide');
  }

  private registerAnimations(scene: Phaser.Scene): void {
    if (scene.anims.exists('drifter_glide')) return;

    scene.anims.create({
      key: 'drifter_glide',
      frames: scene.anims.generateFrameNumbers('drifter_sheet', { start: 0, end: 7 }),
      frameRate: 8,
      repeat: -1,
    });

    scene.anims.create({
      key: 'drifter_resonate',
      frames: scene.anims.generateFrameNumbers('drifter_sheet', { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1,
    });
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  public isEligibleForWake(): boolean {
    return true;
  }

  public isDormantForHint(): boolean {
    return this.resonateTimer <= 0;
  }

  public setProximityHighlight(inRange: boolean, highContrast = false): void {
    this.bracketGraphics.clear();
    if (!inRange) {
      this.sprite.clearTint();
      return;
    }

    this.sprite.setTint(0xd8fff0);
    if (highContrast) {
      this.bracketGraphics.lineStyle(2, VEILGROVE_HEX.sapGold, 0.9);
      this.bracketGraphics.strokeRoundedRect(this.sprite.x - 62, this.sprite.y - 34, 124, 34, 8);
    }
  }

  public onWakeActivated(): boolean {
    this.resonateTimer = 4.5;
    this.sprite.play('drifter_resonate', true);
    AudioManager.playBloomOpen();
    return true;
  }

  public resetDeterministic(): void {
    this.elapsed = 0;
    this.resonateTimer = 0;
    this.prevX = this.startX;
    this.prevY = this.startY;
    this.deltaX = 0;
    this.deltaY = 0;
    this.sprite.setPosition(this.startX, this.startY);
    this.body.updateFromGameObject();
    this.body.prev.copy(this.body.position);
    this.prevSurfaceTopY = this.body.top;
    this.sprite.play('drifter_glide', true);
  }

  public update(dt: number, player?: Player): void {
    const speedMultiplier = this.resonateTimer > 0 ? 0.55 : 1.0;

    if (this.resonateTimer > 0) {
      this.resonateTimer -= dt;
      if (this.resonateTimer <= 0) {
        this.sprite.play('drifter_glide', true);
      }
    }

    this.prevX = this.sprite.x;
    this.prevY = this.sprite.y;
    this.prevSurfaceTopY = this.body.top;

    this.elapsed += dt * speedMultiplier;
    const t = (1 - Math.cos((this.elapsed / this.cycleDuration) * Math.PI * 2)) * 0.5;

    const nextX = Phaser.Math.Linear(this.startX, this.endX, t);
    const nextY =
      Phaser.Math.Linear(this.startY, this.endY, t) + Math.sin(this.elapsed * 2.2) * 3.5;

    this.deltaX = nextX - this.prevX;
    this.deltaY = nextY - this.prevY;

    // Preserve previous body coordinates so Phaser Arcade Physics separateY knows exact delta
    const oldBodyX = this.body.x;
    const oldBodyY = this.body.y;

    this.sprite.setPosition(nextX, nextY);
    this.body.updateFromGameObject();
    this.body.prev.set(oldBodyX, oldBodyY);
    this.body.prevFrame.set(oldBodyX, oldBodyY);

    // Swept one-way landing & continuous passenger carrying
    if (player && !player.isRespawnProtected()) {
      const pBody = player.body;
      const surfaceLeft = this.body.left;
      const surfaceRight = this.body.right;
      const surfaceTopY = this.body.top;

      const horizontalOverlap =
        pBody.right > surfaceLeft + 3 && pBody.left < surfaceRight - 3;

      if (horizontalOverlap && pBody.velocity.y >= -25) {
        const footDeltaFromTop = pBody.bottom - surfaceTopY;
        const prevFootDeltaFromPrevTop = player.prevBottom - this.prevSurfaceTopY;

        // Catch both:
        // 1) Nima already standing/riding on the top surface (within [-8, +16] px of surfaceTopY)
        // 2) Nima falling across the top surface between frames (swept check)
        const isAlreadyRiding =
          player.ridingMovingSurface && Math.abs(footDeltaFromTop) <= 18;
        const isStandingClose =
          footDeltaFromTop >= -8 && footDeltaFromTop <= 16;
        const crossedTopWhileFalling =
          prevFootDeltaFromPrevTop <= 14 &&
          footDeltaFromTop >= -6 &&
          footDeltaFromTop <= 28;

        if (isAlreadyRiding || isStandingClose || crossedTopWhileFalling) {
          player.carryOnMovingSurface(this.deltaX, surfaceTopY);
        }
      }
    }
  }
}
