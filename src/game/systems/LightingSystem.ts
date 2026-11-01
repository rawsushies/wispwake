import Phaser from 'phaser';
import { BiomeTheme, PlatformSpec } from '../levels/sleepingCanopy/levelData';
import { SaveManager } from './SaveManager';

export interface DynamicLightSource {
  x: number;
  y: number;
  radius: number;
  colorHex: string;
  intensity: number; // 0..1
}

interface TransientPulseLight {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  elapsed: number;
  duration: number;
}

/**
 * LightingSystem — Milestone 5 & 6 Hybrid Dynamic 2D / 2.5D Lighting System (Portrait & Landscape Adaptive).
 *
 * Fixes & Improvements:
 * 1. Overscanned High-Resolution Lightmap that adapts dynamically to both Landscape (`960x540`)
 *    and Portrait (`~420x680`) viewports without any rectangular border artifacts.
 * 2. Smooth 4-Stop Radial Falloff: Every light source and transient Wake pulse reaches 0.0 alpha smoothly
 *    along a circular radial gradient with zero square texture artifacts or double-brightening.
 * 3. Soft 2D Projected Drop Shadows & Normal-Style Directional Rim Highlights.
 */
export class LightingSystem {
  private readonly scene: Phaser.Scene;
  private readonly biome: BiomeTheme;

  private shadowGraphics!: Phaser.GameObjects.Graphics;
  private rimLightGraphics!: Phaser.GameObjects.Graphics;

  private lightmapKey = 'dynamic_lightmap_rt';
  private lightmapCanvas!: Phaser.Textures.CanvasTexture;
  private lightmapImage!: Phaser.GameObjects.Image;

  private readonly overscanPx = 32;
  private viewWidth = 960 + 64;
  private viewHeight = 540 + 64;
  private readonly mapWidth = 512;
  private readonly mapHeight = 512;

  private transientPulses: TransientPulseLight[] = [];
  private platforms: PlatformSpec[] = [];
  private isChapterRestored = false;
  private frameCounter = 0;

  constructor(
    scene: Phaser.Scene,
    biome: BiomeTheme,
    platforms: PlatformSpec[],
    initiallyRestored: boolean
  ) {
    this.scene = scene;
    this.biome = biome;
    this.platforms = platforms;
    this.isChapterRestored = initiallyRestored;

    this.viewWidth = (scene.scale.width || 960) + this.overscanPx * 2;
    this.viewHeight = (scene.scale.height || 540) + this.overscanPx * 2;

    this.createProjectedPlatformShadows();
    this.createDynamicLightmapOverlay();
  }

  public handleViewportResize(logicalW: number, logicalH: number): void {
    this.viewWidth = logicalW + this.overscanPx * 2;
    this.viewHeight = logicalH + this.overscanPx * 2;
    if (this.lightmapImage) {
      this.lightmapImage.setScale(this.viewWidth / this.mapWidth, this.viewHeight / this.mapHeight);
    }
  }

  private createProjectedPlatformShadows(): void {
    this.shadowGraphics = this.scene.add.graphics();
    this.shadowGraphics.setDepth(11.8);

    for (const plat of this.platforms) {
      for (let pass = 0; pass < 3; pass++) {
        const offset = (pass + 1) * 9;
        const alpha = 0.22 - pass * 0.055;
        this.shadowGraphics.fillStyle(0x090e17, alpha);
        this.shadowGraphics.fillRoundedRect(
          plat.x + offset * 0.65,
          plat.y + 8 + offset,
          plat.width,
          Math.min(plat.height + 18, 96),
          12
        );
      }
    }

    this.rimLightGraphics = this.scene.add.graphics();
    this.rimLightGraphics.setDepth(13.8);
    this.rimLightGraphics.setBlendMode(Phaser.BlendModes.ADD);
  }

  private createDynamicLightmapOverlay(): void {
    if (this.scene.textures.exists(this.lightmapKey)) {
      this.scene.textures.remove(this.lightmapKey);
    }

    const tex = this.scene.textures.createCanvas(this.lightmapKey, this.mapWidth, this.mapHeight);
    if (tex) {
      this.lightmapCanvas = tex;
    }

    this.lightmapImage = this.scene.add.image(-this.overscanPx, -this.overscanPx, this.lightmapKey);
    this.lightmapImage
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setScale(this.viewWidth / this.mapWidth, this.viewHeight / this.mapHeight)
      .setDepth(28.5)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  public spawnWakeLightPulse(x: number, y: number, maxRadius: number): void {
    this.transientPulses.push({
      x,
      y,
      radius: 36,
      maxRadius: maxRadius * 1.35,
      elapsed: 0,
      duration: 0.65,
    });
  }

  public setRestored(restored: boolean): void {
    this.isChapterRestored = restored;
  }

  public update(
    dt: number,
    cameraScrollX: number,
    cameraScrollY: number,
    nimaX: number,
    nimaY: number,
    pipX: number,
    pipY: number,
    worldLights: DynamicLightSource[]
  ): void {
    this.frameCounter++;

    for (let i = this.transientPulses.length - 1; i >= 0; i--) {
      const p = this.transientPulses[i];
      p.elapsed += dt;
      const t = Phaser.Math.Clamp(p.elapsed / p.duration, 0, 1);
      p.radius = Phaser.Math.Linear(36, p.maxRadius, 1 - Math.pow(1 - t, 3));
      if (p.elapsed >= p.duration) {
        this.transientPulses.splice(i, 1);
      }
    }

    const qualitySetting = SaveManager.get().settings.lightingQuality || 'auto';
    if (qualitySetting === 'low') {
      this.lightmapImage.setVisible(false);
      this.rimLightGraphics.clear();
      return;
    }

    this.lightmapImage.setVisible(true);

    if (qualitySetting === 'balanced' && this.frameCounter % 2 !== 0) {
      return;
    }

    this.renderLightmap(cameraScrollX, cameraScrollY, nimaX, nimaY, pipX, pipY, worldLights);
    this.renderNormalRimHighlights(cameraScrollX, nimaX, nimaY, pipX, pipY, worldLights, qualitySetting);
  }

  private renderLightmap(
    camX: number,
    camY: number,
    nimaX: number,
    nimaY: number,
    pipX: number,
    pipY: number,
    worldLights: DynamicLightSource[]
  ): void {
    if (!this.lightmapCanvas) return;
    const ctx = this.lightmapCanvas.getContext();
    const sx = this.mapWidth / this.viewWidth;
    const sy = this.mapHeight / this.viewHeight;

    let ambientColor = '#7C93AA';
    if (this.isChapterRestored) {
      ambientColor = '#D8CEBA';
    } else if (this.biome === 'marsh') {
      ambientColor = '#6B88A2';
    } else if (this.biome === 'cavern') {
      ambientColor = '#586888';
    } else if (this.biome === 'choir') {
      ambientColor = '#6C78A6';
    } else if (this.biome === 'heart') {
      ambientColor = '#968B7E';
    } else if (this.biome === 'ruins') {
      ambientColor = '#889EB6';
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = ambientColor;
    ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);

    ctx.globalCompositeOperation = 'lighter';

    const drawLight = (wx: number, wy: number, radiusPx: number, rgb: string, intensity: number) => {
      const lx = (wx - camX + this.overscanPx) * sx;
      const ly = (wy - camY + this.overscanPx) * sy;
      const rx = radiusPx * sx;
      const ry = radiusPx * sy;
      if (lx + rx < -10 || lx - rx > this.mapWidth + 10 || ly + ry < -10 || ly - ry > this.mapHeight + 10) {
        return;
      }

      ctx.save();
      ctx.translate(lx, ly);
      ctx.scale(rx, ry);
      const grad = ctx.createRadialGradient(0, 0, 0.04, 0, 0, 1);
      const a0 = Math.min(1, intensity);
      grad.addColorStop(0, `rgba(${rgb}, ${a0.toFixed(3)})`);
      grad.addColorStop(0.38, `rgba(${rgb}, ${(a0 * 0.56).toFixed(3)})`);
      grad.addColorStop(0.72, `rgba(${rgb}, ${(a0 * 0.18).toFixed(3)})`);
      grad.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // Nima's warm living seed illumination
    drawLight(nimaX, nimaY - 8, 195, '241, 200, 120', 0.85);

    // Pip's cool Wake Mint illumination
    drawLight(pipX, pipY, 155, '143, 231, 199', 0.78);

    // World lights (Checkpoints, Awakened Blooms, Root Bridges, Ancient Bloom, NPCs)
    for (const light of worldLights) {
      drawLight(light.x, light.y, light.radius, light.colorHex, light.intensity);
    }

    // Transient Wake Pulse bursts (smooth circular falloff, no square boundaries)
    for (const pulse of this.transientPulses) {
      const fade = Math.pow(1 - pulse.elapsed / pulse.duration, 1.4);
      drawLight(pulse.x, pulse.y, pulse.radius, '143, 231, 199', 0.72 * fade);
    }

    this.lightmapCanvas.refresh();
  }

  private renderNormalRimHighlights(
    camX: number,
    nimaX: number,
    nimaY: number,
    pipX: number,
    pipY: number,
    worldLights: DynamicLightSource[],
    quality: string
  ): void {
    this.rimLightGraphics.clear();
    if (quality === 'balanced' && SaveManager.get().settings.reducedParticles) return;

    const activeSources = [
      { x: nimaX, y: nimaY - 10, r: 220, color: 0xf1c878, alpha: 0.42 },
      { x: pipX, y: pipY, r: 170, color: 0x8fe7c7, alpha: 0.36 },
    ];

    for (const wl of worldLights) {
      if (wl.intensity > 0.5) {
        activeSources.push({
          x: wl.x,
          y: wl.y,
          r: wl.radius,
          color: wl.colorHex.startsWith('241') ? 0xf1c878 : 0x8fe7c7,
          alpha: wl.intensity * 0.35,
        });
      }
    }

    const activeViewW = this.viewWidth;
    for (const plat of this.platforms) {
      if (plat.x + plat.width < camX - 80 || plat.x > camX + activeViewW + 80) continue;

      for (const src of activeSources) {
        const dy = plat.y - src.y;
        if (dy > -35 && dy < src.r) {
          const clampedX = Phaser.Math.Clamp(src.x, plat.x + 12, plat.x + plat.width - 12);
          const dist = Math.hypot(src.x - clampedX, dy);
          if (dist < src.r) {
            const falloff = Math.pow(1 - dist / src.r, 1.6);
            const span = Math.min(plat.width * 0.45, 95 * falloff + 24);
            const startX = Math.max(plat.x + 8, clampedX - span);
            const endX = Math.min(plat.x + plat.width - 8, clampedX + span);
            if (endX > startX) {
              this.rimLightGraphics.lineStyle(2.6, src.color, src.alpha * falloff);
              this.rimLightGraphics.beginPath();
              this.rimLightGraphics.moveTo(startX, plat.y + 1);
              this.rimLightGraphics.lineTo(endX, plat.y + 1);
              this.rimLightGraphics.strokePath();
            }
          }
        }
      }
    }
  }
}
