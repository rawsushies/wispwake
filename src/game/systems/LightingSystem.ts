import Phaser from 'phaser';
import { BiomeTheme } from '../levels/sleepingCanopy/levelData';
import { PlatformSpec } from '../levels/sleepingCanopy/levelData';
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
 * LightingSystem — Milestone 4 (Section 07: Hybrid Dynamic 2D / 2.5D Lighting System).
 *
 * Implements:
 * 1. Soft 2D Projected Drop Shadows cast by platforms and canopy structures onto the forest depths.
 * 2. Depth-aware Biome Gloom & Dynamic Lightmap (rendered via a real-time MULTIPLY canvas lightmap
 *    that carves warm Sap Gold & cool Wake Mint illumination around Nima's seed, Pip, Wake pulses,
 *    awakened BloomPlatforms, Checkpoints, and Ancient Blooms while keeping platform top edges readable).
 * 3. Normal-style Directional Rim Specular Highlights on nearby terrain and foliage when light sources approach.
 * 4. Quality Scaling (`auto`, `high`, `balanced`, `low`) so both desktop and mobile maintain 60 FPS.
 */
export class LightingSystem {
  private readonly scene: Phaser.Scene;
  private readonly biome: BiomeTheme;

  private shadowGraphics!: Phaser.GameObjects.Graphics;
  private rimLightGraphics!: Phaser.GameObjects.Graphics;

  private lightmapKey = 'dynamic_lightmap_rt';
  private lightmapCanvas!: Phaser.Textures.CanvasTexture;
  private lightmapImage!: Phaser.GameObjects.Image;

  private readonly mapWidth = 320;
  private readonly mapHeight = 180;

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

    this.createProjectedPlatformShadows();
    this.createDynamicLightmapOverlay();
  }

  /**
   * 1. Casts soft 2D directional shadows beneath platforms and root arches onto midground/near layers.
   */
  private createProjectedPlatformShadows(): void {
    this.shadowGraphics = this.scene.add.graphics();
    this.shadowGraphics.setDepth(11.8); // Just behind static platform visuals (12.5)

    for (const plat of this.platforms) {
      // Soft multi-pass directional shadow cast diagonally down-right from upper twilight moon/sun
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

    // Dynamic normal-map-style rim highlight graphics drawn above terrain (depth 13.8)
    this.rimLightGraphics = this.scene.add.graphics();
    this.rimLightGraphics.setDepth(13.8);
    this.rimLightGraphics.setBlendMode(Phaser.BlendModes.ADD);
  }

  /**
   * 2. Creates the real-time MULTIPLY darkness & localized lightmap overlay (`960x540` viewport).
   */
  private createDynamicLightmapOverlay(): void {
    if (this.scene.textures.exists(this.lightmapKey)) {
      this.scene.textures.remove(this.lightmapKey);
    }

    const tex = this.scene.textures.createCanvas(this.lightmapKey, this.mapWidth, this.mapHeight);
    if (tex) {
      this.lightmapCanvas = tex;
    }

    this.lightmapImage = this.scene.add.image(0, 0, this.lightmapKey);
    this.lightmapImage
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setScale(960 / this.mapWidth, 540 / this.mapHeight)
      .setDepth(28.5) // Above gameplay plane & atmosphere, below foreground frame (30) and UI
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  public spawnWakeLightPulse(x: number, y: number, maxRadius: number): void {
    this.transientPulses.push({
      x,
      y,
      radius: 28,
      maxRadius: maxRadius * 1.45,
      elapsed: 0,
      duration: 0.72,
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

    // Update expanding Wake light pulses
    for (let i = this.transientPulses.length - 1; i >= 0; i--) {
      const p = this.transientPulses[i];
      p.elapsed += dt;
      const t = Phaser.Math.Clamp(p.elapsed / p.duration, 0, 1);
      p.radius = Phaser.Math.Linear(28, p.maxRadius, 1 - Math.pow(1 - t, 3));
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

    // In 'balanced' mode, update the offscreen lightmap every 2nd frame for extra mobile headroom
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
    const sx = this.mapWidth / 960;
    const sy = this.mapHeight / 540;

    // 1. Base ambient darkness color per biome (lighter when chapter is restored so platform edges are always clear)
    let ambientColor = '#7C93AA'; // Default canopy twilight
    if (this.isChapterRestored) {
      ambientColor = '#D8CEBA';
    } else if (this.biome === 'marsh') {
      ambientColor = '#6E8BA4';
    } else if (this.biome === 'cavern') {
      ambientColor = '#5E6E8C'; // Deeper underground gloom in Hollow Below
    } else if (this.biome === 'ruins') {
      ambientColor = '#8BA0B8'; // High-altitude moonlit sky
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = ambientColor;
    ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);

    // 2. Additive light passes (`lighter` / `screen` on the multiply texture turns darkness toward white/tinted glow)
    ctx.globalCompositeOperation = 'lighter';

    const drawLight = (wx: number, wy: number, radiusPx: number, rgb: string, intensity: number) => {
      const lx = (wx - camX) * sx;
      const ly = (wy - camY) * sy;
      const r = radiusPx * sx;
      if (lx + r < -20 || lx - r > this.mapWidth + 20 || ly + r < -20 || ly - r > this.mapHeight + 20) {
        return;
      }
      const grad = ctx.createRadialGradient(lx, ly, r * 0.06, lx, ly, r);
      grad.addColorStop(0, `rgba(${rgb}, ${Math.min(1, intensity)})`);
      grad.addColorStop(0.5, `rgba(${rgb}, ${Math.min(1, intensity * 0.48)})`);
      grad.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.fill();
    };

    // Nima's warm seed light (always illuminates Nima and nearby platform edges)
    drawLight(nimaX, nimaY - 8, 195, '241, 200, 120', 0.85);

    // Pip's bioluminescent Wake Mint / Spirit Lilac lantern aura
    drawLight(pipX, pipY, 155, '143, 231, 199', 0.78);

    // World lights (Checkpoints, Awakened Blooms, Root Bridges, Ancient Bloom, Bioluminescent Flora)
    for (const light of worldLights) {
      drawLight(light.x, light.y, light.radius, light.colorHex, light.intensity);
    }

    // Transient Wake Pulse bursts
    for (const pulse of this.transientPulses) {
      const fade = 1 - pulse.elapsed / pulse.duration;
      drawLight(pulse.x, pulse.y, pulse.radius, '143, 231, 199', 0.95 * fade);
    }

    this.lightmapCanvas.refresh();
  }

  /**
   * 3. Normal-style directional rim highlights along the top/side surfaces of nearby platforms
   *    reactive to Nima's seed, Pip, and active Wake pulses (2.5D surface normal response).
   */
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

    for (const plat of this.platforms) {
      // Only evaluate platforms visible in the current camera viewport
      if (plat.x + plat.width < camX - 80 || plat.x > camX + 1040) continue;

      for (const src of activeSources) {
        // Check vertical proximity to platform top edge (normal facing upward)
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
