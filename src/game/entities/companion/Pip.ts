import Phaser from 'phaser';
import { Player } from '../player/Player';

/**
 * Pip Companion Entity (Section 4.2 of the Visual Bible):
 * - Smooth follow with a spring-like offset behind/above Nima.
 * - Idle hover oscillation, brief curiosity turns toward nearby dormant Wake objects,
 *   and a clear radiant response when Wake is used.
 * - Never becomes an invasive navigation arrow that removes exploration.
 */
export class Pip {
  public readonly sprite: Phaser.GameObjects.Sprite;
  private readonly scene: Phaser.Scene;

  private vx = 0;
  private vy = 0;
  private hoverPhase = 0;
  private wakeReactTimer = 0;
  private curiosityTarget: { x: number; y: number } | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.registerAnimations(scene);

    this.sprite = scene.add.sprite(x, y, 'pip_sheet', 0);
    this.sprite.setDepth(22);
    this.sprite.play('pip_hover');
  }

  private registerAnimations(scene: Phaser.Scene): void {
    if (scene.anims.exists('pip_hover')) return;

    scene.anims.create({
      key: 'pip_hover',
      frames: scene.anims.generateFrameNumbers('pip_sheet', { start: 0, end: 5 }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: 'pip_follow',
      frames: scene.anims.generateFrameNumbers('pip_sheet', { start: 6, end: 11 }),
      frameRate: 15,
      repeat: -1,
    });

    scene.anims.create({
      key: 'pip_curious',
      frames: scene.anims.generateFrameNumbers('pip_sheet', { start: 12, end: 15 }),
      frameRate: 10,
      repeat: -1,
    });

    scene.anims.create({
      key: 'pip_wake_react',
      frames: scene.anims.generateFrameNumbers('pip_sheet', { start: 16, end: 21 }),
      frameRate: 16,
      repeat: 0,
    });
  }

  public setCuriosityHint(target: { x: number; y: number } | null): void {
    this.curiosityTarget = target;
  }

  public triggerWakeReaction(): void {
    this.wakeReactTimer = 0.45;
    this.sprite.play('pip_wake_react', true);
  }

  public snapToPlayer(player: Player): void {
    this.sprite.setPosition(player.sprite.x - player.facing * 32, player.sprite.y - 46);
    this.vx = 0;
    this.vy = 0;
  }

  public update(dt: number, player: Player): void {
    this.hoverPhase += dt * 3.4;

    // Default spring anchor: slightly behind and above Nima's shoulder
    let targetX = player.sprite.x - player.facing * 34;
    let targetY = player.sprite.y - 46 + Math.sin(this.hoverPhase) * 6;

    // Subtle curiosity drift toward a nearby dormant object (max 28px nudge so Pip stays near Nima)
    if (this.curiosityTarget) {
      const dx = this.curiosityTarget.x - player.sprite.x;
      const dy = this.curiosityTarget.y - player.sprite.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1 && dist < 260) {
        targetX = player.sprite.x + (dx / dist) * 32;
        targetY = player.sprite.y - 42 + (dy / dist) * 16 + Math.sin(this.hoverPhase * 1.4) * 5;
      }
    }

    // Damped spring physics
    const stiffness = 18.0;
    const damping = 0.84;
    const ax = (targetX - this.sprite.x) * stiffness;
    const ay = (targetY - this.sprite.y) * stiffness;

    this.vx = (this.vx + ax * dt) * Math.pow(damping, dt * 60);
    this.vy = (this.vy + ay * dt) * Math.pow(damping, dt * 60);

    this.sprite.x += this.vx * dt;
    this.sprite.y += this.vy * dt;

    // Orientation & animation selection
    if (Math.abs(this.vx) > 15) {
      this.sprite.setFlipX(this.vx < 0);
    } else if (this.curiosityTarget) {
      this.sprite.setFlipX(this.curiosityTarget.x < this.sprite.x);
    } else {
      this.sprite.setFlipX(player.facing < 0);
    }

    if (this.wakeReactTimer > 0) {
      this.wakeReactTimer -= dt;
      return;
    }

    const speed = Math.hypot(this.vx, this.vy);
    if (this.curiosityTarget && speed < 60) {
      if (this.sprite.anims.currentAnim?.key !== 'pip_curious') {
        this.sprite.play('pip_curious', true);
      }
    } else if (speed > 55) {
      if (this.sprite.anims.currentAnim?.key !== 'pip_follow') {
        this.sprite.play('pip_follow', true);
      }
    } else {
      if (this.sprite.anims.currentAnim?.key !== 'pip_hover') {
        this.sprite.play('pip_hover', true);
      }
    }
  }
}
