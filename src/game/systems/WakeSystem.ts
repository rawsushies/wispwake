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
 * The Wake System (Milestone 5 Update — Section 03):
 * - Eliminates any rectangular glow boundary by rendering the expanding magical pulse
 *   using circular Phaser Graphics rings + soft radial core glow with a 16px transparent
 *   safety margin inside its canvas texture + organic floating spore particles.
 */
export class WakeSystem {
  private readonly scene: Phaser.Scene;
  private interactables: WakeInteractable[] = [];
  public cooldownRemaining = 0;

  private proximityGraphics: Phaser.GameObjects.Graphics;
  private pulseGraphics: Phaser.GameObjects.Graphics;
  private activeWaves: Array<{
    x: number;
    y: number;
    maxRadius: number;
    elapsed: number;
    duration: number;
    foundTarget: boolean;
  }> = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.proximityGraphics = scene.add.graphics();
    this.proximityGraphics.setDepth(19);

    this.pulseGraphics = scene.add.graphics();
    this.pulseGraphics.setDepth(24);
    this.pulseGraphics.setBlendMode(Phaser.BlendModes.ADD);
  }

  public register(item: WakeInteractable): void {
    if (!this.interactables.includes(item)) {
      this.interactables.push(item);
    }
  }

  public getInteractables(): WakeInteractable[] {
    return this.interactables;
  }

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

      if (inWakeRange) {
        const pulse = Math.sin(this.scene.time.now * 0.008) * 4;
        const r = (highContrast ? 26 : 20) + pulse;
        this.proximityGraphics.lineStyle(
          highContrast ? 2.2 : 1.5,
          VEILGROVE_HEX.wakeMint,
          highContrast ? 0.9 : 0.65
        );
        this.proximityGraphics.strokeCircle(pos.x, pos.y - 10, r);

        const tick = 5;
        this.proximityGraphics.lineStyle(2, VEILGROVE_HEX.sapGold, 0.85);
        this.proximityGraphics.lineBetween(pos.x, pos.y - 10 - r - tick, pos.x, pos.y - 10 - r + 2);
        this.proximityGraphics.lineBetween(pos.x, pos.y - 10 + r - 2, pos.x, pos.y - 10 + r + tick);
        this.proximityGraphics.lineBetween(pos.x - r - tick, pos.y - 10, pos.x - r + 2, pos.y - 10);
        this.proximityGraphics.lineBetween(pos.x + r - 2, pos.y - 10, pos.x + r + tick, pos.y - 10);
      }
    }

    // Render active Wake circular waves via vector Graphics (100% pure circular geometry, zero texture borders)
    this.pulseGraphics.clear();
    for (let i = this.activeWaves.length - 1; i >= 0; i--) {
      const w = this.activeWaves[i];
      w.elapsed += dt;
      if (w.elapsed >= w.duration) {
        this.activeWaves.splice(i, 1);
        continue;
      }

      const progress = Phaser.Math.Clamp(w.elapsed / w.duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const fade = Math.pow(1 - progress, 1.5);
      const currRadius = Phaser.Math.Linear(14, w.maxRadius, eased);

      // Soft concentric multi-band circular glow rings (Sap Gold inner harmonic + Wake Mint outer wave)
      this.pulseGraphics.lineStyle(8 * fade + 1.5, VEILGROVE_HEX.wakeMint, 0.22 * fade);
      this.pulseGraphics.strokeCircle(w.x, w.y, currRadius);

      this.pulseGraphics.lineStyle(3.2 * fade + 1, VEILGROVE_HEX.wakeMint, (w.foundTarget ? 0.78 : 0.55) * fade);
      this.pulseGraphics.strokeCircle(w.x, w.y, currRadius);

      this.pulseGraphics.lineStyle(2.2 * fade + 0.8, VEILGROVE_HEX.sapGold, 0.65 * fade);
      this.pulseGraphics.strokeCircle(w.x, w.y, currRadius * 0.76);

      // Soft inner core circle fill during the initial burst
      if (progress < 0.65) {
        const coreFade = Math.pow(1 - progress / 0.65, 2);
        this.pulseGraphics.fillStyle(VEILGROVE_HEX.sapGold, 0.14 * coreFade);
        this.pulseGraphics.fillCircle(w.x, w.y, currRadius * 0.55);
      }
    }

    return nearestDormant ? { x: nearestDormant.x, y: nearestDormant.y } : null;
  }

  public tryTriggerWake(
    originX: number,
    originY: number,
    onTargetActivated?: (item: WakeInteractable) => void
  ): boolean {
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

    // 1. Register pure vector circular expanding wave (Zero square texture boundaries)
    this.activeWaves.push({
      x,
      y,
      maxRadius: radius,
      elapsed: 0,
      duration: 0.54,
      foundTarget,
    });

    // 2. Bounded floating spore motes radiating organically
    if (!reduced) {
      const count = foundTarget ? 12 : 6;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.35;
        const dist = radius * (0.42 + Math.random() * 0.52);
        const mote = this.scene.add.image(x, y, 'vfx_spore');
        mote.setDepth(23);
        mote.setScale(0.32 + Math.random() * 0.32);
        mote.setAlpha(0.85);
        mote.setTint(i % 2 === 0 ? VEILGROVE_HEX.wakeMint : VEILGROVE_HEX.sapGold);
        mote.setBlendMode(Phaser.BlendModes.ADD);

        this.scene.tweens.add({
          targets: mote,
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist - 14,
          alpha: 0,
          scale: 0.08,
          duration: 440 + Math.random() * 180,
          ease: 'Sine.Out',
          onComplete: () => mote.destroy(),
        });
      }
    }
  }
}
