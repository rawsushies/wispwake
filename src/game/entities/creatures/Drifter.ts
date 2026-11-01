import Phaser from 'phaser';
import { WakeInteractable } from '../../systems/WakeSystem';
import { VEILGROVE_HEX } from '../../config/palette';

/**
 * Drifter Creature (Section 4.3 & Beat 5: Floating translucent organism acting as a predictable moving traversal aid).
 * - Glides smoothly along a deterministic patrol path across canopy gaps.
 * - Carries Nima smoothly when she stands on its mossy bell top.
 * - Responds to Wake with a warm golden resonance and brief gentle stabilization.
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

    // Walkable bell top collision box (116x22 aligned with the mossy crown rim)
    this.body.setSize(116, 22);
    this.body.setOffset((160 - 116) * 0.5, 22);
    // One-way platform feel from top so Nima can also jump up onto it cleanly
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
    this.harmonizeTimer = 2.4;
    this.sprite.setTint(0xffffff);
    this.sprite.play('drifter_harmonize', true);
    return true;
  }

  public resetDeterministic(): void {
    this.elapsed = 0;
    this.harmonizeTimer = 0;
    this.sprite.setPosition(this.startX, this.startY);
    this.body.updateFromGameObject();
    this.sprite.play('drifter_glide', true);
  }

  public update(dt: number): void {
    const prevX = this.sprite.x;
    const prevY = this.sprite.y;

    if (this.harmonizeTimer > 0) {
      this.harmonizeTimer -= dt;
      // Gentle slow-down while resonating with Nima's Wake
      this.elapsed += dt * 0.35;
      if (this.harmonizeTimer <= 0) {
        this.sprite.play('drifter_glide', true);
      }
    } else {
      this.elapsed += dt;
    }

    // Smooth cosine ping-pong patrol between start and end
    const phase = (this.elapsed / this.cycleDuration) * Math.PI * 2;
    const t = (1 - Math.cos(phase)) * 0.5;
    const nextX = Phaser.Math.Linear(this.startX, this.endX, t);
    const nextY = Phaser.Math.Linear(this.startY, this.endY, t) + Math.sin(this.elapsed * 2.2) * 5;

    this.deltaX = nextX - prevX;
    this.deltaY = nextY - prevY;

    this.sprite.setPosition(nextX, nextY);
    this.body.setVelocity(this.deltaX / Math.max(dt, 0.001), this.deltaY / Math.max(dt, 0.001));
  }
}
