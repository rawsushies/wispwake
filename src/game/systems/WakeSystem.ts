import Phaser from 'phaser';
import { activePhysicsTuning } from '../config/physicsTuning';
import { VEILGROVE_HEX } from '../config/palette';
import { AudioManager } from './AudioManager';
import { SaveManager } from './SaveManager';

export interface WakeInteractable {
  readonly id: string;
  getPosition(): { x: number; y: number };
  isEligibleForWake(): boolean;
  isDormantForHint(): boolean;
  setProximityHighlight(inRange: boolean): void;
  onWakeActivated(): boolean;
}

/**
 * The Wake System (Section 7 of the Visual Bible):
 * - Activated by single press (E or X), grounded or airborne.
 * - Affects registered Wake-reactive objects inside defined radius (160 logical units).
 * - Cooldown (0.48s) prevents accidental spam while staying responsive.
 * - Clear feedback sequence: seed/Pip gather light -> soft pulse ring expands ->
 *   nearby compatible objects show brief response -> object transitions with readable animation & sound.
 */
export class WakeSystem {
  private readonly scene: Phaser.Scene;
  private interactables: WakeInteractable[] = [];
  public cooldownRemaining = 0;

  private proximityGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.proximityGraphics = scene.add.graphics();
    this.proximityGraphics.setDepth(19);
  }

  public register(item: WakeInteractable): void {
    if (!this.interactables.includes(item)) {
      this.interactables.push(item);
    }
  }

  public getInteractables(): WakeInteractable[] {
    return this.interactables;
  }

  /**
   * Updates cooldown, proximity target highlights (shape + outline + color so color is never the sole cue),
   * and returns the nearest dormant object for Pip's subtle curiosity turn.
   */
  public update(dt: number, playerX: number, playerY: number): { x: number; y: number } | null {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
    }

    this.proximityGraphics.clear();
    const wakeRadius = activePhysicsTuning.wakeRadius;
    const hintRadius = activePhysicsTuning.wakeProximityHintRadius;
    const highContrast = SaveManager.get().settings.highContrastCues;

    let nearestDormant: { x: number; y: number; dist: number } | null = null;

    for (const item of this.interactables) {
      const pos = item.getPosition();
      const dist = Phaser.Math.Distance.Between(playerX, playerY, pos.x, pos.y);
      const inWakeRange = dist <= wakeRadius && item.isEligibleForWake();

      item.setProximityHighlight(inWakeRange);

      if (item.isDormantForHint() && dist <= hintRadius) {
        if (!nearestDormant || dist < nearestDormant.dist) {
          nearestDormant = { x: pos.x, y: pos.y, dist };
        }
      }

      // Draw subtle non-color shape cue (4-point diamond resonancebrackets) when in active Wake range
      if (inWakeRange) {
        const pulse = Math.sin(this.scene.time.now * 0.008) * 4;
        const r = (highContrast ? 26 : 20) + pulse;
        this.proximityGraphics.lineStyle(highContrast ? 2.2 : 1.5, VEILGROVE_HEX.wakeMint, highContrast ? 0.9 : 0.65);
        this.proximityGraphics.strokeCircle(pos.x, pos.y - 10, r);

        // Four cardinal diamond ticks around the target (Section 7.2: "do not rely on color alone")
        const tick = 5;
        this.proximityGraphics.lineStyle(2, VEILGROVE_HEX.sapGold, 0.85);
        this.proximityGraphics.lineBetween(pos.x, pos.y - 10 - r - tick, pos.x, pos.y - 10 - r + 2);
        this.proximityGraphics.lineBetween(pos.x, pos.y - 10 + r - 2, pos.x, pos.y - 10 + r + tick);
        this.proximityGraphics.lineBetween(pos.x - r - tick, pos.y - 10, pos.x - r + 2, pos.y - 10);
        this.proximityGraphics.lineBetween(pos.x + r - 2, pos.y - 10, pos.x + r + tick, pos.y - 10);
      }
    }

    return nearestDormant ? { x: nearestDormant.x, y: nearestDormant.y } : null;
  }

  public tryTriggerWake(originX: number, originY: number, onTargetActivated?: (item: WakeInteractable) => void): boolean {
    if (this.cooldownRemaining > 0) {
      return false;
    }

    const radius = activePhysicsTuning.wakeRadius;
    this.cooldownRemaining = activePhysicsTuning.wakeCooldown;

    const activatedTargets: WakeInteractable[] = [];
    for (const item of this.interactables) {
      if (!item.isEligibleForWake()) continue;
      const pos = item.getPosition();
      const dist = Phaser.Math.Distance.Between(originX, originY, pos.x, pos.y);
      if (dist <= radius) {
        const didActivate = item.onWakeActivated();
        if (didActivate) {
          activatedTargets.push(item);
          onTargetActivated?.(item);
        }
      }
    }

    const foundTarget = activatedTargets.length > 0;
    AudioManager.playWakePulse(foundTarget);
    this.spawnPulseVisuals(originX, originY, radius, foundTarget);

    return true;
  }

  private spawnPulseVisuals(x: number, y: number, radius: number, foundTarget: boolean): void {
    const reduced = SaveManager.get().settings.reducedParticles;

    // 1. Expanding Wake ring sprite (Section 7.4: "A soft pulse ring expands from Nima")
    const ring = this.scene.add.image(x, y, 'vfx_wake_ring');
    ring.setDepth(24);
    ring.setScale(0.12);
    ring.setAlpha(foundTarget ? 0.92 : 0.62);
    ring.setBlendMode(Phaser.BlendModes.ADD);

    const targetScale = (radius * 2) / 248;
    this.scene.tweens.add({
      targets: ring,
      scale: targetScale,
      alpha: 0,
      duration: 460,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });

    // 2. Bounded spore motes radiating gently
    if (!reduced) {
      const count = foundTarget ? 10 : 5;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
        const dist = radius * (0.45 + Math.random() * 0.45);
        const mote = this.scene.add.image(x, y, 'vfx_spore');
        mote.setDepth(23);
        mote.setScale(0.35 + Math.random() * 0.35);
        mote.setAlpha(0.85);
        mote.setBlendMode(Phaser.BlendModes.ADD);

        this.scene.tweens.add({
          targets: mote,
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist - 14,
          alpha: 0,
          scale: 0.1,
          duration: 420 + Math.random() * 180,
          ease: 'Sine.Out',
          onComplete: () => mote.destroy(),
        });
      }
    }
  }
}
