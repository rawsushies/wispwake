import Phaser from 'phaser';
import { CharacterArtManager } from './CharacterArtManager';
import { TerrainVisualAssembler } from './TerrainVisualAssembler';

/**
 * AtlasBuilder — Coordinates character, creature, interactive flora, environmental hazards,
 * and organic terrain texture generation at scene boot.
 *
 * Milestone 5 Upgrade:
 * - Strictly clips every atlas cell (`ctx.rect(ox, oy, fw, fh); ctx.clip()`) and bounds all
 *   radial gradients well inside cell borders so no sprite ever exhibits a rectangular glow edge.
 * - Adds organic textures for Crumbling Surfaces (`crumbling_platform_sheet`),
 *   Spore Vents (`spore_vent_sheet`), Falling Debris (`falling_debris_sheet`),
 *   and Memory Echo lore shrines (`memory_echo_sheet`).
 */
export class AtlasBuilder {
  public static buildAllAtlases(scene: Phaser.Scene): void {
    const builtPaintedNima = CharacterArtManager.buildNimaAtlasFromMaster(scene);
    if (!builtPaintedNima) {
      this.buildFallbackNimaAtlas(scene);
    }

    const builtPaintedPip = CharacterArtManager.buildPipAtlasFromMaster(scene);
    if (!builtPaintedPip) {
      this.buildFallbackPipAtlas(scene);
    }

    this.buildDrifterAtlas(scene);
    this.buildBloomPlatformAtlas(scene);
    this.buildRootBridgeAtlas(scene);
    this.buildCheckpointAtlas(scene);
    this.buildAncientBloomAtlas(scene);
    this.buildCrumblingPlatformAtlas(scene);
    this.buildSporeVentAtlas(scene);
    this.buildFallingDebrisAtlas(scene);
    this.buildMemoryEchoAtlas(scene);
    TerrainVisualAssembler.buildOrganicHazardTexture(scene);
    this.buildVfxTextures(scene);
  }

  private static buildFallbackNimaAtlas(scene: Phaser.Scene): void {
    if (scene.textures.exists('nima_sheet')) return;
    const fw = 96;
    const fh = 112;
    const canvasTex = scene.textures.createCanvas('nima_sheet', fw * 8, fh * 6);
    if (!canvasTex) return;
    for (let i = 0; i < 41; i++) {
      canvasTex.add(i, 0, (i % 8) * fw, Math.floor(i / 8) * fh, fw, fh);
    }
    canvasTex.refresh();
  }

  private static buildFallbackPipAtlas(scene: Phaser.Scene): void {
    if (scene.textures.exists('pip_sheet')) return;
    const fw = 56;
    const fh = 56;
    const canvasTex = scene.textures.createCanvas('pip_sheet', fw * 6, fh * 4);
    if (!canvasTex) return;
    for (let i = 0; i < 22; i++) {
      canvasTex.add(i, 0, (i % 6) * fw, Math.floor(i / 6) * fh, fw, fh);
    }
    canvasTex.refresh();
  }

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
      const cy = oy + 42;

      const isResonating = i >= 8;
      const phase = ((i % 8) / 8) * Math.PI * 2;
      const pulse = Math.sin(phase);

      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, oy, fw, fh);
      ctx.clip();
      ctx.translate(cx, cy);

      // Strictly bounded radial glow (radius 36 <= 42 top margin)
      const glow = ctx.createRadialGradient(0, 4, 4, 0, 4, 36);
      glow.addColorStop(0, isResonating ? 'rgba(241, 200, 120, 0.45)' : 'rgba(143, 231, 199, 0.32)');
      glow.addColorStop(0.65, isResonating ? 'rgba(241, 200, 120, 0.14)' : 'rgba(143, 231, 199, 0.10)');
      glow.addColorStop(1, 'rgba(143, 231, 199, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 4, 36, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isResonating ? 'rgba(241, 200, 120, 0.65)' : 'rgba(167, 184, 174, 0.55)';
      ctx.lineWidth = 2.2;
      for (let t = -3; t <= 3; t++) {
        const tx = t * 14;
        const sway = Math.sin(phase + t * 0.7) * 7;
        ctx.beginPath();
        ctx.moveTo(tx, 10);
        ctx.quadraticCurveTo(tx + sway, 30, tx - sway * 0.6, 48);
        ctx.stroke();
      }

      const bellWidth = 62 + pulse * 2.5;
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

      ctx.strokeStyle = '#FFFDF5';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-bellWidth * 0.78, -8);
      ctx.quadraticCurveTo(0, -19, bellWidth * 0.78, -8);
      ctx.stroke();

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
      ctx.beginPath();
      ctx.rect(ox, oy, fw, fh);
      ctx.clip();
      ctx.translate(cx, cy);

      ctx.strokeStyle = '#57725B';
      ctx.lineWidth = 6.5;
      ctx.beginPath();
      ctx.moveTo(0, 50);
      ctx.quadraticCurveTo(Math.sin(subPhase) * 4, 28, 0, 6);
      ctx.stroke();

      ctx.fillStyle = '#78906A';
      ctx.beginPath();
      ctx.ellipse(-10, 28, 8, 3.5, -0.4, 0, Math.PI * 2);
      ctx.ellipse(10, 22, 8, 3.5, 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#294D4D';
      ctx.beginPath();
      ctx.arc(0, 8, 17, 0, Math.PI);
      ctx.fill();

      if (openRatio < 0.35) {
        const budGlow = ctx.createRadialGradient(0, -10, 2, 0, -10, 26);
        budGlow.addColorStop(0, 'rgba(143, 231, 199, 0.36)');
        budGlow.addColorStop(1, 'rgba(143, 231, 199, 0)');
        ctx.fillStyle = budGlow;
        ctx.beginPath();
        ctx.arc(0, -10, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#294D4D';
        ctx.strokeStyle = '#8FE7C7';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, -34);
        ctx.bezierCurveTo(22, -22, 20, 8, 0, 10);
        ctx.bezierCurveTo(-20, 8, -22, -22, 0, -34);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#F1C878';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, 6);
        ctx.stroke();
      } else {
        const span = 54 * openRatio;
        const glowRadius = 42 * openRatio;
        const bloomGlow = ctx.createRadialGradient(0, -8, 4, 0, -8, glowRadius);
        bloomGlow.addColorStop(0, isWarning ? 'rgba(233, 131, 114, 0.52)' : 'rgba(241, 200, 120, 0.58)');
        bloomGlow.addColorStop(0.6, 'rgba(143, 231, 199, 0.22)');
        bloomGlow.addColorStop(1, 'rgba(143, 231, 199, 0)');
        ctx.fillStyle = bloomGlow;
        ctx.beginPath();
        ctx.arc(0, -8, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        const petalGrad = ctx.createLinearGradient(-span, -16, span, 8);
        petalGrad.addColorStop(0, isWarning && col % 2 === 0 ? '#E98372' : '#8FE7C7');
        petalGrad.addColorStop(0.5, '#F1C878');
        petalGrad.addColorStop(1, isWarning && col % 2 === 0 ? '#E98372' : '#8FE7C7');

        ctx.fillStyle = petalGrad;
        ctx.strokeStyle = '#FFF8E7';
        ctx.lineWidth = 2.2;

        ctx.beginPath();
        ctx.moveTo(-span, -12);
        ctx.quadraticCurveTo(0, -20, span, -12);
        ctx.bezierCurveTo(span * 0.85, 10, -span * 0.85, 10, -span, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

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
        extendRatio = 0.14;
      } else if (i < 8) {
        extendRatio = 0.2 + ((i - 2) / 5) * 0.8;
      } else {
        extendRatio = 1.0;
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, oy, fw, fh);
      ctx.clip();
      ctx.translate(ox + 16, oy + 42);

      const bridgeLen = 228 * extendRatio;

      const nodeGlow = ctx.createRadialGradient(14, 0, 2, 14, 0, 24);
      nodeGlow.addColorStop(0, extendRatio >= 1 ? 'rgba(241, 200, 120, 0.50)' : 'rgba(143, 231, 199, 0.40)');
      nodeGlow.addColorStop(1, 'rgba(143, 231, 199, 0)');
      ctx.fillStyle = nodeGlow;
      ctx.beginPath();
      ctx.arc(14, 0, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3B2F26';
      ctx.strokeStyle = '#1D2D43';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(0, -14, bridgeLen, 28, 12);
      ctx.fill();
      ctx.stroke();

      const mossGrad = ctx.createLinearGradient(0, -16, 0, 0);
      mossGrad.addColorStop(0, '#8FA87E');
      mossGrad.addColorStop(1, '#57725B');
      ctx.fillStyle = mossGrad;
      ctx.beginPath();
      ctx.roundRect(2, -16, Math.max(24, bridgeLen - 4), 12, 6);
      ctx.fill();

      ctx.strokeStyle = extendRatio >= 1 ? '#F1C878' : '#8FE7C7';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      for (let x = 20; x < bridgeLen - 8; x += 24) {
        ctx.quadraticCurveTo(x - 12, x % 48 === 0 ? -5 : 5, x, 0);
      }
      ctx.stroke();

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
      ctx.beginPath();
      ctx.rect(ox, oy, fw, fh);
      ctx.clip();
      ctx.translate(cx, by);

      if (isLit) {
        const radius = 38 * litStrength;
        const lanternGlow = ctx.createRadialGradient(0, -64, 3, 0, -64, radius);
        lanternGlow.addColorStop(0, 'rgba(241, 200, 120, 0.78)');
        lanternGlow.addColorStop(0.55, 'rgba(143, 231, 199, 0.28)');
        lanternGlow.addColorStop(1, 'rgba(241, 200, 120, 0)');
        ctx.fillStyle = lanternGlow;
        ctx.beginPath();
        ctx.arc(0, -64, radius, 0, Math.PI * 2);
        ctx.fill();
      }

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

      ctx.fillStyle = '#121B2B';
      ctx.beginPath();
      ctx.ellipse(0, -62, 9, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isLit ? '#F1C878' : '#8FE7C7';
      ctx.beginPath();
      ctx.ellipse(
        0,
        -62 + pulse * 2,
        5 * (0.5 + litStrength * 0.6),
        9 * (0.5 + litStrength * 0.6),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.restore();
      canvasTex.add(i, 0, ox, oy, fw, fh);
    }

    canvasTex.refresh();
  }

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
      ctx.beginPath();
      ctx.rect(ox, oy, fw, fh);
      ctx.clip();
      ctx.translate(cx, cy);

      // Strictly bounded inside cell (distance to top edge is 142px, so max radius 115px)
      const haloRadius = 48 + openAmount * 60 + Math.sin(phase) * 4;
      const halo = ctx.createRadialGradient(0, -70, 8, 0, -70, haloRadius);
      halo.addColorStop(0, openAmount > 0.5 ? 'rgba(241, 200, 120, 0.85)' : 'rgba(143, 231, 199, 0.42)');
      halo.addColorStop(0.55, openAmount > 0.5 ? 'rgba(143, 231, 199, 0.36)' : 'rgba(41, 77, 77, 0.20)');
      halo.addColorStop(1, 'rgba(241, 200, 120, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, -70, haloRadius, 0, Math.PI * 2);
      ctx.fill();

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

  private static buildCrumblingPlatformAtlas(scene: Phaser.Scene): void {
    if (scene.textures.exists('crumbling_platform_sheet')) return;

    const fw = 160;
    const fh = 52;
    const cols = 4;
    const canvasTex = scene.textures.createCanvas('crumbling_platform_sheet', fw * cols, fh);
    if (!canvasTex) return;
    const ctx = canvasTex.getContext();

    for (let i = 0; i < 4; i++) {
      const ox = i * fw;
      const oy = 0;
      const crackIntensity = i / 3;

      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, oy, fw, fh);
      ctx.clip();
      ctx.translate(ox + 8, oy + 6);

      // Ancient fractured bark/stone slab
      const slabGrad = ctx.createLinearGradient(0, 0, 0, 36);
      slabGrad.addColorStop(0, i >= 2 ? '#C9876E' : '#6A7B6E');
      slabGrad.addColorStop(0.35, '#424E58');
      slabGrad.addColorStop(1, '#222B38');

      ctx.fillStyle = slabGrad;
      ctx.strokeStyle = i >= 1 ? '#F1C878' : '#8FA87E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(0, 0, 144, 34, 9);
      ctx.fill();
      ctx.stroke();

      // Glowing fracture lines that brighten as it prepares to crumble
      ctx.strokeStyle = i === 0 ? 'rgba(143, 231, 199, 0.35)' : `rgba(241, 200, 120, ${0.45 + crackIntensity * 0.5})`;
      ctx.lineWidth = 1.6 + crackIntensity * 1.4;
      ctx.beginPath();
      ctx.moveTo(32, 2);
      ctx.lineTo(44, 18);
      ctx.lineTo(36, 32);
      ctx.moveTo(86, 2);
      ctx.lineTo(76, 17);
      ctx.lineTo(92, 32);
      ctx.moveTo(116, 4);
      ctx.lineTo(108, 26);
      ctx.stroke();

      ctx.restore();
      canvasTex.add(i, 0, ox, oy, fw, fh);
    }

    canvasTex.refresh();
  }

  private static buildSporeVentAtlas(scene: Phaser.Scene): void {
    if (scene.textures.exists('spore_vent_sheet')) return;

    const fw = 76;
    const fh = 64;
    const cols = 3;
    const canvasTex = scene.textures.createCanvas('spore_vent_sheet', fw * cols, fh);
    if (!canvasTex) return;
    const ctx = canvasTex.getContext();

    for (let i = 0; i < 3; i++) {
      const ox = i * fw;
      const cx = ox + fw * 0.5;
      const by = fh - 6;

      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, 0, fw, fh);
      ctx.clip();
      ctx.translate(cx, by);

      // Vent chimney mound
      ctx.fillStyle = '#2A3846';
      ctx.strokeStyle = i === 0 ? '#57725B' : i === 1 ? '#F1C878' : '#E98372';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-28, 0);
      ctx.quadraticCurveTo(-20, -34, -12, -40);
      ctx.lineTo(12, -40);
      ctx.quadraticCurveTo(20, -34, 28, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner glowing throat
      ctx.fillStyle = i === 0 ? '#294D4D' : i === 1 ? '#F1C878' : '#FF9E80';
      ctx.beginPath();
      ctx.ellipse(0, -38, 10, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      canvasTex.add(i, 0, ox, 0, fw, fh);
    }

    canvasTex.refresh();
  }

  private static buildFallingDebrisAtlas(scene: Phaser.Scene): void {
    if (scene.textures.exists('falling_debris_sheet')) return;

    const fw = 48;
    const fh = 68;
    const canvasTex = scene.textures.createCanvas('falling_debris_sheet', fw * 2, fh);
    if (!canvasTex) return;
    const ctx = canvasTex.getContext();

    for (let i = 0; i < 2; i++) {
      const ox = i * fw;
      const cx = ox + fw * 0.5;

      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, 0, fw, fh);
      ctx.clip();
      ctx.translate(cx, 6);

      ctx.fillStyle = '#364554';
      ctx.strokeStyle = i === 1 ? '#F1C878' : '#8FE7C7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(16, 0);
      ctx.lineTo(8, 34);
      ctx.lineTo(0, 56);
      ctx.lineTo(-8, 34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
      canvasTex.add(i, 0, ox, 0, fw, fh);
    }

    canvasTex.refresh();
  }

  private static buildMemoryEchoAtlas(scene: Phaser.Scene): void {
    if (scene.textures.exists('memory_echo_sheet')) return;

    const fw = 88;
    const fh = 104;
    const cols = 4;
    const canvasTex = scene.textures.createCanvas('memory_echo_sheet', fw * cols, fh);
    if (!canvasTex) return;
    const ctx = canvasTex.getContext();

    for (let i = 0; i < 4; i++) {
      const ox = i * fw;
      const cx = ox + fw * 0.5;
      const cy = fh * 0.52;
      const awakened = i >= 2;
      const pulse = (i % 2) * 3;

      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, 0, fw, fh);
      ctx.clip();
      ctx.translate(cx, cy);

      const halo = ctx.createRadialGradient(0, -4, 3, 0, -4, 34);
      halo.addColorStop(0, awakened ? 'rgba(241, 200, 120, 0.72)' : 'rgba(143, 231, 199, 0.45)');
      halo.addColorStop(1, 'rgba(143, 231, 199, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, -4, 34, 0, Math.PI * 2);
      ctx.fill();

      // Floating memory crystal / seed chime
      ctx.fillStyle = awakened ? '#F1C878' : '#8FE7C7';
      ctx.strokeStyle = '#FFFDF5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -26 - pulse);
      ctx.quadraticCurveTo(16, -6, 0, 20 + pulse);
      ctx.quadraticCurveTo(-16, -6, 0, -26 - pulse);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
      canvasTex.add(i, 0, ox, 0, fw, fh);
    }

    canvasTex.refresh();
  }

  private static buildVfxTextures(scene: Phaser.Scene): void {
    if (!scene.textures.exists('vfx_spore')) {
      const sporeTex = scene.textures.createCanvas('vfx_spore', 32, 32);
      if (sporeTex) {
        const ctx = sporeTex.getContext();
        const grad = ctx.createRadialGradient(16, 16, 1, 16, 16, 14);
        grad.addColorStop(0, 'rgba(255, 250, 230, 1)');
        grad.addColorStop(0.4, 'rgba(143, 231, 199, 0.75)');
        grad.addColorStop(1, 'rgba(143, 231, 199, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, Math.PI * 2);
        ctx.fill();
        sporeTex.refresh();
      }
    }
  }
}
