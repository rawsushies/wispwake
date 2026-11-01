import Phaser from 'phaser';
import { activePhysicsTuning } from '../config/physicsTuning';
import { Player } from '../entities/player/Player';
import { SaveManager } from './SaveManager';

/**
 * CameraController (Section 6.4 of the Visual Bible):
 * - Side-follow camera with a modest horizontal dead zone.
 * - Default player screen position: ~42% from left edge (leaving more view ahead than behind).
 * - Vertical framing: ~58% from top.
 * - Smooth, time-based exponential following (`1 - Math.exp(-k * dt)`).
 * - Small look-ahead while running, clamped so the camera never reveals a hazard too late.
 * - Screen shake rare, subtle, and disabled by default or toggleable in Settings.
 */
export class CameraController {
  private readonly scene: Phaser.Scene;
  private readonly camera: Phaser.Cameras.Scene2D.Camera;
  private readonly levelWidth: number;
  private readonly levelHeight: number;

  private currentLookAheadX = 0;
  private focusX = 0;
  private focusY = 0;

  constructor(scene: Phaser.Scene, levelWidth: number, levelHeight: number, initialX: number, initialY: number) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    this.levelWidth = levelWidth;
    this.levelHeight = levelHeight;

    this.camera.setBounds(0, 0, levelWidth, levelHeight);
    this.snapTo(initialX, initialY);
  }

  public snapTo(x: number, y: number): void {
    const tuning = activePhysicsTuning;
    this.focusX = x;
    this.focusY = y;

    const targetScrollX = Phaser.Math.Clamp(
      x - tuning.referenceWidth * tuning.cameraTargetScreenX,
      0,
      Math.max(0, this.levelWidth - tuning.referenceWidth)
    );
    const targetScrollY = Phaser.Math.Clamp(
      y - tuning.referenceHeight * tuning.cameraTargetScreenY,
      0,
      Math.max(0, this.levelHeight - tuning.referenceHeight)
    );

    this.camera.setScroll(targetScrollX, targetScrollY);
  }

  public update(dt: number, player: Player): void {
    const tuning = activePhysicsTuning;
    const px = player.sprite.x;
    const py = player.sprite.y;
    const vx = player.body.velocity.x;

    // Smooth look-ahead offset when Nima is actively running
    let desiredLookAhead = 0;
    if (Math.abs(vx) > 40) {
      desiredLookAhead = Math.sign(vx) * tuning.cameraLookAheadX;
    }
    const lookLerp = 1 - Math.exp(-4.2 * dt);
    this.currentLookAheadX = Phaser.Math.Linear(this.currentLookAheadX, desiredLookAhead, lookLerp);

    // Apply horizontal & vertical deadzones around current focus point
    const dx = px + this.currentLookAheadX - this.focusX;
    if (Math.abs(dx) > tuning.cameraDeadzoneX) {
      this.focusX += dx - Math.sign(dx) * tuning.cameraDeadzoneX;
    }

    const dy = py - this.focusY;
    const verticalDeadzone = player.wasGrounded ? tuning.cameraDeadzoneY * 0.5 : tuning.cameraDeadzoneY;
    if (Math.abs(dy) > verticalDeadzone) {
      this.focusY += dy - Math.sign(dy) * verticalDeadzone;
    }

    // Compute desired camera scroll so Nima sits at ~42% from left, ~58% from top
    // When facing left and moving left, shift screen anchor slightly toward 52% so route ahead to the left is visible
    const screenAnchorX = player.facing > 0 ? tuning.cameraTargetScreenX : 1 - tuning.cameraTargetScreenX;
    const desiredScrollX = Phaser.Math.Clamp(
      this.focusX - tuning.referenceWidth * screenAnchorX,
      0,
      Math.max(0, this.levelWidth - tuning.referenceWidth)
    );

    const desiredScrollY = Phaser.Math.Clamp(
      this.focusY - tuning.referenceHeight * tuning.cameraTargetScreenY,
      0,
      Math.max(0, this.levelHeight - tuning.referenceHeight)
    );

    const damping = 1 - Math.exp(-tuning.cameraLerpSpeed * dt);
    const nextScrollX = Phaser.Math.Linear(this.camera.scrollX, desiredScrollX, damping);
    const nextScrollY = Phaser.Math.Linear(this.camera.scrollY, desiredScrollY, damping);

    this.camera.setScroll(nextScrollX, nextScrollY);
  }

  public triggerSubtleShake(durationMs = 140, intensity = 0.0025): void {
    if (!SaveManager.get().settings.screenShake) return;
    this.camera.shake(durationMs, intensity);
  }
}
