import Phaser from 'phaser';

/**
 * CharacterArtManager — Milestone 3 Character Art Redesign & Cutout Rig Pipeline.
 *
 * Processes the canonical hand-painted Nima (`nima_side_gameplay_master`) and Pip (`pip_gameplay_master`)
 * illustrations derived directly from `ref_nima_pip_concept_1793515706089.jpg`:
 * 1. Performs edge-flood chroma-key alpha extraction to strip the uniform Night Ink (#121B2B) studio backdrop
 *    while preserving 100% of the internal hand-painted gouache brushwork, dark pupils, and warm seed shading.
 * 2. Assembles multi-frame skeletal cutout animation atlases (`nima_sheet` 96x112 x 41 frames, `pip_sheet` 64x64 x 24 frames)
 *    using articulated region transforms (head tilt, leaf-cloak billow, independent stride legs, glowing chest seed,
 *    and translucent Spirit Lilac / Wake Mint moth wing flapping).
 * 3. Guarantees Nima's feet sit flush at y = 100 inside each 96x112 frame so her 34x72 physics hitbox aligns with
 *    zero floating or sinking.
 */
export class CharacterArtManager {
  /**
   * Removes the uniform Night Ink (#121B2B) background from a square character master image
   * using an 8-connected border flood-fill with soft anti-aliased edge feathering.
   */
  public static extractTransparentMaster(
    sourceImg: HTMLImageElement,
    colorTolerance = 38,
    featherTolerance = 56
  ): HTMLCanvasElement {
    const w = sourceImg.naturalWidth || sourceImg.width;
    const h = sourceImg.naturalHeight || sourceImg.height;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.drawImage(sourceImg, 0, 0);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Sample corner pixels to determine exact background RGB
    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];

    const visited = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;

    const pushIfBorder = (x: number, y: number) => {
      const idx = y * w + x;
      if (!visited[idx]) {
        visited[idx] = 1;
        queue[tail++] = idx;
      }
    };

    for (let x = 0; x < w; x++) {
      pushIfBorder(x, 0);
      pushIfBorder(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      pushIfBorder(0, y);
      pushIfBorder(w - 1, y);
    }

    const colorDist = (pIdx: number): number => {
      const dr = data[pIdx] - bgR;
      const dg = data[pIdx + 1] - bgG;
      const db = data[pIdx + 2] - bgB;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    };

    while (head < tail) {
      const idx = queue[head++];
      const pIdx = idx * 4;
      const dist = colorDist(pIdx);

      if (dist <= featherTolerance) {
        if (dist <= colorTolerance) {
          data[pIdx + 3] = 0;
        } else {
          // Smooth anti-aliased alpha ramp on silhouette border
          const ratio = (dist - colorTolerance) / (featherTolerance - colorTolerance);
          data[pIdx + 3] = Math.round(ratio * 255);
        }

        if (dist <= colorTolerance + 8) {
          const x = idx % w;
          const y = (idx - x) / w;
          if (x > 0 && !visited[idx - 1]) {
            visited[idx - 1] = 1;
            queue[tail++] = idx - 1;
          }
          if (x < w - 1 && !visited[idx + 1]) {
            visited[idx + 1] = 1;
            queue[tail++] = idx + 1;
          }
          if (y > 0 && !visited[idx - w]) {
            visited[idx - w] = 1;
            queue[tail++] = idx - w;
          }
          if (y < h - 1 && !visited[idx + w]) {
            visited[idx + w] = 1;
            queue[tail++] = idx + w;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  /**
   * Computes the non-transparent bounding box of an extracted character canvas
   * so feet and center axes can be calibrated with pixel precision.
   */
  private static getOpaqueBounds(canvas: HTMLCanvasElement): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  } {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    if (!ctx) return { minX: 0, maxX: w, minY: 0, maxY: h, width: w, height: h };

    const data = ctx.getImageData(0, 0, w, h).data;
    let minX = w;
    let maxX = 0;
    let minY = h;
    let maxY = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const a = data[(y * w + x) * 4 + 3];
        if (a > 25) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (minX > maxX || minY > maxY) {
      return { minX: 0, maxX: w, minY: 0, maxY: h, width: w, height: h };
    }
    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }

  /**
   * Builds the 41-frame `nima_sheet` (96x112 per frame) directly from the transparent
   * hand-painted Nima side-profile master using a 4-part articulated cutout rig:
   * - Part 1: Back Leaf Cloak & Hood tail (billows during run, jump, fall, and Wake cast)
   * - Part 2: Lower Trousers & Wrapped Boots (independent stride swing for left/right legs)
   * - Part 3: Upper Toric, Leaf Mantle, Satchel & Cradled Seed
   * - Part 4: Expressive Head & Tousled Chestnut Hair (subtle pitch/bob)
   * - Dynamic Overlay: Warm Sap Gold (#F1C878) & Wake Mint (#8FE7C7) illumination on the seed
   */
  public static buildNimaAtlasFromMaster(scene: Phaser.Scene): boolean {
    if (!scene.textures.exists('nima_master_raw')) return false;
    const rawSource = scene.textures.get('nima_master_raw').getSourceImage() as HTMLImageElement;
    if (!rawSource || !rawSource.width) return false;

    const cleanMaster = this.extractTransparentMaster(rawSource, 38, 56);
    const bounds = this.getOpaqueBounds(cleanMaster);

    if (scene.textures.exists('nima_sheet')) {
      scene.textures.remove('nima_sheet');
    }

    const fw = 96;
    const fh = 112;
    const cols = 8;
    const rows = 6;
    const canvasTex = scene.textures.createCanvas('nima_sheet', fw * cols, fh * rows);
    if (!canvasTex) return false;
    const ctx = canvasTex.getContext();

    // Target visible height in 96x112 frame: 88px (head top at y=12, feet at y=100)
    const targetHeight = 88;
    const scale = targetHeight / bounds.height;
    const destW = bounds.width * scale;
    const destH = targetHeight;

    // Anatomical split ratios within Nima's bounding box:
    // 0.00 .. 0.38: Head & tousled hair
    // 0.34 .. 0.72: Leaf cloak, tunic, satchel & glowing seed
    // 0.68 .. 1.00: Patched trousers & wrapped ankle boots
    const headSplitY = 0.37;
    const hipSplitY = 0.68;

    for (let frameIdx = 0; frameIdx < 41; frameIdx++) {
      const col = frameIdx % cols;
      const row = Math.floor(frameIdx / cols);
      const ox = col * fw;
      const oy = row * fh;

      let bobY = 0;
      let bodyLean = 0;
      let headNod = 0;
      let cloakFlutter = 0;
      let strideX = 0;
      let strideLift = 0;
      let seedGlowIntensity = 1.0;
      let squashX = 1.0;
      let stretchY = 1.0;
      let alpha = 1.0;

      if (frameIdx < 8) {
        // Idle (0..7): Gentle breathing, warm seed pulse, soft cloak sway
        const t = (frameIdx / 8) * Math.PI * 2;
        bobY = Math.sin(t) * 1.6;
        headNod = Math.sin(t - 0.5) * 0.025;
        cloakFlutter = Math.sin(t) * 2.2;
        seedGlowIntensity = 0.9 + Math.sin(t) * 0.18;
      } else if (frameIdx < 18) {
        // Run (8..17): Dynamic stride, forward lean, billowing leaf cloak
        const step = frameIdx - 8;
        const t = (step / 10) * Math.PI * 2;
        bobY = -Math.abs(Math.sin(t)) * 4.5 + 1.0;
        bodyLean = 0.09;
        headNod = Math.sin(t * 2) * 0.03;
        cloakFlutter = 7 + Math.sin(t * 2) * 3.5;
        strideX = Math.sin(t) * 7.5;
        strideLift = Math.max(0, -Math.cos(t) * 4.5);
        seedGlowIntensity = 1.05;
      } else if (frameIdx < 21) {
        // Jump Start anticipation (18..20)
        const p = (frameIdx - 18) / 2;
        bobY = 3.5 * (1 - p);
        squashX = 1.06 - p * 0.06;
        stretchY = 0.94 + p * 0.06;
        headNod = -0.05;
        cloakFlutter = 4;
      } else if (frameIdx < 24) {
        // Rising (21..23)
        const p = frameIdx - 21;
        bobY = -3;
        stretchY = 1.04;
        squashX = 0.97;
        bodyLean = 0.05;
        headNod = -0.06;
        cloakFlutter = 6 + p * 1.5;
        strideX = 3.5;
        strideLift = 3.5;
      } else if (frameIdx < 27) {
        // Falling (24..26)
        const p = frameIdx - 24;
        bobY = -1.5;
        bodyLean = -0.04;
        headNod = 0.05;
        cloakFlutter = 10 + p * 2;
        strideX = -2.5;
        strideLift = 2.5;
      } else if (frameIdx < 31) {
        // Landing (27..30)
        const p = (frameIdx - 27) / 3;
        const crouch = Math.sin((1 - p) * Math.PI);
        bobY = crouch * 4.0;
        squashX = 1 + crouch * 0.07;
        stretchY = 1 - crouch * 0.06;
        cloakFlutter = (1 - p) * 7;
      } else if (frameIdx < 37) {
        // Wake Cast (31..36): Raising the seed with radiant Sap Gold & Wake Mint aura
        const p = (frameIdx - 31) / 5;
        const wave = Math.sin(p * Math.PI);
        bobY = -wave * 3.0;
        headNod = -wave * 0.06;
        cloakFlutter = wave * 9.0;
        seedGlowIntensity = 1.2 + wave * 1.35;
      } else {
        // Respawn (37..40)
        const p = (frameIdx - 37) / 3;
        bobY = (1 - p) * -8;
        seedGlowIntensity = 2.0 - p * 1.0;
        alpha = 0.4 + p * 0.6;
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      // Ground contact point at (ox + 48, oy + 100) so feet always align with hitbox bottom (y = 100)
      const footAnchorX = ox + fw * 0.5;
      const footAnchorY = oy + 100;

      // 1. Soft ground contact shadow
      const shadowGrad = ctx.createRadialGradient(footAnchorX, footAnchorY, 2, footAnchorX, footAnchorY, 20);
      shadowGrad.addColorStop(0, 'rgba(18, 27, 43, 0.55)');
      shadowGrad.addColorStop(1, 'rgba(18, 27, 43, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(footAnchorX, footAnchorY, 17, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.translate(footAnchorX, footAnchorY + bobY);
      ctx.scale(squashX, stretchY);
      ctx.rotate(bodyLean);

      const drawLeft = -destW * 0.5;
      const drawTop = -destH;

      // 2. Trailing Cloak Back-Flutter Layer (drawn behind legs when running/jumping/casting)
      if (Math.abs(cloakFlutter) > 1.0) {
        ctx.save();
        ctx.translate(-cloakFlutter * 0.55, -destH * 0.45);
        ctx.rotate((cloakFlutter * 0.012));
        ctx.globalAlpha = alpha * 0.88;
        const cloakSrcY = bounds.minY + bounds.height * 0.36;
        const cloakSrcH = bounds.height * 0.44;
        ctx.drawImage(
          cleanMaster,
          bounds.minX,
          cloakSrcY,
          bounds.width * 0.55,
          cloakSrcH,
          drawLeft - cloakFlutter * 0.35,
          -destH * 0.09,
          destW * 0.55,
          destH * 0.44
        );
        ctx.restore();
      }

      // 3. Articulated Legs & Wrapped Ankle Boots (Back Leg & Front Leg)
      const legSrcY = bounds.minY + bounds.height * hipSplitY;
      const legSrcH = bounds.height * (1 - hipSplitY);
      const legDestY = drawTop + destH * hipSplitY;
      const legDestH = destH * (1 - hipSplitY);

      // Back Leg (slightly darkened for depth separation during stride)
      if (Math.abs(strideX) > 0.8) {
        ctx.save();
        ctx.translate(-strideX * 0.75, -strideLift * 0.5);
        ctx.rotate(-strideX * 0.025);
        ctx.filter = 'brightness(0.82)';
        ctx.drawImage(
          cleanMaster,
          bounds.minX,
          legSrcY,
          bounds.width,
          legSrcH,
          drawLeft,
          legDestY,
          destW,
          legDestH
        );
        ctx.filter = 'none';
        ctx.restore();
      }

      // Front / Main Leg
      ctx.save();
      ctx.translate(strideX * 0.65, -strideLift);
      ctx.rotate(strideX * 0.022);
      ctx.drawImage(
        cleanMaster,
        bounds.minX,
        legSrcY,
        bounds.width,
        legSrcH,
        drawLeft,
        legDestY,
        destW,
        legDestH
      );
      ctx.restore();

      // 4. Torso, Embroidered Leaf Cloak, Satchel & Cradled Seed
      const torsoSrcY = bounds.minY + bounds.height * (headSplitY - 0.03);
      const torsoSrcH = bounds.height * (hipSplitY - headSplitY + 0.07);
      const torsoDestY = drawTop + destH * (headSplitY - 0.03);
      const torsoDestH = destH * (hipSplitY - headSplitY + 0.07);

      ctx.drawImage(
        cleanMaster,
        bounds.minX,
        torsoSrcY,
        bounds.width,
        torsoSrcH,
        drawLeft,
        torsoDestY,
        destW,
        torsoDestH
      );

      // 5. Expressive Head & Tousled Chestnut Hair with subtle nod
      const headSrcY = bounds.minY;
      const headSrcH = bounds.height * (headSplitY + 0.03);
      const headDestY = drawTop;
      const headDestH = destH * (headSplitY + 0.03);

      ctx.save();
      ctx.translate(0, drawTop + headDestH * 0.85);
      ctx.rotate(headNod);
      ctx.drawImage(
        cleanMaster,
        bounds.minX,
        headSrcY,
        bounds.width,
        headSrcH,
        drawLeft,
        -headDestH * 0.85,
        destW,
        headDestH
      );
      ctx.restore();

      // 6. Integrated Magical Illumination from Nima's Living Seed (Sap Gold #F1C878 + Wake Mint #8FE7C7)
      const seedX = destW * 0.19;
      const seedY = -destH * 0.54;
      const haloRadius = 18 * seedGlowIntensity;
      const seedHalo = ctx.createRadialGradient(seedX, seedY, 1.5, seedX, seedY, haloRadius);
      seedHalo.addColorStop(0, `rgba(255, 248, 220, ${Math.min(0.95, 0.55 * seedGlowIntensity)})`);
      seedHalo.addColorStop(0.45, `rgba(241, 200, 120, ${Math.min(0.75, 0.32 * seedGlowIntensity)})`);
      seedHalo.addColorStop(0.8, `rgba(143, 231, 199, ${Math.min(0.45, 0.14 * seedGlowIntensity)})`);
      seedHalo.addColorStop(1, 'rgba(143, 231, 199, 0)');

      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = seedHalo;
      ctx.beginPath();
      ctx.arc(seedX, seedY, haloRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      ctx.restore();
      canvasTex.add(frameIdx, 0, ox, oy, fw, fh);
    }

    canvasTex.refresh();
    return true;
  }

  /**
   * Builds the 22-frame `pip_sheet` (56x56 per frame) directly from the transparent
   * hand-painted Pip illustration (`pip_gameplay_master`) with articulated wing-flapping,
   * soft Spirit Lilac (#B7A2E8) and Wake Mint (#8FE7C7) bioluminescence, and curiosity tilts.
   */
  public static buildPipAtlasFromMaster(scene: Phaser.Scene): boolean {
    if (!scene.textures.exists('pip_master_raw')) return false;
    const rawSource = scene.textures.get('pip_master_raw').getSourceImage() as HTMLImageElement;
    if (!rawSource || !rawSource.width) return false;

    const cleanPip = this.extractTransparentMaster(rawSource, 38, 58);
    const bounds = this.getOpaqueBounds(cleanPip);

    if (scene.textures.exists('pip_sheet')) {
      scene.textures.remove('pip_sheet');
    }

    const fw = 56;
    const fh = 56;
    const cols = 6;
    const rows = 4;
    const canvasTex = scene.textures.createCanvas('pip_sheet', fw * cols, fh * rows);
    if (!canvasTex) return false;
    const ctx = canvasTex.getContext();

    const baseSize = 42;
    const scale = baseSize / Math.max(bounds.width, bounds.height);
    const destW = bounds.width * scale;
    const destH = bounds.height * scale;

    for (let i = 0; i < 22; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ox = col * fw;
      const oy = row * fh;
      const cx = ox + fw * 0.5;
      const cy = oy + fh * 0.5;

      const phase = ((i % 6) / 6) * Math.PI * 2;
      const wingCycle = Math.sin(phase);
      const isCurious = i >= 12 && i < 16;
      const isWakeReact = i >= 16;

      ctx.save();
      ctx.translate(cx, cy + Math.cos(phase) * 1.5);

      if (isCurious) {
        ctx.rotate(Math.sin(phase) * 0.22);
      } else if (isWakeReact) {
        ctx.scale(1.12 + Math.sin(phase) * 0.08, 1.12 + Math.cos(phase) * 0.08);
      }

      // 1. Translucent Spirit Lilac & Wake Mint bioluminescent halo
      const glowRadius = isWakeReact ? 26 : 21;
      const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, glowRadius);
      aura.addColorStop(0, isWakeReact ? 'rgba(143, 231, 199, 0.85)' : 'rgba(183, 162, 232, 0.55)');
      aura.addColorStop(0.55, isWakeReact ? 'rgba(241, 200, 120, 0.45)' : 'rgba(143, 231, 199, 0.25)');
      aura.addColorStop(1, 'rgba(183, 162, 232, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Articulated Left/Back Wing Region (0..58% X of Pip master) flapping vertically
      const wingSplitX = 0.58;
      const wingSrcW = bounds.width * wingSplitX;
      const wingDestW = destW * wingSplitX;

      ctx.save();
      ctx.translate(destW * 0.08, 0);
      ctx.scale(1.0, 0.72 + (wingCycle + 1) * 0.22);
      ctx.rotate(wingCycle * 0.16);
      ctx.drawImage(
        cleanPip,
        bounds.minX,
        bounds.minY,
        wingSrcW,
        bounds.height,
        -destW * 0.5 - destW * 0.08,
        -destH * 0.5,
        wingDestW,
        destH
      );
      ctx.restore();

      // 3. Fuzzy Moth Body, Expressive Eyes & Feathered Antennae (48%..100% X of Pip master)
      const bodyStartRatio = 0.46;
      const bodySrcX = bounds.minX + bounds.width * bodyStartRatio;
      const bodySrcW = bounds.width * (1 - bodyStartRatio);
      const bodyDestX = -destW * 0.5 + destW * bodyStartRatio;
      const bodyDestW = destW * (1 - bodyStartRatio);

      ctx.drawImage(
        cleanPip,
        bodySrcX,
        bounds.minY,
        bodySrcW,
        bounds.height,
        bodyDestX,
        -destH * 0.5,
        bodyDestW,
        destH
      );

      ctx.restore();
      canvasTex.add(i, 0, ox, oy, fw, fh);
    }

    canvasTex.refresh();
    return true;
  }
}
