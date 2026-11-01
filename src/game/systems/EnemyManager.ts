import Phaser from 'phaser';
import { StoryDifficulty } from '../config/gameConfig';
import { VEILGROVE_HEX } from '../config/palette';
import { Player } from '../entities/player/Player';
import { AudioManager } from './AudioManager';
import { SaveManager } from './SaveManager';
import { StoryJournalManager } from './StoryJournalManager';

export type EnemyArchetype =
  | 'hushed_stalker'
  | 'gloom_moth'
  | 'rootbound_sentinel';

export type EnemyState =
  | 'IDLE'
  | 'PATROL'
  | 'ALERT'
  | 'TELEGRAPH'
  | 'ATTACK'
  | 'RECOVER'
  | 'STUNNED'
  | 'DEFEATED_OR_RETREATED';

export interface EnemyPlacementSpec {
  id: string;
  archetype: EnemyArchetype;
  x: number;           // Center / Anchor X
  y: number;           // Supporting platform top Y (for ground) or flight center Y (for aerial)
  patrolMinX?: number; // Ground patrol min X
  patrolMaxX?: number; // Ground patrol max X
  flightRadiusX?: number;
  flightRadiusY?: number;
  speed?: number;
}

interface EnemyRuntime {
  spec: EnemyPlacementSpec;
  sprite: Phaser.GameObjects.Sprite;
  state: EnemyState;
  stateTimer: number;
  paramT: number;
  x: number;
  y: number;
  facing: 1 | -1;
  attackStartX: number;
  attackStartY: number;
  attackTargetX: number;
  attackTargetY: number;
  waveRadius: number;
  journalUnlocked: boolean;
}

/**
 * EnemyManager — Milestone 6 Section 13 (Hostile Creature System & Parametric Mob AI).
 *
 * Implements three distinct hostile creature archetypes with deterministic mathematical
 * trajectories, readable attack telegraphs, and direct Wake interactions:
 * 1. Hushed Stalker (`hushed_stalker`):
 *    - Sinusoidal ground patrol within `[patrolMinX, patrolMaxX]`, ember-coral telegraph crouch,
 *      bounded horizontal lunge, recovery pause, and Wake stun/calm reaction.
 * 2. Gloom Moth (`gloom_moth`):
 *    - Parametric figure-eight Lissajous aerial path, amber wing-shimmer telegraph,
 *      quadratic Bezier swoop curve, recovery ascend, and Wake pushback/stun.
 * 3. Rootbound Sentinel (`rootbound_sentinel`):
 *    - Ancient sanctuary guardian that telegraphs and releases a jumpable ground root-wave.
 *      Wake resonates with its core rune to temporarily calm its barrier.
 */
export class EnemyManager {
  private readonly scene: Phaser.Scene;
  private readonly enemies: EnemyRuntime[] = [];
  private readonly telegraphGraphics: Phaser.GameObjects.Graphics;
  private readonly onPlayerHit: () => void;
  private readonly difficulty: StoryDifficulty;

  constructor(
    scene: Phaser.Scene,
    specs: EnemyPlacementSpec[],
    difficulty: StoryDifficulty,
    onPlayerHit: () => void
  ) {
    this.scene = scene;
    this.difficulty = difficulty;
    this.onPlayerHit = onPlayerHit;

    EnemyManager.buildEnemyAtlas(scene);

    this.telegraphGraphics = scene.add.graphics();
    this.telegraphGraphics.setDepth(18.5);

    // On Easy difficulty, thin out every third enemy if more than 2 exist
    const filteredSpecs =
      difficulty === 'easy' && specs.length > 2
        ? specs.filter((_, idx) => idx % 3 !== 2)
        : specs;

    for (const spec of filteredSpecs) {
      const row = this.getRowForArchetype(spec.archetype);
      const startY =
        spec.archetype === 'gloom_moth' ? spec.y : spec.y - 24;

      const sprite = scene.add.sprite(spec.x, startY, 'hostile_creatures_sheet', row * 4);
      sprite.setDepth(18);

      this.enemies.push({
        spec,
        sprite,
        state: 'PATROL',
        stateTimer: 0,
        paramT: (spec.x % 100) * 0.06,
        x: spec.x,
        y: startY,
        facing: 1,
        attackStartX: spec.x,
        attackStartY: startY,
        attackTargetX: spec.x,
        attackTargetY: startY,
        waveRadius: 0,
        journalUnlocked: false,
      });
    }
  }

  private getRowForArchetype(archetype: EnemyArchetype): number {
    switch (archetype) {
      case 'hushed_stalker':
        return 0;
      case 'gloom_moth':
        return 1;
      case 'rootbound_sentinel':
        return 2;
    }
  }

  public static buildEnemyAtlas(scene: Phaser.Scene): void {
    if (scene.textures.exists('hostile_creatures_sheet')) return;

    const fw = 96;
    const fh = 84;
    const cols = 4; // 0: Patrol A, 1: Patrol B, 2: Telegraph, 3: Attack / Stunned
    const rows = 3;
    const canvasTex = scene.textures.createCanvas(
      'hostile_creatures_sheet',
      fw * cols,
      fh * rows
    );
    if (!canvasTex) return;
    const ctx = canvasTex.getContext();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const ox = col * fw;
        const oy = row * fh;
        const cx = ox + fw * 0.5;
        const cy = oy + fh * 0.56;

        ctx.save();
        ctx.beginPath();
        ctx.rect(ox, oy, fw, fh);
        ctx.clip();
        ctx.translate(cx, cy);

        const isTelegraph = col === 2;
        const isStunned = col === 3;

        if (row === 0) {
          // ===================================================================
          // ROW 0: HUSHED STALKER (Shadow-barked quadruped with glowing eyes)
          // ===================================================================
          const crouchY = isTelegraph ? 4 : col === 1 ? -2 : 0;
          ctx.translate(0, crouchY);

          // Bark carapace body
          ctx.fillStyle = isStunned ? '#3E5758' : '#231D32';
          ctx.strokeStyle = isTelegraph
            ? '#E98372'
            : isStunned
              ? '#8FE7C7'
              : '#5E4B7A';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-24, 4);
          ctx.quadraticCurveTo(-8, -16, 18, -8);
          ctx.lineTo(28, 2);
          ctx.quadraticCurveTo(6, 12, -24, 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Thorned dorsal ridge
          ctx.fillStyle = isTelegraph ? '#E98372' : '#4A3B63';
          for (const sx of [-10, 0, 10]) {
            ctx.beginPath();
            ctx.moveTo(sx - 4, -8);
            ctx.lineTo(sx, -17);
            ctx.lineTo(sx + 4, -7);
            ctx.closePath();
            ctx.fill();
          }

          // Legs
          const stride = col % 2 === 0 ? 5 : -5;
          ctx.strokeStyle = '#181424';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(-14, 6);
          ctx.lineTo(-16 + stride, 20);
          ctx.moveTo(12, 6);
          ctx.lineTo(14 - stride, 20);
          ctx.stroke();

          // Glowing eye
          ctx.fillStyle = isStunned ? '#8FE7C7' : isTelegraph ? '#FFD6CC' : '#E98372';
          ctx.beginPath();
          ctx.arc(19, -2, isTelegraph ? 4 : 2.8, 0, Math.PI * 2);
          ctx.fill();
        } else if (row === 1) {
          // ===================================================================
          // ROW 1: GLOOM MOTH (Nocturnal spore-winged aerial creature)
          // ===================================================================
          const wingAngle = col === 0 ? -0.35 : col === 1 ? 0.32 : isTelegraph ? -0.5 : 0.1;

          for (const side of [-1, 1]) {
            ctx.save();
            ctx.scale(side, 1);
            ctx.rotate(wingAngle);

            const wingGrad = ctx.createLinearGradient(0, -22, 34, 12);
            wingGrad.addColorStop(0, isStunned ? '#8FE7C7' : '#3A2B54');
            wingGrad.addColorStop(
              1,
              isTelegraph ? '#E98372' : isStunned ? '#294D4D' : '#B7A2E8'
            );

            ctx.fillStyle = wingGrad;
            ctx.strokeStyle = isTelegraph ? '#F1C878' : '#1D2D43';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(0, -4);
            ctx.bezierCurveTo(18, -28, 38, -14, 32, 6);
            ctx.bezierCurveTo(22, 18, 8, 14, 0, 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Wing eye-spot
            ctx.fillStyle = isTelegraph ? '#FFF3D1' : '#F1C878';
            ctx.beginPath();
            ctx.arc(18, -4, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Moth thorax
          ctx.fillStyle = '#1D182E';
          ctx.beginPath();
          ctx.ellipse(0, 0, 5.5, 13, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // ===================================================================
          // ROW 2: ROOTBOUND SENTINEL (Ancient stone-and-root guardian)
          // ===================================================================
          ctx.fillStyle = '#2B3646';
          ctx.strokeStyle = isStunned
            ? '#8FE7C7'
            : isTelegraph
              ? '#E98372'
              : '#F1C878';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(-22, 22);
          ctx.lineTo(-18, -22);
          ctx.quadraticCurveTo(0, -34, 18, -22);
          ctx.lineTo(22, 22);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Harmonic Core Rune
          ctx.fillStyle = isStunned
            ? '#8FE7C7'
            : isTelegraph
              ? '#E98372'
              : '#F1C878';
          ctx.beginPath();
          ctx.arc(0, -4, isTelegraph ? 8.5 : 6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        canvasTex.add(idx, 0, ox, oy, fw, fh);
      }
    }

    canvasTex.refresh();
  }

  public onWakePulse(originX: number, originY: number, wakeRadius: number): void {
    const effectiveRadius = wakeRadius + 32;
    for (const e of this.enemies) {
      const dist = Phaser.Math.Distance.Between(originX, originY, e.x, e.y);
      if (dist <= effectiveRadius) {
        e.state = 'STUNNED';
        e.stateTimer = e.spec.archetype === 'rootbound_sentinel' ? 4.2 : 3.6;
        e.waveRadius = 0;
        const pushDir = e.x >= originX ? 1 : -1;
        if (e.spec.archetype === 'hushed_stalker') {
          const minX = e.spec.patrolMinX ?? e.spec.x - 110;
          const maxX = e.spec.patrolMaxX ?? e.spec.x + 110;
          e.x = Phaser.Math.Clamp(e.x + pushDir * 28, minX, maxX);
        }
        e.sprite.setPosition(e.x, e.y);
      }
    }
  }

  public resetAllEnemies(): void {
    for (const e of this.enemies) {
      e.state = 'PATROL';
      e.stateTimer = 0;
      e.waveRadius = 0;
      e.x = e.spec.x;
      e.y = e.spec.archetype === 'gloom_moth' ? e.spec.y : e.spec.y - 24;
      e.sprite.setPosition(e.x, e.y);
      e.sprite.clearTint();
    }
    this.telegraphGraphics.clear();
  }

  public update(dt: number, player: Player): void {
    this.telegraphGraphics.clear();

    const speedMult =
      this.difficulty === 'easy'
        ? 0.8
        : this.difficulty === 'hard'
          ? 1.1
          : this.difficulty === 'extreme'
            ? 1.2
            : 1.0;

    const telegraphMult =
      this.difficulty === 'easy'
        ? 1.25
        : this.difficulty === 'extreme'
          ? 0.88
          : 1.0;

    const px = player.sprite.x;
    const py = player.sprite.y;
    const pLeft = player.body.left;
    const pRight = player.body.right;
    const pTop = player.body.top;
    const pBottom = player.body.bottom;

    for (const e of this.enemies) {
      const row = this.getRowForArchetype(e.spec.archetype);
      const distToPlayer = Phaser.Math.Distance.Between(px, py, e.x, e.y);

      if (!e.journalUnlocked && distToPlayer < 360) {
        e.journalUnlocked = true;
        SaveManager.recordCreatureEncounter(e.spec.archetype);
        StoryJournalManager.unlockEntry(`creature_${e.spec.archetype}`);
      }

      if (e.state === 'STUNNED') {
        e.stateTimer -= dt;
        e.sprite.setFrame(row * 4 + 3);
        e.sprite.setTint(0x8fe7c7);

        // Draw calm golden-mint sleep ring above stunned creature
        this.telegraphGraphics.lineStyle(1.6, VEILGROVE_HEX.wakeMint, 0.75);
        this.telegraphGraphics.strokeCircle(
          e.x,
          e.y - 28,
          10 + Math.sin(e.stateTimer * 6) * 2.5
        );

        if (e.stateTimer <= 0) {
          e.state = 'PATROL';
          e.sprite.clearTint();
        }
        continue;
      }

      e.sprite.clearTint();

      if (e.spec.archetype === 'hushed_stalker') {
        this.updateHushedStalker(
          e,
          dt,
          speedMult,
          telegraphMult,
          px,
          py,
          pLeft,
          pRight,
          pTop,
          pBottom,
          row
        );
      } else if (e.spec.archetype === 'gloom_moth') {
        this.updateGloomMoth(
          e,
          dt,
          speedMult,
          telegraphMult,
          px,
          py,
          pLeft,
          pRight,
          pTop,
          pBottom,
          row
        );
      } else {
        this.updateRootboundSentinel(
          e,
          dt,
          speedMult,
          telegraphMult,
          px,
          py,
          pLeft,
          pRight,
          pTop,
          pBottom,
          row
        );
      }
    }
  }

  private updateHushedStalker(
    e: EnemyRuntime,
    dt: number,
    speedMult: number,
    telegraphMult: number,
    px: number,
    py: number,
    pLeft: number,
    pRight: number,
    pTop: number,
    pBottom: number,
    row: number
  ): void {
    const minX = e.spec.patrolMinX ?? e.spec.x - 110;
    const maxX = e.spec.patrolMaxX ?? e.spec.x + 110;
    const centerX = (minX + maxX) * 0.5;
    const amp = Math.max(24, (maxX - minX) * 0.5);

    if (e.state === 'PATROL') {
      e.paramT += dt * 1.15 * speedMult;
      const nextX = centerX + Math.sin(e.paramT) * amp;
      e.facing = nextX >= e.x ? 1 : -1;
      e.x = nextX;
      e.sprite.setFlipX(e.facing < 0);
      e.sprite.setFrame(row * 4 + (Math.floor(e.paramT * 4) % 2));

      if (Math.abs(px - e.x) < 160 && Math.abs(py - e.y) < 58) {
        e.state = 'TELEGRAPH';
        e.stateTimer = 0.65 * telegraphMult;
        e.facing = px >= e.x ? 1 : -1;
        e.sprite.setFlipX(e.facing < 0);
        e.attackStartX = e.x;
        e.attackTargetX = Phaser.Math.Clamp(e.x + e.facing * 135, minX, maxX);
      }
    } else if (e.state === 'TELEGRAPH') {
      e.stateTimer -= dt;
      e.sprite.setFrame(row * 4 + 2);

      // Draw clear charge telegraph line along the platform
      this.telegraphGraphics.lineStyle(2.2, VEILGROVE_HEX.emberCoral, 0.72);
      this.telegraphGraphics.beginPath();
      this.telegraphGraphics.moveTo(e.x, e.y + 14);
      this.telegraphGraphics.lineTo(e.attackTargetX, e.y + 14);
      this.telegraphGraphics.strokePath();
      this.telegraphGraphics.fillStyle(VEILGROVE_HEX.emberCoral, 0.45);
      this.telegraphGraphics.fillCircle(e.x + e.facing * 18, e.y - 4, 6);

      if (e.stateTimer <= 0) {
        e.state = 'ATTACK';
        e.stateTimer = 0.42;
      }
    } else if (e.state === 'ATTACK') {
      e.stateTimer -= dt;
      const progress = 1 - Math.max(0, e.stateTimer) / 0.42;
      e.x = Phaser.Math.Linear(e.attackStartX, e.attackTargetX, progress);
      e.sprite.setFrame(row * 4 + 1);

      if (e.stateTimer <= 0) {
        e.state = 'RECOVER';
        e.stateTimer = 0.95;
      }
    } else if (e.state === 'RECOVER') {
      e.stateTimer -= dt;
      e.sprite.setFrame(row * 4);
      if (e.stateTimer <= 0) {
        e.state = 'PATROL';
      }
    }

    e.sprite.setPosition(e.x, e.y);

    // Body hazard check (only when not stunned)
    if (
      pRight > e.x - 18 &&
      pLeft < e.x + 18 &&
      pBottom > e.y - 12 &&
      pTop < e.y + 18
    ) {
      this.onPlayerHit();
    }
  }

  private updateGloomMoth(
    e: EnemyRuntime,
    dt: number,
    speedMult: number,
    telegraphMult: number,
    px: number,
    py: number,
    pLeft: number,
    pRight: number,
    pTop: number,
    pBottom: number,
    row: number
  ): void {
    const rx = e.spec.flightRadiusX ?? 95;
    const ry = e.spec.flightRadiusY ?? 38;

    if (e.state === 'PATROL') {
      e.paramT += dt * 1.25 * speedMult;
      const nextX = e.spec.x + Math.cos(e.paramT) * rx;
      const nextY = e.spec.y + Math.sin(e.paramT * 2) * ry;
      e.facing = nextX >= e.x ? 1 : -1;
      e.x = nextX;
      e.y = nextY;
      e.sprite.setFlipX(e.facing < 0);
      e.sprite.setFrame(row * 4 + (Math.floor(e.paramT * 5) % 2));

      if (Math.hypot(px - e.x, py - e.y) < 175 && py >= e.y - 20) {
        e.state = 'TELEGRAPH';
        e.stateTimer = 0.72 * telegraphMult;
        e.attackStartX = e.x;
        e.attackStartY = e.y;
        e.attackTargetX = Phaser.Math.Clamp(px, e.spec.x - rx - 40, e.spec.x + rx + 40);
        e.attackTargetY = Math.min(e.spec.y + ry + 55, py - 6);
      }
    } else if (e.state === 'TELEGRAPH') {
      e.stateTimer -= dt;
      e.sprite.setFrame(row * 4 + 2);

      // Draw clear swoop target ring
      this.telegraphGraphics.lineStyle(2, VEILGROVE_HEX.sapGold, 0.7);
      this.telegraphGraphics.strokeCircle(e.attackTargetX, e.attackTargetY, 16);
      this.telegraphGraphics.lineStyle(1.4, VEILGROVE_HEX.emberCoral, 0.55);
      this.telegraphGraphics.lineBetween(e.x, e.y, e.attackTargetX, e.attackTargetY);

      if (e.stateTimer <= 0) {
        e.state = 'ATTACK';
        e.stateTimer = 0.55;
      }
    } else if (e.state === 'ATTACK') {
      e.stateTimer -= dt;
      const t = 1 - Math.max(0, e.stateTimer) / 0.55;
      // Parabolic swoop down to target and back toward patrol height
      const swoopDepth = Math.sin(t * Math.PI);
      e.x = Phaser.Math.Linear(e.attackStartX, e.attackTargetX, t);
      e.y = Phaser.Math.Linear(e.attackStartY, e.attackTargetY, swoopDepth);
      e.sprite.setFrame(row * 4 + 1);

      if (e.stateTimer <= 0) {
        e.state = 'RECOVER';
        e.stateTimer = 0.9;
      }
    } else if (e.state === 'RECOVER') {
      e.stateTimer -= dt;
      e.y = Phaser.Math.Linear(e.y, e.spec.y, dt * 4);
      e.sprite.setFrame(row * 4);
      if (e.stateTimer <= 0) {
        e.state = 'PATROL';
      }
    }

    e.sprite.setPosition(e.x, e.y);

    if (
      pRight > e.x - 16 &&
      pLeft < e.x + 16 &&
      pBottom > e.y - 12 &&
      pTop < e.y + 12
    ) {
      this.onPlayerHit();
    }
  }

  private updateRootboundSentinel(
    e: EnemyRuntime,
    dt: number,
    speedMult: number,
    telegraphMult: number,
    px: number,
    py: number,
    pLeft: number,
    pRight: number,
    pTop: number,
    pBottom: number,
    row: number
  ): void {
    e.paramT += dt * speedMult;

    if (e.state === 'PATROL') {
      e.sprite.setFrame(row * 4 + (Math.floor(e.paramT * 2) % 2));
      if (Math.abs(px - e.x) < 210 && Math.abs(py - e.y) < 90) {
        e.state = 'TELEGRAPH';
        e.stateTimer = 0.85 * telegraphMult;
        e.waveRadius = 0;
      }
    } else if (e.state === 'TELEGRAPH') {
      e.stateTimer -= dt;
      e.sprite.setFrame(row * 4 + 2);

      const warnProgress = 1 - Math.max(0, e.stateTimer) / (0.85 * telegraphMult);
      this.telegraphGraphics.lineStyle(2.5, VEILGROVE_HEX.emberCoral, 0.4 + warnProgress * 0.45);
      this.telegraphGraphics.strokeCircle(e.x, e.y, 24 + warnProgress * 16);
      this.telegraphGraphics.lineBetween(e.x - 115, e.spec.y - 2, e.x + 115, e.spec.y - 2);

      if (e.stateTimer <= 0) {
        e.state = 'ATTACK';
        e.stateTimer = 0.65;
        e.waveRadius = 18;
        AudioManager.playLand(0.5);
      }
    } else if (e.state === 'ATTACK') {
      e.stateTimer -= dt;
      const progress = 1 - Math.max(0, e.stateTimer) / 0.65;
      e.waveRadius = 18 + progress * 102;
      e.sprite.setFrame(row * 4 + 2);

      // Draw expanding left & right root-shockwave pulses (18px tall so Nima can jump cleanly over)
      for (const side of [-1, 1]) {
        const wx = e.x + side * e.waveRadius;
        const wy = e.spec.y - 10;
        this.telegraphGraphics.fillStyle(VEILGROVE_HEX.emberCoral, 0.82);
        this.telegraphGraphics.fillRoundedRect(wx - 10, wy - 8, 20, 16, 5);

        if (
          pRight > wx - 9 &&
          pLeft < wx + 9 &&
          pBottom > wy - 6 &&
          pTop < wy + 8
        ) {
          this.onPlayerHit();
        }
      }

      if (e.stateTimer <= 0) {
        e.state = 'RECOVER';
        e.stateTimer = 1.25;
        e.waveRadius = 0;
      }
    } else if (e.state === 'RECOVER') {
      e.stateTimer -= dt;
      e.sprite.setFrame(row * 4);
      if (e.stateTimer <= 0) {
        e.state = 'PATROL';
      }
    }

    // Direct contact with un-stunned Sentinel core
    if (
      pRight > e.x - 18 &&
      pLeft < e.x + 18 &&
      pBottom > e.y - 20 &&
      pTop < e.y + 20
    ) {
      this.onPlayerHit();
    }
  }

  public getDebugBounds(): Array<{ x: number; y: number; w: number; h: number; state: EnemyState }> {
    return this.enemies.map((e) => ({
      x: e.x - 18,
      y: e.y - 18,
      w: 36,
      h: 36,
      state: e.state,
    }));
  }

  public destroy(): void {
    this.telegraphGraphics.destroy();
    for (const e of this.enemies) {
      e.sprite.destroy();
    }
  }
}
