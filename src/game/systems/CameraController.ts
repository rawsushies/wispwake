import Phaser from 'phaser';
import { activePhysicsTuning } from '../config/physicsTuning';
import { SaveManager } from './SaveManager';
import { Player } from '../entities/player/Player';

/**
 * CameraController — Responsive Landscape & Native Portrait Camera System.
 *
 * Adapts smoothly to both landscape (`960×540`) and native portrait (`360×640` .. `480×640`)
 * logical viewports without ever making Nima or platforms tiny:
 * - In landscape: positions Nima around 42% from left, 58% from top with smooth forward look-ahead.
 * - In portrait: uses a narrower horizontal window while keeping generous vertical visibility
 *   (`anchorY = 0.54` so platforms stay well above the bottom thumb controls) and subtle forward
 *   camera anticipation (`±56px` in portrait, `±68px` in landscape) in the direction of travel.
 * - Supports live orientation transitions (`onViewportResized`) without losing focus or revealing
 *   out-of-bounds areas.
 */
export class CameraController {
  private readonly scene: Phaser.Scene;
  private readonly camera: Phaser.Cameras.Scene2D.Camera;
  private levelWidth: number;
  private levelHeight: number;

  private lookAheadX = 0;
  private currentScrollX = 0;
  private currentScrollY = 0;

  constructor(
    scene: Phaser.Scene,
    levelWidth: number,
    levelHeight: number,
    initialX: number,
    initialY: number
  ) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    this.levelWidth = levelWidth;
    this.levelHeight = levelHeight;

    this.camera.setBounds(0, 0, levelWidth, levelHeight);
    this.snapTo(initialX, initialY);
  }

  public onViewportResized(targetX: number, targetY: number): void {
    this.camera.setBounds(0, 0, this.levelWidth, this.levelHeight);
    this.snapTo(targetX, targetY);
  }

  public snapTo(targetX: number, targetY: number): void {
    const viewW = this.camera.width || activePhysicsTuning.referenceWidth;
    const viewH = this.camera.height || activePhysicsTuning.referenceHeight;
    const isPortrait = viewH > viewW;

    const anchorX = isPortrait ? 0.44 : activePhysicsTuning.cameraTargetScreenX;
    const anchorY = isPortrait ? 0.54 : activePhysicsTuning.cameraTargetScreenY;

    this.currentScrollX = Phaser.Math.Clamp(
      targetX - viewW * anchorX,
      0,
      Math.max(0, this.levelWidth - viewW)
    );
    this.currentScrollY = Phaser.Math.Clamp(
      targetY - viewH * anchorY,
      0,
      Math.max(0, this.levelHeight - viewH)
    );
    this.camera.setScroll(this.currentScrollX, this.currentScrollY);
  }

  public update(dt: number, player: Player): void {
    const tuning = activePhysicsTuning;
    const viewW = this.camera.width || tuning.referenceWidth;
    const viewH = this.camera.height || tuning.referenceHeight;
    const isPortrait = viewH > viewW;

    const vx = player.body.velocity.x;
    const vy = player.body.velocity.y;
    const grounded = player.isGrounded();

    // Responsive look-ahead scaled appropriately for portrait vs landscape width
    const maxLookAhead = isPortrait
      ? Math.min(58, viewW * 0.145)
      : tuning.cameraLookAheadX;

    let desiredLookAhead = 0;
    if (Math.abs(vx) > 22) {
      desiredLookAhead = Math.sign(vx) * maxLookAhead;
    } else if (isPortrait) {
      desiredLookAhead = player.facing * (maxLookAhead * 0.35);
    }

    const lookLerp = 1 - Math.exp(-3.4 * dt);
    this.lookAheadX = Phaser.Math.Linear(this.lookAheadX, desiredLookAhead, lookLerp);

    const anchorX = isPortrait ? 0.46 : tuning.cameraTargetScreenX;
    const anchorY = isPortrait ? 0.54 : tuning.cameraTargetScreenY;

    const desiredScrollX = Phaser.Math.Clamp(
      player.sprite.x + this.lookAheadX - viewW * anchorX,
      0,
      Math.max(0, this.levelWidth - viewW)
    );

    const verticalBias = !grounded && vy > 120 ? 34 : !grounded && vy < -180 ? -18 : 0;
    const desiredScrollY = Phaser.Math.Clamp(
      player.sprite.y + verticalBias - viewH * anchorY,
      0,
      Math.max(0, this.levelHeight - viewH)
    );

    const xLerp = 1 - Math.exp(-tuning.cameraLerpSpeed * dt);
    const yLerpSpeed = grounded ? tuning.cameraLerpSpeed * 0.85 : tuning.cameraLerpSpeed * 1.1;
    const yLerp = 1 - Math.exp(-yLerpSpeed * dt);

    this.currentScrollX = Phaser.Math.Linear(this.currentScrollX, desiredScrollX, xLerp);
    this.currentScrollY = Phaser.Math.Linear(this.currentScrollY, desiredScrollY, yLerp);

    this.camera.setScroll(this.currentScrollX, this.currentScrollY);
  }

  public triggerSubtleShake(durationMs = 120, intensity = 0.002): void {
    const settings = SaveManager.get().settings;
    if (!settings.screenShake || settings.reducedParticles) {
      return;
    }
    this.camera.shake(durationMs, intensity);
  }
}
