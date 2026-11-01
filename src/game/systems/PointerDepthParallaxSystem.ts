import Phaser from 'phaser';
import { SaveManager } from './SaveManager';

/**
 * PointerDepthParallaxSystem — Milestone 6 Section 17 (Desktop 2.5D Mouse Depth Parallax).
 *
 * Adds a refined, subtle 2.5D depth response to mouse movement on desktop/laptop screens:
 * - Normalizes pointer coordinates to `[-1, 1]` across the canvas.
 * - Smoothly interpolates towards the target offset (`lerp = 1 - Math.exp(-5.5 * dt)`).
 * - Smoothly returns to `(0, 0)` when the cursor leaves the window or loses focus.
 * - Automatically disabled on touch-primary devices, when `reducedParticles` is enabled,
 *   or when `mouseDepthParallax` is turned off in Settings.
 * - Affects ONLY decorative background/midground/foreground layers—never moves playable
 *   platforms, hazards, characters, or physics bodies.
 */
export class PointerDepthParallaxSystem {
  private targetNormX = 0;
  private targetNormY = 0;
  private currentNormX = 0;
  private currentNormY = 0;
  private isTouchPrimaryDevice = false;

  private readonly handleMouseMove = (e: MouseEvent) => {
    if (this.isTouchPrimaryDevice) return;
    const w = window.innerWidth || 960;
    const h = window.innerHeight || 540;
    this.targetNormX = Phaser.Math.Clamp((e.clientX / w) * 2 - 1, -1, 1);
    this.targetNormY = Phaser.Math.Clamp((e.clientY / h) * 2 - 1, -1, 1);
  };

  private readonly handleMouseLeave = () => {
    this.targetNormX = 0;
    this.targetNormY = 0;
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.isTouchPrimaryDevice = Boolean(
        window.matchMedia?.('(pointer: coarse)').matches &&
          !window.matchMedia?.('(any-pointer: fine)').matches
      );
      window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
      window.addEventListener('mouseleave', this.handleMouseLeave);
      window.addEventListener('blur', this.handleMouseLeave);
    }
  }

  public update(dt: number): { normX: number; normY: number } {
    const settings = SaveManager.get().settings;
    const enabled =
      !this.isTouchPrimaryDevice &&
      settings.mouseDepthParallax !== false &&
      !settings.reducedParticles;

    const goalX = enabled ? this.targetNormX : 0;
    const goalY = enabled ? this.targetNormY : 0;

    const smooth = 1 - Math.exp(-5.5 * dt);
    this.currentNormX = Phaser.Math.Linear(this.currentNormX, goalX, smooth);
    this.currentNormY = Phaser.Math.Linear(this.currentNormY, goalY, smooth);

    return {
      normX: this.currentNormX,
      normY: this.currentNormY,
    };
  }

  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this.handleMouseMove);
      window.removeEventListener('mouseleave', this.handleMouseLeave);
      window.removeEventListener('blur', this.handleMouseLeave);
    }
  }
}
