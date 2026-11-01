import Phaser from 'phaser';
import { WakeInteractable } from '../systems/WakeSystem';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';
import { VEILGROVE_HEX } from '../config/palette';
import { CampaignChapterId } from '../config/gameConfig';

export class AncientBloom implements WakeInteractable {
  public readonly id: string;
  public readonly chapterId: CampaignChapterId | 'wake_trial';
  public readonly sprite: Phaser.GameObjects.Sprite;
  private readonly scene: Phaser.Scene;
  private readonly onRestoredCallback: () => void;

  public isRestored = false;

  constructor(
    scene: Phaser.Scene,
    chapterId: CampaignChapterId | 'wake_trial',
    id: string,
    x: number,
    y: number,
    initiallyRestored: boolean,
    onRestoredCallback: () => void
  ) {
    this.scene = scene;
    this.chapterId = chapterId;
    this.id = id;
    this.onRestoredCallback = onRestoredCallback;

    this.registerAnimations(scene);

    this.sprite = scene.add.sprite(x, y, 'ancient_bloom_sheet', 0);
    this.sprite.setOrigin(0.5, 0.85);
    this.sprite.setDepth(14);

    if (initiallyRestored) {
      this.isRestored = true;
      this.sprite.play('ancient_radiant');
    } else {
      this.sprite.play('ancient_sleeping');
    }
  }

  private registerAnimations(scene: Phaser.Scene): void {
    if (scene.anims.exists('ancient_sleeping')) return;

    scene.anims.create({
      key: 'ancient_sleeping',
      frames: scene.anims.generateFrameNumbers('ancient_bloom_sheet', { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    });

    scene.anims.create({
      key: 'ancient_restoring',
      frames: scene.anims.generateFrameNumbers('ancient_bloom_sheet', { start: 4, end: 7 }),
      frameRate: 8,
      repeat: 0,
    });

    scene.anims.create({
      key: 'ancient_radiant',
      frames: scene.anims.generateFrameNumbers('ancient_bloom_sheet', { start: 8, end: 11 }),
      frameRate: 6,
      repeat: -1,
    });
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y - 54 };
  }

  public isEligibleForWake(): boolean {
    return !this.isRestored;
  }

  public isDormantForHint(): boolean {
    return !this.isRestored;
  }

  public setProximityHighlight(inRange: boolean): void {
    if (!this.isRestored) {
      this.sprite.setTint(inRange ? VEILGROVE_HEX.sapGold : 0xffffff);
    } else {
      this.sprite.setTint(0xffffff);
    }
  }

  public onWakeActivated(): boolean {
    if (this.isRestored) return false;
    this.isRestored = true;
    this.sprite.setTint(0xffffff);
    AudioManager.playGrandRestoration();

    if (this.chapterId !== 'wake_trial') {
      SaveManager.markChapterCompleted(this.chapterId);
    }

    this.sprite.play('ancient_restoring', true);
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'ancient_restoring', () => {
      this.sprite.play('ancient_radiant', true);
    });

    const wave = this.scene.add.image(this.sprite.x, this.sprite.y - 68, 'vfx_wake_ring');
    wave.setDepth(25);
    wave.setScale(0.2);
    wave.setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: wave,
      scale: 4.5,
      alpha: 0,
      duration: 1600,
      ease: 'Cubic.Out',
      onComplete: () => wave.destroy(),
    });

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const dist = 60 + Math.random() * 140;
      const mote = this.scene.add.image(this.sprite.x, this.sprite.y - 68, 'vfx_spore');
      mote.setDepth(24);
      mote.setScale(0.6 + Math.random() * 0.6);
      mote.setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: mote,
        x: this.sprite.x + Math.cos(angle) * dist,
        y: this.sprite.y - 68 + Math.sin(angle) * dist - 40,
        alpha: 0,
        duration: 1200 + Math.random() * 600,
        ease: 'Sine.Out',
        onComplete: () => mote.destroy(),
      });
    }

    this.onRestoredCallback();
    return true;
  }
}
