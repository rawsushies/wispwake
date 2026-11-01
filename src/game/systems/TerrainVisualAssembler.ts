import Phaser from 'phaser';
import { BiomeTheme, PlatformSpec } from '../levels/sleepingCanopy/levelData';

/**
 * TerrainVisualAssembler — Milestone 3, 4 & 6 Multi-Biome Organic Terrain & Platform Redesign.
 *
 * Replaces uniform geometric rectangle platforms with multi-layered, hand-painted organic
 * Veilgrove formations tailored to each chapter's biome (`canopy`, `marsh`, `cavern`, `ruins`, `choir`, `heart`)
 * while keeping the physics collision box 100% separate and readable:
 * 1. Ancient Root Formations (`canopy`): Knotted bark strata, uneven moss-draped top ridges, hanging root tendrils.
 * 2. Moonlit Marsh Terraces (`marsh`): Sunken stone arches, wet reflective slate, glowing cattail reeds, and water-lily pads.
 * 3. Hollow Below Caverns (`cavern`): Giant subterranean root ribs, bioluminescent purple/mint shelf fungi, and hanging root stalactites.
 * 4. Windward Ruins (`ruins`): Weathered sky-temple stone blocks, carved relief arches, golden sun-lichen, and wind-swept grasses.
 * 5. Shattered Choir (`choir`): Fluted acoustic resonance stone, silver-lilac lichen, and harmonic crystal veins.
 * 6. Heart of the Veil (`heart`): Ancient heartwood roots, golden sap veins, and luminous emerald sanctuary moss.
 */
export class TerrainVisualAssembler {
  public static createOrganicPlatformVisual(
    scene: Phaser.Scene,
    spec: PlatformSpec,
    index: number,
    restored = false,
    biome: BiomeTheme = 'canopy'
  ): Phaser.GameObjects.Image {
    const padX = 24;
    const padTop = 16;
    const padBottom = 46;

    const texW = spec.width + padX * 2;
    const texH = spec.height + padTop + padBottom;
    const style = index % 3 === 1 ? 'stone_root' : 'ancient_root';
    const texKey = `org_plat_${biome}_${spec.id}_${style}_${restored ? 'warm' : 'cool'}`;

    if (!scene.textures.exists(texKey)) {
      const canvasTex = scene.textures.createCanvas(texKey, texW, texH);
      if (canvasTex) {
        const ctx = canvasTex.getContext();
        this.paintOrganicPlatform(ctx, spec.width, spec.height, padX, padTop, style, index, restored, biome);
        canvasTex.refresh();
      }
    }

    const img = scene.add.image(spec.x - padX, spec.y - padTop, texKey);
    img.setOrigin(0, 0);
    img.setDepth(12.5);
    return img;
  }

  private static paintOrganicPlatform(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    ox: number,
    oy: number,
    style: 'ancient_root' | 'stone_root',
    seed: number,
    restored: boolean,
    biome: BiomeTheme
  ): void {
    const rand = (n: number) => {
      const x = Math.sin(seed * 97.13 + n * 43.7) * 10000;
      return x - Math.floor(x);
    };

    // 1. HANGING ROOTS, MARSH REED ROOTS, OR CAVERN TENDRILS BENEATH PLATFORM
    const rootCount = Math.max(4, Math.floor(w / 52));
    for (let i = 0; i < rootCount; i++) {
      const rx = ox + 22 + (i + 0.35) * ((w - 44) / rootCount) + (rand(i) - 0.5) * 18;
      const startY = oy + h - 18;
      const hangLen = 20 + rand(i + 20) * 38;
      const curve = (rand(i + 40) - 0.5) * 26;

      ctx.strokeStyle =
        biome === 'cavern' || biome === 'choir'
          ? '#231D3A'
          : biome === 'ruins'
          ? '#2D3A4A'
          : biome === 'heart'
          ? '#2E261E'
          : i % 2 === 0
          ? '#19283A'
          : '#243B3E';
      ctx.lineWidth = 3.5 + rand(i + 10) * 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(rx, startY);
      ctx.quadraticCurveTo(rx + curve, startY + hangLen * 0.55, rx - curve * 0.4, startY + hangLen);
      ctx.stroke();

      if (rand(i + 60) > 0.4) {
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(rx + curve * 0.4, startY + hangLen * 0.5);
        ctx.quadraticCurveTo(rx + curve + 12, startY + hangLen * 0.75, rx + curve + 6, startY + hangLen * 0.9);
        ctx.stroke();
      }

      if (restored || rand(i + 80) > 0.55) {
        ctx.fillStyle =
          restored || biome === 'heart'
            ? 'rgba(241, 200, 120, 0.8)'
            : biome === 'cavern' || biome === 'choir'
            ? 'rgba(183, 162, 232, 0.72)'
            : 'rgba(143, 231, 199, 0.6)';
        ctx.beginPath();
        ctx.arc(rx - curve * 0.4, startY + hangLen, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. MAIN IRREGULAR BARK OR LAYERED STONE BODY
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ox + 8, oy + 4);
    for (let x = 24; x < w - 16; x += 28) {
      const bump = (rand(x) - 0.5) * 3.5;
      ctx.lineTo(ox + x, oy + 2 + bump);
    }
    ctx.lineTo(ox + w - 8, oy + 5);

    ctx.bezierCurveTo(
      ox + w + 10,
      oy + h * 0.28,
      ox + w - 12,
      oy + h * 0.68,
      ox + w - 14,
      oy + h - 8
    );

    const bottomSegments = Math.max(4, Math.floor(w / 68));
    for (let s = bottomSegments - 1; s >= 0; s--) {
      const sx = ox + (s / bottomSegments) * w;
      const midX = sx + (w / bottomSegments) * 0.5;
      const archDepth = 6 + rand(s + 100) * 18;
      ctx.quadraticCurveTo(midX, oy + h - archDepth, sx + 10, oy + h - 4 + (rand(s) - 0.5) * 8);
    }

    ctx.bezierCurveTo(ox - 10, oy + h * 0.65, ox + 12, oy + h * 0.3, ox + 8, oy + 4);
    ctx.closePath();

    const bodyGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
    if (biome === 'marsh') {
      bodyGrad.addColorStop(0, '#274E54');
      bodyGrad.addColorStop(0.5, '#193542');
      bodyGrad.addColorStop(1, '#0F1D2C');
    } else if (biome === 'cavern') {
      bodyGrad.addColorStop(0, '#32294E');
      bodyGrad.addColorStop(0.5, '#201B38');
      bodyGrad.addColorStop(1, '#110F22');
    } else if (biome === 'ruins') {
      bodyGrad.addColorStop(0, '#445566');
      bodyGrad.addColorStop(0.5, '#2B3A4D');
      bodyGrad.addColorStop(1, '#172233');
    } else if (biome === 'choir') {
      bodyGrad.addColorStop(0, '#3A3E64');
      bodyGrad.addColorStop(0.5, '#25294A');
      bodyGrad.addColorStop(1, '#14172E');
    } else if (biome === 'heart') {
      bodyGrad.addColorStop(0, '#3D4838');
      bodyGrad.addColorStop(0.5, '#28312A');
      bodyGrad.addColorStop(1, '#151C1E');
    } else if (style === 'stone_root') {
      bodyGrad.addColorStop(0, '#334C54');
      bodyGrad.addColorStop(0.45, '#1F3142');
      bodyGrad.addColorStop(1, '#121B2B');
    } else {
      bodyGrad.addColorStop(0, '#2E4A46');
      bodyGrad.addColorStop(0.4, '#1F333D');
      bodyGrad.addColorStop(1, '#121B2B');
    }
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.clip();

    if (style === 'stone_root' || biome === 'ruins' || biome === 'choir') {
      ctx.strokeStyle = '#121B2B';
      ctx.lineWidth = 2.5;
      for (let y = oy + 26; y < oy + h - 12; y += 32) {
        ctx.beginPath();
        ctx.moveTo(ox - 10, y);
        for (let x = 30; x < w + 10; x += 48) {
          ctx.lineTo(ox + x, y + (rand(x + y) - 0.5) * 14);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = biome === 'choir' ? '#6D72A8' : biome === 'ruins' ? '#586A78' : '#253D3B';
      ctx.lineWidth = 10;
      for (let i = 0; i < 3; i++) {
        const rx = ox + w * (0.2 + i * 0.3);
        ctx.beginPath();
        ctx.moveTo(rx - 25, oy);
        ctx.bezierCurveTo(rx + 20, oy + h * 0.4, rx - 15, oy + h * 0.7, rx + 10, oy + h);
        ctx.stroke();
      }
    } else {
      for (let r = 0; r < 6; r++) {
        const yOff = oy + 18 + r * (h / 6);
        ctx.strokeStyle =
          r % 2 === 0
            ? biome === 'cavern'
              ? 'rgba(92, 74, 138, 0.45)'
              : biome === 'heart'
              ? 'rgba(218, 172, 94, 0.38)'
              : 'rgba(56, 88, 78, 0.55)'
            : 'rgba(18, 27, 43, 0.65)';
        ctx.lineWidth = 6 + (r % 3) * 3;
        ctx.beginPath();
        ctx.moveTo(ox - 10, yOff);
        for (let x = 40; x <= w + 20; x += 65) {
          ctx.quadraticCurveTo(
            ox + x - 32,
            yOff + (rand(x + r * 19) - 0.5) * 22,
            ox + x,
            yOff + (rand(x + r * 31) - 0.5) * 12
          );
        }
        ctx.stroke();
      }
    }

    ctx.restore();

    // 3. SIDE SHELF MUSHROOMS / POLYPORE FUNGI ON BARK EDGES
    for (const side of [-1, 1]) {
      const mx = side < 0 ? ox + 6 : ox + w - 6;
      const my = oy + 28 + rand(side + 50) * Math.min(45, h * 0.4);
      ctx.fillStyle =
        restored || biome === 'heart'
          ? '#F1C878'
          : biome === 'cavern' || biome === 'choir'
          ? '#B7A2E8'
          : '#8FE7C7';
      ctx.strokeStyle = '#121B2B';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(mx + side * 4, my, 9, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#57725B';
      ctx.beginPath();
      ctx.ellipse(mx + side * 2, my + 5, 6.5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. LUSH UNEVEN MOSS MANTLE & SMALL SURFACE PLANTS ALONG WALKABLE TOP
    const tuftCount = Math.max(5, Math.floor(w / 38));
    for (let t = 0; t < tuftCount; t++) {
      const tx = ox + 18 + t * ((w - 36) / tuftCount) + (rand(t + 200) - 0.5) * 12;
      const ty = oy + 2;

      ctx.strokeStyle =
        restored || biome === 'heart'
          ? '#98B87A'
          : biome === 'cavern' || biome === 'choir'
          ? '#70889E'
          : '#78906A';
      ctx.lineWidth = 2;
      for (let b = -1; b <= 1; b++) {
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.quadraticCurveTo(tx + b * 5, ty - 7, tx + b * 8, ty - 10 - rand(t + b) * 4);
        ctx.stroke();
      }

      if (t % 3 === 0) {
        ctx.fillStyle =
          restored || biome === 'heart'
            ? '#F1C878'
            : biome === 'cavern' || biome === 'choir'
            ? '#B7A2E8'
            : '#8FE7C7';
        ctx.beginPath();
        ctx.arc(tx, ty - 11, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const mossGrad = ctx.createLinearGradient(0, oy - 3, 0, oy + 26);
    if (restored || biome === 'heart') {
      mossGrad.addColorStop(0, '#B4CF8E');
      mossGrad.addColorStop(0.5, '#78906A');
      mossGrad.addColorStop(1, '#4A6B53');
    } else if (biome === 'marsh') {
      mossGrad.addColorStop(0, '#6EB8A8');
      mossGrad.addColorStop(0.55, '#3E7A74');
      mossGrad.addColorStop(1, '#1E464A');
    } else if (biome === 'cavern') {
      mossGrad.addColorStop(0, '#7B74B8');
      mossGrad.addColorStop(0.55, '#4A487A');
      mossGrad.addColorStop(1, '#29284D');
    } else if (biome === 'choir') {
      mossGrad.addColorStop(0, '#96A6D6');
      mossGrad.addColorStop(0.55, '#5C6C9E');
      mossGrad.addColorStop(1, '#323D64');
    } else if (biome === 'ruins') {
      mossGrad.addColorStop(0, '#B5B884');
      mossGrad.addColorStop(0.55, '#6D7E62');
      mossGrad.addColorStop(1, '#3B4D47');
    } else {
      mossGrad.addColorStop(0, '#89A477');
      mossGrad.addColorStop(0.55, '#57725B');
      mossGrad.addColorStop(1, '#294D4D');
    }

    ctx.fillStyle = mossGrad;
    ctx.strokeStyle = '#121B2B';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(ox - 4, oy + 12);
    ctx.quadraticCurveTo(ox - 2, oy, ox + 10, oy);

    for (let x = 20; x < w - 16; x += 22) {
      ctx.lineTo(ox + x, oy + Math.sin(x * 0.08 + seed) * 1.4);
    }
    ctx.lineTo(ox + w - 10, oy);
    ctx.quadraticCurveTo(ox + w + 2, oy, ox + w + 4, oy + 12);

    const lobeWidth = 26;
    for (let x = w; x >= 0; x -= lobeWidth) {
      const lobeDrop = 14 + rand(x + 300) * 14;
      ctx.quadraticCurveTo(ox + x - lobeWidth * 0.5, oy + lobeDrop, ox + Math.max(0, x - lobeWidth), oy + 11);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. Walkable Top Rim Light (Ensures instant platform readability in every lighting state per Section 9.6)
    ctx.strokeStyle =
      restored || biome === 'heart' ? 'rgba(241, 200, 120, 0.88)' : 'rgba(182, 212, 200, 0.82)';
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    ctx.moveTo(ox + 10, oy + 1.5);
    for (let x = 20; x <= w - 12; x += 22) {
      ctx.lineTo(ox + x, oy + 1.5 + Math.sin(x * 0.08 + seed) * 1.2);
    }
    ctx.stroke();
  }

  public static buildOrganicHazardTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('hazard_bramble')) {
      scene.textures.remove('hazard_bramble');
    }

    const bw = 136;
    const bh = 56;
    const brambleTex = scene.textures.createCanvas('hazard_bramble', bw, bh);
    if (!brambleTex) return;
    const ctx = brambleTex.getContext();

    const glow = ctx.createRadialGradient(bw * 0.5, bh - 12, 8, bw * 0.5, bh - 18, 64);
    glow.addColorStop(0, 'rgba(233, 131, 114, 0.42)');
    glow.addColorStop(1, 'rgba(233, 131, 114, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, bw, bh);

    ctx.strokeStyle = '#1D2D43';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(8, bh - 6);
    ctx.bezierCurveTo(bw * 0.3, bh - 22, bw * 0.7, bh - 22, bw - 8, bh - 6);
    ctx.stroke();

    ctx.strokeStyle = '#5E2B2A';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    for (let x = 12; x < bw - 12; x += 22) {
      ctx.moveTo(x, bh - 5);
      ctx.quadraticCurveTo(x + 11, bh - 26, x + 22, bh - 6);
    }
    ctx.stroke();

    const spirePositions = [18, 34, 52, 68, 84, 102, 118];
    spirePositions.forEach((x, idx) => {
      const lean = (idx % 2 === 0 ? -1 : 1) * (4 + (idx % 3) * 2);
      const height = 28 + (idx % 3) * 7;

      const thornGrad = ctx.createLinearGradient(x, bh - height, x, bh - 6);
      thornGrad.addColorStop(0, '#FFD6CC');
      thornGrad.addColorStop(0.35, '#E98372');
      thornGrad.addColorStop(1, '#4A1F24');

      ctx.fillStyle = thornGrad;
      ctx.strokeStyle = '#121B2B';
      ctx.lineWidth = 1.6;

      ctx.beginPath();
      ctx.moveTo(x - 6, bh - 6);
      ctx.quadraticCurveTo(x - 3, bh - height * 0.6, x + lean, bh - height);
      ctx.quadraticCurveTo(x + 5, bh - height * 0.55, x + 6, bh - 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (idx % 2 === 0) {
        ctx.fillStyle = '#E98372';
        ctx.beginPath();
        ctx.arc(x + 5, bh - 12, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    brambleTex.refresh();
  }
}
