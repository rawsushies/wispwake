import Phaser from 'phaser';
import { VEILGROVE_PALETTE } from '../config/palette';

/**
 * Multi-Part Painterly Sprite Atlas & Texture Generator.
 *
 * Bakes high-resolution, transparent-background sprite sheets at boot time
 * so every character, companion, creature, Wake-reactive plant, and terrain
 * platform has organic hand-painted brushwork, soft rim lighting, and multi-frame
 * skeletal kinematics matching the Wispwake Visual Bible.
 */
export class AtlasBuilder {
  public static buildAllAtlases(scene: Phaser.Scene): void {
    this.buildNimaAtlas(scene);
    this.buildPipAtlas(scene);
    this.buildDrifterAtlas(scene);
    this.buildBloomPlatformAtlas(scene);
    this.buildRootBridgeAtlas(scene);
    this.buildCheckpointAtlas(scene);
    this.buildAncientBloomAtlas(scene);
    this.buildTerrainAndVfxTextures(scene);
  }

  /**
   * Nima Sprite Sheet: 96x112 per frame, 41 frames across 6 rows (8 columns per row)
   * Row 0 (0-7): Idle (8 frames) - gentle breathing, cloak sway, warm seed pulse
   * Row 1 (8-17): Run (10 frames across 8..17) - dynamic stride, trailing leaf cloak, head bob
   * Row 2 (18-20): Jump Start (3f), (21-23): Rise (3f)
   * Row 3 (24-26): Fall (3f), (27-30): Land (4f)
   * Row 4 (31-36): Wake Cast (6f) - raising the seed, radiant golden-mint aura
   * Row 5 (37-40): Hurt/Respawn (4f) - dissolving/reforming in soft seed light
   */
  private static buildNimaAtlas(scene: Phaser.Scene): void {
    if (scene.textures.exists('nima_sheet')) return;

    const fw = 96;
    const fh = 112;
    const cols = 8;
    const rows = 6;
    const canvasTex = scene.textures.createCanvas('nima_sheet', fw * cols, fh * rows);
    if (!canvasTex) return;
    const ctx = canvasTex.getContext();

    for (let frameIdx = 0; frameIdx < 41; frameIdx++) {
      const col = frameIdx % cols;
      const row = Math.floor(frameIdx / cols);
      const ox = col * fw;
      const oy = row * fh;

      // Determine pose kinematics by frame index
      let bobY = 0;
      let leanAngle = 0;
      let cloakBillow = 0;
      let leftLegAngle = 0;
      let rightLegAngle = 0;
      let seedLift = 0;
      let seedGlowScale = 1.0;
      let eyeBlink = false;
      let alpha = 1.0;

      if (frameIdx < 8) {
        // Idle (0..7)
        const t = (frameIdx / 8) * Math.PI * 2;
        bobY = Math.sin(t) * 2.2;
        cloakBillow = Math.sin(t - 0.6) * 3;
        seedGlowScale = 0.92 + Math.sin(t) * 0.14;
        eyeBlink = frameIdx === 6;
      } else if (frameIdx < 18) {
        // Run (8..17)
        const runStep = frameIdx - 8;
        const t = (runStep / 10) * Math.PI * 2;
        bobY = -Math.abs(Math.sin(t)) * 5.5 + 1.5;
        leanAngle = 0.14;
        cloakBillow = 12 + Math.sin(t * 2) * 5;
        leftLegAngle = Math.sin(t) * 0.65;
        rightLegAngle = -Math.sin(t) * 0.65;
        seedLift = Math.cos(t) * 2;
      } else if (frameIdx < 21) {
        // Jump Start anticipation (18..20)
        const p = (frameIdx - 18) / 2;
        bobY = 5 * (1 - p);
        leanAngle = 0.08;
        cloakBillow = 4;
        leftLegAngle = -0.25;
        rightLegAngle = 0.25;
      } else if (frameIdx < 24) {
        // Rising (21..23)
        const p = frameIdx - 21;
        bobY = -4;
        leanAngle = 0.06;
        cloakBillow = -8 - p * 2;
        leftLegAngle = -0.35;
        rightLegAngle = 0.15;
        seedLift = -3;
      } else if (frameIdx < 27) {
        // Falling (24..26)
        const p = frameIdx - 24;
        bobY = -2;
        leanAngle = -0.05;
        cloakBillow = 16 + p * 2.5;
        leftLegAngle = 0.25;
        rightLegAngle = -0.2;
        seedLift = 2;
      } else if (frameIdx < 31) {
        // Landing (27..30)
        const p = (frameIdx - 27) / 3;
        bobY = Math.sin((1 - p) * Math.PI) * 5;
        cloakBillow = (1 - p) * 10;
      } else if (frameIdx < 37) {
        // Wake Cast (31..36)
        const p = (frameIdx - 31) / 5;
        const wave = Math.sin(p * Math.PI);
        bobY = -wave * 3.5;
        cloakBillow = wave * 11;
        seedLift = -wave * 8;
        seedGlowScale = 1.0 + wave * 0.95;
      } else {
        // Respawn (37..40)
        const p = (frameIdx - 37) / 3;
        bobY = (1 - p) * -10;
        seedGlowScale = 1.8 - p * 0.8;
        alpha = 0.35 + p * 0.65;
      }

      this.drawNimaFrame(ctx, ox + fw * 0.5, oy + fh - 12, {
        bobY,
        leanAngle,
        cloakBillow,
        leftLegAngle,
        rightLegAngle,
        seedLift,
        seedGlowScale,
        eyeBlink,
        alpha,
      });

      canvasTex.add(frameIdx, 0, ox, oy, fw, fh);
    }

    canvasTex.refresh();
  }

  private static drawNimaFrame(
    ctx: CanvasRenderingContext2D,
    footX: number,
    footY: number,
    pose: {
      bobY: number;
      leanAngle: number;
      cloakBillow: number;
      leftLegAngle: number;
      rightLegAngle: number;
      seedLift: number;
      seedGlowScale: number;
      eyeBlink: boolean;
      alpha: number;
    }
  ): void {
    ctx.save();
    ctx.globalAlpha = pose.alpha;
    ctx.translate(footX, footY + pose.bobY);
    ctx.rotate(pose.leanAngle);

    // 1. Soft ground shadow / ambient occlusion
    const shadowGrad = ctx.createRadialGradient(0, -pose.bobY, 2, 0, -pose.bobY, 20);
    shadowGrad.addColorStop(0, 'rgba(18, 27, 43, 0.55)');
    shadowGrad.addColorStop(1, 'rgba(18, 27, 43, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(0, -pose.bobY, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Back Cloak Fold (Dark Moss / Veil Teal inner lining)
    ctx.fillStyle = '#294D4D';
    ctx.beginPath();
    ctx.moveTo(-8, -56);
    ctx.bezierCurveTo(-24 - pose.cloakBillow * 0.8, -42, -28 - pose.cloakBillow, -20, -18 - pose.cloakBillow * 0.9, -12);
    ctx.quadraticCurveTo(0, -10, 12, -16);
    ctx.closePath();
    ctx.fill();

    // 3. Legs & Boots (Earthy brown trousers & wrapped boots)
    const drawLeg = (hipX: number, angle: number, isBack: boolean) => {
      ctx.save();
      ctx.translate(hipX, -24);
      ctx.rotate(angle);
      // Trouser leg
      ctx.fillStyle = isBack ? '#3B342E' : '#4E453D';
      ctx.beginPath();
      ctx.roundRect(-4.5, 0, 9, 15, 4);
      ctx.fill();
      // Boot wrap
      ctx.fillStyle = isBack ? '#523A28' : '#6B4C35';
      ctx.beginPath();
      ctx.roundRect(-4, 12, 9.5, 11, 3);
      ctx.fill();
      ctx.restore();
    };

    drawLeg(-4, pose.leftLegAngle, true);
    drawLeg(4, pose.rightLegAngle, false);

    // 4. Tunic & Torso
    ctx.fillStyle = '#D9D4C5';
    ctx.beginPath();
    ctx.roundRect(-10, -50, 20, 28, 7);
    ctx.fill();

    // Leather belt & small satchel (from reference sheet)
    ctx.fillStyle = '#6B4C35';
    ctx.fillRect(-10, -30, 20, 4);
    ctx.fillStyle = '#7E5A3F';
    ctx.beginPath();
    ctx.roundRect(-12, -29, 9, 10, 2.5);
    ctx.fill();

    // 5. Leaf-Shaped Forest Cloak (Signature silhouette: Soft Leaf #78906A + Moss Green #57725B + rim light)
    const cloakGrad = ctx.createLinearGradient(-15, -58, 15, -14);
    cloakGrad.addColorStop(0, '#8FA87E');
    cloakGrad.addColorStop(0.55, '#78906A');
    cloakGrad.addColorStop(1, '#57725B');

    ctx.fillStyle = cloakGrad;
    ctx.strokeStyle = '#1D2D43';
    ctx.lineWidth = 1.6;

    // Left/Back sweeping leaf mantle
    ctx.beginPath();
    ctx.moveTo(0, -56);
    ctx.bezierCurveTo(-20, -52, -24 - pose.cloakBillow * 0.7, -34, -22 - pose.cloakBillow, -14);
    ctx.quadraticCurveTo(-8 - pose.cloakBillow * 0.4, -20, -2, -26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right/Front leaf mantle
    ctx.beginPath();
    ctx.moveTo(2, -56);
    ctx.bezierCurveTo(18, -50, 20, -32, 15, -17);
    ctx.quadraticCurveTo(7, -23, 3, -32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Leaf vein embroidery detail on cloak
    ctx.strokeStyle = 'rgba(241, 200, 120, 0.35)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-4, -52);
    ctx.quadraticCurveTo(-13 - pose.cloakBillow * 0.4, -36, -17 - pose.cloakBillow * 0.7, -18);
    ctx.stroke();

    // Collar & twig clasp
    ctx.fillStyle = '#57725B';
    ctx.beginPath();
    ctx.ellipse(1, -54, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1D2D43';
    ctx.stroke();

    // 6. Slightly Oversized Expressive Head & Hair (Visual Bible Section 4.1)
    ctx.save();
    ctx.translate(1, -69);

    // Back hair wave
    ctx.fillStyle = '#3B281E';
    ctx.beginPath();
    ctx.arc(-3, -2, 16.5, 0, Math.PI * 2);
    ctx.fill();

    // Warm skin face
    const faceGrad = ctx.createRadialGradient(4, 2, 2, 1, 0, 14);
    faceGrad.addColorStop(0, '#F7DEC8');
    faceGrad.addColorStop(1, '#E2B897');
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.ellipse(2, 1, 13, 12.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2B1D16';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Rosy cheek warmth from seed light
    ctx.fillStyle = 'rgba(233, 131, 114, 0.32)';
    ctx.beginPath();
    ctx.arc(8, 4, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Golden-amber curious eyes (facing right by default; sprite flips horizontally when moving left)
    if (pose.eyeBlink) {
      ctx.strokeStyle = '#2B1D16';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.quadraticCurveTo(7, 2, 10, 0);
      ctx.stroke();
    } else {
      // Main foreground eye
      ctx.fillStyle = '#2B1D16';
      ctx.beginPath();
      ctx.ellipse(7.5, -0.5, 2.7, 3.3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Amber iris reflection
      ctx.fillStyle = '#F1C878';
      ctx.beginPath();
      ctx.arc(8.1, 0.5, 1.3, 0, Math.PI * 2);
      ctx.fill();
      // Specular catchlight
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(8.5, -1.6, 1.0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tousled Chestnut Front Hair Bangs & Locks
    ctx.fillStyle = '#4C3325';
    ctx.beginPath();
    ctx.moveTo(-14, -2);
    ctx.bezierCurveTo(-12, -16, 10, -17, 15, -5);
    ctx.quadraticCurveTo(9, -8, 3, -4);
    ctx.quadraticCurveTo(-3, -9, -8, -1);
    ctx.quadraticCurveTo(-11, 5, -14, -2);
    ctx.closePath();
    ctx.fill();

    // Subtle rim light on hair top
    ctx.strokeStyle = 'rgba(143, 231, 199, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -3, 14.5, -Math.PI * 0.8, -Math.PI * 0.2);
    ctx.stroke();

    ctx.restore();

    // 7. Living Seed Light Near Chest/Hands (Focal Point: Sap Gold #F1C878)
    const seedX = 6;
    const seedY = -41 + pose.seedLift;

    // Soft outer seed halo (never obscures face or body pose per Section 4.1)
    const glowRadius = 20 * pose.seedGlowScale;
    const seedGlow = ctx.createRadialGradient(seedX, seedY, 2, seedX, seedY, glowRadius);
    seedGlow.addColorStop(0, 'rgba(241, 200, 120, 0.85)');
    seedGlow.addColorStop(0.45, 'rgba(241, 200, 120, 0.32)');
    seedGlow.addColorStop(1, 'rgba(241, 200, 120, 0)');
    ctx.fillStyle = seedGlow;
    ctx.beginPath();
    ctx.arc(seedX, seedY, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Seed core
    ctx.fillStyle = '#FFF5D6';
    ctx.strokeStyle = '#F1C878';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(seedX, seedY, 4.5, 6.2, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cradling hand/sleeve
    ctx.fillStyle = '#E2B897';
    ctx.beginPath();
    ctx.arc(seedX - 2, seedY + 3, 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Pip Companion Sprite Sheet: 56x56 per frame, 22 frames (6 columns x 4 rows)
   * Row 0 (0-5): Hover loop
   * Row 1 (6-11): Follow movement
   * Row 2 (12-15): Curious reaction
   * Row 3 (16-21): Wake response
   */
  private static buildPipAtlas(scene: Phaser.Scene): void {
    if (scene.textures.exists('pip_sheet')) return;

    const fw = 56;
    const fh = 56;
    const cols = 6;
    const rows = 4;
    const canvasTex = scene.textures.createCanvas('pip_sheet', fw * cols, fh * rows);
    if (!canvasTex) return;
    const ctx = canvasTex.getContext();

    for (let i = 0; i < 22; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ox = col * fw;
      const oy = row * fh;
      const cx = ox + fw * 0.5;
      const cy = oy + fh * 0.5;

      const phase = (i % 6) / 6;
      const wingFlap = Math.sin(phase * Math.PI * 2);
      const isWake = i >= 16;
      const isCurious = i >= 12 && i < 16;

      ctx.save();
      ctx.translate(cx, cy);
      if (isCurious) {
        ctx.rotate(Math.sin(phase * Math.PI * 2) * 0.28);
      }

      // Outer luminous aura
      const auraRadius = isWake ? 26 : 19;
      const auraGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, auraRadius);
      auraGrad.addColorStop(0, isWake ? 'rgba(143, 231, 199, 0.9)' : 'rgba(183, 162, 232, 0.65)');
      auraGrad.addColorStop(0.5, isWake ? 'rgba(241, 200, 120, 0.4)' : 'rgba(143, 231, 199, 0.25)');
      auraGrad.addColorStop(1, 'rgba(183, 162, 232, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      // Translucent Moth Wings (Spirit Lilac #B7A2E8 + Wake Mint #8FE7C7 tips)
      const wingSpreadY = 10 + wingFlap * 7;
      ctx.fillStyle = isWake ? 'rgba(143, 231, 199, 0.88)' : 'rgba(183, 162, 232, 0.82)';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;

      // Upper left wing
      ctx.beginPath();
      ctx.moveTo(-2, -1);
      ctx.bezierCurveTo(-16, -wingSpreadY - 6, -20, -2, -4, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Upper right wing
      ctx.beginPath();
      ctx.moveTo(2, -1);
      ctx.bezierCurveTo(16, -wingSpreadY - 6, 20, -2, 4, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Fuzzy moth body & antennae
      ctx.fillStyle = '#FFF7E8';
      ctx.beginPath();
      ctx.ellipse(0, 1, 4.5, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Feathered antennae
      ctx.strokeStyle = '#8FE7C7';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-2, -5);
      ctx.quadraticCurveTo(-6, -12, -9, -10);
      ctx.moveTo(2, -5);
      ctx.quadraticCurveTo(6, -12, 9, -10);
      ctx.stroke();

      // Tiny dark eyes
      ctx.fillStyle = '#121B2B';
      ctx.beginPath();
      ctx.arc(-1.8, -1.5, 1.1, 0, Math.PI * 2);
      ctx.arc(1.8, -1.5, 1.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      canvasTex.add(i, 0, ox, oy, fw, fh);
    }

    canvasTex.refresh();
  }

  /**
   * Drifter Creature Sprite Sheet (Section 4.3 & Beat 5: Floating translucent organism acting as moving traversal aid)
   * 160x104 per frame, 12 frames (4 cols x 3 rows)
   */
  private static buildDrifterAtlas(scene: Phaser.Scene): void {
    if (scene.textures.exists('drifter_sheet')) return;

    const fw = 160;
    const fh = 104;
    const cols = 4;
    const rows = 3;
    const canvasTex = scene.textures.createCanvas('drifter_sheet', fw * cols, fh * rows);
    if (!canvasTex) return;
    const ctx = canvasTex.getContext();

    for (let i = 0; i < 12; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ox = col * fw;
      const oy = row * fh;
      const cx = ox + fw * 0.5;
      const cy = oy + 38;

      const isResonating = i >= 8;
      const phase = ((i % 8) / 8) * Math.PI * 2;
      const pulse = Math.sin(phase);

      ctx.save();
      ctx.translate(cx, cy);

      // Soft bioluminescent under-glow
      const glow = ctx.createRadialGradient(0, 6, 6, 0, 12, 68);
      glow.addColorStop(0, isResonating ? 'rgba(241, 200, 120, 0.55)' : 'rgba(143, 231, 199, 0.38)');
      glow.addColorStop(1, 'rgba(143, 231, 199, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 8, 68, 0, Math.PI * 2);
      ctx.fill();

      // Trailing translucent tendrils below the bell
      ctx.strokeStyle = isResonating ? 'rgba(241, 200, 120, 0.65)' : 'rgba(167, 184, 174, 0.55)';
      ctx.lineWidth = 2.2;
      for (let t = -3; t <= 3; t++) {
        const tx = t * 14;
        const sway = Math.sin(phase + t * 0.7) * 7;
        ctx.beginPath();
        ctx.moveTo(tx, 10);
        ctx.quadraticCurveTo(tx + sway, 32, tx - sway * 0.6, 52);
        ctx.stroke();
      }

      // Main Walkable Canopy Bell (Clear readable top edge + glowing ribs)
      const bellWidth = 64 + pulse * 3;
      const bellGrad = ctx.createLinearGradient(0, -24, 0, 18);
      bellGrad.addColorStop(0, isResonating ? '#F1C878' : '#8FE7C7');
      bellGrad.addColorStop(0.35, '#78906A');
      bellGrad.addColorStop(1, 'rgba(41, 77, 77, 0.85)');

      ctx.fillStyle = bellGrad;
      ctx.strokeStyle = isResonating ? '#FFF3D1' : '#8FE7C7';
      ctx.lineWidth = 2.2;

      ctx.beginPath();
      ctx.moveTo(-bellWidth, 10);
      ctx.bezierCurveTo(-bellWidth * 0.85, -22, bellWidth * 0.85, -22, bellWidth, 10);
      ctx.quadraticCurveTo(0, 18 + pulse * 2, -bellWidth, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Walkable mossy crown rim so players clearly read the solid top surface
      ctx.strokeStyle = '#FFFDF5';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-bellWidth * 0.78, -8);
      ctx.quadraticCurveTo(0, -19, bellWidth * 0.78, -8);
      ctx.stroke();

      // Internal bioluminescent nuclei
      ctx.fillStyle = '#F1C878';
      ctx.beginPath();
      ctx.arc(-18, 0, 3.5, 0, Math.PI * 2);
      ctx.arc(0, -3, 4.5, 0, Math.PI * 2);
      ctx.arc(18, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      canvasTex.add(i, 0, ox, oy, fw, fh);
    }

    canvasTex.refresh();
  }

  /**
   * Bloom Platform Sprite Sheet (Section 7.3: Dormant closed bud -> Awakening -> Active Bloom Platform -> Closing warning)
   * 140x120 per frame, 16 frames (4 cols x 4 rows)
   * Row 0 (0..3): Dormant closed flower bud with Wake Mint veins
   * Row 1 (4..7): Awakening unfurl transition
   * Row 2 (8..11): Active wide golden-mint platform
   * Row 3 (12..15): Closing warning shimmer
   */
  private static buildBloomPlatformAtlas(scene: Phaser.Scene): void {
    if (scene.textures.exists('bloom_platform_sheet')) return;

    const fw = 140;
    const fh = 120;
    const cols = 4;
    const rows = 4;
    const canvasTex = scene.textures.createCanvas('bloom_platform_sheet', fw * cols, fh * rows);
    if (!canvasTex) return;
    const ctx = canvasTex.getContext();

    for (let i = 0; i < 16; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ox = col * fw;
      const oy = row * fh;
      const cx = ox + fw * 0.5;
      const cy = oy + 62;

      const subPhase = (col / 4) * Math.PI * 2;
      let openRatio = 0;
      let isWarning = false;

      if (row === 0) {
        openRatio = 0.05 + Math.sin(subPhase) * 0.03;
      } else if (row === 1) {
        openRatio = 0.25 + (col / 3) * 0.75;
      } else if (row === 2) {
        openRatio = 1.0;
      } else {
        openRatio = 0.85 - col * 0.08;
        isWarning = true;
      }

      ctx.save();
      ctx.translate(cx, cy);

      // Stem & Supporting Vine Base
      ctx.strokeStyle = '#57725B';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 52);
      ctx.quadraticCurveTo(Math.sin(subPhase) * 4, 28, 0, 6);
      ctx.stroke();

      // Sepal cup
      ctx.fillStyle = '#294D4D';
      ctx.beginPath();
      ctx.arc(0, 8, 16, 0, Math.PI);
      ctx.fill();

      if (openRatio < 0.35) {
        // Closed Dormant Bud (Distinctive bulb silhouette + Wake Mint #8FE7C7 veins so shape + color identify it)
        const budGlow = ctx.createRadialGradient(0, -10, 2, 0, -10, 28);
        budGlow.addColorStop(0, 'rgba(143, 231, 199, 0.35)');
        budGlow.addColorStop(1, 'rgba(143, 231, 199, 0)');
        ctx.fillStyle = budGlow;
        ctx.beginPath();
        ctx.arc(0, -10, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#294D4D';
        ctx.strokeStyle = '#8FE7C7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -34);
        ctx.bezierCurveTo(22, -22, 20, 8, 0, 10);
        ctx.bezierCurveTo(-20, 8, -22, -22, 0, -34);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner glowing seam
        ctx.strokeStyle = '#F1C878';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, 6);
        ctx.stroke();
      } else {
        // Unfurled / Unfurling Platform State
        const span = 56 * openRatio;
        const glowRadius = 54 * openRatio;
        const bloomGlow = ctx.createRadialGradient(0, -8, 4, 0, -8, glowRadius);
        bloomGlow.addColorStop(0, isWarning ? 'rgba(233, 131, 114, 0.55)' : 'rgba(241, 200, 120, 0.65)');
        bloomGlow.addColorStop(0.6, 'rgba(143, 231, 199, 0.25)');
        bloomGlow.addColorStop(1, 'rgba(143, 231, 199, 0)');
        ctx.fillStyle = bloomGlow;
        ctx.beginPath();
        ctx.arc(0, -8, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Wide horizontal petals forming a sturdy, unmistakable landing pad
        const petalGrad = ctx.createLinearGradient(-span, -16, span, 8);
        petalGrad.addColorStop(0, isWarning && col % 2 === 0 ? '#E98372' : '#8FE7C7');
        petalGrad.addColorStop(0.5, '#F1C878');
        petalGrad.addColorStop(1, isWarning && col % 2 === 0 ? '#E98372' : '#8FE7C7');

        ctx.fillStyle = petalGrad;
        ctx.strokeStyle = '#FFF8E7';
        ctx.lineWidth = 2.2;

        // Main flat-topped bloom pad (collision top aligns at y = -14 relative to center)
        ctx.beginPath();
        ctx.moveTo(-span, -12);
        ctx.quadraticCurveTo(0, -20, span, -12);
        ctx.bezierCurveTo(span * 0.85, 10, -span * 0.85, 10, -span, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Crisp walkable top highlight bar
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-span * 0.88, -14);
        ctx.quadraticCurveTo(0, -18, span * 0.88, -14);
        ctx.stroke();
      }

      ctx.restore();
      canvasTex.add(i, 0, ox, oy, fw, fh);
    }

    canvasTex.refresh();
  }

  /**
   * Root Bridge Sprite Sheet (Section 7.3: Recessed inactive roots -> Extends into a permanent walkable route)
   * 260x84 per frame, 10 frames (2 cols x 5 rows)
   */
  private static buildRootBridgeAtlas(scene: Phaser.Scene): void {
    if (scene.textures.exists('root_bridge_sheet')) return;

    const fw = 260;
    const fh = 84;
    const cols = 2;
    const rows = 5;
    const canvasTex = scene.textures.createCanvas('root_bridge_sheet', fw * cols, fh * rows);
    if (!canvasTex) return;
    const ctx = canvasTex.getContext();

    for (let i = 0; i < 10; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ox = col * fw;
      const oy = row * fh;

      let extendRatio = 0;
      if (i < 2) {
        extendRatio = 0.14; // Coiled dormant root bulb on left edge
      } else if (i < 8) {
        extendRatio = 0.2 + ((i - 2) / 5) * 0.8;
      } else {
        extendRatio = 1.0; // Fully extended solid bridge
      }

      ctx.save();
      ctx.translate(ox + 12, oy + 42);

      const bridgeLen = 236 * extendRatio;

      // Dormant/Active Root Base Node on left anchor
      const nodeGlow = ctx.createRadialGradient(14, 0, 2, 14, 0, 28);
      nodeGlow.addColorStop(0, extendRatio >= 1 ? 'rgba(241, 200, 120, 0.55)' : 'rgba(143, 231, 199, 0.45)');
      nodeGlow.addColorStop(1, 'rgba(143, 231, 199, 0)');
      ctx.fillStyle = nodeGlow;
      ctx.beginPath();
      ctx.arc(14, 0, 28, 0, Math.PI * 2);
      ctx.fill();

      // Intertwined wooden root strands
      ctx.fillStyle = '#3B2F26';
      ctx.strokeStyle = '#1D2D43';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(0, -14, bridgeLen, 28, 12);
      ctx.fill();
      ctx.stroke();

      // Top mossy walkable carpet (#78906A Soft Leaf + #57725B Moss Green)
      const mossGrad = ctx.createLinearGradient(0, -16, 0, 0);
      mossGrad.addColorStop(0, '#8FA87E');
      mossGrad.addColorStop(1, '#57725B');
      ctx.fillStyle = mossGrad;
      ctx.beginPath();
      ctx.roundRect(2, -16, Math.max(24, bridgeLen - 4), 12, 6);
      ctx.fill();

      // Glowing Wake Mint / Sap Gold sap veins running through the bridge
      ctx.strokeStyle = extendRatio >= 1 ? '#F1C878' : '#8FE7C7';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      for (let x = 20; x < bridgeLen - 8; x += 24) {
        ctx.quadraticCurveTo(x - 12, (x % 48 === 0 ? -5 : 5), x, 0);
      }
      ctx.stroke();

      // Coiled spiral tip at the leading edge
      ctx.fillStyle = '#57725B';
      ctx.strokeStyle = '#8FE7C7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bridgeLen - 6, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
      canvasTex.add(i, 0, ox, oy, fw, fh);
    }

    canvasTex.refresh();
  }

  /**
   * Checkpoint Resonance Cairn Sprite Sheet (Section 8.3: Visually obvious checkpoint activated by proximity or Wake)
   * 96x136 per frame, 10 frames (5 cols x 2 rows)
   */
  private static buildCheckpointAtlas(scene: Phaser.Scene): void {
    if (scene.textures.exists('checkpoint_cairn_sheet')) return;

    const fw = 96;
    const fh = 136;
    const cols = 5;
    const rows = 2;
    const canvasTex = scene.textures.createCanvas('checkpoint_cairn_sheet', fw * cols, fh * rows);
    if (!canvasTex) return;
    const ctx = canvasTex.getContext();

    for (let i = 0; i < 10; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ox = col * fw;
      const oy = row * fh;
      const cx = ox + fw * 0.5;
      const by = oy + fh - 10;

      const isLit = i >= 2;
      const litStrength = i < 2 ? 0.15 : i < 6 ? (i - 1) / 5 : 1.0;
      const pulse = Math.sin((i / 4) * Math.PI * 2);

      ctx.save();
      ctx.translate(cx, by);

      if (isLit) {
        const lanternGlow = ctx.createRadialGradient(0, -64, 4, 0, -64, 44 * litStrength);
        lanternGlow.addColorStop(0, 'rgba(241, 200, 120, 0.85)');
        lanternGlow.addColorStop(0.5, 'rgba(143, 231, 199, 0.35)');
        lanternGlow.addColorStop(1, 'rgba(241, 200, 120, 0)');
        ctx.fillStyle = lanternGlow;
        ctx.beginPath();
        ctx.arc(0, -64, 44 * litStrength, 0, Math.PI * 2);
        ctx.fill();
      }

      // Carved stone & root pedestal
      ctx.fillStyle = '#294D4D';
      ctx.strokeStyle = '#121B2B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(-14, -84);
      ctx.quadraticCurveTo(0, -98, 14, -84);
      ctx.lineTo(22, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Hollow resonance chamber
      ctx.fillStyle = '#121B2B';
      ctx.beginPath();
      ctx.ellipse(0, -62, 9, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Floating seed flame inside chamber
      ctx.fillStyle = isLit ? '#F1C878' : '#8FE7C7';
      ctx.beginPath();
      ctx.ellipse(0, -62 + pulse * 2, 5 * (0.5 + litStrength * 0.6), 9 * (0.5 + litStrength * 0.6), 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      canvasTex.add(i, 0, ox, oy, fw, fh);
    }

    canvasTex.refresh();
  }

  /**
   * Ancient Bloom Landmark Sprite Sheet (Section 7.3 & Beat 7: Closed landmark -> Triggers large local restoration event)
   * 280x260 per frame, 12 frames (4 cols x 3 rows)
   */
  private static buildAncientBloomAtlas(scene: Phaser.Scene): void {
    if (scene.textures.exists('ancient_bloom_sheet')) return;

    const fw = 280;
    const fh = 260;
    const cols = 4;
    const rows = 3;
    const canvasTex = scene.textures.createCanvas('ancient_bloom_sheet', fw * cols, fh * rows);
    if (!canvasTex) return;
    const ctx = canvasTex.getContext();

    for (let i = 0; i < 12; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ox = col * fw;
      const oy = row * fh;
      const cx = ox + fw * 0.5;
      const cy = oy + fh - 48;

      const openAmount = row === 0 ? 0.12 : row === 1 ? 0.3 + (col / 3) * 0.7 : 1.0;
      const phase = (col / 4) * Math.PI * 2;

      ctx.save();
      ctx.translate(cx, cy);

      // Radiant sanctuary halo
      const haloRadius = 55 + openAmount * 75 + Math.sin(phase) * 6;
      const halo = ctx.createRadialGradient(0, -70, 8, 0, -70, haloRadius);
      halo.addColorStop(0, openAmount > 0.5 ? 'rgba(241, 200, 120, 0.92)' : 'rgba(143, 231, 199, 0.45)');
      halo.addColorStop(0.5, openAmount > 0.5 ? 'rgba(143, 231, 199, 0.45)' : 'rgba(41, 77, 77, 0.25)');
      halo.addColorStop(1, 'rgba(241, 200, 120, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, -70, haloRadius, 0, Math.PI * 2);
      ctx.fill();

      // Intertwined Ancient Root Throne
      ctx.fillStyle = '#294D4D';
      ctx.strokeStyle = '#121B2B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-85, 36);
      ctx.bezierCurveTo(-60, 0, -45, -35, 0, -35);
      ctx.bezierCurveTo(45, -35, 60, 0, 85, 36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Layered Lotus Petals
      const petalCount = 7;
      for (let p = -3; p <= 3; p++) {
        ctx.save();
        ctx.translate(0, -40);
        const spreadAngle = p * (0.16 + openAmount * 0.26);
        ctx.rotate(spreadAngle);

        const pGrad = ctx.createLinearGradient(0, -110, 0, 0);
        if (openAmount > 0.4) {
          pGrad.addColorStop(0, '#FFF6D6');
          pGrad.addColorStop(0.45, '#F1C878');
          pGrad.addColorStop(1, '#8FE7C7');
        } else {
          pGrad.addColorStop(0, '#8FE7C7');
          pGrad.addColorStop(0.5, '#57725B');
          pGrad.addColorStop(1, '#294D4D');
        }

        ctx.fillStyle = pGrad;
        ctx.strokeStyle = openAmount > 0.4 ? '#FFFDF7' : '#8FE7C7';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-28, -36, -24, -88, 0, -108);
        ctx.bezierCurveTo(24, -88, 28, -36, 0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Core heart orb when awakened
      if (openAmount > 0.5) {
        ctx.fillStyle = '#FFFDF5';
        ctx.beginPath();
        ctx.arc(0, -78 + Math.sin(phase) * 3, 16 * openAmount, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      canvasTex.add(i, 0, ox, oy, fw, fh);
    }

    canvasTex.refresh();
  }

  /**
   * Builds reusable painterly terrain platform textures, Ember Coral hazard brambles,
   * and particle/pulse textures.
   */
  private static buildTerrainAndVfxTextures(scene: Phaser.Scene): void {
    // 1. Ember Coral Bramble Hazard (Section 9.3 & 9.6: Unmistakable shape + Ember Coral #E98372)
    if (!scene.textures.exists('hazard_bramble')) {
      const bw = 128;
      const bh = 48;
      const brambleTex = scene.textures.createCanvas('hazard_bramble', bw, bh);
      if (brambleTex) {
        const ctx = brambleTex.getContext();
        // Warning glow
        const g = ctx.createLinearGradient(0, 0, 0, bh);
        g.addColorStop(0, 'rgba(233, 131, 114, 0.35)');
        g.addColorStop(1, 'rgba(18, 27, 43, 0.8)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(4, 18, bw - 8, bh - 18, 8);
        ctx.fill();

        // Sharp curved thorns with Ember Coral tips
        for (let x = 14; x <= bw - 14; x += 16) {
          ctx.fillStyle = '#E98372';
          ctx.strokeStyle = '#121B2B';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(x - 7, bh - 4);
          ctx.quadraticCurveTo(x - 2, 12, x + 3, 4);
          ctx.quadraticCurveTo(x + 6, 18, x + 7, bh - 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Bright warning highlight tip
          ctx.fillStyle = '#FFD3C9';
          ctx.beginPath();
          ctx.arc(x + 2, 8, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        brambleTex.refresh();
      }
    }

    // 2. Soft Spore / Firefly Mote Particle
    if (!scene.textures.exists('vfx_spore')) {
      const sporeTex = scene.textures.createCanvas('vfx_spore', 32, 32);
      if (sporeTex) {
        const ctx = sporeTex.getContext();
        const grad = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
        grad.addColorStop(0, 'rgba(255, 250, 230, 1)');
        grad.addColorStop(0.4, 'rgba(143, 231, 199, 0.75)');
        grad.addColorStop(1, 'rgba(143, 231, 199, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(16, 16, 15, 0, Math.PI * 2);
        ctx.fill();
        sporeTex.refresh();
      }
    }

    // 3. Wake Pulse Ring Sprite
    if (!scene.textures.exists('vfx_wake_ring')) {
      const ringTex = scene.textures.createCanvas('vfx_wake_ring', 256, 256);
      if (ringTex) {
        const ctx = ringTex.getContext();
        const cx = 128;
        const cy = 128;
        const grad = ctx.createRadialGradient(cx, cy, 70, cx, cy, 124);
        grad.addColorStop(0, 'rgba(143, 231, 199, 0)');
        grad.addColorStop(0.65, 'rgba(143, 231, 199, 0.25)');
        grad.addColorStop(0.88, 'rgba(241, 200, 120, 0.85)');
        grad.addColorStop(0.96, 'rgba(143, 231, 199, 0.95)');
        grad.addColorStop(1, 'rgba(143, 231, 199, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 124, 0, Math.PI * 2);
        ctx.fill();
        ringTex.refresh();
      }
    }
  }

  /**
   * Renders a bespoke painterly mossy root platform texture of exact width & height
   * so every walkable surface has a crisp, readable top edge and shadowed bark underside
   * (Section 9.6 Platform and hazard readability).
   */
  public static getOrCreatePlatformTexture(
    scene: Phaser.Scene,
    width: number,
    height: number,
    restored = false
  ): string {
    const key = `plat_${Math.round(width)}_${Math.round(height)}_${restored ? 'warm' : 'cool'}`;
    if (scene.textures.exists(key)) return key;

    const canvasTex = scene.textures.createCanvas(key, width, height);
    if (!canvasTex) return '';
    const ctx = canvasTex.getContext();

    // 1. Deep bark underside body
    const bodyGrad = ctx.createLinearGradient(0, 0, 0, height);
    bodyGrad.addColorStop(0, '#294D4D');
    bodyGrad.addColorStop(0.35, '#1D2D43');
    bodyGrad.addColorStop(1, '#121B2B');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#121B2B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(1, 4, width - 2, height - 6, 12);
    ctx.fill();
    ctx.stroke();

    // Organic root striations along the underside
    ctx.strokeStyle = 'rgba(41, 77, 77, 0.45)';
    ctx.lineWidth = 2;
    for (let x = 24; x < width - 24; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x, 16);
      ctx.quadraticCurveTo(x + 14, height * 0.55, x - 6, height - 6);
      ctx.stroke();
    }

    // 2. Distinct Walkable Moss Top Cap (Soft Leaf #78906A / Moss Green #57725B)
    const topCapHeight = Math.min(18, Math.max(12, height * 0.28));
    const mossGrad = ctx.createLinearGradient(0, 0, 0, topCapHeight);
    if (restored) {
      mossGrad.addColorStop(0, '#A5C084');
      mossGrad.addColorStop(0.6, '#78906A');
      mossGrad.addColorStop(1, '#57725B');
    } else {
      mossGrad.addColorStop(0, '#78906A');
      mossGrad.addColorStop(0.65, '#57725B');
      mossGrad.addColorStop(1, '#294D4D');
    }

    ctx.fillStyle = mossGrad;
    ctx.beginPath();
    ctx.roundRect(1, 1, width - 2, topCapHeight, [10, 10, 4, 4]);
    ctx.fill();

    // 3. High-contrast rim highlight along exact top collision edge (y = 2)
    ctx.strokeStyle = restored ? VEILGROVE_PALETTE.sapGold : VEILGROVE_PALETTE.paleMist;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(10, 2.5);
    ctx.lineTo(width - 10, 2.5);
    ctx.stroke();

    canvasTex.refresh();
    return key;
  }
}
