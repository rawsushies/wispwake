import Phaser from 'phaser';
import {
  CrumblingPlatformSpec,
  FallingDebrisSpec,
  LevelDefinition,
  MemoryEchoSpec,
  ResonanceBellSpec,
  SporeVentSpec,
  WaterCurrentSpec,
  WindZoneSpec,
} from '../levels/sleepingCanopy/levelData';
import { Player } from '../entities/player/Player';
import { WakeInteractable, WakeSystem } from './WakeSystem';
import { SaveManager } from './SaveManager';
import { AudioManager } from './AudioManager';
import { VEILGROVE_HEX } from '../config/palette';

interface CrumblingRuntime {
  spec: CrumblingPlatformSpec;
  sprite: Phaser.Physics.Arcade.Sprite;
  body: Phaser.Physics.Arcade.Body;
  state: 'solid' | 'shaking' | 'collapsed';
  timer: number;
  standWindowSec: number;
  respawnSec: number;
}

interface SporeVentRuntime {
  spec: SporeVentSpec;
  sprite: Phaser.GameObjects.Sprite;
  elapsed: number;
  state: 'calm' | 'telegraph' | 'burst';
}

interface FallingDebrisRuntime {
  spec: FallingDebrisSpec;
  sprite: Phaser.GameObjects.Sprite;
  elapsed: number;
  currentY: number;
  state: 'resting' | 'warning' | 'falling' | 'impacted';
}

class MemoryEchoNode implements WakeInteractable {
  public readonly id: string;
  public readonly spec: MemoryEchoSpec;
  public readonly sprite: Phaser.GameObjects.Sprite;
  private readonly onTriggered: (spec: MemoryEchoSpec) => void;
  public isDiscovered: boolean;
  private floatPhase = 0;

  constructor(
    scene: Phaser.Scene,
    spec: MemoryEchoSpec,
    initiallyDiscovered: boolean,
    onTriggered: (spec: MemoryEchoSpec) => void
  ) {
    this.id = spec.id;
    this.spec = spec;
    this.isDiscovered = initiallyDiscovered;
    this.onTriggered = onTriggered;

    this.sprite = scene.add.sprite(
      spec.x,
      spec.y,
      'memory_echo_sheet',
      initiallyDiscovered ? 2 : 0
    );
    this.sprite.setDepth(16);
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  public isEligibleForWake(): boolean {
    return true;
  }

  public isDormantForHint(): boolean {
    return !this.isDiscovered;
  }

  public setProximityHighlight(inRange: boolean): void {
    if (!this.isDiscovered) {
      this.sprite.setTint(inRange ? VEILGROVE_HEX.sapGold : 0xffffff);
    } else {
      this.sprite.setTint(0xffffff);
    }
  }

  public onWakeActivated(): boolean {
    this.isDiscovered = true;
    this.sprite.setFrame(2);
    this.sprite.setTint(0xffffff);
    SaveManager.recordDiscoveredMemory(this.id);
    AudioManager.playCheckpoint();
    this.onTriggered(this.spec);
    return true;
  }

  public update(dt: number): void {
    this.floatPhase += dt * 2.6;
    this.sprite.y = this.spec.y + Math.sin(this.floatPhase) * 4.5;
    const baseFrame = this.isDiscovered ? 2 : 0;
    const animStep = Math.floor(this.floatPhase * 1.5) % 2;
    this.sprite.setFrame(baseFrame + animStep);
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}

class ResonanceBellNode implements WakeInteractable {
  public readonly id: string;
  public readonly spec: ResonanceBellSpec;
  public readonly sprite: Phaser.GameObjects.Sprite;
  private readonly onBellRung: (spec: ResonanceBellSpec) => void;
  public resonateTimer = 0;
  public waveProgress = 0;

  constructor(
    scene: Phaser.Scene,
    spec: ResonanceBellSpec,
    onBellRung: (spec: ResonanceBellSpec) => void
  ) {
    this.id = spec.id;
    this.spec = spec;
    this.onBellRung = onBellRung;

    ResonanceBellNode.ensureTexture(scene);
    this.sprite = scene.add.sprite(spec.x, spec.y, 'resonance_bell_sheet', 0);
    this.sprite.setOrigin(0.5, 1.0);
    this.sprite.setDepth(15.5);
  }

  public static ensureTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('resonance_bell_sheet')) return;
    const fw = 96;
    const fh = 116;
    const tex = scene.textures.createCanvas('resonance_bell_sheet', fw * 2, fh);
    if (!tex) return;
    const ctx = tex.getContext();

    for (let i = 0; i < 2; i++) {
      const ox = i * fw;
      const cx = ox + fw * 0.5;
      const by = fh - 6;
      const ringing = i === 1;

      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, 0, fw, fh);
      ctx.clip();
      ctx.translate(cx, by);

      if (ringing) {
        const glow = ctx.createRadialGradient(0, -54, 4, 0, -54, 40);
        glow.addColorStop(0, 'rgba(241, 200, 120, 0.72)');
        glow.addColorStop(0.6, 'rgba(183, 162, 232, 0.32)');
        glow.addColorStop(1, 'rgba(183, 162, 232, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, -54, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stone belfry pillars
      ctx.fillStyle = '#2B3648';
      ctx.strokeStyle = '#121B2B';
      ctx.lineWidth = 2;
      ctx.fillRect(-30, -92, 10, 92);
      ctx.fillRect(20, -92, 10, 92);
      ctx.fillRect(-34, -98, 68, 10);

      // Suspended bronze bell
      const bellGrad = ctx.createLinearGradient(0, -82, 0, -34);
      bellGrad.addColorStop(0, ringing ? '#F1C878' : '#7D6E5D');
      bellGrad.addColorStop(1, ringing ? '#8FE7C7' : '#3E3A4B');
      ctx.fillStyle = bellGrad;
      ctx.strokeStyle = ringing ? '#FFF6D6' : '#8FE7C7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-14, -82);
      ctx.lineTo(14, -82);
      ctx.quadraticCurveTo(18, -50, 22, -36);
      ctx.lineTo(-22, -36);
      ctx.quadraticCurveTo(-18, -50, -14, -82);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing clapper crystal
      ctx.fillStyle = ringing ? '#FFFDF5' : '#B7A2E8';
      ctx.beginPath();
      ctx.arc(0, -32, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      tex.add(i, 0, ox, 0, fw, fh);
    }
    tex.refresh();
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y - 52 };
  }

  public isEligibleForWake(): boolean {
    return true;
  }

  public isDormantForHint(): boolean {
    return this.resonateTimer <= 0;
  }

  public setProximityHighlight(inRange: boolean): void {
    this.sprite.setTint(inRange ? 0xfff2cc : 0xffffff);
  }

  public onWakeActivated(): boolean {
    this.resonateTimer = this.spec.resonanceDurationSec ?? 7.5;
    this.waveProgress = 0.01;
    this.sprite.setFrame(1);
    AudioManager.playCheckpoint();
    this.onBellRung(this.spec);
    return true;
  }

  public update(dt: number, g: Phaser.GameObjects.Graphics): void {
    if (this.resonateTimer > 0) {
      this.resonateTimer = Math.max(0, this.resonateTimer - dt);
      this.waveProgress = (this.waveProgress + dt * 0.9) % 1;
      this.sprite.setAngle(Math.sin(this.resonateTimer * 7) * 3.5);

      const r = 24 + this.waveProgress * 145;
      const alpha = (1 - this.waveProgress) * 0.65;
      g.lineStyle(2.2, VEILGROVE_HEX.sapGold, alpha);
      g.strokeCircle(this.sprite.x, this.sprite.y - 54, r);

      if (this.resonateTimer <= 0) {
        this.sprite.setFrame(0);
        this.sprite.setAngle(0);
      }
    }
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}

/**
 * EnvironmentalHazardSystem — Manages region-specific mechanics across all 6 chapters:
 * - Water Currents & Sap Rivers (Chapters 02, 06 & Trials)
 * - Wind Zones & Updrafts (Chapters 04, 05, 06 & Trials)
 * - Crumbling Surfaces (Chapters 01–06 & Trials)
 * - Spore Vents (Chapters 03–06 & Trials)
 * - Falling Debris (Chapters 03–06 & Trials)
 * - Memory Echo Lore Nodes (Chapters 01–06 optional secret paths)
 * - Resonance Bells (Chapters 05–06 harmonic puzzle bells that awaken linked Blooms)
 */
export class EnvironmentalHazardSystem {
  private readonly scene: Phaser.Scene;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly waterCurrents: WaterCurrentSpec[];
  private readonly windZones: WindZoneSpec[];
  private readonly crumblingPlatforms: CrumblingRuntime[] = [];
  private readonly sporeVents: SporeVentRuntime[] = [];
  private readonly fallingDebris: FallingDebrisRuntime[] = [];
  private readonly memoryEchoes: MemoryEchoNode[] = [];
  private readonly resonanceBells: ResonanceBellNode[] = [];
  private elapsed = 0;

  constructor(
    scene: Phaser.Scene,
    level: LevelDefinition,
    player: Player,
    wakeSystem: WakeSystem,
    onPlayerHazardHit: () => void,
    onMemoryEchoTriggered: (spec: MemoryEchoSpec) => void,
    onResonanceBellRung?: (spec: ResonanceBellSpec) => void
  ) {
    this.scene = scene;
    this.waterCurrents = level.waterCurrents ?? [];
    this.windZones = level.windZones ?? [];

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(17);

    // 1. Build Crumbling Surfaces
    for (const cSpec of level.crumblingPlatforms ?? []) {
      const sprite = scene.physics.add.sprite(
        cSpec.x + cSpec.width * 0.5,
        cSpec.y + 18,
        'crumbling_platform_sheet',
        0
      );
      sprite.setDepth(14);
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.setSize(cSpec.width, 18);
      body.setOffset((160 - cSpec.width) * 0.5, 6);
      body.checkCollision.down = false;
      body.checkCollision.left = false;
      body.checkCollision.right = false;

      scene.physics.add.collider(player.sprite, sprite);

      this.crumblingPlatforms.push({
        spec: cSpec,
        sprite,
        body,
        state: 'solid',
        timer: 0,
        standWindowSec: cSpec.standWindowSec ?? 0.95,
        respawnSec: cSpec.respawnSec ?? 2.6,
      });
    }

    // 2. Build Spore Vents
    for (const vSpec of level.sporeVents ?? []) {
      const sprite = scene.add.sprite(vSpec.x, vSpec.y, 'spore_vent_sheet', 0);
      sprite.setOrigin(0.5, 0.92);
      sprite.setDepth(14);
      this.sporeVents.push({
        spec: vSpec,
        sprite,
        elapsed: vSpec.phaseOffsetSec,
        state: 'calm',
      });
    }

    // 3. Build Falling Debris
    for (const dSpec of level.fallingDebris ?? []) {
      const sprite = scene.add.sprite(dSpec.x, dSpec.ceilingY, 'falling_debris_sheet', 0);
      sprite.setOrigin(0.5, 0.1);
      sprite.setDepth(16);
      this.fallingDebris.push({
        spec: dSpec,
        sprite,
        elapsed: dSpec.phaseOffsetSec,
        currentY: dSpec.ceilingY,
        state: 'resting',
      });
    }

    // 4. Build Memory Echoes
    for (const mSpec of level.memoryEchoes ?? []) {
      const node = new MemoryEchoNode(
        scene,
        mSpec,
        SaveManager.hasDiscoveredMemory(mSpec.id),
        onMemoryEchoTriggered
      );
      wakeSystem.register(node);
      this.memoryEchoes.push(node);
    }

    // 5. Build Resonance Bells (Chapters 05 & 06)
    for (const bSpec of level.resonanceBells ?? []) {
      const bell = new ResonanceBellNode(scene, bSpec, (s) => {
        onResonanceBellRung?.(s);
      });
      wakeSystem.register(bell);
      this.resonanceBells.push(bell);
    }

    this.onPlayerHazardHit = onPlayerHazardHit;
  }

  private readonly onPlayerHazardHit: () => void;

  public resetAllTransientHazards(): void {
    for (const c of this.crumblingPlatforms) {
      c.state = 'solid';
      c.timer = 0;
      c.body.enable = true;
      c.sprite.setAlpha(1);
      c.sprite.setFrame(0);
      c.sprite.setPosition(c.spec.x + c.spec.width * 0.5, c.spec.y + 18);
    }
  }

  public update(dt: number, player: Player): void {
    this.elapsed += dt;
    this.graphics.clear();

    let totalDriftVx = 0;
    let totalDriftVy = 0;

    const px = player.sprite.x;
    const py = player.sprite.y;
    const pLeft = player.body.left;
    const pRight = player.body.right;
    const pTop = player.body.top;
    const pBottom = player.body.bottom;

    // 1. Update & Render Water Currents / Sap Rivers
    for (const wc of this.waterCurrents) {
      if (
        px >= wc.x &&
        px <= wc.x + wc.width &&
        py >= wc.y &&
        py <= wc.y + wc.height
      ) {
        totalDriftVx += wc.driftVx;
      }

      const dir = wc.driftVx >= 0 ? 1 : -1;
      this.graphics.fillStyle(0x294d4d, 0.18);
      this.graphics.fillRect(wc.x, wc.y, wc.width, wc.height);

      this.graphics.lineStyle(2, 0x8fe7c7, 0.42);
      for (let row = 0; row < 3; row++) {
        const ry = wc.y + 24 + row * 38;
        const flowShift =
          ((this.elapsed * Math.abs(wc.driftVx) * 0.9 + row * 65) % 120) * dir;
        for (let sx = wc.x + 20; sx < wc.x + wc.width - 40; sx += 120) {
          const lineStartX = Phaser.Math.Clamp(
            sx + flowShift,
            wc.x + 8,
            wc.x + wc.width - 28
          );
          this.graphics.beginPath();
          this.graphics.moveTo(lineStartX, ry);
          this.graphics.lineTo(lineStartX + 26 * dir, ry);
          this.graphics.strokePath();
        }
      }
    }

    // 2. Update & Render Wind Zones
    for (const wz of this.windZones) {
      if (
        px >= wz.x &&
        px <= wz.x + wz.width &&
        py >= wz.y &&
        py <= wz.y + wz.height
      ) {
        totalDriftVx += wz.driftVx;
        totalDriftVy += wz.driftVy;
      }

      this.graphics.fillStyle(0x8fe7c7, 0.08);
      this.graphics.fillRect(wz.x, wz.y, wz.width, wz.height);

      this.graphics.lineStyle(1.8, 0xf1c878, 0.44);
      for (let i = 0; i < 6; i++) {
        const cycle = (this.elapsed * 1.1 + i * 0.19) % 1;
        const startX =
          wz.driftVx >= 0
            ? wz.x + cycle * (wz.width - 36)
            : wz.x + wz.width - cycle * (wz.width - 36);
        const startY =
          wz.driftVy <= 0
            ? wz.y + wz.height - cycle * (wz.height - 32)
            : wz.y + cycle * (wz.height - 32);

        this.graphics.beginPath();
        this.graphics.moveTo(startX, startY);
        this.graphics.lineTo(
          startX + wz.driftVx * 0.22,
          startY + wz.driftVy * 0.22
        );
        this.graphics.strokePath();
      }
    }

    player.setExternalEnvironmentalDrift(totalDriftVx, totalDriftVy);

    // 3. Update Crumbling Platforms
    for (const c of this.crumblingPlatforms) {
      if (c.state === 'solid') {
        const standingOnCrumble =
          Boolean(player.body.blocked.down || player.body.touching.down) &&
          pRight > c.body.left + 4 &&
          pLeft < c.body.right - 4 &&
          Math.abs(pBottom - c.body.top) <= 8;

        if (standingOnCrumble) {
          c.state = 'shaking';
          c.timer = c.standWindowSec;
        }
      } else if (c.state === 'shaking') {
        c.timer -= dt;
        const progress = 1 - Math.max(0, c.timer) / c.standWindowSec;
        const frameIdx = Math.min(3, 1 + Math.floor(progress * 2.9));
        c.sprite.setFrame(frameIdx);
        c.sprite.x =
          c.spec.x +
          c.spec.width * 0.5 +
          Math.sin(this.elapsed * 48) * (1.5 + progress * 2.5);

        if (c.timer <= 0) {
          c.state = 'collapsed';
          c.timer = c.respawnSec;
          c.body.enable = false;
          c.sprite.setAlpha(0.16);
          c.sprite.x = c.spec.x + c.spec.width * 0.5;
        }
      } else if (c.state === 'collapsed') {
        c.timer -= dt;
        if (c.timer <= 0) {
          c.state = 'solid';
          c.body.enable = true;
          c.sprite.setAlpha(1);
          c.sprite.setFrame(0);
          c.sprite.setPosition(c.spec.x + c.spec.width * 0.5, c.spec.y + 18);
        }
      }
    }

    // 4. Update & Render Spore Vents
    for (const v of this.sporeVents) {
      v.elapsed = (v.elapsed + dt) % v.spec.cycleSec;
      const telegraphStart = v.spec.cycleSec - 2.1;
      const burstStart = v.spec.cycleSec - 1.05;

      if (v.elapsed < telegraphStart) {
        v.state = 'calm';
        v.sprite.setFrame(0);
      } else if (v.elapsed < burstStart) {
        v.state = 'telegraph';
        v.sprite.setFrame(1);
        const warnRatio = (v.elapsed - telegraphStart) / (burstStart - telegraphStart);
        this.graphics.fillStyle(0xf1c878, 0.25 + warnRatio * 0.35);
        this.graphics.fillCircle(v.spec.x, v.spec.y - 38, 8 + warnRatio * 10);
      } else {
        v.state = 'burst';
        v.sprite.setFrame(2);
        const burstRatio = (v.elapsed - burstStart) / (v.spec.cycleSec - burstStart);
        const plumeHeight =
          v.spec.burstHeight * Math.sin(Math.min(1, burstRatio * 1.4) * (Math.PI * 0.5));

        this.graphics.fillStyle(0xe98372, 0.38);
        this.graphics.fillRoundedRect(
          v.spec.x - 16,
          v.spec.y - 36 - plumeHeight,
          32,
          plumeHeight,
          12
        );
        this.graphics.fillStyle(0xf1c878, 0.65);
        for (let m = 0; m < 4; m++) {
          const my = v.spec.y - 40 - ((m * 0.25 + burstRatio) % 1) * plumeHeight;
          const mx = v.spec.x + Math.sin(this.elapsed * 9 + m * 1.8) * 9;
          this.graphics.fillCircle(mx, my, 4.5);
        }

        const plumeLeft = v.spec.x - 14;
        const plumeRight = v.spec.x + 14;
        const plumeTop = v.spec.y - 34 - plumeHeight;
        const plumeBottom = v.spec.y - 24;

        if (
          pRight > plumeLeft &&
          pLeft < plumeRight &&
          pBottom > plumeTop &&
          pTop < plumeBottom
        ) {
          this.onPlayerHazardHit();
        }
      }
    }

    // 5. Update & Render Falling Debris
    for (const d of this.fallingDebris) {
      d.elapsed = (d.elapsed + dt) % d.spec.cycleSec;
      const warnStart = d.spec.cycleSec - 2.0;
      const fallStart = d.spec.cycleSec - 1.0;

      if (d.elapsed < warnStart) {
        d.state = 'resting';
        d.currentY = d.spec.ceilingY;
        d.sprite.setAlpha(1);
        d.sprite.setFrame(0);
        d.sprite.setPosition(d.spec.x, d.currentY);
      } else if (d.elapsed < fallStart) {
        d.state = 'warning';
        d.currentY = d.spec.ceilingY;
        d.sprite.setAlpha(1);
        d.sprite.setFrame(1);
        d.sprite.setPosition(
          d.spec.x + Math.sin(this.elapsed * 52) * 2.5,
          d.spec.ceilingY
        );

        const warnProgress = (d.elapsed - warnStart) / (fallStart - warnStart);
        this.graphics.lineStyle(1.5, 0xf1c878, 0.32);
        this.graphics.beginPath();
        this.graphics.moveTo(d.spec.x, d.spec.ceilingY + 48);
        this.graphics.lineTo(
          d.spec.x,
          d.spec.ceilingY + 48 + (d.spec.floorY - d.spec.ceilingY - 48) * warnProgress
        );
        this.graphics.strokePath();
      } else {
        const fallElapsed = d.elapsed - fallStart;
        const fallDuration = Math.max(
          0.25,
          (d.spec.floorY - d.spec.ceilingY - 52) / 520
        );
        if (fallElapsed <= fallDuration) {
          d.state = 'falling';
          d.currentY =
            d.spec.ceilingY +
            (fallElapsed / fallDuration) * (d.spec.floorY - d.spec.ceilingY - 52);
          d.sprite.setAlpha(1);
          d.sprite.setFrame(1);
          d.sprite.setPosition(d.spec.x, d.currentY);

          const debLeft = d.spec.x - 12;
          const debRight = d.spec.x + 12;
          const debTop = d.currentY + 6;
          const debBottom = d.currentY + 54;
          if (
            pRight > debLeft &&
            pLeft < debRight &&
            pBottom > debTop &&
            pTop < debBottom
          ) {
            this.onPlayerHazardHit();
          }
        } else {
          d.state = 'impacted';
          d.sprite.setAlpha(0);
        }
      }
    }

    // 6. Update Memory Echoes
    for (const mem of this.memoryEchoes) {
      mem.update(dt);
    }

    // 7. Update Resonance Bells
    for (const bell of this.resonanceBells) {
      bell.update(dt, this.graphics);
    }
  }

  public getTotalMemoryEchoesCount(): number {
    return this.memoryEchoes.length;
  }

  public getDiscoveredMemoryEchoesCount(): number {
    return this.memoryEchoes.filter((m) => m.isDiscovered).length;
  }

  public destroy(): void {
    this.graphics.destroy();
    for (const c of this.crumblingPlatforms) {
      c.sprite.destroy();
    }
    for (const v of this.sporeVents) {
      v.sprite.destroy();
    }
    for (const d of this.fallingDebris) {
      d.sprite.destroy();
    }
    for (const m of this.memoryEchoes) {
      m.destroy();
    }
    for (const b of this.resonanceBells) {
      b.destroy();
    }
  }
}
