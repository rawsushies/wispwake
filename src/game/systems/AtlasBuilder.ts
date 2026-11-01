import Phaser from 'phaser';
import { CharacterArtManager } from './CharacterArtManager';
import { TerrainVisualAssembler } from './TerrainVisualAssembler';

/**
 * AtlasBuilder — Coordinates character, creature, interactive flora, and organic terrain
 * texture generation at scene boot.
 *
 * Milestone 3 Update:
 * - Delegates Nima (`nima_sheet`) and Pip (`pip_sheet`) directly to `CharacterArtManager`
 *   using the canonical hand-painted reference illustrations (`nima_side_gameplay_master`
 *   and `pip_gameplay_master`), with fallback procedural generation only if an image is still loading.
 * - Delegates organic terrain and gnarled Ember Coral brambles to `TerrainVisualAssembler`.
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
      const cy = oy + 38;

      const isResonating = i >= 8;
      const phase = ((i % 8) / 8) * Math.PI * 2;
      const pulse = Math.sin(phase);

      ctx.save();
      ctx.translate(cx, cy);

      const glow = ctx.createRadialGradient(0, 6, 6, 0, 12, 68);
      glow.addColorStop(0, isResonating ? 'rgba(241, 200, 120, 0.55)' : 'rgba(143, 231, 199, 0.38)');
      glow.addColorStop(1, 'rgba(143, 231, 199, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 8, 68, 0, Math.PI * 2);
      ctx.fill();

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
      ctx.translate(cx, cy);

      // Rooted botanical stem with small side leaves
      ctx.strokeStyle = '#57725B';
      ctx.lineWidth = 6.5;
      ctx.beginPath();
      ctx.moveTo(0, 52);
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
        const budGlow = ctx.createRadialGradient(0, -10, 2, 0, -10, 30);
        budGlow.addColorStop(0, 'rgba(143, 231, 199, 0.4)');
        budGlow.addColorStop(1, 'rgba(143, 231, 199, 0)');
        ctx.fillStyle = budGlow;
        ctx.beginPath();
        ctx.arc(0, -10, 30, 0, Math.PI * 2);
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
        const span = 56 * openRatio;
        const glowRadius = 56 * openRatio;
        const bloomGlow = ctx.createRadialGradient(0, -8, 4, 0, -8, glowRadius);
        bloomGlow.addColorStop(0, isWarning ? 'rgba(233, 131, 114, 0.58)' : 'rgba(241, 200, 120, 0.7)');
        bloomGlow.addColorStop(0.6, 'rgba(143, 231, 199, 0.28)');
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
      ctx.translate(ox + 12, oy + 42);

      const bridgeLen = 236 * extendRatio;

      const nodeGlow = ctx.createRadialGradient(14, 0, 2, 14, 0, 28);
      nodeGlow.addColorStop(0, extendRatio >= 1 ? 'rgba(241, 200, 120, 0.55)' : 'rgba(143, 231, 199, 0.45)');
      nodeGlow.addColorStop(1, 'rgba(143, 231, 199, 0)');
      ctx.fillStyle = nodeGlow;
      ctx.beginPath();
      ctx.arc(14, 0, 28, 0, Math.PI * 2);
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
      ctx.translate(cx, cy);

      const haloRadius = 55 + openAmount * 75 + Math.sin(phase) * 6;
      const halo = ctx.createRadialGradient(0, -70, 8, 0, -70, haloRadius);
      halo.addColorStop(0, openAmount > 0.5 ? 'rgba(241, 200, 120, 0.92)' : 'rgba(143, 231, 199, 0.45)');
      halo.addColorStop(0.5, openAmount > 0.5 ? 'rgba(143, 231, 199, 0.45)' : 'rgba(41, 77, 77, 0.25)');
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

  private static buildVfxTextures(scene: Phaser.Scene): void {
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
}
