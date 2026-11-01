import Phaser from 'phaser';

/**
 * CharacterArtManager — Milestone 4 Complete Pose-Based Character Atlas Pipeline (Section 02).
 *
 * Replaces the Milestone 3 horizontal leg-slicing workaround with a true multi-pose hand-painted
 * keyframe pipeline using:
 * 1. `nima_master_raw`: Canonical idle/standing side-profile illustration.
 * 2. `nima_run_contact_raw`: Full-body hand-painted running contact stride pose (front leg extended forward,
 *    back leg pushing off behind, leaf cloak billowing naturally, zero duplicated anatomy).
 * 3. `nima_run_passing_raw`: Full-body hand-painted running passing stride pose (planted supporting leg,
 *    opposite knee lifted and swinging forward).
 * 4. `pip_master_raw`: Canonical approved Pip companion master.
 *
 * Every frame in `nima_sheet` (96x112 x 41 frames) is calibrated so Nima's lowest planted foot sits
 * strictly at `y = 100` (matching her 34x72 physics body with offset Y = 28 -> bottom = 100).
 */
export class CharacterArtManager {
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
   * Builds the 41-frame `nima_sheet` (96x112 per frame) from the three full-body hand-painted
   * pose masters (`nima_master_raw`, `nima_run_contact_raw`, `nima_run_passing_raw`).
   * Zero leg region duplication is ever performed—every frame renders a complete, anatomically
   * coherent full-body illustration with natural weight transfer, foot contact, and seed glow.
   */
  public static buildNimaAtlasFromMaster(scene: Phaser.Scene): boolean {
    if (!scene.textures.exists('nima_master_raw')) return false;
    const rawIdle = scene.textures.get('nima_master_raw').getSourceImage() as HTMLImageElement;
    if (!rawIdle || !rawIdle.width) return false;

    const cleanIdle = this.extractTransparentMaster(rawIdle, 38, 56);
    const boundsIdle = this.getOpaqueBounds(cleanIdle);

    // Extract dedicated running contact & passing full-body poses (fallback to idle if still loading)
    let cleanContact = cleanIdle;
    let boundsContact = boundsIdle;
    if (scene.textures.exists('nima_run_contact_raw')) {
      const rawContact = scene.textures.get('nima_run_contact_raw').getSourceImage() as HTMLImageElement;
      if (rawContact && rawContact.width) {
        cleanContact = this.extractTransparentMaster(rawContact, 38, 56);
        boundsContact = this.getOpaqueBounds(cleanContact);
      }
    }

    let cleanPassing = cleanIdle;
    let boundsPassing = boundsIdle;
    if (scene.textures.exists('nima_run_passing_raw')) {
      const rawPassing = scene.textures.get('nima_run_passing_raw').getSourceImage() as HTMLImageElement;
      if (rawPassing && rawPassing.width) {
        cleanPassing = this.extractTransparentMaster(rawPassing, 38, 56);
        boundsPassing = this.getOpaqueBounds(cleanPassing);
      }
    }

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

    for (let frameIdx = 0; frameIdx < 41; frameIdx++) {
      const col = frameIdx % cols;
      const row = Math.floor(frameIdx / cols);
      const ox = col * fw;
      const oy = row * fh;

      let activeCanvas = cleanIdle;
      let activeBounds = boundsIdle;
      let targetHeight = 86;
      let bobY = 0;
      let bodyPitch = 0;
      let seedGlowIntensity = 1.0;
      let alpha = 1.0;
      let centerOffsetX = 0;

      if (frameIdx < 8) {
        // IDLE (Frames 0..7): Gentle breathing & warm seed pulse on standing master
        const t = (frameIdx / 8) * Math.PI * 2;
        activeCanvas = cleanIdle;
        activeBounds = boundsIdle;
        targetHeight = 86 + Math.sin(t) * 1.2;
        bobY = 0;
        seedGlowIntensity = 0.92 + Math.sin(t) * 0.16;
      } else if (frameIdx < 18) {
        // RUN CYCLE (Frames 8..17 — 10-frame natural running cycle alternating Contact -> Recoil -> Passing -> High-Point -> Contact)
        // Each half-stride (5 frames) transitions smoothly across the full-body Contact and Passing illustrations
        const step = frameIdx - 8; // 0..9
        const halfStep = step % 5; // 0..4
        const isSecondStride = step >= 5;

        if (halfStep === 0) {
          // Frame 0 / 5: Full Contact Stride (Front foot strikes ground, back leg pushes off)
          activeCanvas = cleanContact;
          activeBounds = boundsContact;
          targetHeight = 82;
          bobY = 0;
          bodyPitch = 0.02;
          centerOffsetX = -3;
        } else if (halfStep === 1) {
          // Frame 1 / 6: Down / Recoil Absorption (Weight settles onto planted leg)
          activeCanvas = cleanPassing;
          activeBounds = boundsPassing;
          targetHeight = 81;
          bobY = 1.0;
          bodyPitch = 0.04;
          centerOffsetX = -1;
        } else if (halfStep === 2) {
          // Frame 2 / 7: Mid-Stride Passing Pose (Supporting leg vertical, opposite knee driving up)
          activeCanvas = cleanPassing;
          activeBounds = boundsPassing;
          targetHeight = 84;
          bobY = -1.5;
          bodyPitch = 0.01;
          centerOffsetX = 0;
        } else if (halfStep === 3) {
          // Frame 3 / 8: Push-Off / Airborne Drive (Driving forward into full extension)
          activeCanvas = cleanContact;
          activeBounds = boundsContact;
          targetHeight = 84;
          bobY = -3.0;
          bodyPitch = -0.02;
          centerOffsetX = -2;
        } else {
          // Frame 4 / 9: Pre-Contact Reach
          activeCanvas = cleanPassing;
          activeBounds = boundsPassing;
          targetHeight = 83;
          bobY = -1.0;
          bodyPitch = 0.02;
          centerOffsetX = -1;
        }

        if (isSecondStride) {
          // Subtle natural rhythm variation between left and right stride
          bobY += 0.5;
        }
        seedGlowIntensity = 1.08;
      } else if (frameIdx < 21) {
        // JUMP START ANTICIPATION (Frames 18..20)
        const p = (frameIdx - 18) / 2;
        activeCanvas = cleanPassing;
        activeBounds = boundsPassing;
        targetHeight = 82 + p * 3;
        bobY = 1.5 * (1 - p);
        bodyPitch = -0.03;
      } else if (frameIdx < 24) {
        // RISING (Frames 21..23): Dynamic upward drive
        activeCanvas = cleanContact;
        activeBounds = boundsContact;
        targetHeight = 84;
        bobY = -3;
        bodyPitch = -0.05;
        centerOffsetX = -3;
        seedGlowIntensity = 1.15;
      } else if (frameIdx < 27) {
        // FALLING (Frames 24..26): Descending pose with trailing leaf cloak
        activeCanvas = cleanPassing;
        activeBounds = boundsPassing;
        targetHeight = 84;
        bobY = -1;
        bodyPitch = 0.04;
      } else if (frameIdx < 31) {
        // LANDING (Frames 27..30): Soft knee absorption back to standing
        const p = (frameIdx - 27) / 3;
        activeCanvas = p < 0.5 ? cleanPassing : cleanIdle;
        activeBounds = p < 0.5 ? boundsPassing : boundsIdle;
        targetHeight = 83 + p * 3;
        bobY = (1 - p) * 2.0;
      } else if (frameIdx < 37) {
        // WAKE CAST (Frames 31..36): Raising the glowing seed with radiant golden-mint bloom
        const p = (frameIdx - 31) / 5;
        const wave = Math.sin(p * Math.PI);
        activeCanvas = wave > 0.45 ? cleanPassing : cleanIdle;
        activeBounds = wave > 0.45 ? boundsPassing : boundsIdle;
        targetHeight = 86;
        bobY = -wave * 2.5;
        seedGlowIntensity = 1.25 + wave * 1.45;
      } else {
        // RESPAWN (Frames 37..40): Materializing gently on the checkpoint platform
        const p = (frameIdx - 37) / 3;
        activeCanvas = cleanIdle;
        activeBounds = boundsIdle;
        targetHeight = 86;
        bobY = (1 - p) * -6;
        seedGlowIntensity = 1.9 - p * 0.9;
        alpha = 0.45 + p * 0.55;
      }

      const scale = targetHeight / activeBounds.height;
      const destW = Math.min(fw - 6, activeBounds.width * scale);
      const destH = activeBounds.height * (destW / activeBounds.width);

      // Ground contact anchor at (ox + 48, oy + 100) so Nima's feet sit flush on platform tops
      const footAnchorX = ox + fw * 0.5 + centerOffsetX;
      const footAnchorY = oy + 100;

      ctx.save();
      ctx.globalAlpha = alpha;

      // 1. Soft ground contact shadow at y = 100
      const shadowGrad = ctx.createRadialGradient(ox + fw * 0.5, footAnchorY, 2, ox + fw * 0.5, footAnchorY, 19);
      shadowGrad.addColorStop(0, 'rgba(18, 27, 43, 0.58)');
      shadowGrad.addColorStop(1, 'rgba(18, 27, 43, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(ox + fw * 0.5, footAnchorY, 17, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Render Complete Hand-Painted Pose (Zero anatomical slicing or duplicated legs)
      ctx.translate(footAnchorX, footAnchorY + bobY);
      ctx.rotate(bodyPitch);

      ctx.drawImage(
        activeCanvas,
        activeBounds.minX,
        activeBounds.minY,
        activeBounds.width,
        activeBounds.height,
        -destW * 0.5,
        -destH,
        destW,
        destH
      );

      // 3. Integrated Magical Illumination from Nima's Living Seed
      const seedX = destW * 0.22;
      const seedY = -destH * 0.56;
      const haloRadius = 18 * seedGlowIntensity;
      const seedHalo = ctx.createRadialGradient(seedX, seedY, 1.5, seedX, seedY, haloRadius);
      seedHalo.addColorStop(0, `rgba(255, 248, 220, ${Math.min(0.95, 0.52 * seedGlowIntensity)})`);
      seedHalo.addColorStop(0.45, `rgba(241, 200, 120, ${Math.min(0.75, 0.30 * seedGlowIntensity)})`);
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
   * Builds the approved 22-frame `pip_sheet` (56x56 per frame) from `pip_master_raw`.
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

      const glowRadius = isWakeReact ? 26 : 21;
      const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, glowRadius);
      aura.addColorStop(0, isWakeReact ? 'rgba(143, 231, 199, 0.85)' : 'rgba(183, 162, 232, 0.55)');
      aura.addColorStop(0.55, isWakeReact ? 'rgba(241, 200, 120, 0.45)' : 'rgba(143, 231, 199, 0.25)');
      aura.addColorStop(1, 'rgba(183, 162, 232, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
      ctx.fill();

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
