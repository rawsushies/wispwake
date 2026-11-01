import Phaser from 'phaser';
import { WakeInteractable } from '../systems/WakeSystem';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';
import { VEILGROVE_HEX } from '../config/palette';

/**
 * Checkpoint (Section 8.3 of the Visual Bible):
 * - Placed after the player has learned the basic Wake interaction and before the most demanding traversal sequence.
 * - Visually obvious Resonance Cairn activated through proximity OR a Wake pulse.
 * - Respawn restores moving and temporary objects to a fair, deterministic state.
 */
export class Checkpoint implements WakeInteractable {
  public readonly id: string;
  public readonly sprite: Phaser.GameObjects.Sprite;
  private readonly scene: Phaser.Scene;
  public readonly spawnX: number;
  public readonly spawnY: number;

  public isActivated = false;

  constructor(scene: Phaser.Scene, id: string, x: number, y: number, initiallyActivated = false) {
    this.scene = scene;
    this.id = id;
    this.spawnX = x;
    this.spawnY = y - 16;

    this.registerAnimations(scene);

    this.sprite = scene.add.sprite(x, y, 'checkpoint_cairn_sheet', 0);
    this.sprite.setOrigin(0.5, 0.9);
    this.sprite.setDepth(14);

    if (initiallyActivated) {
      this.isActivated = true;
      this.sprite.play('checkpoint_active');
    } else {
      this.sprite.play('checkpoint_dormant');
    }
  }

  private registerAnimations(scene: Phaser.Scene): void {
    if (scene.anims.exists('checkpoint_dormant')) return;

    scene.anims.create({
      key: 'checkpoint_dormant',
      frames: scene.anims.generateFrameNumbers('checkpoint_cairn_sheet', { start: 0, end: 1 }),
      frameRate: 3,
      repeat: -1,
    });

    scene.anims.create({
      key: 'checkpoint_activating',
      frames: scene.anims.generateFrameNumbers('checkpoint_cairn_sheet', { start: 2, end: 5 }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: 'checkpoint_active',
      frames: scene.anims.generateFrameNumbers('checkpoint_cairn_sheet', { start: 6, end: 9 }),
      frameRate: 6,
      repeat: -1,
    });
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y - 48 };
  }

  public isEligibleForWake(): boolean {
    return !this.isActivated;
  }

  public isDormantForHint(): boolean {
    return !this.isActivated;
  }

  public setProximityHighlight(inRange: boolean): void {
    if (!this.isActivated) {
      this.sprite.setTint(inRange ? VEILGROVE_HEX.sapGold : 0xffffff);
    } else {
      this.sprite.setTint(0xffffff);
    }
  }

  public onWakeActivated(): boolean {
    return this.activate();
  }

  public checkProximityActivation(playerX: number, playerY: number): boolean {
    if (this.isActivated) return false;
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.sprite.x, this.sprite.y - 36);
    if (dist <= 68) {
      return this.activate();
    }
    return false;
  }

  public activate(): boolean {
    if (this.isActivated) return false;
    this.isActivated = true;
    this.sprite.setTint(0xffffff);
    AudioManager.playCheckpoint();
    SaveManager.recordCheckpoint(this.id, this.spawnX, this.spawnY);

    this.sprite.play('checkpoint_activating', true);
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'checkpoint_activating', () => {
      this.sprite.play('checkpoint_active', true);
    });

    // Warm golden spore shower
    for (let i = 0; i < 8; i++) {
      const mote = this.scene.add.image(
        this.sprite.x + (Math.random() - 0.5) * 32,
        this.sprite.y - 45,
        'vfx_spore'
      );
      mote.setDepth(21);
      mote.setScale(0.55);
      mote.setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: mote,
        y: mote.y - 48 - Math.random() * 24,
        alpha: 0,
        duration: 750 + Math.random() * 300,
        onComplete: () => mote.destroy(),
      });
    }

    return true;
  }
}
