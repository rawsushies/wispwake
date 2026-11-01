import Phaser from 'phaser';
import { WakeInteractable } from '../systems/WakeSystem';
import { activePhysicsTuning } from '../config/physicsTuning';
import { AudioManager } from '../systems/AudioManager';
import { VEILGROVE_HEX } from '../config/palette';

export type BloomState = 'dormant' | 'awakening' | 'active' | 'closing';

/**
 * BloomPlatform (Section 7.3 of the Visual Bible):
 * - Dormant state: Closed flower bud with Wake Mint veins (no platform collision).
 * - Activated result: Opens into a stable platform (114x18 solid top surface).
 * - Persistence: Temporary (default ~5.2s, configurable in physicsTuning), refreshable if pulsed again while open.
 * - Includes a clear closing warning state during the final 1.35s so the player is never surprised.
 */
export class BloomPlatform implements WakeInteractable {
  public readonly id: string;
  public readonly sprite: Phaser.Physics.Arcade.Sprite;
  public readonly body: Phaser.Physics.Arcade.Body;
  private readonly scene: Phaser.Scene;

  public state: BloomState = 'dormant';
  public activeTimer = 0;

  constructor(scene: Phaser.Scene, id: string, x: number, y: number) {
    this.scene = scene;
    this.id = id;
    this.registerAnimations(scene);

    this.sprite = scene.physics.add.sprite(x, y, 'bloom_platform_sheet', 0);
    this.sprite.setDepth(15);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    // Walkable petal top surface: 112px wide, 18px tall aligned with unfurled petals (y offset 44 in 140x120 frame)
    this.body.setSize(112, 18);
    this.body.setOffset((140 - 112) * 0.5, 44);
    // One-way top platform so jumping up from underneath never blocks Nima's head
    this.body.checkCollision.down = false;
    this.body.checkCollision.left = false;
    this.body.checkCollision.right = false;

    this.setDormant();
  }

  private registerAnimations(scene: Phaser.Scene): void {
    if (scene.anims.exists('bloom_dormant')) return;

    scene.anims.create({
      key: 'bloom_dormant',
      frames: scene.anims.generateFrameNumbers('bloom_platform_sheet', { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1,
    });

    scene.anims.create({
      key: 'bloom_awakening',
      frames: scene.anims.generateFrameNumbers('bloom_platform_sheet', { start: 4, end: 7 }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: 'bloom_active',
      frames: scene.anims.generateFrameNumbers('bloom_platform_sheet', { start: 8, end: 11 }),
      frameRate: 6,
      repeat: -1,
    });

    scene.anims.create({
      key: 'bloom_closing',
      frames: scene.anims.generateFrameNumbers('bloom_platform_sheet', { start: 12, end: 15 }),
      frameRate: 10,
      repeat: -1,
    });
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  public isEligibleForWake(): boolean {
    return true; // Can be opened when dormant OR refreshed when active/closing
  }

  public isDormantForHint(): boolean {
    return this.state === 'dormant';
  }

  public setProximityHighlight(inRange: boolean): void {
    if (this.state === 'dormant') {
      this.sprite.setTint(inRange ? VEILGROVE_HEX.sapGold : 0xffffff);
    } else {
      this.sprite.setTint(0xffffff);
    }
  }

  public onWakeActivated(): boolean {
    AudioManager.playBloomOpen();
    this.activeTimer = activePhysicsTuning.bloomDuration;
    this.body.enable = true;
    this.sprite.setTint(0xffffff);

    if (this.state === 'dormant') {
      this.state = 'awakening';
      this.sprite.play('bloom_awakening', true);
      this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'bloom_awakening', () => {
        if (this.state === 'awakening') {
          this.state = 'active';
          this.sprite.play('bloom_active', true);
        }
      });
    } else {
      // Refresh already open bloom
      this.state = 'active';
      this.sprite.play('bloom_active', true);
    }

    // Short warm visual accent burst
    const burst = this.scene.add.image(this.sprite.x, this.sprite.y - 10, 'vfx_spore');
    burst.setDepth(21);
    burst.setScale(1.2);
    burst.setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: burst,
      scale: 2.8,
      alpha: 0,
      duration: 360,
      onComplete: () => burst.destroy(),
    });

    return true;
  }

  public setDormant(): void {
    this.state = 'dormant';
    this.activeTimer = 0;
    this.body.enable = false;
    this.sprite.setTint(0xffffff);
    this.sprite.play('bloom_dormant', true);
  }

  public update(dt: number): void {
    if (this.state === 'dormant') return;

    this.activeTimer -= dt;
    if (this.activeTimer <= 0) {
      this.setDormant();
      return;
    }

    if (this.activeTimer <= activePhysicsTuning.bloomWarningTime && this.state !== 'closing') {
      this.state = 'closing';
      this.sprite.play('bloom_closing', true);
    }
  }
}
