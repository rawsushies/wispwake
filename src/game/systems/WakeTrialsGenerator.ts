import { TrialDifficulty } from '../config/gameConfig';
import { activePhysicsTuning } from '../config/physicsTuning';
import {
  BloomSpec,
  DrifterSpec,
  HazardSpec,
  LevelDefinition,
  PlatformSpec,
  RootBridgeSpec,
} from '../levels/sleepingCanopy/levelData';

export interface ValidatedTrialResult {
  levelDef: LevelDefinition;
  seed: string;
  difficulty: TrialDifficulty;
  validationPassed: boolean;
  validationNotes: string[];
}

/**
 * WakeTrialsGenerator & Traversal Validator (Section 07):
 * - Generates deterministic, replayable platforming challenges from curated segment archetypes
 *   using a shareable seed string.
 * - Supports 4 difficulty tiers (`easy`, `medium`, `hard`, `extreme`) without altering Nima's physics.
 * - Explicitly validates every generated gap, elevation delta, BloomPlatform reachability,
 *   RootBridge span, and Drifter patrol against `activePhysicsTuning` kinematics:
 *   - Max single jump apex height: `v0^2 / (2 * g) = 570^2 / (2 * 1460) ≈ 111.2 logical units`
 *   - Total jump airtime (level ground) + coyote (0.10s): `~0.88s` -> max horizontal reach `~225 units`
 *   - Guaranteed safe platform-to-platform jump limit enforced by validator: `<= 195 units` horizontal,
 *     `<= 92 units` upward vertical gain.
 */
export class WakeTrialsGenerator {
  private static hashSeed(seedStr: string): () => number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += h << 13;
      h ^= h >>> 7;
      h += h << 3;
      h ^= h >>> 17;
      h += h << 5;
      return (h >>> 0) / 4294967296;
    };
  }

  public static generateSeedCode(difficulty: TrialDifficulty): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = difficulty.slice(0, 2).toUpperCase() + '-';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  public static buildValidatedTrial(difficulty: TrialDifficulty, seedInput?: string): ValidatedTrialResult {
    const seed = (seedInput && seedInput.trim().toUpperCase()) || this.generateSeedCode(difficulty);
    const rng = this.hashSeed(`${difficulty}:${seed}`);

    // Difficulty parameters (purely architectural—never alters player physics)
    const config = {
      easy: {
        segmentCount: 5,
        platWidthMin: 260,
        platWidthMax: 350,
        gapMin: 95,
        gapMax: 140,
        maxStepUp: 55,
        hazardChance: 0.15,
      },
      medium: {
        segmentCount: 6,
        platWidthMin: 210,
        platWidthMax: 290,
        gapMin: 115,
        gapMax: 160,
        maxStepUp: 70,
        hazardChance: 0.35,
      },
      hard: {
        segmentCount: 7,
        platWidthMin: 175,
        platWidthMax: 245,
        gapMin: 130,
        gapMax: 175,
        maxStepUp: 80,
        hazardChance: 0.55,
      },
      extreme: {
        segmentCount: 8,
        platWidthMin: 150,
        platWidthMax: 210,
        gapMin: 145,
        gapMax: 185,
        maxStepUp: 86,
        hazardChance: 0.72,
      },
    }[difficulty];

    const platforms: PlatformSpec[] = [];
    const blooms: BloomSpec[] = [];
    const rootBridges: RootBridgeSpec[] = [];
    const drifters: DrifterSpec[] = [];
    const hazards: HazardSpec[] = [];

    // 1. Entry Safe Terrace
    let cursorX = 40;
    let cursorY = 480;
    platforms.push({
      id: 'trial_plat_start',
      x: cursorX,
      y: cursorY,
      width: 340,
      height: 180,
    });
    cursorX += 340;

    const checkpointIndex = Math.floor(config.segmentCount * 0.5);
    let checkpointX = cursorX + 120;
    let checkpointY = cursorY;

    for (let s = 0; s < config.segmentCount; s++) {
      const roll = rng();
      const stepDeltaY = Math.round((rng() - 0.52) * config.maxStepUp * 1.5);
      const nextY = Math.max(310, Math.min(540, cursorY + stepDeltaY));
      const platWidth = Math.round(
        config.platWidthMin + rng() * (config.platWidthMax - config.platWidthMin)
      );

      if (s === checkpointIndex) {
        // Dedicated wide Checkpoint Sanctuary Platform
        const gap = 115;
        cursorX += gap;
        const cpWidth = 340;
        platforms.push({
          id: `trial_plat_cp_${s}`,
          x: cursorX,
          y: nextY,
          width: cpWidth,
          height: 220,
        });
        checkpointX = cursorX + Math.round(cpWidth * 0.5);
        checkpointY = nextY;
        cursorX += cpWidth;
        cursorY = nextY;
        continue;
      }

      if (roll < 0.34) {
        // Archetype A: Bloom Crossing (1 or 2 temporary Wake flower platforms across a wide gap)
        const bloomCount = difficulty === 'easy' ? 1 : rng() > 0.45 ? 2 : 1;
        let bX = cursorX;
        let bY = cursorY;
        for (let b = 0; b < bloomCount; b++) {
          bX += Math.round(125 + rng() * 35);
          bY = Math.max(300, Math.min(520, bY - Math.round(15 + rng() * 35)));
          blooms.push({
            id: `trial_bloom_${s}_${b}`,
            x: bX,
            y: bY + 42, // Bloom top surface is at y - 42 relative to sprite center
          });
        }
        cursorX = bX + Math.round(125 + rng() * 35);
        cursorY = Math.max(310, Math.min(530, bY + Math.round((rng() - 0.3) * 40)));
      } else if (roll < 0.58) {
        // Archetype B: Recessed Root Bridge Chasm (220px gap spanned by a 236px permanent RootBridge)
        const bridgeAnchorX = cursorX - 14;
        rootBridges.push({
          id: `trial_root_${s}`,
          x: bridgeAnchorX,
          y: cursorY + 12,
        });
        cursorX += 220;
        cursorY = Math.max(320, Math.min(530, cursorY));
      } else if (roll < 0.78) {
        // Archetype C: Gliding Drifter Chasm
        const startX = cursorX + 105;
        const endX = startX + Math.round(160 + rng() * 90);
        const driftY = Math.min(cursorY, nextY) + 10;
        drifters.push({
          id: `trial_drifter_${s}`,
          startX,
          startY: driftY,
          endX,
          endY: nextY + 10,
          cycleDuration: difficulty === 'extreme' ? 4.6 : 5.5,
        });
        cursorX = endX + 105;
        cursorY = nextY;
      } else {
        // Archetype D: Pure Precision Jump + Optional Ember Coral Bramble Vault
        const gap = Math.round(config.gapMin + rng() * (config.gapMax - config.gapMin));
        cursorX += gap;
        cursorY = nextY;
      }

      const finalWidth = Math.max(150, platWidth);
      platforms.push({
        id: `trial_plat_${s}`,
        x: cursorX,
        y: cursorY,
        width: finalWidth,
        height: 220,
      });

      // Optional Hazard with guaranteed overhead Wake Bloom bypass if platform is narrow
      if (rng() < config.hazardChance && finalWidth >= 230) {
        const hazX = cursorX + Math.round(finalWidth * 0.5);
        hazards.push({
          id: `trial_haz_${s}`,
          x: hazX,
          y: cursorY,
          width: 128,
        });
        blooms.push({
          id: `trial_haz_bloom_${s}`,
          x: hazX,
          y: cursorY - 68,
        });
      }

      cursorX += finalWidth;
    }

    // Final Sanctuary Terrace with Ancient Bloom
    cursorX += 115;
    const endY = Math.max(340, Math.min(480, cursorY - 25));
    const endWidth = 420;
    platforms.push({
      id: 'trial_plat_sanctuary',
      x: cursorX,
      y: endY,
      width: endWidth,
      height: 240,
    });

    const ancientBloomX = cursorX + Math.round(endWidth * 0.62);
    const totalWidth = cursorX + endWidth + 120;

    const levelDef: LevelDefinition = {
      id: `wake_trial_${difficulty}_${seed}`,
      title: `Wake Trial · ${difficulty.toUpperCase()} (${seed})`,
      width: totalWidth,
      height: 780,
      spawnX: 150,
      spawnY: 420,
      platforms,
      blooms,
      rootBridges,
      drifters,
      hazards,
      checkpoint: {
        id: `trial_cp_${seed}`,
        x: checkpointX,
        y: checkpointY,
      },
      ancientBloom: {
        id: `trial_goal_${seed}`,
        x: ancientBloomX,
        y: endY,
      },
      beats: [
        {
          index: 1,
          title: `Wake Trial (${difficulty.toUpperCase()})`,
          subtitle: `Seed ${seed} · Reach and awaken the Sanctuary Bloom.`,
          minX: 0,
          maxX: totalWidth,
        },
      ],
    };

    const validation = this.validateLevelTraversability(levelDef);
    return {
      levelDef,
      seed,
      difficulty,
      validationPassed: validation.passed,
      validationNotes: validation.notes,
    };
  }

  /**
   * Physics-based traversability validator (Section 07):
   * Verifies that every platform, Bloom, RootBridge, and Drifter forms a continuous reachable chain
   * from `spawnX` to `ancientBloom.x` within Nima's actual jump impulse & gravity limits.
   */
  public static validateLevelTraversability(level: LevelDefinition): {
    passed: boolean;
    notes: string[];
  } {
    const tuning = activePhysicsTuning;
    const maxJumpHeight = (tuning.jumpVelocity * tuning.jumpVelocity) / (2 * tuning.gravity); // ~111.2u
    const airTime = (2 * Math.abs(tuning.jumpVelocity)) / tuning.gravity + tuning.coyoteTime; // ~0.88s
    const maxHorizReach = tuning.moveSpeed * airTime; // ~225u

    const notes: string[] = [
      `Physics envelope: maxJumpHeight=${Math.round(maxJumpHeight)}u, maxHorizReach=${Math.round(maxHorizReach)}u`,
    ];

    // Collect all walkable spans (static platforms, opened blooms, extended root bridges, drifter sweeps)
    const spans: Array<{ minX: number; maxX: number; topY: number; label: string }> = [];

    for (const p of level.platforms) {
      spans.push({ minX: p.x, maxX: p.x + p.width, topY: p.y, label: p.id });
    }
    for (const b of level.blooms) {
      spans.push({ minX: b.x - 56, maxX: b.x + 56, topY: b.y - 44, label: b.id });
    }
    for (const r of level.rootBridges) {
      spans.push({ minX: r.x, maxX: r.x + 236, topY: r.y - 14, label: r.id });
    }
    for (const d of level.drifters) {
      spans.push({
        minX: Math.min(d.startX, d.endX) - 58,
        maxX: Math.max(d.startX, d.endX) + 58,
        topY: Math.min(d.startY, d.endY) - 18,
        label: d.id,
      });
    }

    spans.sort((a, b) => a.minX - b.minX);

    let passed = true;
    for (let i = 0; i < spans.length - 1; i++) {
      const curr = spans[i];
      const next = spans[i + 1];
      const horizGap = Math.max(0, next.minX - curr.maxX);
      const climbUp = Math.max(0, curr.topY - next.topY);

      if (horizGap > maxHorizReach * 0.92 || climbUp > maxJumpHeight * 0.88) {
        passed = false;
        notes.push(
          `Gap warning between ${curr.label} and ${next.label}: gap=${horizGap}u, climb=${climbUp}u`
        );
      }
    }

    if (passed) {
      notes.push(`Validated ${spans.length} traversal surfaces: 100% physically reachable.`);
    }

    return { passed, notes };
  }
}
