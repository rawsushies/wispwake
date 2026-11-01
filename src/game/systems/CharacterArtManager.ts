import Phaser from 'phaser';

interface LegPose {
  hipX: number;
  hipY: number;
  kneeX: number;
  kneeY: number;
  ankleX: number;
  ankleY: number;
  toeAngle: number;
}

interface RunFrameSpec {
  bobY: number;
  torsoLean: number;
  cloakWave: number;
  frontLeg: LegPose;
  rearLeg: LegPose;
}

/**
 * CharacterArtManager — Milestone 5 Identity-Locked Skeletal & Hand-Painted Character Pipeline (Section 02 & 03).
 *
 * Fixes the Milestone 4 visual defects:
 * 1. Identity Lock: Uses `nima_master_raw` (`nima_side_gameplay_master_1793518602554.jpg`) as the single
 *    canonical source for Nima's head, tousled chestnut hair, facial proportions, leaf-embroidered cloak,
 *    satchel, and glowing seed at a locked scale across all 41 frames—eliminating character/costume morphing
 *    and aspect-ratio height shrinking.
 * 2. Clean Upper-Body Extraction: Masks out the standing dual-legs below Nima's cream tunic hem (`y > 62%`)
 *    so the standing legs are never drawn during movement.
 * 3. 10-Frame Biomechanical Run Cycle (`frames 8..17`): Renders independent, anatomically articulated Front
 *    and Rear legs (thigh, patched knee, cuffed shin, cross-wrapped ankle, and bare toes) across Contact,
 *    Downward Compression, Passing, High-Point, Opposite Contact, Opposite Compression, Opposite Passing,
 *    and Recovery phases, plus a dynamic billowing leaf-cloak tail.
 * 4. Strict Frame Clipping & Contained Seed Halo (Bug Priority B): Caps sprite-local seed glow so its radial
 *    gradient reaches 0.0 alpha strictly inside the 96x112 frame cell, preventing any rectangular clipping edge.
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
   * Creates an upper-body cutout from the canonical side-profile master where the standing
   * trousers and feet below the cream tunic hem (`relY > 0.625`) are cleanly erased, while
   * preserving the left leaf-cloak tips (`relX < 0.42`).
   */
  private static createUpperBodyCutout(
    cleanMaster: HTMLCanvasElement,
    bounds: { minX: number; minY: number; width: number; height: number }
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = cleanMaster.width;
    canvas.height = cleanMaster.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.drawImage(cleanMaster, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    for (let y = bounds.minY; y <= bounds.minY + bounds.height; y++) {
      const relY = (y - bounds.minY) / bounds.height;
      if (relY < 0.60) continue;

      for (let x = bounds.minX; x <= bounds.minX + bounds.width; x++) {
        const relX = (x - bounds.minX) / bounds.width;
        const pIdx = (y * canvas.width + x) * 4;
        if (d[pIdx + 3] === 0) continue;

        // Keep the trailing green leaf cloak on the left (`relX < 0.38 && relY < 0.78`),
        // erase the standing brown trousers and feet (`relX >= 0.36 && relY > 0.625`).
        const isCloakTail = relX < 0.37 && relY < 0.76;
        if (!isCloakTail) {
          if (relY >= 0.635) {
            d[pIdx + 3] = 0;
          } else if (relY > 0.605) {
            const fade = 1 - (relY - 0.605) / 0.03;
            d[pIdx + 3] = Math.round(d[pIdx + 3] * fade);
          }
        } else if (relY >= 0.73) {
          const fade = Math.max(0, 1 - (relY - 0.73) / 0.04);
          d[pIdx + 3] = Math.round(d[pIdx + 3] * fade);
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  /**
   * Paints a single anatomically articulated leg (thigh -> knee -> shin -> ankle wrap -> bare toes)
   * matching the exact hand-painted brushwork and palette of `nima_side_gameplay_master`.
   */
  private static paintArticulatedLeg(
    ctx: CanvasRenderingContext2D,
    pose: LegPose,
    isFrontLeg: boolean
  ): void {
    const outline = '#181311';
    const trouserMain = isFrontLeg ? '#7B5A44' : '#594030';
    const trouserHighlight = isFrontLeg ? '#916D54' : '#684C39';
    const patchColor = isFrontLeg ? '#9B7B5C' : '#735942';
    const wrapColor = isFrontLeg ? '#5B5041' : '#443C31';
    const wrapBand = isFrontLeg ? '#746755' : '#564C3F';
    const skinColor = isFrontLeg ? '#F0BFA0' : '#CFA082';

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. THIGH SEGMENT (Hip to Knee) with tapered organic trouser volume
    const thighAngle = Math.atan2(pose.kneeY - pose.hipY, pose.kneeX - pose.hipX);
    const thighLen = Math.hypot(pose.kneeX - pose.hipX, pose.kneeY - pose.hipY);

    ctx.save();
    ctx.translate(pose.hipX, pose.hipY);
    ctx.rotate(thighAngle);

    ctx.fillStyle = trouserMain;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -6.2);
    ctx.quadraticCurveTo(thighLen * 0.5, -6.8, thighLen, -5.2);
    ctx.arc(thighLen, 0, 5.2, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.quadraticCurveTo(thighLen * 0.5, 6.2, 0, 5.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Soft painterly highlight along top of thigh
    ctx.strokeStyle = trouserHighlight;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(2, -3.5);
    ctx.lineTo(Math.max(3, thighLen - 2), -3.0);
    ctx.stroke();
    ctx.restore();

    // 2. SHIN / CALF SEGMENT (Knee to Ankle) with puffed trouser cuff + stitched knee patch
    const shinAngle = Math.atan2(pose.ankleY - pose.kneeY, pose.ankleX - pose.kneeX);
    const shinLen = Math.hypot(pose.ankleX - pose.kneeX, pose.ankleY - pose.kneeY);
    const cuffLen = shinLen * 0.64;

    ctx.save();
    ctx.translate(pose.kneeX, pose.kneeY);
    ctx.rotate(shinAngle);

    // Lower trouser leg (Knee to calf cuff)
    ctx.fillStyle = trouserMain;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-1, -5.0);
    ctx.quadraticCurveTo(cuffLen * 0.55, -5.6, cuffLen, -4.4);
    ctx.lineTo(cuffLen, 4.4);
    ctx.quadraticCurveTo(cuffLen * 0.55, 5.4, -1, 4.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Signature stitched knee patch on front leg
    if (isFrontLeg && cuffLen >= 6) {
      ctx.fillStyle = patchColor;
      ctx.strokeStyle = '#3B281D';
      ctx.lineWidth = 0.9;
      ctx.fillRect(1.5, -3.2, Math.min(5.5, cuffLen * 0.55), 5.2);
      ctx.strokeRect(1.5, -3.2, Math.min(5.5, cuffLen * 0.55), 5.2);
    }

    // 3. ANKLE & FOOT-WRAP (Cuff to Ankle)
    ctx.fillStyle = wrapColor;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cuffLen - 0.5, -3.4);
    ctx.lineTo(shinLen, -2.8);
    ctx.lineTo(shinLen, 2.8);
    ctx.lineTo(cuffLen - 0.5, 3.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Criss-cross bandage wrap line
    ctx.strokeStyle = wrapBand;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cuffLen + 1, -2.2);
    ctx.lineTo(shinLen - 1, 2.0);
    ctx.stroke();
    ctx.restore();

    // 4. FOOT & BARE TOES (Anchored at Ankle, rotated by toeAngle)
    ctx.save();
    ctx.translate(pose.ankleX, pose.ankleY);
    ctx.rotate(pose.toeAngle);

    // Wrapped heel & arch
    ctx.fillStyle = wrapColor;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-3.2, -2.2);
    ctx.lineTo(4.8, -1.8);
    ctx.lineTo(5.6, 2.6);
    ctx.lineTo(-3.4, 2.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Exposed bare toes at front of foot-wrap
    ctx.fillStyle = skinColor;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(6.8, 0.9, 2.8, 1.8, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }

  /**
   * Paints a dynamic trailing leaf-cloak tail behind Nima's back during running and jumping
   * so her leaf cloak responds naturally to movement without deforming her upper body.
   */
  private static paintDynamicCloakTail(
    ctx: CanvasRenderingContext2D,
    anchorX: number,
    anchorY: number,
    wavePhase: number,
    intensity: number
  ): void {
    if (intensity <= 0.05) return;

    const flutter = Math.sin(wavePhase) * 4.5 * intensity;
    const lift = 6 * intensity + Math.cos(wavePhase) * 2.5;

    ctx.save();
    ctx.translate(anchorX, anchorY);

    const cloakGrad = ctx.createLinearGradient(-26, 0, 4, 26);
    cloakGrad.addColorStop(0, '#729368');
    cloakGrad.addColorStop(0.6, '#52704D');
    cloakGrad.addColorStop(1, '#395238');

    ctx.fillStyle = cloakGrad;
    ctx.strokeStyle = '#181311';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.quadraticCurveTo(-14, -4 - lift * 0.5, -26 - intensity * 5, 10 - lift + flutter);
    ctx.quadraticCurveTo(-18, 16 - lift * 0.6 + flutter * 0.6, -12, 14 - lift * 0.4);
    ctx.quadraticCurveTo(-16, 22 - lift * 0.3 + flutter * 0.5, -20 - intensity * 3, 25 - lift * 0.3 + flutter);
    ctx.quadraticCurveTo(-6, 24, 4, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Embroidered leaf vein on the billowing cloak
    ctx.strokeStyle = '#92B082';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-2, -2);
    ctx.quadraticCurveTo(-12, 4 - lift * 0.4, -21 - intensity * 3, 10 - lift * 0.8 + flutter * 0.8);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Returns the 10 distinct biomechanical keyframes for Nima's running cycle (`frames 8..17`).
   * Coordinates are relative to `(footAnchorX, footAnchorY)` where ground level is `y = 0`
   * and hip center is around `(2, -28)`.
   */
  private static getRunCycleSpecs(): RunFrameSpec[] {
    return [
      // Frame 0 (Sheet 8): CONTACT (Right leg extended forward touching ground, Left leg extended back)
      {
        bobY: 0.5,
        torsoLean: 0.065,
        cloakWave: 0.0,
        frontLeg: { hipX: 3, hipY: -27, kneeX: 9, kneeY: -14, ankleX: 12, ankleY: -2, toeAngle: -0.22 },
        rearLeg: { hipX: -1, hipY: -27, kneeX: -7, kneeY: -14, ankleX: -14, ankleY: -3, toeAngle: 0.48 },
      },
      // Frame 1 (Sheet 9): DOWNWARD COMPRESSION (Right knee bends absorbing impact, Left foot lifts behind)
      {
        bobY: 2.2,
        torsoLean: 0.08,
        cloakWave: 0.65,
        frontLeg: { hipX: 3, hipY: -25, kneeX: 10, kneeY: -13, ankleX: 7, ankleY: -2, toeAngle: 0.0 },
        rearLeg: { hipX: -1, hipY: -25, kneeX: -5, kneeY: -13, ankleX: -15, ankleY: -10, toeAngle: 0.65 },
      },
      // Frame 2 (Sheet 10): PASSING (Right leg planted vertical under hip, Left knee driving forward & high)
      {
        bobY: 0.4,
        torsoLean: 0.055,
        cloakWave: 1.3,
        frontLeg: { hipX: 2, hipY: -27, kneeX: 4, kneeY: -14, ankleX: 1, ankleY: -2, toeAngle: 0.0 },
        rearLeg: { hipX: 1, hipY: -27, kneeX: 9, kneeY: -15, ankleX: -2, ankleY: -9, toeAngle: 0.35 },
      },
      // Frame 3 (Sheet 11): HIGH POINT / DRIVE (Right toe pushing off behind, Left knee high and reaching out)
      {
        bobY: -2.4,
        torsoLean: 0.045,
        cloakWave: 1.95,
        frontLeg: { hipX: 1, hipY: -29, kneeX: -4, kneeY: -15, ankleX: -10, ankleY: -3, toeAngle: 0.42 },
        rearLeg: { hipX: 3, hipY: -29, kneeX: 12, kneeY: -16, ankleX: 11, ankleY: -6, toeAngle: -0.15 },
      },
      // Frame 4 (Sheet 12): RECOVERY / PRE-CONTACT (Left leg reaching out for strike, Right leg trailing back)
      {
        bobY: -1.0,
        torsoLean: 0.06,
        cloakWave: 2.55,
        frontLeg: { hipX: 0, hipY: -28, kneeX: -6, kneeY: -15, ankleX: -14, ankleY: -7, toeAngle: 0.55 },
        rearLeg: { hipX: 3, hipY: -28, kneeX: 11, kneeY: -15, ankleX: 14, ankleY: -4, toeAngle: -0.25 },
      },
      // Frame 5 (Sheet 13): OPPOSITE CONTACT (Left leg strikes ground forward, Right leg pushes off back)
      {
        bobY: 0.5,
        torsoLean: 0.065,
        cloakWave: 3.14,
        frontLeg: { hipX: -1, hipY: -27, kneeX: -7, kneeY: -14, ankleX: -14, ankleY: -3, toeAngle: 0.48 },
        rearLeg: { hipX: 3, hipY: -27, kneeX: 9, kneeY: -14, ankleX: 12, ankleY: -2, toeAngle: -0.22 },
      },
      // Frame 6 (Sheet 14): OPPOSITE COMPRESSION (Left knee absorbs impact, Right foot lifts behind)
      {
        bobY: 2.2,
        torsoLean: 0.08,
        cloakWave: 3.8,
        frontLeg: { hipX: -1, hipY: -25, kneeX: -5, kneeY: -13, ankleX: -15, ankleY: -10, toeAngle: 0.65 },
        rearLeg: { hipX: 3, hipY: -25, kneeX: 10, kneeY: -13, ankleX: 7, ankleY: -2, toeAngle: 0.0 },
      },
      // Frame 7 (Sheet 15): OPPOSITE PASSING (Left leg planted vertical, Right knee driving high & forward)
      {
        bobY: 0.4,
        torsoLean: 0.055,
        cloakWave: 4.45,
        frontLeg: { hipX: 1, hipY: -27, kneeX: 9, kneeY: -15, ankleX: -2, ankleY: -9, toeAngle: 0.35 },
        rearLeg: { hipX: 2, hipY: -27, kneeX: 4, kneeY: -14, ankleX: 1, ankleY: -2, toeAngle: 0.0 },
      },
      // Frame 8 (Sheet 16): OPPOSITE HIGH POINT (Left toe pushing off, Right knee driving forward)
      {
        bobY: -2.4,
        torsoLean: 0.045,
        cloakWave: 5.1,
        frontLeg: { hipX: 3, hipY: -29, kneeX: 12, kneeY: -16, ankleX: 11, ankleY: -6, toeAngle: -0.15 },
        rearLeg: { hipX: 1, hipY: -29, kneeX: -4, kneeY: -15, ankleX: -10, ankleY: -3, toeAngle: 0.42 },
      },
      // Frame 9 (Sheet 17): OPPOSITE RECOVERY (Right foot reaching for ground strike, Left leg trailing)
      {
        bobY: -1.0,
        torsoLean: 0.06,
        cloakWave: 5.7,
        frontLeg: { hipX: 3, hipY: -28, kneeX: 11, kneeY: -15, ankleX: 14, ankleY: -4, toeAngle: -0.25 },
        rearLeg: { hipX: 0, hipY: -28, kneeX: -6, kneeY: -15, ankleX: -14, ankleY: -7, toeAngle: 0.55 },
      },
    ];
  }

  public static buildNimaAtlasFromMaster(scene: Phaser.Scene): boolean {
    if (!scene.textures.exists('nima_master_raw')) return false;
    const rawIdle = scene.textures.get('nima_master_raw').getSourceImage() as HTMLImageElement;
    if (!rawIdle || !rawIdle.width) return false;

    const cleanFullMaster = this.extractTransparentMaster(rawIdle, 38, 56);
    const boundsFull = this.getOpaqueBounds(cleanFullMaster);
    const upperBodyCutout = this.createUpperBodyCutout(cleanFullMaster, boundsFull);

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

    // Locked canonical character scale so Nima's head, hair, cloak, and proportions NEVER change size
    const baseHeight = 86;
    const masterScale = baseHeight / boundsFull.height;
    const destW = boundsFull.width * masterScale;
    const destH = baseHeight;

    const runSpecs = this.getRunCycleSpecs();

    for (let frameIdx = 0; frameIdx < 41; frameIdx++) {
      const col = frameIdx % cols;
      const row = Math.floor(frameIdx / cols);
      const ox = col * fw;
      const oy = row * fh;

      const footAnchorX = ox + fw * 0.5;
      const footAnchorY = oy + 100;

      ctx.save();
      // Strictly clip to the 96x112 frame cell so no pixels or glow can ever bleed into adjacent frames
      ctx.beginPath();
      ctx.rect(ox, oy, fw, fh);
      ctx.clip();

      // 1. Soft ground contact shadow at y = 100
      const shadowGrad = ctx.createRadialGradient(footAnchorX, footAnchorY, 2, footAnchorX, footAnchorY, 18);
      shadowGrad.addColorStop(0, 'rgba(18, 27, 43, 0.55)');
      shadowGrad.addColorStop(1, 'rgba(18, 27, 43, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(footAnchorX, footAnchorY, 16, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();

      let bobY = 0;
      let torsoLean = 0;
      let seedGlowIntensity = 1.0;
      let alpha = 1.0;
      let useArticulatedLegs = false;
      let frontLeg: LegPose = runSpecs[0].frontLeg;
      let rearLeg: LegPose = runSpecs[0].rearLeg;
      let cloakWave = 0;
      let cloakIntensity = 0;

      if (frameIdx < 8) {
        // IDLE (Frames 0..7): Gentle breathing on full canonical master
        const t = (frameIdx / 8) * Math.PI * 2;
        bobY = Math.sin(t) * 0.8;
        seedGlowIntensity = 0.92 + Math.sin(t) * 0.14;
        useArticulatedLegs = false;
      } else if (frameIdx < 18) {
        // RUN CYCLE (Frames 8..17): 10-pose articulated running stride
        const spec = runSpecs[frameIdx - 8];
        bobY = spec.bobY;
        torsoLean = spec.torsoLean;
        frontLeg = spec.frontLeg;
        rearLeg = spec.rearLeg;
        cloakWave = spec.cloakWave;
        cloakIntensity = 1.0;
        seedGlowIntensity = 1.05;
        useArticulatedLegs = true;
      } else if (frameIdx < 21) {
        // JUMP START (Frames 18..20): Crouch anticipation into upward launch
        const p = (frameIdx - 18) / 2;
        bobY = 2.0 * (1 - p) - p * 1.5;
        torsoLean = 0.04 - p * 0.06;
        frontLeg = { hipX: 2, hipY: -26, kneeX: 9, kneeY: -14, ankleX: 5, ankleY: -3 - p * 4, toeAngle: 0.25 };
        rearLeg = { hipX: -1, hipY: -26, kneeX: 5, kneeY: -14, ankleX: -3, ankleY: -2 - p * 3, toeAngle: 0.3 };
        cloakWave = p * 1.5;
        cloakIntensity = 0.6;
        useArticulatedLegs = true;
      } else if (frameIdx < 24) {
        // RISING (Frames 21..23): Airborne upward drive with tucked front knee
        const p = (frameIdx - 21) / 3;
        bobY = -2.5;
        torsoLean = -0.03;
        frontLeg = { hipX: 2, hipY: -28, kneeX: 11, kneeY: -17, ankleX: 6, ankleY: -7, toeAngle: 0.35 };
        rearLeg = { hipX: -1, hipY: -28, kneeX: -3, kneeY: -14, ankleX: -9, ankleY: -4, toeAngle: 0.5 };
        cloakWave = p * Math.PI * 2;
        cloakIntensity = 0.85;
        seedGlowIntensity = 1.12;
        useArticulatedLegs = true;
      } else if (frameIdx < 27) {
        // FALLING (Frames 24..26): Descending pose with trailing cloak and extended landing leg
        const p = (frameIdx - 24) / 3;
        bobY = -1.0;
        torsoLean = 0.03;
        frontLeg = { hipX: 2, hipY: -27, kneeX: 8, kneeY: -13, ankleX: 9, ankleY: -2, toeAngle: 0.15 };
        rearLeg = { hipX: -1, hipY: -27, kneeX: 4, kneeY: -15, ankleX: -4, ankleY: -7, toeAngle: 0.35 };
        cloakWave = p * Math.PI * 2;
        cloakIntensity = 0.95;
        useArticulatedLegs = true;
      } else if (frameIdx < 31) {
        // LANDING (Frames 27..30): Knee absorption settling back to standing
        const p = (frameIdx - 27) / 3;
        if (p < 0.6) {
          bobY = 2.4 * (1 - p);
          torsoLean = 0.05 * (1 - p);
          frontLeg = { hipX: 2, hipY: -25, kneeX: 8, kneeY: -13, ankleX: 5, ankleY: -2, toeAngle: 0.0 };
          rearLeg = { hipX: -1, hipY: -25, kneeX: 3, kneeY: -13, ankleX: -3, ankleY: -2, toeAngle: 0.0 };
          cloakIntensity = 0.4 * (1 - p);
          useArticulatedLegs = true;
        } else {
          bobY = 0.5 * (1 - p);
          useArticulatedLegs = false;
        }
      } else if (frameIdx < 37) {
        // WAKE CAST (Frames 31..36): Raising the warm seed (halo strictly contained inside 96x112 frame)
        const p = (frameIdx - 31) / 5;
        const wave = Math.sin(p * Math.PI);
        bobY = -wave * 1.6;
        seedGlowIntensity = 1.15 + wave * 0.45;
        useArticulatedLegs = false;
      } else {
        // RESPAWN (Frames 37..40)
        const p = (frameIdx - 37) / 3;
        bobY = (1 - p) * -4;
        seedGlowIntensity = 1.35 - p * 0.35;
        alpha = 0.5 + p * 0.5;
        useArticulatedLegs = false;
      }

      ctx.globalAlpha = alpha;
      ctx.translate(footAnchorX, footAnchorY);

      if (useArticulatedLegs) {
        // Painter's Order:
        // A. Dynamic billowing leaf-cloak tail behind Nima
        this.paintDynamicCloakTail(ctx, -6, -54 + bobY, cloakWave, cloakIntensity);

        // B. Shaded Rear Leg
        this.paintArticulatedLeg(ctx, rearLeg, false);

        // C. Illuminated Front Leg with knee patch
        this.paintArticulatedLeg(ctx, frontLeg, true);

        // D. Canonical Upper Body, Head, Hair, Cloak, Satchel & Seed (with slight torso lean around hip pivot)
        ctx.save();
        ctx.translate(0, -28 + bobY);
        ctx.rotate(torsoLean);
        ctx.translate(0, 28);
        ctx.drawImage(
          upperBodyCutout,
          boundsFull.minX,
          boundsFull.minY,
          boundsFull.width,
          boundsFull.height,
          -destW * 0.5,
          -destH,
          destW,
          destH
        );
        ctx.restore();
      } else {
        // Standing Idle / Wake Cast / Respawn: Full canonical master
        ctx.drawImage(
          cleanFullMaster,
          boundsFull.minX,
          boundsFull.minY,
          boundsFull.width,
          boundsFull.height,
          -destW * 0.5,
          -destH + bobY,
          destW,
          destH
        );
      }

      // 3. Strictly Contained Seed Glow (Max radius 22px so `seedX + 22 <= 38 < 48`, never touching the 96px frame edge)
      const seedX = destW * 0.22;
      const seedY = -destH * 0.56 + bobY;
      const haloRadius = Math.min(22, 14 * seedGlowIntensity);
      const seedHalo = ctx.createRadialGradient(seedX, seedY, 1, seedX, seedY, haloRadius);
      seedHalo.addColorStop(0, `rgba(255, 248, 220, ${Math.min(0.85, 0.45 * seedGlowIntensity)})`);
      seedHalo.addColorStop(0.5, `rgba(241, 200, 120, ${Math.min(0.55, 0.24 * seedGlowIntensity)})`);
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
   * Builds the approved 22-frame `pip_sheet` (56x56 per frame) from `pip_master_raw`
   * with strict cell clipping so glow never touches the 56x56 frame edge.
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

    const baseSize = 40;
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
      ctx.beginPath();
      ctx.rect(ox, oy, fw, fh);
      ctx.clip();

      ctx.translate(cx, cy + Math.cos(phase) * 1.5);

      if (isCurious) {
        ctx.rotate(Math.sin(phase) * 0.22);
      } else if (isWakeReact) {
        ctx.scale(1.08 + Math.sin(phase) * 0.06, 1.08 + Math.cos(phase) * 0.06);
      }

      const glowRadius = isWakeReact ? 22 : 19;
      const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, glowRadius);
      aura.addColorStop(0, isWakeReact ? 'rgba(143, 231, 199, 0.8)' : 'rgba(183, 162, 232, 0.5)');
      aura.addColorStop(0.55, isWakeReact ? 'rgba(241, 200, 120, 0.38)' : 'rgba(143, 231, 199, 0.22)');
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
