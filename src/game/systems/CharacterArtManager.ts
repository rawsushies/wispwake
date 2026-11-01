import Phaser from 'phaser';

export interface LegJointPose {
  hipAngle: number;  // radians: positive = forward (right), negative = backward (left)
  kneeBend: number;  // radians: >= 0 (human/child knees bend backward in right-facing profile)
  footPitch: number; // radians: ankle tilt
  liftY?: number;    // optional hip vertical offset
}

/**
 * CharacterArtManager — Milestone 6 Priority 1 Update.
 *
 * Fixes Nima's clothing consistency and running animation:
 * 1. Canonical Single-Garment Trouser Silhouette:
 *    - In `nima_side_gameplay_master_1793518602554.jpg`, Nima's cream tunic ends around `relY = 0.612`
 *      and her warm brown cropped trousers extend down to `relY = 0.825` above bare ankles and cloth foot-wraps.
 *    - Previously, `createUpperBodyCutout` only erased pixels below `relY >= 0.635` (and kept `relX < 0.37`
 *      down to `0.76`), leaving the upper portion of the static standing trousers visible on top of the
 *      animated legs—creating a visual "second pair of shorts/leggings" artifact.
 *    - `createUpperBodyCutout` now cleanly removes the static standing trousers right up to the cream
 *      tunic hem (`relY = 0.595` across the leg column `relX >= 0.34`, while preserving the green cloak
 *      tail on the left where `g > r`), and `paintArticulatedLeg` draws ONE consistent pair of warm
 *      earth-brown cropped trousers (`#6F5541` / `#83664E`), bare lower shins (`#E3B696`), and warm
 *      cloth foot-wraps (`#5A493A`) with exposed toes (`#E3B696`) tucked naturally under the cream tunic hem.
 * 2. Expressive 10-Frame Run Cycle:
 *    - Contact, Downward Compression, Passing, High Point, Opposite Contact, Opposite Compression,
 *      Opposite Passing, and Recovery with natural cloak billow, body bob, and seed cradle sway.
 * 3. Preserves Pip's approved 22-frame luminous sprite sheet (`pip_sheet`).
 */
export class CharacterArtManager {
  public static buildNimaAtlasFromMaster(scene: Phaser.Scene): boolean {
    if (scene.textures.exists('nima_sheet')) {
      scene.textures.remove('nima_sheet');
    }
    if (!scene.textures.exists('nima_master_raw')) return false;

    const rawImg = scene.textures.get('nima_master_raw').getSourceImage() as HTMLImageElement;
    if (!rawImg || !rawImg.width) return false;

    const cleanMaster = this.extractTransparentCharacter(rawImg);
    const upperBodyCutout = this.createUpperBodyCutout(cleanMaster);

    const fw = 96;
    const fh = 112;
    const cols = 8;
    const rows = 6;

    const canvasTex = scene.textures.createCanvas('nima_sheet', fw * cols, fh * rows);
    if (!canvasTex) return false;
    const ctx = canvasTex.getContext();

    for (let i = 0; i < 41; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ox = col * fw;
      const oy = row * fh;

      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, oy, fw, fh);
      ctx.clip();

      this.renderNimaFrame(ctx, cleanMaster.canvas, upperBodyCutout, i, ox, oy, fw, fh);

      ctx.restore();
      canvasTex.add(i, 0, ox, oy, fw, fh);
    }

    canvasTex.refresh();
    return true;
  }

  public static buildPipAtlasFromMaster(scene: Phaser.Scene): boolean {
    if (scene.textures.exists('pip_sheet')) {
      scene.textures.remove('pip_sheet');
    }
    if (!scene.textures.exists('pip_master_raw')) return false;

    const rawImg = scene.textures.get('pip_master_raw').getSourceImage() as HTMLImageElement;
    if (!rawImg || !rawImg.width) return false;

    const cleanMaster = this.extractTransparentCharacter(rawImg);

    const fw = 56;
    const fh = 56;
    const cols = 6;
    const rows = 4;

    const canvasTex = scene.textures.createCanvas('pip_sheet', fw * cols, fh * rows);
    if (!canvasTex) return false;
    const ctx = canvasTex.getContext();

    for (let i = 0; i < 22; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ox = col * fw;
      const oy = row * fh;

      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, oy, fw, fh);
      ctx.clip();

      this.renderPipFrame(ctx, cleanMaster.canvas, i, ox, oy, fw, fh);

      ctx.restore();
      canvasTex.add(i, 0, ox, oy, fw, fh);
    }

    canvasTex.refresh();
    return true;
  }

  /**
   * Removes the uniform dark studio backdrop from the master character art
   * and returns a tight bounding-box canvas with clean alpha edges.
   */
  private static extractTransparentCharacter(img: HTMLImageElement): {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
  } {
    const w = img.width;
    const h = img.height;
    const workCanvas = document.createElement('canvas');
    workCanvas.width = w;
    workCanvas.height = h;
    const ctx = workCanvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    const bgR = d[0];
    const bgG = d[1];
    const bgB = d[2];

    const visited = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;

    const isBackdropColor = (idx: number): boolean => {
      const r = d[idx];
      const g = d[idx + 1];
      const b = d[idx + 2];
      const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      return diff < 56 || (luma < 32 && b >= r);
    };

    const pushSeed = (x: number, y: number) => {
      const p = y * w + x;
      if (!visited[p] && isBackdropColor(p * 4)) {
        visited[p] = 1;
        queue[tail++] = p;
      }
    };

    for (let x = 0; x < w; x++) {
      pushSeed(x, 0);
      pushSeed(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      pushSeed(0, y);
      pushSeed(w - 1, y);
    }

    while (head < tail) {
      const curr = queue[head++];
      const cx = curr % w;
      const cy = (curr - cx) / w;
      d[curr * 4 + 3] = 0;

      if (cx > 0) pushSeed(cx - 1, cy);
      if (cx < w - 1) pushSeed(cx + 1, cy);
      if (cy > 0) pushSeed(cx, cy - 1);
      if (cy < h - 1) pushSeed(cx, cy + 1);
    }

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x;
        if (visited[p]) continue;
        const idx = p * 4;
        const hasTransparentNeighbor =
          visited[p - 1] || visited[p + 1] || visited[p - w] || visited[p + w];
        if (hasTransparentNeighbor) {
          const r = d[idx];
          const g = d[idx + 1];
          const b = d[idx + 2];
          const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
          if (diff < 88) {
            d[idx + 3] = Math.round(Phaser.Math.Clamp(((diff - 36) / 52) * 255, 0, 255));
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 20) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (minX >= maxX || minY >= maxY) {
      return { canvas: workCanvas, width: w, height: h };
    }

    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const cropped = document.createElement('canvas');
    cropped.width = cropW;
    cropped.height = cropH;
    const cCtx = cropped.getContext('2d')!;
    cCtx.drawImage(workCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

    return { canvas: cropped, width: cropW, height: cropH };
  }

  /**
   * Creates an upper-body cutout of Nima (head, hair, green leaf cloak, satchel, cream tunic,
   * and arms cradling the glowing golden seed) with the static standing brown trousers and feet
   * cleanly removed right up to the cream tunic hem (`relY = 0.592`), while preserving the
   * green leaf-cloak tail on the left (`g > r + 6`) so animated legs never overlap with a
   * leftover static trouser layer.
   */
  private static createUpperBodyCutout(master: {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
  }): HTMLCanvasElement {
    const w = master.width;
    const h = master.height;
    const cut = document.createElement('canvas');
    cut.width = w;
    cut.height = h;
    const ctx = cut.getContext('2d')!;
    ctx.drawImage(master.canvas, 0, 0);

    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    for (let y = 0; y < h; y++) {
      const relY = y / h;
      if (relY < 0.575) continue;

      for (let x = 0; x < w; x++) {
        const relX = x / w;
        const idx = (y * w + x) * 4;
        if (d[idx + 3] === 0) continue;

        const r = d[idx];
        const g = d[idx + 1];
        const b = d[idx + 2];

        // Preserve the green leaf-cloak tail on the left/back side (where green channel dominates red)
        const isGreenCloak = g >= r - 2 && g > b + 6 && relX < 0.36 && relY < 0.80;
        if (isGreenCloak) {
          continue;
        }

        // Preserve the cream tunic hem (high luminance cream/ivory pixels above relY 0.625)
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        const isCreamTunicHem = luma > 165 && r > 175 && g > 155 && relY < 0.628;
        if (isCreamTunicHem) {
          continue;
        }

        // Preserve the leather satchel pouch on the hip (relX < 0.58 and relY < 0.608)
        if (relY < 0.602 && relX < 0.58) {
          continue;
        }

        // Remove all static standing brown trouser & foot-wrap pixels below the tunic hem
        if (relY >= 0.592) {
          const fadeBand = 0.016;
          if (relY < 0.592 + fadeBand) {
            const fade = 1 - (relY - 0.592) / fadeBand;
            d[idx + 3] = Math.round(d[idx + 3] * fade);
          } else {
            d[idx + 3] = 0;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return cut;
  }

  /**
   * Paints a single articulated child leg matching Nima's exact canonical design from
   * `nima_side_gameplay_master_1793518602554.jpg`:
   * - Single pair of loose warm earth-brown cropped trousers (`#6F5541` front / `#584232` back)
   *   with a subtle stitched knee patch (`#8A6E52`) on the front leg and gathered trouser cuff.
   * - Bare lower ankle skin (`#E3B696` / `#C7997A`) between the cropped trouser cuff and foot-wrap.
   * - Warm dark-brown cloth foot-wraps (`#5A493A` / `#46382C`) with exposed bare toes (`#E3B696`)
   *   just like the standing master artwork.
   */
  private static paintArticulatedLeg(
    ctx: CanvasRenderingContext2D,
    hipX: number,
    hipY: number,
    pose: LegJointPose,
    isBackLeg: boolean
  ): void {
    const thighLen = 11.5;
    const shinLen = 10.5;
    const hY = hipY + (pose.liftY || 0);

    // Positive hipAngle swings leg forward (right); knee bends backward (left)
    const kneeX = hipX + Math.sin(pose.hipAngle) * thighLen;
    const kneeY = hY + Math.cos(pose.hipAngle) * thighLen;

    const shinWorldAngle = pose.hipAngle - pose.kneeBend;
    const ankleX = kneeX + Math.sin(shinWorldAngle) * shinLen;
    const ankleY = kneeY + Math.cos(shinWorldAngle) * shinLen;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const outlineColor = '#211915';
    const trouserMain = isBackLeg ? '#594333' : '#765A45';
    const trouserHighlight = isBackLeg ? '#6B523F' : '#8C6D54';
    const patchColor = isBackLeg ? '#69533E' : '#96795B';
    const skinTone = isBackLeg ? '#C89B7B' : '#E3B696';
    const wrapColor = isBackLeg ? '#46382C' : '#5C4A3B';
    const wrapBand = isBackLeg ? '#584738' : '#735D4B';

    // 1. Bare Ankle / Lower Shin (drawn first so cropped trouser cuff overlaps top, foot-wrap overlaps bottom)
    const midShinX = kneeX + (ankleX - kneeX) * 0.52;
    const midShinY = kneeY + (ankleY - kneeY) * 0.52;

    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 6.8;
    ctx.beginPath();
    ctx.moveTo(midShinX, midShinY);
    ctx.lineTo(ankleX, ankleY + 1.5);
    ctx.stroke();

    ctx.strokeStyle = skinTone;
    ctx.lineWidth = 4.4;
    ctx.beginPath();
    ctx.moveTo(midShinX, midShinY);
    ctx.lineTo(ankleX, ankleY + 1.5);
    ctx.stroke();

    // 2. Single Loose Cropped Brown Trouser Leg (from hip down to mid-shin cuff)
    const cuffX = kneeX + (ankleX - kneeX) * 0.64;
    const cuffY = kneeY + (ankleY - kneeY) * 0.64;

    // Outer ink outline of loose trouser leg
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 12.2;
    ctx.beginPath();
    ctx.moveTo(hipX, hY);
    ctx.quadraticCurveTo(kneeX + 1.2, kneeY, cuffX, cuffY);
    ctx.stroke();

    // Main warm brown trouser fabric fill
    ctx.strokeStyle = trouserMain;
    ctx.lineWidth = 9.4;
    ctx.beginPath();
    ctx.moveTo(hipX, hY);
    ctx.quadraticCurveTo(kneeX + 1.2, kneeY, cuffX, cuffY);
    ctx.stroke();

    // Front-edge warm sunlight highlight on trouser leg
    ctx.strokeStyle = trouserHighlight;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(hipX + 1.8, hY + 1);
    ctx.quadraticCurveTo(kneeX + 2.6, kneeY, cuffX + 1.5, cuffY - 1);
    ctx.stroke();

    // Canonical stitched rectangular patch on the knee (matching master image)
    ctx.save();
    ctx.translate(kneeX + 0.8, kneeY - 0.5);
    ctx.rotate(-shinWorldAngle * 0.45);
    ctx.fillStyle = patchColor;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.roundRect(-2.4, -3.2, 4.8, 6.0, 1.2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Gathered trouser hem at mid-shin (same brown trouser fabric, NOT a second legging layer)
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 5.2;
    ctx.beginPath();
    ctx.moveTo(cuffX - 3.2, cuffY);
    ctx.lineTo(cuffX + 3.2, cuffY);
    ctx.stroke();

    ctx.strokeStyle = trouserHighlight;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(cuffX - 2.8, cuffY);
    ctx.lineTo(cuffX + 2.8, cuffY);
    ctx.stroke();

    // 3. Canonical Cloth Foot-Wrap & Exposed Bare Toes
    ctx.save();
    ctx.translate(ankleX, ankleY + 1.2);
    ctx.rotate(pose.footPitch);

    // Cloth ankle wrap collar
    ctx.fillStyle = wrapColor;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-3.4, -4.2);
    ctx.lineTo(3.0, -4.2);
    ctx.lineTo(4.2, 1.8);
    ctx.quadraticCurveTo(0, 3.2, -4.2, 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crossed cloth wrap band
    ctx.strokeStyle = wrapBand;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-2.8, -2.2);
    ctx.lineTo(2.8, -0.8);
    ctx.moveTo(-2.8, -0.4);
    ctx.lineTo(2.6, -2.0);
    ctx.stroke();

    // Exposed bare toes at the front of the foot-wrap (matching canonical master art)
    ctx.fillStyle = skinTone;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(5.0, 1.2, 3.0, 1.9, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }

  /**
   * Paints subtle animated cloak billow behind Nima during movement and jumps so her leaf cloak
   * responds organically to motion without detaching from her shoulders.
   */
  private static paintDynamicCloakTrail(
    ctx: CanvasRenderingContext2D,
    anchorX: number,
    anchorY: number,
    billowAmount: number,
    phase: number
  ): void {
    if (billowAmount <= 0.05) return;

    ctx.save();
    ctx.translate(anchorX, anchorY);

    const wave = Math.sin(phase) * 3.5 * billowAmount;
    const spanX = -16 - billowAmount * 11;
    const tipY = 6 - billowAmount * 5 + wave;

    const grad = ctx.createLinearGradient(0, -18, spanX, tipY);
    grad.addColorStop(0, '#4E6B48');
    grad.addColorStop(0.65, '#68865B');
    grad.addColorStop(1, '#3B5439');

    ctx.fillStyle = grad;
    ctx.strokeStyle = '#1E2822';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(-4, -18);
    ctx.quadraticCurveTo(spanX * 0.55, -14 + wave * 0.5, spanX, tipY);
    ctx.quadraticCurveTo(spanX * 0.45, 11 + wave * 0.3, -2, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private static renderNimaFrame(
    ctx: CanvasRenderingContext2D,
    masterCanvas: HTMLCanvasElement,
    upperBodyCutout: HTMLCanvasElement,
    frameIdx: number,
    ox: number,
    oy: number,
    fw: number,
    fh: number
  ): void {
    const baseDrawH = 88;
    const aspect = masterCanvas.width / masterCanvas.height;
    const baseDrawW = Math.round(baseDrawH * aspect);

    const groundY = oy + 100;
    const centerX = ox + fw * 0.5;

    let offsetX = 0;
    let offsetY = 0;
    let scaleX = 1.0;
    let scaleY = 1.0;
    let rotation = 0;
    let seedGlowRadius = 15;
    let seedGlowAlpha = 0.38;

    let useArticulatedLegs = false;
    let cloakBillow = 0;
    let cloakPhase = 0;
    let backLeg: LegJointPose = { hipAngle: 0, kneeBend: 0, footPitch: 0 };
    let frontLeg: LegJointPose = { hipAngle: 0, kneeBend: 0, footPitch: 0 };

    if (frameIdx <= 7) {
      // =====================================================================
      // IDLE (Frames 0..7): Uses intact canonical master artwork directly
      // =====================================================================
      const phase = (frameIdx / 8) * Math.PI * 2;
      const breath = Math.sin(phase);
      scaleX = 1.0 - breath * 0.01;
      scaleY = 1.0 + breath * 0.015;
      rotation = Math.sin(phase) * 0.01;
      seedGlowRadius = 15 + breath * 3;
      seedGlowAlpha = 0.36 + breath * 0.08;
      useArticulatedLegs = false;
    } else if (frameIdx >= 8 && frameIdx <= 17) {
      // =====================================================================
      // 10-FRAME RUN CYCLE (Frames 8..17):
      // Complete stride cycle: Contact -> Downward Compression -> Passing ->
      // High Point -> Opposite Contact -> Opposite Compression -> Opposite Passing ->
      // High Point -> Recovery
      // =====================================================================
      useArticulatedLegs = true;
      const step = frameIdx - 8; // 0..9
      const runPhase = (step / 10) * Math.PI * 2;
      cloakBillow = 0.85;
      cloakPhase = runPhase;

      // Keyframed 10-frame run cycle poses for front & back legs
      const runKeyframes: Array<{
        front: LegJointPose;
        back: LegJointPose;
        bobY: number;
        lean: number;
        sy: number;
      }> = [
        // Frame 8 (0): Right-leg forward Contact, Left-leg extended back push-off
        {
          front: { hipAngle: 0.58, kneeBend: 0.16, footPitch: -0.18, liftY: 0 },
          back: { hipAngle: -0.52, kneeBend: 0.38, footPitch: 0.36, liftY: 0 },
          bobY: 0.5,
          lean: 0.065,
          sy: 0.99,
        },
        // Frame 9 (1): Downward Compression (weight absorbed on front leg, back foot lifts)
        {
          front: { hipAngle: 0.32, kneeBend: 0.44, footPitch: 0.0, liftY: 1.2 },
          back: { hipAngle: -0.26, kneeBend: 0.92, footPitch: 0.48, liftY: 0.5 },
          bobY: 2.4,
          lean: 0.08,
          sy: 0.965,
        },
        // Frame 10 (2): Passing I (back leg swings rapidly forward past standing front leg)
        {
          front: { hipAngle: 0.02, kneeBend: 0.18, footPitch: 0.08, liftY: 0.4 },
          back: { hipAngle: 0.22, kneeBend: 1.05, footPitch: 0.22, liftY: -1.6 },
          bobY: 0.6,
          lean: 0.065,
          sy: 1.0,
        },
        // Frame 11 (3): High Point / Drive I (back leg drives high forward, front leg pushes off back)
        {
          front: { hipAngle: -0.34, kneeBend: 0.22, footPitch: 0.34, liftY: -0.8 },
          back: { hipAngle: 0.62, kneeBend: 0.46, footPitch: -0.12, liftY: -1.8 },
          bobY: -2.2,
          lean: 0.055,
          sy: 1.02,
        },
        // Frame 12 (4): Extended Airborne Stride I
        {
          front: { hipAngle: -0.54, kneeBend: 0.32, footPitch: 0.42, liftY: -0.4 },
          back: { hipAngle: 0.64, kneeBend: 0.18, footPitch: -0.20, liftY: -0.6 },
          bobY: -1.4,
          lean: 0.06,
          sy: 1.01,
        },
        // Frame 13 (5): Opposite Contact (Back leg lands forward, Front leg extended behind)
        {
          front: { hipAngle: -0.50, kneeBend: 0.42, footPitch: 0.36, liftY: 0 },
          back: { hipAngle: 0.56, kneeBend: 0.18, footPitch: -0.16, liftY: 0 },
          bobY: 0.5,
          lean: 0.065,
          sy: 0.99,
        },
        // Frame 14 (6): Opposite Downward Compression
        {
          front: { hipAngle: -0.24, kneeBend: 0.94, footPitch: 0.48, liftY: 0.5 },
          back: { hipAngle: 0.30, kneeBend: 0.44, footPitch: 0.0, liftY: 1.2 },
          bobY: 2.4,
          lean: 0.08,
          sy: 0.965,
        },
        // Frame 15 (7): Opposite Passing II (Front leg swings forward with high knee lift)
        {
          front: { hipAngle: 0.24, kneeBend: 1.05, footPitch: 0.22, liftY: -1.6 },
          back: { hipAngle: 0.0, kneeBend: 0.18, footPitch: 0.08, liftY: 0.4 },
          bobY: 0.6,
          lean: 0.065,
          sy: 1.0,
        },
        // Frame 16 (8): High Point / Drive II
        {
          front: { hipAngle: 0.64, kneeBend: 0.44, footPitch: -0.12, liftY: -1.8 },
          back: { hipAngle: -0.36, kneeBend: 0.22, footPitch: 0.34, liftY: -0.8 },
          bobY: -2.2,
          lean: 0.055,
          sy: 1.02,
        },
        // Frame 17 (9): Recovery into Contact
        {
          front: { hipAngle: 0.62, kneeBend: 0.20, footPitch: -0.18, liftY: -0.4 },
          back: { hipAngle: -0.52, kneeBend: 0.30, footPitch: 0.38, liftY: -0.4 },
          bobY: -1.1,
          lean: 0.06,
          sy: 1.01,
        },
      ];

      const kf = runKeyframes[step];
      frontLeg = kf.front;
      backLeg = kf.back;
      offsetY = kf.bobY;
      rotation = kf.lean;
      scaleY = kf.sy;
      scaleX = 2.0 - kf.sy;
      offsetX = 1.5;
      seedGlowRadius = 17;
      seedGlowAlpha = 0.44;
    } else if (frameIdx >= 18 && frameIdx <= 20) {
      // =====================================================================
      // JUMP ANTICIPATION & TAKEOFF (Frames 18..20)
      // =====================================================================
      useArticulatedLegs = true;
      const t = frameIdx - 18;
      if (t === 0) {
        scaleX = 1.06;
        scaleY = 0.92;
        offsetY = 3;
        rotation = 0.04;
        cloakBillow = 0.35;
        backLeg = { hipAngle: -0.2, kneeBend: 0.72, footPitch: 0.1, liftY: 2 };
        frontLeg = { hipAngle: 0.36, kneeBend: 0.78, footPitch: -0.05, liftY: 2 };
      } else {
        scaleX = 0.95;
        scaleY = 1.06;
        offsetY = -4;
        rotation = -0.04;
        cloakBillow = 0.75;
        backLeg = { hipAngle: -0.36, kneeBend: 0.16, footPitch: 0.42, liftY: -1 };
        frontLeg = { hipAngle: 0.56, kneeBend: 0.88, footPitch: 0.22, liftY: -2 };
      }
      seedGlowRadius = 19;
      seedGlowAlpha = 0.5;
    } else if (frameIdx >= 21 && frameIdx <= 23) {
      // =====================================================================
      // AIRBORNE RISE (Frames 21..23)
      // =====================================================================
      useArticulatedLegs = true;
      const t = frameIdx - 21;
      scaleX = 0.96;
      scaleY = 1.04;
      offsetY = -4 - (t % 2);
      rotation = -0.03;
      cloakBillow = 0.85;
      cloakPhase = t * 1.1;
      backLeg = { hipAngle: -0.28, kneeBend: 0.38, footPitch: 0.35, liftY: -1 };
      frontLeg = { hipAngle: 0.58, kneeBend: 0.95, footPitch: 0.28, liftY: -2 };
      seedGlowRadius = 18;
      seedGlowAlpha = 0.46;
    } else if (frameIdx >= 24 && frameIdx <= 26) {
      // =====================================================================
      // AIRBORNE FALL (Frames 24..26)
      // =====================================================================
      useArticulatedLegs = true;
      const t = frameIdx - 24;
      scaleX = 1.02;
      scaleY = 0.98;
      offsetY = -2;
      rotation = 0.03;
      cloakBillow = 1.0;
      cloakPhase = t * 1.3;
      backLeg = { hipAngle: -0.18, kneeBend: 0.42, footPitch: 0.22, liftY: -1 };
      frontLeg = { hipAngle: 0.32, kneeBend: 0.22, footPitch: -0.12, liftY: 0 };
      seedGlowRadius = 16;
      seedGlowAlpha = 0.42;
    } else if (frameIdx >= 27 && frameIdx <= 30) {
      // =====================================================================
      // LANDING RECOVERY (Frames 27..30)
      // =====================================================================
      useArticulatedLegs = true;
      const t = (frameIdx - 27) / 3;
      const squash = Math.sin((1 - t) * Math.PI * 0.5);
      scaleX = 1.0 + squash * 0.08;
      scaleY = 1.0 - squash * 0.09;
      offsetY = squash * 3.5;
      rotation = squash * 0.05;
      cloakBillow = squash * 0.6;
      backLeg = {
        hipAngle: -0.22 * squash,
        kneeBend: 0.68 * squash,
        footPitch: 0,
        liftY: squash * 2.2,
      };
      frontLeg = {
        hipAngle: 0.32 * squash,
        kneeBend: 0.72 * squash,
        footPitch: 0,
        liftY: squash * 2.2,
      };
    } else if (frameIdx >= 31 && frameIdx <= 36) {
      // =====================================================================
      // WAKE PULSE CAST (Frames 31..36)
      // =====================================================================
      useArticulatedLegs = true;
      const t = (frameIdx - 31) / 5;
      const lift = Math.sin(t * Math.PI);
      scaleX = 1.0 + lift * 0.04;
      scaleY = 1.0 + lift * 0.04;
      offsetY = -lift * 2.5;
      rotation = -lift * 0.035;
      cloakBillow = lift * 0.85;
      cloakPhase = t * Math.PI * 2;
      seedGlowRadius = 18 + lift * 16;
      seedGlowAlpha = 0.55 + lift * 0.35;
      backLeg = { hipAngle: -0.22, kneeBend: 0.16, footPitch: 0.08 };
      frontLeg = { hipAngle: 0.26, kneeBend: 0.14, footPitch: -0.04 };
    } else {
      // =====================================================================
      // RESPAWN REFORM (Frames 37..40)
      // =====================================================================
      const t = (frameIdx - 37) / 3;
      scaleX = 0.88 + t * 0.12;
      scaleY = 0.88 + t * 0.12;
      offsetY = (1 - t) * -6;
      seedGlowRadius = 22;
      seedGlowAlpha = 0.75;
      useArticulatedLegs = false;
    }

    ctx.save();
    ctx.translate(centerX + offsetX, groundY + offsetY);
    ctx.rotate(rotation);
    ctx.scale(scaleX, scaleY);

    // 1. Soft ground contact shadow when near ground
    if (offsetY >= -2) {
      ctx.fillStyle = 'rgba(9, 14, 23, 0.34)';
      ctx.beginPath();
      ctx.ellipse(0, 1, 13, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!useArticulatedLegs) {
      ctx.drawImage(masterCanvas, -baseDrawW * 0.5, -baseDrawH, baseDrawW, baseDrawH);
    } else {
      // 1. Dynamic leaf-cloak billow behind Nima
      this.paintDynamicCloakTrail(ctx, -6, -42, cloakBillow, cloakPhase);

      // 2. Back leg & Front leg anchored at hipY = -23 (tucked cleanly under the cream tunic hem at -35)
      this.paintArticulatedLeg(ctx, -1.5, -23, backLeg, true);
      this.paintArticulatedLeg(ctx, 2.0, -23, frontLeg, false);

      // 3. Upper-body cutout (head, cloak, satchel, cream tunic, and hands holding the seed)
      ctx.drawImage(upperBodyCutout, -baseDrawW * 0.5, -baseDrawH, baseDrawW, baseDrawH);
    }

    // 4. Warm Living Seed Glow in Nima's hands (strictly bounded inside cell)
    const seedX = baseDrawW * 0.16;
    const seedY = -baseDrawH * 0.52;
    const safeGlowR = Math.min(seedGlowRadius, 24);
    const seedGrad = ctx.createRadialGradient(seedX, seedY, 2, seedX, seedY, safeGlowR);
    seedGrad.addColorStop(0, `rgba(255, 248, 214, ${seedGlowAlpha.toFixed(3)})`);
    seedGrad.addColorStop(0.5, `rgba(241, 200, 120, ${(seedGlowAlpha * 0.55).toFixed(3)})`);
    seedGrad.addColorStop(1, 'rgba(241, 200, 120, 0)');

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = seedGrad;
    ctx.beginPath();
    ctx.arc(seedX, seedY, safeGlowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static renderPipFrame(
    ctx: CanvasRenderingContext2D,
    masterCanvas: HTMLCanvasElement,
    frameIdx: number,
    ox: number,
    oy: number,
    fw: number,
    fh: number
  ): void {
    const baseSize = 36;
    const aspect = masterCanvas.width / masterCanvas.height;
    const drawW = aspect >= 1 ? baseSize : Math.round(baseSize * aspect);
    const drawH = aspect >= 1 ? Math.round(baseSize / aspect) : baseSize;

    const cx = ox + fw * 0.5;
    const cy = oy + fh * 0.5;

    let offsetY = 0;
    let scaleX = 1.0;
    let scaleY = 1.0;
    let rotation = 0;
    let haloRadius = 18;
    let haloAlpha = 0.42;

    if (frameIdx <= 5) {
      const phase = (frameIdx / 6) * Math.PI * 2;
      offsetY = Math.sin(phase) * 2.2;
      scaleX = 1.0 + Math.cos(phase) * 0.04;
      scaleY = 1.0 - Math.cos(phase) * 0.04;
      haloRadius = 18 + Math.sin(phase) * 2.5;
    } else if (frameIdx <= 11) {
      const phase = ((frameIdx - 6) / 6) * Math.PI * 2;
      rotation = 0.14 + Math.sin(phase) * 0.05;
      scaleX = 1.06;
      scaleY = 0.95;
      offsetY = Math.cos(phase) * 1.6;
    } else if (frameIdx <= 15) {
      const phase = ((frameIdx - 12) / 4) * Math.PI * 2;
      rotation = Math.sin(phase) * 0.14;
      haloRadius = 21;
      haloAlpha = 0.55;
    } else {
      const t = (frameIdx - 16) / 5;
      const pulse = Math.sin(t * Math.PI);
      scaleX = 1.0 + pulse * 0.16;
      scaleY = 1.0 + pulse * 0.16;
      haloRadius = 20 + pulse * 5;
      haloAlpha = 0.62 + pulse * 0.28;
    }

    ctx.save();
    ctx.translate(cx, cy + offsetY);
    ctx.rotate(rotation);
    ctx.scale(scaleX, scaleY);

    const safeHaloR = Math.min(haloRadius, 24);
    const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, safeHaloR);
    halo.addColorStop(0, `rgba(241, 200, 120, ${haloAlpha.toFixed(3)})`);
    halo.addColorStop(0.55, `rgba(143, 231, 199, ${(haloAlpha * 0.55).toFixed(3)})`);
    halo.addColorStop(1, 'rgba(143, 231, 199, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, safeHaloR, 0, Math.PI * 2);
    ctx.fill();

    ctx.drawImage(masterCanvas, -drawW * 0.5, -drawH * 0.5, drawW, drawH);
    ctx.restore();
  }
}
