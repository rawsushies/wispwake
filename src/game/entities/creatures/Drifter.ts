import Phaser from 'phaser';
import { WakeInteractable } from '../../systems/WakeSystem';
import { VEILGROVE_HEX } from '../../config/palette';
import { Player } from '../player/Player';

/**
 * Drifter Creature (Milestone 5 Single-Authority Kinematic Moving Platform — Section 04):
 *
 * Fixes the Milestone 4 dual-authority jitter/desynchronization bug:
 * - Uses `this.body.moves = false` and `this.body.setImmovable(true)` so Phaser Arcade Physics
 *   NEVER integrates `body.velocity` a second time on top of `sprite.setPosition`.
 * - Single movement authority: deterministic cosine ping-pong patrol (`nextX`, `nextY`) followed
 *   by `this.body.updateFromGameObject()`.
 * - Carries Nima smoothly in BOTH X (`deltaX`) and Y (`deltaY`) whenever she is standing on the
 *   Drifter's mossy bell top, keeping her grounded during both upward and downward movement while
 *   allowing natural walking and jumping off at any moment.
 */
export class Drifter implements WakeInteractable {
  public readonly id: string;
  public readonly sprite: Phaser.Physics.Arcade.Sprite;
  public readonly body: Phaser.Physics.Arcade.Body;
  private readonly scene: Phaser.Scene;

  public readonly startX: number;
  public readonly startY: number;
  public readonly endX: number;
  public readonly endY: number;
  public readonly cycleDuration: number;

  private elapsed = 0;
  private harmonizeTimer = 0;
  public deltaX = 0;
  public deltaY = 0;

  constructor(
    scene: Phaser.Scene,
    id: string,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    cycleDuration = 6.5
  ) {
    this.scene = scene;
    this.id = id;
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.cycleDuration = cycleDuration;

    this.registerAnimations(scene);

    this.sprite = scene.physics.add.sprite(startX, startY, 'drifter_sheet', 0);
    this.sprite.setDepth(16);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    // CRITICAL FIX: Disable Arcade Physics velocity integration so position is controlled
    // strictly by one authority (`Drifter.update`), eliminating double-movement and jitter.
    this.body.moves = false;

    // Walkable bell top collision box (116x22 aligned with the mossy crown rim)
    this.body.setSize(116, 22);
    this.body.setOffset((160 - 116) * 0.5, 22);
    // One-way platform from top so Nima can jump up through the underside cleanly
    this.body.checkCollision.down = false;
    this.body.checkCollision.left = false;
    this.body.checkCollision.right = false;

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
      key: 'drifter_harmonize',
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
    return false;
  }

  public setProximityHighlight(inRange: boolean): void {
    if (this.harmonizeTimer <= 0) {
      this.sprite.setTint(inRange ? VEILGROVE_HEX.wakeMint : 0xffffff);
    }
  }

  public onWakeActivated(): boolean {
    this.harmonizeTimer = 2.6;
    this.sprite.setTint(0xffffff);
    this.sprite.play('drifter_harmonize', true);
    return true;
  }

  public resetDeterministic(): void {
    this.elapsed = 0;
    this.harmonizeTimer = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.sprite.setPosition(this.startX, this.startY);
    this.body.setVelocity(0, 0);
    this.body.updateFromGameObject();
    this.sprite.play('drifter_glide', true);
  }

  /**
   * Checks whether Nima is currently standing on top of this Drifter's bell surface.
   */
  public isPlayerStandingOnTop(player: Player): boolean {
    if (player.isJumping && player.body.velocity.y < -40) {
      return false;
    }
    const pBody = player.body;
    const dBody = this.body;
    const horizOverlap = pBody.right > dBody.left + 4 && pBody.left < dBody.right - 4;
    const vertDist = Math.abs(pBody.bottom - dBody.top);
    return horizOverlap && vertDist <= 8 && pBody.velocity.y >= -15;
  }

  /**
   * Single-authority kinematic update + synchronized 2D passenger carrying.
   */
  public update(dt: number, player?: Player): void {
    const prevX = this.sprite.x;
    const prevY = this.sprite.y;

    const wasPassengerOnTop = player ? this.isPlayerStandingOnTop(player) : false;

    if (this.harmonizeTimer > 0) {
      this.harmonizeTimer -= dt;
      this.elapsed += dt * 0.38;
      if (this.harmonizeTimer <= 0) {
        this.sprite.play('drifter_glide', true);
      }
    } else {
      this.elapsed += dt;
    }

    const phase = (this.elapsed / this.cycleDuration) * Math.PI * 2;
    const t = (1 - Math.cos(phase)) * 0.5;
    const nextX = Phaser.Math.Linear(this.startX, this.endX, t);
    const nextY = Phaser.Math.Linear(this.startY, this.endY, t) + Math.sin(this.elapsed * 2.2) * 5;

    this.deltaX = nextX - prevX;
    this.deltaY = nextY - prevY;

    this.sprite.setPosition(nextX, nextY);
    this.body.updateFromGameObject();

    // If Nima was standing on top of this Drifter, carry her cleanly in both X and Y
    if (player && wasPassengerOnTop) {
      player.carryOnMovingSurface(this.deltaX, this.body.top);
    }
  }
}
