import Phaser from 'phaser';
import { VEILGROVE_HEX } from '../config/palette';
import { BiomeTheme, PlatformSpec } from '../levels/sleepingCanopy/levelData';
import { SaveManager } from './SaveManager';

interface BirdEntity {
  sprite: Phaser.GameObjects.Sprite;
  speedX: number;
  baseY: number;
  waveAmp: number;
  waveFreq: number;
  phase: number;
}

interface WispCreature {
  sprite: Phaser.GameObjects.Image;
  anchorX: number;
  anchorY: number;
  radiusX: number;
  radiusY: number;
  speed: number;
  phase: number;
  excitedTimer: number;
}

interface ReactivePlant {
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
  baseAngle: number;
  swaySpeed: number;
  swayPhase: number;
  bendVelocity: number;
  bendOffset: number;
  wakeGlowTimer: number;
  wakeMote?: Phaser.GameObjects.Image;
}

interface HangingVine {
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
  swaySpeed: number;
  swayPhase: number;
  wakeExciteTimer: number;
}

interface CanopyBough {
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
  swaySpeed: number;
  swayPhase: number;
  wakeExciteTimer: number;
}

interface FogBand {
  sprite: Phaser.GameObjects.Image;
  speedX: number;
  baseAlpha: number;
}

/**
 * LivingEnvironmentSystem — Milestone 3, 4 & 6 (6-Biome Parallax + Portrait/Landscape Responsive Backdrops + Mouse 2.5D Depth).
 */
export class LivingEnvironmentSystem {
  private readonly scene: Phaser.Scene;
  private readonly levelWidth: number;
  private readonly levelHeight: number;
  private readonly biome: BiomeTheme;

  private farSkyLayer!: Phaser.GameObjects.TileSprite;
  private distantCanopyLayer!: Phaser.GameObjects.TileSprite;
  private midgroundForestLayer!: Phaser.GameObjects.TileSprite;
  private nearRootsPlates: Phaser.GameObjects.Image[] = [];
  private upperCanopyBoughs: CanopyBough[] = [];
  private lightRays: Phaser.GameObjects.Image[] = [];
  private foregroundBotanicals: Array<{ sprite: Phaser.GameObjects.Image; baseX: number; baseY: number }> = [];
  private separationHaze!: Phaser.GameObjects.Rectangle;
  private restorationWash!: Phaser.GameObjects.Rectangle;

  private birds: BirdEntity[] = [];
  private wisps: WispCreature[] = [];
  private reactivePlants: ReactivePlant[] = [];
  private hangingVines: HangingVine[] = [];
  private fogBands: FogBand[] = [];
  private ambientSpores: Array<{
    sprite: Phaser.GameObjects.Image;
    baseY: number;
    speedX: number;
    phase: number;
    depthFactor: number;
  }> = [];

  constructor(
    scene: Phaser.Scene,
    levelWidth: number,
    levelHeight: number,
    platforms: PlatformSpec[],
    initiallyRestored: boolean,
    biome: BiomeTheme = 'canopy'
  ) {
    this.scene = scene;
    this.levelWidth = levelWidth;
    this.levelHeight = levelHeight;
    this.biome = biome;

    this.buildProceduralBotanicalAndWildlifeTextures();
    this.assembleSixLayerEnvironment(platforms, initiallyRestored);
  }

  private buildProceduralBotanicalAndWildlifeTextures(): void {
    const s = this.scene;

    // 1. Distant Bird Sprite Sheet (4 frames of wing flapping, 36x24 per frame)
    if (!s.textures.exists('env_bird_sheet')) {
      const fw = 36;
      const fh = 24;
      const tex = s.textures.createCanvas('env_bird_sheet', fw * 4, fh);
      if (tex) {
        const ctx = tex.getContext();
        const wingHeights = [-7, -2, 5, -1];
        for (let i = 0; i < 4; i++) {
          const ox = i * fw + fw * 0.5;
          const oy = fh * 0.55;
          const wy = wingHeights[i];

          ctx.save();
          ctx.translate(ox, oy);
          ctx.strokeStyle = '#A7B8AE';
          ctx.fillStyle = '#1D2D43';
          ctx.lineWidth = 1.8;
          ctx.lineCap = 'round';

          ctx.beginPath();
          ctx.moveTo(-12, wy);
          ctx.quadraticCurveTo(-5, wy * 0.4 - 2, 0, 0);
          ctx.quadraticCurveTo(5, wy * 0.4 - 2, 12, wy);
          ctx.stroke();

          ctx.fillStyle = '#8FE7C7';
          ctx.beginPath();
          ctx.ellipse(0, 0, 3.5, 1.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          tex.add(i, 0, i * fw, 0, fw, fh);
        }
        tex.refresh();
      }

      if (!s.anims.exists('bird_flap')) {
        s.anims.create({
          key: 'bird_flap',
          frames: s.anims.generateFrameNumbers('env_bird_sheet', { start: 0, end: 3 }),
          frameRate: 9,
          repeat: -1,
        });
      }
    }

    // 2. Reactive Surface Fern & Veil-Bell Cluster (64x56, anchored at bottom center)
    for (let variant = 0; variant < 3; variant++) {
      const key = `env_reactive_flora_${variant}`;
      if (!s.textures.exists(key)) {
        const tex = s.textures.createCanvas(key, 64, 56);
        if (tex) {
          const ctx = tex.getContext();
          ctx.translate(32, 54);

          const frondColors = ['#294D4D', '#57725B', '#78906A'];
          for (let f = -2; f <= 2; f++) {
            const angle = f * 0.34;
            const len = 26 + (2 - Math.abs(f)) * 7;
            ctx.save();
            ctx.rotate(angle);
            ctx.strokeStyle = frondColors[(Math.abs(f) + variant) % 3];
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(f * 3, -len * 0.55, f * 6, -len);
            ctx.stroke();

            ctx.fillStyle = f === 0 ? '#78906A' : '#57725B';
            for (let y = -8; y > -len + 4; y -= 6) {
              ctx.beginPath();
              ctx.ellipse(-3.5, y, 3.5, 1.6, -0.4, 0, Math.PI * 2);
              ctx.ellipse(3.5, y, 3.5, 1.6, 0.4, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          const budColor = variant === 0 ? '#8FE7C7' : variant === 1 ? '#F1C878' : '#B7A2E8';
          ctx.fillStyle = budColor;
          ctx.beginPath();
          ctx.arc(-6, -24, 3.2, 0, Math.PI * 2);
          ctx.arc(5, -28, 3.8, 0, Math.PI * 2);
          ctx.fill();

          tex.refresh();
        }
      }
    }

    // 3. Hanging Canopy Moss Vine (48x180, anchored at top center)
    if (!s.textures.exists('env_hanging_vine')) {
      const tex = s.textures.createCanvas('env_hanging_vine', 48, 180);
      if (tex) {
        const ctx = tex.getContext();
        ctx.translate(24, 0);
        ctx.strokeStyle = '#294D4D';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-10, 50, 10, 110, 0, 166);
        ctx.stroke();

        for (let y = 16; y < 160; y += 16) {
          const side = (y / 16) % 2 === 0 ? -1 : 1;
          ctx.fillStyle = y > 100 ? '#78906A' : '#57725B';
          ctx.beginPath();
          ctx.ellipse(side * 7, y, 6.5, 3.2, side * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#8FE7C7';
        ctx.beginPath();
        ctx.arc(0, 170, 3.4, 0, Math.PI * 2);
        ctx.fill();
        tex.refresh();
      }
    }

    // 4. Upper Canopy Overhanging Branch & Blossom Bough (340x165)
    if (!s.textures.exists('env_upper_canopy_bough')) {
      const tex = s.textures.createCanvas('env_upper_canopy_bough', 340, 165);
      if (tex) {
        const ctx = tex.getContext();

        ctx.strokeStyle = '#19293B';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-10, 12);
        ctx.quadraticCurveTo(145, 58, 315, 24);
        ctx.stroke();

        ctx.strokeStyle = '#243C42';
        ctx.lineWidth = 7;
        for (const bx of [68, 155, 245]) {
          ctx.beginPath();
          ctx.moveTo(bx, 32);
          ctx.quadraticCurveTo(bx + 22, 74, bx - 12, 118);
          ctx.stroke();
        }

        const leafClusters = [
          { x: 55, y: 42, r: 34, c: '#233F42' },
          { x: 115, y: 54, r: 40, c: '#2E524E' },
          { x: 185, y: 48, r: 38, c: '#233F42' },
          { x: 255, y: 38, r: 34, c: '#365E55' },
          { x: 85, y: 82, r: 26, c: '#486C58' },
          { x: 165, y: 88, r: 28, c: '#486C58' },
          { x: 235, y: 76, r: 24, c: '#57725B' },
        ];
        for (const lc of leafClusters) {
          ctx.fillStyle = lc.c;
          ctx.beginPath();
          ctx.ellipse(lc.x, lc.y, lc.r * 1.25, lc.r * 0.72, 0.15, 0, Math.PI * 2);
          ctx.fill();
        }

        for (const fl of [
          { x: 64, y: 112, c: '#8FE7C7' },
          { x: 148, y: 120, c: '#F1C878' },
          { x: 236, y: 108, c: '#B7A2E8' },
        ]) {
          ctx.fillStyle = fl.c;
          ctx.beginPath();
          ctx.arc(fl.x, fl.y, 4.2, 0, Math.PI * 2);
          ctx.fill();
        }

        tex.refresh();
      }
    }

    // 5. Soft Drifting Fog Bank (380x110)
    if (!s.textures.exists('env_fog_bank')) {
      const tex = s.textures.createCanvas('env_fog_bank', 380, 110);
      if (tex) {
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(190, 55, 15, 190, 55, 185);
        grad.addColorStop(0, 'rgba(167, 184, 174, 0.24)');
        grad.addColorStop(0.55, 'rgba(41, 77, 77, 0.12)');
        grad.addColorStop(1, 'rgba(18, 27, 43, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 380, 110);
        tex.refresh();
      }
    }

    // 6. Diagonal Canopy Light Ray (180x540)
    if (!s.textures.exists('env_light_ray')) {
      const tex = s.textures.createCanvas('env_light_ray', 180, 540);
      if (tex) {
        const ctx = tex.getContext();
        const grad = ctx.createLinearGradient(0, 0, 140, 540);
        grad.addColorStop(0, 'rgba(241, 200, 120, 0.16)');
        grad.addColorStop(0.5, 'rgba(143, 231, 199, 0.07)');
        grad.addColorStop(1, 'rgba(143, 231, 199, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(110, 0);
        ctx.lineTo(180, 540);
        ctx.lineTo(70, 540);
        ctx.closePath();
        ctx.fill();
        tex.refresh();
      }
    }

    // 7. Foreground Painted Botanical Silhouette Frame (220x130)
    if (!s.textures.exists('env_fg_botanical')) {
      const tex = s.textures.createCanvas('env_fg_botanical', 220, 130);
      if (tex) {
        const ctx = tex.getContext();
        ctx.fillStyle = '#0D1522';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(220, 0);
        ctx.quadraticCurveTo(185, 58, 120, 48);
        ctx.quadraticCurveTo(60, 74, 0, 36);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#121B2B';
        ctx.lineWidth = 4;
        for (let x = 35; x <= 175; x += 35) {
          ctx.beginPath();
          ctx.moveTo(x, 20);
          ctx.quadraticCurveTo(x + 12, 65, x - 6, 96);
          ctx.stroke();
        }
        tex.refresh();
      }
    }

    // 8. Key out dark Night Ink (#121B2B) void from `env_near_twisted_roots`
    if (s.textures.exists('env_near_twisted_roots_raw') && !s.textures.exists('env_near_twisted_roots_clean')) {
      const srcImg = s.textures.get('env_near_twisted_roots_raw').getSourceImage() as HTMLImageElement;
      if (srcImg && srcImg.width) {
        const w = srcImg.width;
        const h = srcImg.height;
        const canvasTex = s.textures.createCanvas('env_near_twisted_roots_clean', w, h);
        if (canvasTex) {
          const ctx = canvasTex.getContext();
          ctx.drawImage(srcImg, 0, 0);
          const imgData = ctx.getImageData(0, 0, w, h);
          const d = imgData.data;

          for (let i = 0; i < d.length; i += 4) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;
            if (luma < 26 && b > r) {
              d[i + 3] = 0;
            } else if (luma < 42 && b >= g) {
              d[i + 3] = Math.round(((luma - 26) / 16) * 230);
            }
          }
          ctx.putImageData(imgData, 0, 0);
          canvasTex.refresh();
        }
      }
    }
  }

  private getFarSkyTextureKey(): string {
    if (this.biome === 'marsh' && this.scene.textures.exists('bg_moonlit_marsh')) {
      return 'bg_moonlit_marsh';
    }
    if (this.biome === 'cavern' && this.scene.textures.exists('bg_hollow_below')) {
      return 'bg_hollow_below';
    }
    if (this.biome === 'ruins' && this.scene.textures.exists('bg_windward_ruins')) {
      return 'bg_windward_ruins';
    }
    if (this.biome === 'choir' && this.scene.textures.exists('bg_shattered_choir')) {
      return 'bg_shattered_choir';
    }
    if (this.biome === 'heart' && this.scene.textures.exists('bg_heart_of_veil')) {
      return 'bg_heart_of_veil';
    }
    return 'bg_canopy_far_sky';
  }

  private assembleSixLayerEnvironment(platforms: PlatformSpec[], initiallyRestored: boolean): void {
    const s = this.scene;
    const viewW = s.scale.width || 960;
    const viewH = s.scale.height || 540;

    // =========================================================================
    // LAYER 1 — FAR SKY / BIOME MASTER BACKDROP (Depth 1, Parallax 0.05x)
    // =========================================================================
    const farKey = this.getFarSkyTextureKey();
    if (s.textures.exists(farKey)) {
      const texImg = s.textures.get(farKey).getSourceImage() as HTMLImageElement;
      const tw = texImg?.width || 1920;
      const th = texImg?.height || 1080;
      this.farSkyLayer = s.add.tileSprite(-24, -24, tw, th, farKey);
      const coverScale = Math.max((viewW + 48) / tw, (viewH + 48) / th);
      this.farSkyLayer
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setScale(coverScale, coverScale)
        .setDepth(1);
      this.farSkyLayer.setTint(initiallyRestored ? 0xffe8c2 : 0xd0e2f2);
    }

    // =========================================================================
    // LAYER 2 — DISTANT ENVIRONMENT & FLOCKS OF BIRDS (Depth 2..3, Parallax 0.14x)
    // =========================================================================
    if (s.textures.exists('env_distant_canopy')) {
      this.distantCanopyLayer = s.add.tileSprite(-24, -24, 1920, 1080, 'env_distant_canopy');
      const coverScale = Math.max((viewW + 48) / 1920, (viewH + 48) / 1080);
      this.distantCanopyLayer
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setScale(coverScale, coverScale)
        .setDepth(2)
        .setAlpha(this.biome === 'canopy' || this.biome === 'heart' ? 0.52 : 0.28)
        .setTint(
          initiallyRestored || this.biome === 'heart'
            ? 0xffe4b8
            : this.biome === 'cavern' || this.biome === 'choir'
            ? 0x695d94
            : this.biome === 'marsh'
            ? 0x64969e
            : 0x7698a0
        );
    }

    const flockCenters = [320, 980, 1680, 2450, 3250, 3850];
    flockCenters.forEach((fx, flockIdx) => {
      const birdCount = 3 + (flockIdx % 2);
      for (let b = 0; b < birdCount; b++) {
        const bx = fx + b * 34 + (b % 2) * 14;
        const by = 58 + (flockIdx % 4) * 34 + b * 9;
        const birdSprite = s.add.sprite(bx, by, 'env_bird_sheet', b % 4);
        birdSprite.setDepth(2.6);
        birdSprite.setScrollFactor(0.22, 0.15);
        birdSprite.setScale(0.58 + (b % 3) * 0.14);
        birdSprite.setAlpha(0.8);
        birdSprite.play('bird_flap');
        birdSprite.anims.setProgress((b * 0.27) % 1);

        this.birds.push({
          sprite: birdSprite,
          speedX: 28 + (flockIdx % 3) * 9 + b * 2,
          baseY: by,
          waveAmp: 6 + (b % 3) * 3,
          waveFreq: 1.2 + b * 0.25,
          phase: b * 1.1,
        });
      }
    });

    // =========================================================================
    // LAYER 3 — MIDGROUND FOREST (Depth 4, Parallax 0.26x)
    // =========================================================================
    if (s.textures.exists('bg_canopy_giant_roots')) {
      this.midgroundForestLayer = s.add.tileSprite(-24, -24, 1920, 1080, 'bg_canopy_giant_roots');
      const coverScale = Math.max((viewW + 48) / 1920, (viewH + 48) / 1080);
      this.midgroundForestLayer
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setScale(coverScale, coverScale)
        .setDepth(4)
        .setAlpha(this.biome === 'canopy' || this.biome === 'heart' ? 0.68 : 0.36)
        .setTint(
          initiallyRestored || this.biome === 'heart'
            ? 0xfff0d4
            : this.biome === 'cavern' || this.biome === 'choir'
            ? 0x7668a6
            : this.biome === 'marsh'
            ? 0x6ea4a8
            : 0x7ea6a6
        );
    }

    // =========================================================================
    // LAYER 4 — NEAR ENVIRONMENT: TWISTED ROOT ARCHES, UPPER CANOPY BOUGHS, VINES & WISPS (Depth 6..9)
    // =========================================================================
    if (s.textures.exists('env_near_twisted_roots_clean')) {
      const archPositions = [0, 1180, 2320, 3480];
      archPositions.forEach((ax, idx) => {
        const plate = s.add.image(ax, -20, 'env_near_twisted_roots_clean');
        plate.setOrigin(0, 0);
        plate.setScrollFactor(0.46, 0.35);
        plate.setScale(0.62, 0.58 + (idx % 2) * 0.05);
        plate.setFlipX(idx % 2 === 1);
        plate.setDepth(6);
        plate.setAlpha(0.76);
        plate.setTint(initiallyRestored || this.biome === 'heart' ? 0xffecc4 : 0x8db0a8);
        this.nearRootsPlates.push(plate);
      });
    }

    for (let bx = 80; bx < this.levelWidth - 100; bx += 380) {
      const bough = s.add.image(bx, -14 + ((bx % 3) * 8), 'env_upper_canopy_bough');
      bough.setOrigin(0.5, 0);
      bough.setDepth(7.4);
      bough.setScrollFactor(0.68, 0.55);
      bough.setScale(0.9 + ((bx % 4) * 0.1));
      bough.setFlipX((bx / 380) % 2 === 1);
      bough.setAlpha(0.88);
      if (this.biome === 'cavern' || this.biome === 'choir') bough.setTint(0x9a8cd8);
      if (this.biome === 'ruins') bough.setTint(0xc8d4b8);
      if (this.biome === 'heart') bough.setTint(0xffe4b5);
      this.upperCanopyBoughs.push({
        sprite: bough,
        x: bx,
        y: bough.y,
        swaySpeed: 0.75 + ((bx % 5) * 0.12),
        swayPhase: bx * 0.015,
        wakeExciteTimer: 0,
      });
    }

    for (let vx = 160; vx < this.levelWidth - 120; vx += 240) {
      const vine = s.add.image(vx, -10 + ((vx % 3) * 18), 'env_hanging_vine');
      vine.setOrigin(0.5, 0);
      vine.setDepth(8);
      vine.setScrollFactor(0.78, 0.82);
      vine.setScale(0.85 + ((vx % 3) * 0.18));
      vine.setAlpha(0.86);
      this.hangingVines.push({
        sprite: vine,
        x: vx,
        y: vine.y,
        swaySpeed: 1.1 + ((vx % 5) * 0.18),
        swayPhase: vx * 0.02,
        wakeExciteTimer: 0,
      });
    }

    for (let wx = 260; wx < this.levelWidth - 160; wx += 320) {
      const wy = 95 + ((wx * 19) % 245);
      const wisp = s.add.image(wx, wy, 'vfx_spore');
      wisp.setDepth(9);
      wisp.setScale(0.54);
      wisp.setTint(wx % 640 === 0 ? VEILGROVE_HEX.wakeMint : VEILGROVE_HEX.spiritLilac);
      wisp.setBlendMode(Phaser.BlendModes.ADD);
      this.wisps.push({
        sprite: wisp,
        anchorX: wx,
        anchorY: wy,
        radiusX: 28 + (wx % 22),
        radiusY: 16 + (wx % 15),
        speed: 1.4 + ((wx % 4) * 0.25),
        phase: wx * 0.03,
        excitedTimer: 0,
      });
    }

    // Atmospheric Separation Haze between background layers and gameplay collision plane
    this.separationHaze = s.add
      .rectangle(0, 0, viewW + 64, viewH + 64, VEILGROVE_HEX.nightInk, 0.22)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(9.5);

    this.restorationWash = s.add
      .rectangle(0, 0, viewW + 64, viewH + 64, VEILGROVE_HEX.sapGold, initiallyRestored ? 0.16 : 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(9.8);

    // =========================================================================
    // GAMEPLAY PLANE REACTIVE VEGETATION (Depth 13.5, Reacts to Nima & Wake)
    // =========================================================================
    platforms.forEach((plat, pIdx) => {
      const plantCount = Math.max(2, Math.floor(plat.width / 115));
      for (let i = 0; i < plantCount; i++) {
        const px = plat.x + 38 + i * ((plat.width - 76) / Math.max(1, plantCount - 1));
        const py = plat.y + 4;
        const variant = (pIdx + i) % 3;
        const plantSprite = s.add.image(px, py, `env_reactive_flora_${variant}`);
        plantSprite.setOrigin(0.5, 1.0);
        plantSprite.setDepth(13.5);
        plantSprite.setScale(0.82 + ((i + pIdx) % 3) * 0.12);
        if (initiallyRestored) {
          plantSprite.setTint(0xfff2cc);
        }

        this.reactivePlants.push({
          sprite: plantSprite,
          x: px,
          y: py,
          baseAngle: 0,
          swaySpeed: 1.6 + ((i + pIdx) % 4) * 0.3,
          swayPhase: px * 0.04,
          bendVelocity: 0,
          bendOffset: 0,
          wakeGlowTimer: 0,
        });
      }
    });

    // =========================================================================
    // LAYER 5 — FOREGROUND BOTANICAL FRAMING (Depth 30, Parallax 1.18x, Never Obscures Play)
    // =========================================================================
    for (let fx = 120; fx < this.levelWidth; fx += 440) {
      const fg = s.add.image(fx, -18, 'env_fg_botanical');
      fg.setOrigin(0.5, 0);
      fg.setDepth(30);
      fg.setScrollFactor(1.18, 1.0);
      fg.setAlpha(0.85);
      fg.setFlipX((fx / 440) % 2 === 1);
      this.foregroundBotanicals.push({ sprite: fg, baseX: fx, baseY: -18 });
    }

    // =========================================================================
    // LAYER 6 — ATMOSPHERE: DRIFTING FOG, VOLUMETRIC LIGHT RAYS & MULTI-DEPTH POLLEN
    // =========================================================================
    for (let rx = 240; rx < this.levelWidth; rx += 520) {
      const ray = s.add.image(rx, -20, 'env_light_ray');
      ray.setOrigin(0.5, 0);
      ray.setDepth(10);
      ray.setScrollFactor(0.65, 0.5);
      ray.setBlendMode(Phaser.BlendModes.ADD);
      ray.setAlpha(initiallyRestored ? 0.85 : 0.45);
      this.lightRays.push(ray);
    }

    for (let fgX = 200; fgX < this.levelWidth; fgX += 460) {
      const fog = s.add.image(fgX, 460 + ((fgX % 3) * 35), 'env_fog_bank');
      fog.setDepth(11);
      fog.setScrollFactor(0.82, 0.9);
      fog.setScale(1.3, 1.0);
      const baseAlpha = 0.42 + ((fgX % 4) * 0.08);
      fog.setAlpha(baseAlpha);
      this.fogBands.push({
        sprite: fog,
        speedX: (fgX % 2 === 0 ? 1 : -1) * (10 + (fgX % 7)),
        baseAlpha,
      });
    }

    const sporeCount = 46;
    for (let i = 0; i < sporeCount; i++) {
      const sx = (i / sporeCount) * this.levelWidth + Math.random() * 80;
      const sy = 45 + Math.random() * (this.levelHeight - 110);
      const sprite = s.add.image(sx, sy, 'vfx_spore');
      const isForeground = i % 5 === 0;
      sprite.setDepth(isForeground ? 26 : 18);
      sprite.setScale(isForeground ? 0.44 : 0.24 + Math.random() * 0.22);
      sprite.setAlpha(0.35 + Math.random() * 0.45);
      sprite.setTint(i % 3 === 0 ? VEILGROVE_HEX.sapGold : VEILGROVE_HEX.wakeMint);
      sprite.setBlendMode(Phaser.BlendModes.ADD);
      this.ambientSpores.push({
        sprite,
        baseY: sy,
        speedX: 9 + Math.random() * 14,
        phase: Math.random() * Math.PI * 2,
        depthFactor: isForeground ? 1.2 : 1.0,
      });
    }
  }

  /**
   * Dynamically rescales screen-space backdrop layers when switching between portrait and landscape
   * so there is never an unrendered gap or stretched distortion.
   */
  public handleViewportResize(viewW: number, viewH: number): void {
    const farKey = this.getFarSkyTextureKey();
    if (this.farSkyLayer && this.scene.textures.exists(farKey)) {
      const texImg = this.scene.textures.get(farKey).getSourceImage() as HTMLImageElement;
      const tw = texImg?.width || 1920;
      const th = texImg?.height || 1080;
      const coverScale = Math.max((viewW + 48) / tw, (viewH + 48) / th);
      this.farSkyLayer.setScale(coverScale, coverScale);
    }

    const stdCover = Math.max((viewW + 48) / 1920, (viewH + 48) / 1080);
    if (this.distantCanopyLayer) {
      this.distantCanopyLayer.setScale(stdCover, stdCover);
    }
    if (this.midgroundForestLayer) {
      this.midgroundForestLayer.setScale(stdCover, stdCover);
    }
    if (this.separationHaze) {
      this.separationHaze.setSize(viewW + 64, viewH + 64);
    }
    if (this.restorationWash) {
      this.restorationWash.setSize(viewW + 64, viewH + 64);
    }
  }

  public onWakePulse(originX: number, originY: number, radius: number): void {
    const envRadius = radius * 1.45;

    for (const plant of this.reactivePlants) {
      const dist = Phaser.Math.Distance.Between(originX, originY, plant.x, plant.y);
      if (dist <= envRadius) {
        const dir = plant.x >= originX ? 1 : -1;
        plant.bendVelocity = dir * 165;
        plant.wakeGlowTimer = 3.2;
        plant.sprite.setTint(VEILGROVE_HEX.sapGold);

        if (!SaveManager.get().settings.reducedParticles) {
          const mote = this.scene.add.image(plant.x, plant.y - 18, 'vfx_spore');
          mote.setDepth(21);
          mote.setScale(0.38);
          mote.setTint(VEILGROVE_HEX.wakeMint);
          mote.setBlendMode(Phaser.BlendModes.ADD);
          this.scene.tweens.add({
            targets: mote,
            y: plant.y - 58 - Math.random() * 20,
            alpha: 0,
            duration: 680,
            ease: 'Sine.Out',
            onComplete: () => mote.destroy(),
          });
        }
      }
    }

    for (const vine of this.hangingVines) {
      const dist = Math.abs(vine.x - originX);
      if (dist <= envRadius * 1.3) {
        vine.wakeExciteTimer = 2.0;
        vine.sprite.setTint(VEILGROVE_HEX.wakeMint);
      }
    }

    for (const bough of this.upperCanopyBoughs) {
      const dist = Math.abs(bough.x - originX);
      if (dist <= envRadius * 1.4) {
        bough.wakeExciteTimer = 2.2;
        bough.sprite.setTint(VEILGROVE_HEX.sapGold);
      }
    }

    for (const wisp of this.wisps) {
      const dist = Phaser.Math.Distance.Between(originX, originY, wisp.sprite.x, wisp.sprite.y);
      if (dist <= envRadius * 1.35) {
        wisp.excitedTimer = 3.0;
        wisp.sprite.setTint(VEILGROVE_HEX.sapGold);
        wisp.sprite.setScale(0.85);
      }
    }
  }

  public triggerGrandRestoration(): void {
    this.scene.tweens.add({
      targets: this.restorationWash,
      alpha: 0.18,
      duration: 2000,
      ease: 'Sine.InOut',
    });

    if (this.farSkyLayer) this.farSkyLayer.setTint(0xffe8c2);
    if (this.distantCanopyLayer) this.distantCanopyLayer.setTint(0xffe4b8);
    if (this.midgroundForestLayer) this.midgroundForestLayer.setTint(0xfff0d4);

    for (const plate of this.nearRootsPlates) {
      plate.setTint(0xffecc4);
    }

    for (const ray of this.lightRays) {
      this.scene.tweens.add({
        targets: ray,
        alpha: 0.9,
        duration: 1800,
      });
    }

    for (const plant of this.reactivePlants) {
      plant.wakeGlowTimer = 999;
      plant.sprite.setTint(0xfff2cc);
    }

    for (const wisp of this.wisps) {
      wisp.excitedTimer = 15;
      wisp.sprite.setTint(VEILGROVE_HEX.sapGold);
    }
  }

  public update(
    dt: number,
    cameraScrollX: number,
    playerX: number,
    playerY: number,
    playerVx: number,
    pointerNormX = 0,
    pointerNormY = 0
  ): void {
    const reduced = SaveManager.get().settings.reducedParticles;

    if (this.farSkyLayer) {
      this.farSkyLayer.tilePositionX = cameraScrollX * 0.05 + pointerNormX * 4;
      this.farSkyLayer.y = -24 + pointerNormY * 3;
    }
    if (this.distantCanopyLayer) {
      this.distantCanopyLayer.tilePositionX = cameraScrollX * 0.14 + pointerNormX * 9;
      this.distantCanopyLayer.y = -24 + pointerNormY * 6;
    }
    if (this.midgroundForestLayer) {
      this.midgroundForestLayer.tilePositionX = cameraScrollX * 0.26 + pointerNormX * 15;
      this.midgroundForestLayer.y = -24 + pointerNormY * 9;
    }

    for (const fg of this.foregroundBotanicals) {
      fg.sprite.x = fg.baseX - pointerNormX * 18;
      fg.sprite.y = fg.baseY - pointerNormY * 9;
    }

    for (const bird of this.birds) {
      bird.phase += dt * bird.waveFreq;
      bird.sprite.x += bird.speedX * dt;
      bird.sprite.y = bird.baseY + Math.sin(bird.phase) * bird.waveAmp;
      if (bird.sprite.x > this.levelWidth + 200) {
        bird.sprite.x = -120;
      }
    }

    for (const wisp of this.wisps) {
      const speedMult = wisp.excitedTimer > 0 ? 2.6 : 1.0;
      if (wisp.excitedTimer > 0) {
        wisp.excitedTimer -= dt;
        if (wisp.excitedTimer <= 0) {
          wisp.sprite.setTint(VEILGROVE_HEX.spiritLilac);
          wisp.sprite.setScale(0.54);
        }
      }
      wisp.phase += dt * wisp.speed * speedMult;
      wisp.sprite.x = wisp.anchorX + Math.cos(wisp.phase) * wisp.radiusX;
      wisp.sprite.y = wisp.anchorY + Math.sin(wisp.phase * 1.3) * wisp.radiusY;
    }

    for (const plant of this.reactivePlants) {
      plant.swayPhase += dt * plant.swaySpeed;

      const dx = Math.abs(playerX - plant.x);
      const dy = Math.abs(playerY - plant.y);
      if (dx < 28 && dy < 48 && Math.abs(playerVx) > 35) {
        plant.bendVelocity += Math.sign(playerVx) * 180 * dt;
      }

      const springForce = -plant.bendOffset * 28;
      plant.bendVelocity = (plant.bendVelocity + springForce * dt) * Math.pow(0.86, dt * 60);
      plant.bendOffset += plant.bendVelocity * dt;

      const windAngle = reduced ? 0 : Math.sin(plant.swayPhase) * 4.5;
      plant.sprite.setAngle(Phaser.Math.Clamp(windAngle + plant.bendOffset, -28, 28));

      if (plant.wakeGlowTimer > 0 && plant.wakeGlowTimer < 900) {
        plant.wakeGlowTimer -= dt;
        if (plant.wakeGlowTimer <= 0) {
          plant.sprite.clearTint();
        }
      }
    }

    for (const vine of this.hangingVines) {
      const mult = vine.wakeExciteTimer > 0 ? 2.4 : 1.0;
      if (vine.wakeExciteTimer > 0) {
        vine.wakeExciteTimer -= dt;
        if (vine.wakeExciteTimer <= 0) {
          vine.sprite.clearTint();
        }
      }
      vine.swayPhase += dt * vine.swaySpeed * mult;
      const swayDeg = reduced ? 0 : Math.sin(vine.swayPhase) * (3.5 * mult);
      vine.sprite.setAngle(swayDeg);
    }

    for (const bough of this.upperCanopyBoughs) {
      const mult = bough.wakeExciteTimer > 0 ? 2.0 : 1.0;
      if (bough.wakeExciteTimer > 0) {
        bough.wakeExciteTimer -= dt;
        if (bough.wakeExciteTimer <= 0) {
          if (this.biome === 'cavern' || this.biome === 'choir') bough.sprite.setTint(0x9a8cd8);
          else if (this.biome === 'ruins') bough.sprite.setTint(0xc8d4b8);
          else if (this.biome === 'heart') bough.sprite.setTint(0xffe4b5);
          else bough.sprite.clearTint();
        }
      }
      bough.swayPhase += dt * bough.swaySpeed * mult;
      const swayDeg = reduced ? 0 : Math.sin(bough.swayPhase) * (1.8 * mult);
      bough.sprite.setAngle(swayDeg);
    }

    for (const fog of this.fogBands) {
      fog.sprite.setVisible(!reduced);
      if (!reduced) {
        fog.sprite.x += fog.speedX * dt;
        if (fog.sprite.x > this.levelWidth + 240) fog.sprite.x = -240;
        if (fog.sprite.x < -240) fog.sprite.x = this.levelWidth + 240;
      }
    }

    for (const s of this.ambientSpores) {
      s.sprite.setVisible(!reduced);
      if (!reduced) {
        s.phase += dt * 1.5;
        s.sprite.x += s.speedX * s.depthFactor * dt;
        s.sprite.y = s.baseY + Math.sin(s.phase) * 14;
        if (s.sprite.x > this.levelWidth) {
          s.sprite.x = 0;
        }
      }
    }
  }
}
