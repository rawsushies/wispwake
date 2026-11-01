import Phaser from 'phaser';
import { WakeInteractable } from '../systems/WakeSystem';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';
import { VEILGROVE_HEX } from '../config/palette';

export type RootBridgeState = 'recessed' | 'extending' | 'extended';

/**
 * RootBridge (Section 7.3 of the Visual Bible):
 * - Dormant state: Recessed, inactive coiled roots on the chasm edge.
 * - Activated result: Extends into a solid 236px walkable route across the gap.
 * - Persistence: Permanent once activated in the level (and persisted via SaveManager).
 */
export class RootBridge implements WakeInteractable {
  public readonly id: string;
  public readonly sprite: Phaser.Physics.Arcade.Sprite;
  public readonly body: Phaser.Physics.Arcade.Body;
  private readonly scene: Phaser.Scene;

  public state: RootBridgeState = 'recessed';

  constructor(scene: Phaser.Scene, id: string, x: number, y: number, initiallyExtended = false) {
    this.scene = scene;
    this.id = id;
    this.registerAnimations(scene);

    // Anchor sprite at left root base (origin 0, 0.5) so it extends rightward across the gap
    this.sprite = scene.physics.add.sprite(x, y, 'root_bridge_sheet', 0);
    this.sprite.setOrigin(0, 0.5);
    this.sprite.setDepth(15);

    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    // Full walkable bridge dimensions: 236px wide, 26px tall aligned with mossy top
    this.body.setSize(236, 26);
    this.body.setOffset(12, 26);

    if (initiallyExtended) {
      this.setExtendedImmediately();
    } else {
      this.state = 'recessed';
      this.body.enable = false;
      this.sprite.play('root_recessed');
    }
  }

  private registerAnimations(scene: Phaser.Scene): void {
    if (scene.anims.exists('root_recessed')) return;

    scene.anims.create({
      key: 'root_recessed',
      frames: scene.anims.generateFrameNumbers('root_bridge_sheet', { start: 0, end: 1 }),
      frameRate: 3,
      repeat: -1,
    });

    scene.anims.create({
      key: 'root_extending',
      frames: scene.anims.generateFrameNumbers('root_bridge_sheet', { start: 2, end: 7 }),
      frameRate: 14,
      repeat: 0,
    });

    scene.anims.create({
      key: 'root_extended',
      frames: scene.anims.generateFrameNumbers('root_bridge_sheet', { start: 8, end: 9 }),
      frameRate: 4,
      repeat: -1,
    });
  }

  public getPosition(): { x: number; y: number } {
    // Wake target point is the coiled root base on the left ledge
    return { x: this.sprite.x + 28, y: this.sprite.y };
  }

  public isEligibleForWake(): boolean {
    return this.state === 'recessed';
  }

  public isDormantForHint(): boolean {
    return this.state === 'recessed';
  }

  public setProximityHighlight(inRange: boolean): void {
    if (this.state === 'recessed') {
      this.sprite.setTint(inRange ? VEILGROVE_HEX.sapGold : 0xffffff);
    } else {
      this.sprite.setTint(0xffffff);
    }
  }

  public onWakeActivated(): boolean {
    if (this.state !== 'recessed') return false;

    this.state = 'extending';
    this.sprite.setTint(0xffffff);
    this.body.enable = true;
    AudioManager.playRootExtend();
    SaveManager.recordRootBridge(this.id);

    this.sprite.play('root_extending', true);
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'root_extending', () => {
      this.state = 'extended';
      this.sprite.play('root_extended', true);
    });

    return true;
  }

  public setExtendedImmediately(): void {
    this.state = 'extended';
    this.body.enable = true;
    this.sprite.setTint(0xffffff);
    this.sprite.play('root_extended', true);
  }
}
