import { MouthLandmarks, LipSyncConfig, EyeLandmarks, EyePosition } from '../types';

/**
 * Renders a lip-synced frame onto a 2D canvas.
 * Implements non-rigid mouth aperture warping, oral cavity synthesis,
 * teeth/tongue rendering, natural eye blinking, and interactive landmarks.
 */
export function renderLipSyncFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  mouth: MouthLandmarks,
  aperture: number,
  config: LipSyncConfig,
  timeSec: number = 0,
  showLandmarks: boolean = false,
  eyes?: EyeLandmarks,
  manualBlinkProgress?: number
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // 1. Natural idle micro-motion (subtle head breathing & speaking cadence)
  let idleY = 0;
  let idleRotate = 0;

  if (config.enableIdleMotion) {
    // Subtle breathing cycle (approx 12 breaths per minute = 0.2 Hz)
    idleY = Math.sin(timeSec * 2 * Math.PI * 0.25) * 1.5;
    // Micro speech tilt when speaking loud
    if (aperture > 0.3) {
      idleRotate = Math.sin(timeSec * 7) * 0.003 * aperture;
      idleY += Math.sin(timeSec * 10) * 1.0 * aperture;
    }
  }

  // Calculate Eye Blinking Progress (0.0 to 1.0)
  const isBlinkConfigActive = config.enableBlink !== false && (eyes?.enabled ?? true);
  let blinkFactor = 0;

  if (manualBlinkProgress !== undefined && manualBlinkProgress > 0) {
    blinkFactor = manualBlinkProgress;
  } else if (isBlinkConfigActive) {
    const blinkInterval = eyes?.blinkInterval || config.blinkInterval || 3.2;
    const blinkDuration = 0.20; // 200ms blink duration
    const cycle = timeSec % blinkInterval;

    if (cycle < 0.08) {
      // Closing eyelid smoothly (0 -> 1)
      blinkFactor = Math.sin((cycle / 0.08) * (Math.PI / 2));
    } else if (cycle < 0.12) {
      // Eyelid remains shut momentarily
      blinkFactor = 1.0;
    } else if (cycle < blinkDuration) {
      // Re-opening eyelid smoothly (1 -> 0)
      const reopenPhase = (cycle - 0.12) / (blinkDuration - 0.12);
      blinkFactor = Math.cos(reopenPhase * (Math.PI / 2));
    }

    // Occasional expressive blink during enthusiastic speech
    if (aperture > 0.6) {
      const speechSync = (timeSec * 1.4) % 3.6;
      if (speechSync < 0.16) {
        const factor = Math.sin((speechSync / 0.16) * Math.PI);
        blinkFactor = Math.max(blinkFactor, factor);
      }
    }
  }

  ctx.save();

  if (idleRotate !== 0) {
    ctx.translate(width / 2, height / 2);
    ctx.rotate(idleRotate);
    ctx.translate(-width / 2, -height / 2);
  }

  // 2. Draw base image
  ctx.drawImage(img, 0, idleY, width, height);

  // 3. Render Eye Blinking (both left and right eye)
  const leftEye: EyePosition = eyes?.leftEye || {
    x: mouth.x - 13,
    y: mouth.y - 21,
    radiusX: 6.5,
    radiusY: 7.5,
  };
  const rightEye: EyePosition = eyes?.rightEye || {
    x: mouth.x + 13,
    y: mouth.y - 21,
    radiusX: 6.5,
    radiusY: 7.5,
  };

  const renderSingleEyeBlink = (eye: EyePosition) => {
    const ex = (eye.x / 100) * width;
    const ey = (eye.y / 100) * height + idleY;
    const erx = (eye.radiusX / 100) * width;
    const ery = (eye.radiusY / 100) * height;

    if (blinkFactor > 0.02 && erx > 3 && ery > 3) {
      ctx.save();
      // Clip strictly within eye socket contour
      ctx.beginPath();
      ctx.ellipse(ex, ey, erx, ery, 0, 0, Math.PI * 2);
      ctx.clip();

      // Sample character eyelid skin texture directly from above eye socket with strict boundary clamping
      const scaleX = img.naturalWidth / width;
      const scaleY = img.naturalHeight / height;

      const rawSkinY = (ey - ery * 1.55 - idleY) * scaleY;
      const rawSkinH = ery * 0.8 * scaleY;
      const rawSkinX = (ex - erx) * scaleX;
      const rawSkinW = erx * 2 * scaleX;

      const srcSkinX = Math.max(0, Math.min(img.naturalWidth - 1, rawSkinX));
      const srcSkinY = Math.max(0, Math.min(img.naturalHeight - 1, rawSkinY));
      const srcSkinW = Math.max(1, Math.min(img.naturalWidth - srcSkinX, rawSkinW));
      const srcSkinH = Math.max(1, Math.min(img.naturalHeight - srcSkinY, rawSkinH));

      const lidTopY = ey - ery;
      const lidBottomY = ey - ery + (ery * 2 * blinkFactor);
      const lidCurrentH = Math.max(1, lidBottomY - lidTopY);

      if (img.complete && img.naturalWidth > 0 && srcSkinW > 0 && srcSkinH > 0) {
        ctx.drawImage(
          img,
          srcSkinX,
          srcSkinY,
          srcSkinW,
          srcSkinH,
          ex - erx,
          lidTopY,
          erx * 2,
          lidCurrentH
        );
      }

      // Soft 3D lighting gradient over upper eyelid
      const lidGrad = ctx.createLinearGradient(ex, lidTopY, ex, lidBottomY);
      lidGrad.addColorStop(0, 'rgba(0,0,0,0.04)');
      lidGrad.addColorStop(0.7, 'rgba(0,0,0,0.12)');
      lidGrad.addColorStop(1, 'rgba(45,18,22,0.35)');
      ctx.fillStyle = lidGrad;
      ctx.fillRect(ex - erx, lidTopY, erx * 2, lidCurrentH);

      // Cartoon Eyelash curve along the moving eyelid margin
      ctx.beginPath();
      const curvature = ery * 0.22 * (1 - blinkFactor * 0.4);
      ctx.moveTo(ex - erx, lidBottomY - 1);
      ctx.quadraticCurveTo(ex, lidBottomY + curvature, ex + erx, lidBottomY - 1);
      ctx.strokeStyle = 'rgba(28, 14, 18, 0.95)';
      ctx.lineWidth = Math.max(2.2, erx * 0.14);
      ctx.lineCap = 'round';
      ctx.stroke();

      // Cartoon eyelid fold line (crease above eye)
      if (blinkFactor > 0.35) {
        ctx.beginPath();
        const creaseY = ey - ery + (ery * 0.32);
        ctx.moveTo(ex - erx * 0.75, creaseY);
        ctx.quadraticCurveTo(ex, creaseY + ery * 0.15, ex + erx * 0.75, creaseY);
        ctx.strokeStyle = 'rgba(50, 20, 25, 0.35)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      ctx.restore();
    }
  };

  renderSingleEyeBlink(leftEye);
  renderSingleEyeBlink(rightEye);

  // 4. Calculate Mouth Coordinates from percentages
  const cx = (mouth.x / 100) * width;
  const cy = (mouth.y / 100) * height + idleY;
  const mw = (mouth.width / 100) * width;
  const mh = (mouth.height / 100) * height;
  const mouthAngle = (mouth.angle || 0) * (Math.PI / 180);
  const mouthFeather = mouth.feather ?? config.lipFeather ?? 3.5;

  // Calculate opening metrics
  const effectiveAperture = Math.min(1.2, aperture * config.intensity);
  const openPixels = mh * effectiveAperture * 0.75;
  const jawDisplacement = config.jawDisplacement ?? 0;
  const jawShift = openPixels * jawDisplacement;

  // 5. If mouth opens, apply oral cavity rendering with seamless edge blending
  if (effectiveAperture > 0.02 && openPixels >= 1) {
    const cavityWidth = mw * 0.85;
    const cavityHeight = Math.max(3, openPixels);
    // When chin doesn't move (jawShift === 0), opening remains neatly centered at lips line cy
    const cavityY = cy + (jawDisplacement > 0.05 ? openPixels * 0.25 : openPixels * 0.05);

    ctx.save();
    // Support rotation for tilted faces
    if (mouthAngle !== 0) {
      ctx.translate(cx, cy);
      ctx.rotate(mouthAngle);
      ctx.translate(-cx, -cy);
    }

    // A. Soft edge feathering gradient to blend seamlessly into portrait
    if (config.seamlessBlend !== false && mouthFeather > 0) {
      ctx.save();
      const featherPad = mouthFeather * 1.5;
      const featherGrad = ctx.createRadialGradient(
        cx,
        cavityY,
        Math.max(1, cavityHeight * 0.2),
        cx,
        cavityY,
        cavityWidth / 2 + featherPad
      );
      featherGrad.addColorStop(0, 'rgba(16, 5, 7, 0.95)');
      featherGrad.addColorStop(0.7, 'rgba(42, 12, 19, 0.75)');
      featherGrad.addColorStop(0.9, 'rgba(70, 20, 28, 0.35)');
      featherGrad.addColorStop(1, 'rgba(70, 20, 28, 0)');
      ctx.fillStyle = featherGrad;
      ctx.beginPath();
      ctx.ellipse(
        cx,
        cavityY,
        cavityWidth / 2 + featherPad,
        cavityHeight / 2 + featherPad,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }

    // B. Draw dark oral cavity interior
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cavityY, cavityWidth / 2, cavityHeight / 2, 0, 0, Math.PI * 2);
    const cavityGrad = ctx.createRadialGradient(
      cx,
      cavityY,
      cavityHeight * 0.1,
      cx,
      cavityY,
      cavityWidth / 2
    );
    cavityGrad.addColorStop(0, '#0e0406');
    cavityGrad.addColorStop(0.65, '#22090e');
    cavityGrad.addColorStop(0.9, '#361117');
    cavityGrad.addColorStop(1, '#4a1720');
    ctx.fillStyle = cavityGrad;
    ctx.fill();

    // Clip subsequent mouth interior (teeth, tongue) inside cavity
    ctx.clip();

    if (config.enableTeeth) {
      // C. Tongue hint (pink rounded arc in lower back)
      if (effectiveAperture > 0.25) {
        const tongueY = cavityY + cavityHeight * 0.2;
        const tongueW = cavityWidth * 0.65;
        const tongueH = cavityHeight * 0.55;
        ctx.beginPath();
        ctx.ellipse(cx, tongueY, tongueW / 2, tongueH / 2, 0, 0, Math.PI);
        const tongueGrad = ctx.createRadialGradient(cx, tongueY, 2, cx, tongueY, tongueW / 2);
        tongueGrad.addColorStop(0, '#d15b6d');
        tongueGrad.addColorStop(0.8, '#b23b4e');
        tongueGrad.addColorStop(1, '#852233');
        ctx.fillStyle = tongueGrad;
        ctx.fill();
      }

      // D. Upper Teeth (peeks from top lip)
      const upperTeethW = cavityWidth * 0.75;
      const upperTeethH = Math.min(cavityHeight * 0.45, mh * 0.3);
      const teethY = cavityY - cavityHeight / 2;
      ctx.beginPath();
      ctx.ellipse(cx, teethY + upperTeethH * 0.5, upperTeethW / 2, upperTeethH * 0.6, 0, 0, Math.PI);
      const teethGrad = ctx.createLinearGradient(cx, teethY, cx, teethY + upperTeethH);
      teethGrad.addColorStop(0, '#fafaf9');
      teethGrad.addColorStop(0.7, '#e7e5e4');
      teethGrad.addColorStop(1, '#d6d3d1');
      ctx.fillStyle = teethGrad;
      ctx.fill();

      // Subtle dental vertical separators
      ctx.strokeStyle = 'rgba(120, 113, 108, 0.4)';
      ctx.lineWidth = 1;
      for (let offset = -upperTeethW * 0.3; offset <= upperTeethW * 0.3; offset += upperTeethW * 0.15) {
        ctx.beginPath();
        ctx.moveTo(cx + offset, teethY);
        ctx.lineTo(cx + offset, teethY + upperTeethH * 0.7);
        ctx.stroke();
      }

      // E. Lower Teeth (visible only during wide open aperture)
      if (effectiveAperture > 0.65) {
        const lowerTeethW = cavityWidth * 0.6;
        const lowerTeethH = Math.min(cavityHeight * 0.3, mh * 0.2);
        const lowerTeethY = cavityY + cavityHeight / 2;
        ctx.beginPath();
        ctx.ellipse(cx, lowerTeethY - lowerTeethH * 0.4, lowerTeethW / 2, lowerTeethH * 0.5, 0, Math.PI, 0);
        ctx.fillStyle = '#eae5e1';
        ctx.fill();
      }
    }

    ctx.restore();

    // 6. Warp lower lip & chin downward with feathered alpha blend (Only if jawDisplacement is active)
    if (jawDisplacement > 0.05 && jawShift > 0.5) {
      const patchX = Math.max(0, cx - mw * 0.85);
      const patchY = cy + mh * 0.05;
      const patchW = Math.min(width - patchX, mw * 1.7);
      const patchH = Math.min(height - patchY, mh * 2.6);

      if (patchW > 0 && patchH > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(patchX, patchY + jawShift + 5);
        ctx.quadraticCurveTo(cx, patchY + jawShift + mh * 0.5, patchX + patchW, patchY + jawShift + 5);
        ctx.lineTo(patchX + patchW, patchY + patchH + jawShift);
        ctx.lineTo(patchX, patchY + patchH + jawShift);
        ctx.closePath();
        ctx.clip();

        // Draw translated jaw/chin patch with properly scaled source coordinates
        const imgScaleX = img.naturalWidth / width;
        const imgScaleY = img.naturalHeight / height;

        const rawSrcX = patchX * imgScaleX;
        const rawSrcY = (patchY - idleY) * imgScaleY;
        const rawSrcW = patchW * imgScaleX;
        const rawSrcH = patchH * imgScaleY;

        const sX = Math.max(0, Math.min(img.naturalWidth - 1, rawSrcX));
        const sY = Math.max(0, Math.min(img.naturalHeight - 1, rawSrcY));
        const sW = Math.max(1, Math.min(img.naturalWidth - sX, rawSrcW));
        const sH = Math.max(1, Math.min(img.naturalHeight - sY, rawSrcH));

        if (img.complete && img.naturalWidth > 0 && sW > 0 && sH > 0) {
          ctx.drawImage(
            img,
            sX,
            sY,
            sW,
            sH,
            patchX,
            patchY + jawShift,
            patchW,
            patchH
          );
        }

        // Subtle shadow under lower lip
        const lipShadow = ctx.createLinearGradient(cx, patchY + jawShift, cx, patchY + jawShift + mh * 0.4);
        lipShadow.addColorStop(0, 'rgba(0,0,0,0.3)');
        lipShadow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = lipShadow;
        ctx.fillRect(patchX, patchY + jawShift, patchW, mh * 0.4);

        ctx.restore();
      }
    }

    // 7. Natural Lip Contours & Seamless Commissure Creases
    ctx.save();
    // Soft commissure crease shadows (left & right corners of mouth)
    const cornerShadowW = Math.max(4, mw * 0.12);
    const cornerLeftGrad = ctx.createRadialGradient(
      cx - cavityWidth / 2,
      cavityY,
      1,
      cx - cavityWidth / 2,
      cavityY,
      cornerShadowW
    );
    cornerLeftGrad.addColorStop(0, 'rgba(40, 14, 20, 0.6)');
    cornerLeftGrad.addColorStop(1, 'rgba(40, 14, 20, 0)');
    ctx.fillStyle = cornerLeftGrad;
    ctx.fillRect(cx - cavityWidth / 2 - cornerShadowW, cavityY - 3, cornerShadowW * 2, 6);

    const cornerRightGrad = ctx.createRadialGradient(
      cx + cavityWidth / 2,
      cavityY,
      1,
      cx + cavityWidth / 2,
      cavityY,
      cornerShadowW
    );
    cornerRightGrad.addColorStop(0, 'rgba(40, 14, 20, 0.6)');
    cornerRightGrad.addColorStop(1, 'rgba(40, 14, 20, 0)');
    ctx.fillStyle = cornerRightGrad;
    ctx.fillRect(cx + cavityWidth / 2 - cornerShadowW, cavityY - 3, cornerShadowW * 2, 6);

    // Smooth cavity border
    ctx.beginPath();
    ctx.ellipse(cx, cavityY, cavityWidth / 2, cavityHeight / 2, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(55, 20, 26, 0.42)';
    ctx.lineWidth = Math.max(1.2, mouthFeather * 0.4);
    ctx.stroke();

    // Natural upper lip contour (Cupid's bow subtle arc)
    const upperLipY = cy - mh * 0.28;
    ctx.beginPath();
    ctx.ellipse(cx, upperLipY, mw * 0.42, mh * 0.18, 0, Math.PI, 0);
    ctx.strokeStyle = 'rgba(45, 18, 22, 0.2)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Natural ambient occlusion crease under lower lip
    const lowerLipY = cavityY + cavityHeight / 2 + 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, lowerLipY, mw * 0.38, mh * 0.15, 0, 0, Math.PI);
    ctx.strokeStyle = 'rgba(40, 16, 20, 0.22)';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.restore();
    ctx.restore(); // restore angle
  }

  ctx.restore();

  // 8. Tri-Scale (Rule of Thirds Facial Canon) & Coordinate Ruler Overlay
  if (config.showTriScale) {
    ctx.save();

    // Top X-Axis Ruler (22px)
    const rulerBg = 'rgba(9, 9, 11, 0.88)';
    const rulerBorder = 'rgba(63, 63, 70, 0.8)';
    const rulerText = '#a1a1aa';

    ctx.fillStyle = rulerBg;
    ctx.fillRect(0, 0, width, 22);
    ctx.fillRect(0, 0, 28, height);

    ctx.strokeStyle = rulerBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.lineTo(width, 22);
    ctx.moveTo(28, 0);
    ctx.lineTo(28, height);
    ctx.stroke();

    // X-Axis Scale Ticks & Numbers
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = rulerText;
    ctx.textAlign = 'center';
    for (let pct = 0; pct <= 100; pct += 5) {
      const px = (pct / 100) * width;
      if (px < 30) continue;
      const isMajor = pct % 10 === 0;
      const isQuarter = pct === 25 || pct === 50 || pct === 75;
      const tickH = isMajor || isQuarter ? 10 : 5;

      ctx.strokeStyle = isQuarter ? '#f59e0b' : isMajor ? '#71717a' : '#3f3f46';
      ctx.beginPath();
      ctx.moveTo(px, 22 - tickH);
      ctx.lineTo(px, 22);
      ctx.stroke();

      if (isQuarter || pct % 20 === 0) {
        ctx.fillStyle = isQuarter ? '#fbbf24' : rulerText;
        ctx.fillText(`${pct}%`, px, 10);
      }
    }

    // Y-Axis Scale Ticks & Numbers
    ctx.textAlign = 'right';
    for (let pct = 0; pct <= 100; pct += 5) {
      const py = (pct / 100) * height;
      if (py < 24) continue;
      const isMajor = pct % 10 === 0;
      const isQuarter = pct === 25 || pct === 50 || pct === 75;
      const tickW = isMajor || isQuarter ? 9 : 4;

      ctx.strokeStyle = isQuarter ? '#f59e0b' : isMajor ? '#71717a' : '#3f3f46';
      ctx.beginPath();
      ctx.moveTo(28 - tickW, py);
      ctx.lineTo(28, py);
      ctx.stroke();

      if (isQuarter || pct % 20 === 0) {
        ctx.fillStyle = isQuarter ? '#fbbf24' : rulerText;
        ctx.fillText(`${pct}`, 17, py + 3);
      }
    }

    // Corner badge
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('X/Y%', 14, 14);

    // Anatomical Tri-Scale (3-part facial rule of thirds)
    // Third 1: Upper Third (0 - 33.3%)
    // Third 2: Middle Third (33.3% - 66.7%)
    // Third 3: Lower Third (66.7% - 100%)
    const yThird1 = height * 0.333;
    const yThird2 = height * 0.667;
    const yGoldenLip = height * 0.70; // Classical anatomical lip level

    // Tri-Scale Line 1: Brow line (33.3%)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(28, yThird1);
    ctx.lineTo(width, yThird1);
    ctx.stroke();

    // Tri-Scale Line 2: Subnasale / Nose base (66.7%)
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.6)';
    ctx.beginPath();
    ctx.moveTo(28, yThird2);
    ctx.lineTo(width, yThird2);
    ctx.stroke();

    // Tri-Scale Line 3: Golden Ratio Mouth line (70%)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(28, yGoldenLip);
    ctx.lineTo(width, yGoldenLip);
    ctx.stroke();

    // Vertical Facial Center Axis (50%)
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width * 0.5, 22);
    ctx.lineTo(width * 0.5, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tri-Scale Zone Badges (Right side)
    const drawZoneBadge = (text: string, yPos: number, color: string) => {
      ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
      ctx.fillRect(width - 150, yPos - 11, 145, 16);
      ctx.strokeStyle = color;
      ctx.strokeRect(width - 150, yPos - 11, 145, 16);
      ctx.fillStyle = color;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(text, width - 144, yPos + 1);
    };

    drawZoneBadge('1/3 ส่วนบน (หน้าผาก-คิ้ว)', yThird1 * 0.5, '#38bdf8');
    drawZoneBadge('2/3 ส่วนกลาง (คิ้ว-ใต้จมูก)', (yThird1 + yThird2) * 0.5, '#fb923c');
    drawZoneBadge('3/3 ส่วนล่าง (ใต้จมูก-ปาก-คาง)', (yThird2 + height) * 0.5, '#f59e0b');

    // Dynamic Crosshair Lines to current mouth position
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    // Vertical line to top ruler
    ctx.beginPath();
    ctx.moveTo(cx, 22);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    // Horizontal line to left ruler
    ctx.beginPath();
    ctx.moveTo(28, cy);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Mouth coordinate badge on rulers
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(cx - 18, 1, 36, 19);
    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${mouth.x.toFixed(1)}%`, cx, 14);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(1, cy - 8, 26, 16);
    ctx.fillStyle = '#09090b';
    ctx.fillText(`${mouth.y.toFixed(0)}%`, 14, cy + 4);

    ctx.restore();
  }

  ctx.restore();

  // 8. Calibration landmarks overlay & interactive handles
  if (showLandmarks) {
    ctx.save();

    // A. Mouth Bounding Box
    ctx.strokeStyle = '#f59e0b'; // amber
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    const boxLeft = cx - mw / 2;
    const boxTop = cy - mh / 2;
    ctx.strokeRect(boxLeft, boxTop, mw, mh);

    // Mouth Drag Handles
    ctx.setLineDash([]);
    const drawHandle = (hx: number, hy: number, color = '#f59e0b', size = 8) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hx - size / 2, hy - size / 2, size, size);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(hx - size / 2, hy - size / 2, size, size);
    };

    // 4 Corners of mouth box
    drawHandle(boxLeft, boxTop);
    drawHandle(boxLeft + mw, boxTop);
    drawHandle(boxLeft, boxTop + mh);
    drawHandle(boxLeft + mw, boxTop + mh);

    // Edge handles (North, South, East, West)
    drawHandle(cx, boxTop, '#fbbf24', 6);
    drawHandle(cx, boxTop + mh, '#fbbf24', 6);
    drawHandle(boxLeft, cy, '#fbbf24', 6);
    drawHandle(boxLeft + mw, cy, '#fbbf24', 6);

    // Center Mouth Anchor (Red Crosshair)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair lines
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy + 10);
    ctx.stroke();

    // Jaw / Chin Anchor
    const chinPx = (mouth.chinY / 100) * height;
    const isChinActive = jawDisplacement > 0.05;
    ctx.strokeStyle = isChinActive ? '#3b82f6' : '#9ca3af';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, cy + mh / 2);
    ctx.lineTo(cx, chinPx);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = isChinActive ? '#3b82f6' : '#9ca3af';
    ctx.beginPath();
    ctx.arc(cx, chinPx, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (!isChinActive) {
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 3;
      ctx.fillText('🔒 คางล็อคนิ่ง', cx + 10, chinPx + 3);
    }

    // B. Eye Landmarks (Left & Right Eye)
    const drawEyeLandmark = (eye: EyePosition, label: string) => {
      const ex = (eye.x / 100) * width;
      const ey = (eye.y / 100) * height + idleY;
      const erx = (eye.radiusX / 100) * width;
      const ery = (eye.radiusY / 100) * height;

      // Dashed eye orbit ellipse
      ctx.strokeStyle = '#06b6d4'; // cyan
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.ellipse(ex, ey, erx, ery, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center handle
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Eye label
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(label, ex - 18, ey - ery - 5);
    };

    drawEyeLandmark(leftEye, '👁️ ตาซ้าย');
    drawEyeLandmark(rightEye, '👁️ ตาขวา');

    // C. Mouth & Chin Info Labels
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 5;
    ctx.fillText(
      `👄 ตำแหน่งปาก (${Math.round(mouth.x)}%, ${Math.round(mouth.y)}%)`,
      boxLeft,
      boxTop - 8
    );
    ctx.fillStyle = '#60a5fa';
    ctx.fillText(`จุดคาง (${Math.round(mouth.chinY)}%)`, cx + 10, chinPx + 4);

    ctx.restore();
  }
}

