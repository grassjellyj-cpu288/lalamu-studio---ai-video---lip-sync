import { MouthLandmarks, LipSyncConfig, EyeLandmarks, EyePosition, BackgroundConfig } from '../types';
import { drawCoverImage } from './backgroundMatting';

/**
 * Renders a lip-synced frame onto a 2D canvas.
 * Implements non-rigid mouth aperture warping, oral cavity synthesis,
 * teeth/tongue rendering, natural eye blinking, interactive landmarks,
 * and custom background compositing.
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
  manualBlinkProgress?: number,
  backgroundConfig?: BackgroundConfig,
  bgImgElement?: HTMLImageElement | null,
  cutoutCanvas?: HTMLCanvasElement | null
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // 1. Render Background if enabled and not set to original
  const isBgActive = Boolean(
    backgroundConfig && backgroundConfig.enabled && backgroundConfig.type !== 'original'
  );

  if (isBgActive) {
    ctx.save();
    if (bgImgElement && bgImgElement.complete && bgImgElement.naturalWidth > 0) {
      const blurVal = backgroundConfig?.blur ?? 0;
      const brightVal = backgroundConfig?.brightness ?? 100;
      if (blurVal > 0) {
        ctx.filter = `blur(${blurVal}px) brightness(${brightVal}%)`;
      } else if (brightVal !== 100) {
        ctx.filter = `brightness(${brightVal}%)`;
      }
      drawCoverImage(ctx, bgImgElement, width, height);
    } else if (backgroundConfig?.color) {
      ctx.fillStyle = backgroundConfig.color;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }

  // 2. Natural idle micro-motion (subtle head breathing & speaking cadence)
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

  // Character dimensions & position on top of the background
  const charScale = isBgActive ? (backgroundConfig?.characterScale ?? 1.0) : 1.0;
  const charW = width * charScale;
  const charH = height * charScale;
  const offsetX = isBgActive ? (((backgroundConfig?.characterPositionX ?? 0) / 100) * width) : 0;
  const offsetY = isBgActive ? (((backgroundConfig?.characterPositionY ?? 0) / 100) * height) : 0;
  const charX = (width - charW) / 2 + offsetX;
  const charY = (height - charH) / 2 + offsetY + idleY;

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
    const rotCenterX = charX + charW / 2;
    const rotCenterY = charY + charH / 2;
    ctx.translate(rotCenterX, rotCenterY);
    ctx.rotate(idleRotate);
    ctx.translate(-rotCenterX, -rotCenterY);
  }

  // 3. Draw character base image (cutout or original)
  if (isBgActive && cutoutCanvas && backgroundConfig?.keyingMode !== 'none') {
    ctx.drawImage(cutoutCanvas, charX, charY, charW, charH);
  } else {
    ctx.drawImage(img, charX, charY, charW, charH);
  }

  // 4. Render Eye Blinking (both left and right eye)
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
    const ex = charX + (eye.x / 100) * charW;
    const ey = charY + (eye.y / 100) * charH;
    const erx = (eye.radiusX / 100) * charW;
    const ery = (eye.radiusY / 100) * charH;

    if (blinkFactor > 0.02 && erx > 3 && ery > 3) {
      ctx.save();
      // Clip strictly within eye socket contour
      ctx.beginPath();
      ctx.ellipse(ex, ey, erx, ery, 0, 0, Math.PI * 2);
      ctx.clip();

      // Sample character eyelid skin texture directly from above eye socket with strict boundary clamping
      const scaleX = img.naturalWidth / charW;
      const scaleY = img.naturalHeight / charH;

      const rawSkinY = (ey - ery * 1.55 - charY) * scaleY;
      const rawSkinH = ery * 0.8 * scaleY;
      const rawSkinX = (ex - erx - charX) * scaleX;
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

  // 5. Calculate Mouth Coordinates from percentages
  const cx = charX + (mouth.x / 100) * charW;
  const cy = charY + (mouth.y / 100) * charH;
  const mw = (mouth.width / 100) * charW;
  const mh = (mouth.height / 100) * charH;
  const mouthAngle = (mouth.angle || 0) * (Math.PI / 180);
  const mouthFeather = mouth.feather ?? config.lipFeather ?? 3.5;

  // Calculate opening metrics
  const effectiveAperture = Math.min(1.2, aperture * config.intensity);
  const openPixels = mh * effectiveAperture * 0.75;
  const jawDisplacement = config.jawDisplacement ?? 0;
  const jawShift = openPixels * jawDisplacement;

  // 6. If mouth opens, apply oral cavity rendering with seamless edge blending
  if (effectiveAperture > 0.02 && openPixels >= 1) {
    const isRealistic3D = config.mouthStyle === 'realistic-3d' || !config.mouthStyle;
    const cavityWidth = mw * (isRealistic3D ? 0.92 : 0.85);
    const cavityHeight = Math.max(3, openPixels);
    const cavityY = cy + (jawDisplacement > 0.05 ? openPixels * 0.25 : openPixels * 0.05);

    const smileCurveVal = config.smileCurve ?? 3;
    const smileOffset = isRealistic3D ? smileCurveVal * Math.min(2.5, cavityHeight * 0.12) : 0;

    ctx.save();
    // Support rotation for tilted faces
    if (mouthAngle !== 0) {
      ctx.translate(cx, cy);
      ctx.rotate(mouthAngle);
      ctx.translate(-cx, -cy);
    }

    // Helper to create the realistic smiling mouth opening path
    const createMouthOpeningPath = (c: CanvasRenderingContext2D, pad = 0) => {
      const leftX = cx - (cavityWidth / 2 + pad);
      const rightX = cx + (cavityWidth / 2 + pad);
      const cornerY = cavityY - smileOffset * 0.35;
      const topDipY = cavityY - (cavityHeight / 2 + pad) * 0.85;
      const topCrestY = cavityY - (cavityHeight / 2 + pad) - smileOffset * 0.25;
      const bottomY = cavityY + (cavityHeight / 2 + pad) + smileOffset * 0.2;

      c.beginPath();
      c.moveTo(leftX, cornerY);
      // Top lip with Cupid's bow contour
      if (isRealistic3D) {
        c.bezierCurveTo(
          cx - cavityWidth * 0.28,
          topCrestY,
          cx - cavityWidth * 0.09,
          topDipY - 1,
          cx,
          topDipY
        );
        c.bezierCurveTo(
          cx + cavityWidth * 0.09,
          topDipY - 1,
          cx + cavityWidth * 0.28,
          topCrestY,
          rightX,
          cornerY
        );
      } else {
        c.quadraticCurveTo(cx, topCrestY, rightX, cornerY);
      }
      // Bottom lip smooth convex curve
      c.bezierCurveTo(
        cx + cavityWidth * 0.32,
        bottomY,
        cx - cavityWidth * 0.32,
        bottomY,
        leftX,
        cornerY
      );
      c.closePath();
    };

    // A. Soft edge feathering gradient to blend seamlessly into portrait
    if (config.seamlessBlend !== false && mouthFeather > 0) {
      ctx.save();
      const featherPad = mouthFeather * 1.6;
      const featherGrad = ctx.createRadialGradient(
        cx,
        cavityY,
        Math.max(1, cavityHeight * 0.15),
        cx,
        cavityY,
        cavityWidth / 2 + featherPad
      );
      featherGrad.addColorStop(0, 'rgba(18, 5, 8, 0.95)');
      featherGrad.addColorStop(0.68, 'rgba(45, 14, 20, 0.75)');
      featherGrad.addColorStop(0.88, 'rgba(75, 22, 30, 0.35)');
      featherGrad.addColorStop(1, 'rgba(75, 22, 30, 0)');
      ctx.fillStyle = featherGrad;

      createMouthOpeningPath(ctx, featherPad);
      ctx.fill();
      ctx.restore();
    }

    // B. Draw dark oral cavity interior with realistic buccal corridor depth
    ctx.save();
    createMouthOpeningPath(ctx, 0);

    const cavityGrad = ctx.createRadialGradient(
      cx,
      cavityY,
      Math.max(2, cavityHeight * 0.1),
      cx,
      cavityY,
      cavityWidth / 2
    );
    cavityGrad.addColorStop(0, '#0a0204');
    cavityGrad.addColorStop(0.65, '#1e070d');
    cavityGrad.addColorStop(0.88, '#300d15');
    cavityGrad.addColorStop(1, '#44141d');
    ctx.fillStyle = cavityGrad;
    ctx.fill();

    // Clip subsequent mouth interior (teeth, tongue) inside cavity
    ctx.clip();

    if (config.enableTeeth) {
      // C. Deep Tongue hint (pink rounded arc in lower back)
      if (effectiveAperture > 0.22) {
        const tongueY = cavityY + cavityHeight * 0.18;
        const tongueW = cavityWidth * 0.68;
        const tongueH = cavityHeight * 0.52;
        ctx.beginPath();
        ctx.ellipse(cx, tongueY, tongueW / 2, tongueH / 2, 0, 0, Math.PI);
        const tongueGrad = ctx.createRadialGradient(cx, tongueY, 2, cx, tongueY, tongueW / 2);
        tongueGrad.addColorStop(0, '#d15b6d');
        tongueGrad.addColorStop(0.75, '#ad384b');
        tongueGrad.addColorStop(1, '#7a1f2e');
        ctx.fillStyle = tongueGrad;
        ctx.fill();

        // Subtle center lingual groove
        ctx.strokeStyle = 'rgba(70, 16, 26, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, tongueY - tongueH * 0.35);
        ctx.lineTo(cx, tongueY + tongueH * 0.2);
        ctx.stroke();
      }

      // D. Upper Dental Arch (ฟันบนเรียงสวยแบบ 3D สมจริงตามในรูป)
      const archW = cavityWidth * (isRealistic3D ? 0.88 : 0.75);
      const upperTeethH = Math.min(cavityHeight * 0.48, mh * 0.36);
      const teethBaseY = cavityY - cavityHeight / 2 - 1;

      if (isRealistic3D) {
        // Sculpted 3D Teeth Anatomy (Central incisors, lateral incisors, canines, premolars)
        // Upper Teeth definitions: center offset, width, height, bottom corner radius
        const upperTeethList = [
          // Left quadrant (viewer's left = character's right)
          { id: 'L-pre', xRatio: -0.37, wRatio: 0.095, hRatio: 0.68, corner: 1.5, shade: 0.88 },
          { id: 'L-can', xRatio: -0.265, wRatio: 0.115, hRatio: 0.82, corner: 2.2, shade: 0.94 },
          { id: 'L-lat', xRatio: -0.155, wRatio: 0.125, hRatio: 0.89, corner: 2.0, shade: 0.98 },
          { id: 'L-cen', xRatio: -0.052, wRatio: 0.142, hRatio: 0.98, corner: 2.5, shade: 1.0 },
          // Right quadrant
          { id: 'R-cen', xRatio: 0.052, wRatio: 0.142, hRatio: 0.98, corner: 2.5, shade: 1.0 },
          { id: 'R-lat', xRatio: 0.155, wRatio: 0.125, hRatio: 0.89, corner: 2.0, shade: 0.98 },
          { id: 'R-can', xRatio: 0.265, wRatio: 0.115, hRatio: 0.82, corner: 2.2, shade: 0.94 },
          { id: 'R-pre', xRatio: 0.37, wRatio: 0.095, hRatio: 0.68, corner: 1.5, shade: 0.88 },
        ];

        // 1. Soft healthy gingival gum line behind teeth tops
        ctx.beginPath();
        const gumY = teethBaseY + upperTeethH * 0.25;
        ctx.ellipse(cx, gumY, archW * 0.52, upperTeethH * 0.45, 0, Math.PI, 0);
        ctx.fillStyle = '#b84a5c';
        ctx.fill();

        // 2. Render each sculpted 3D tooth
        upperTeethList.forEach((tooth) => {
          const toothX = cx + tooth.xRatio * archW;
          const toothW = tooth.wRatio * archW;
          const toothH = upperTeethH * tooth.hRatio;
          const toothTopY = teethBaseY + (1 - Math.abs(tooth.xRatio * 1.5)) * smileOffset * 0.2;
          const toothBottomY = toothTopY + toothH;

          ctx.save();
          // Rounded tooth contour
          ctx.beginPath();
          ctx.moveTo(toothX - toothW / 2, toothTopY);
          ctx.lineTo(toothX + toothW / 2, toothTopY);
          ctx.lineTo(toothX + toothW / 2, toothBottomY - tooth.corner);
          ctx.quadraticCurveTo(
            toothX + toothW / 2,
            toothBottomY,
            toothX + toothW / 2 - tooth.corner,
            toothBottomY
          );
          ctx.lineTo(toothX - toothW / 2 + tooth.corner, toothBottomY);
          ctx.quadraticCurveTo(
            toothX - toothW / 2,
            toothBottomY,
            toothX - toothW / 2,
            toothBottomY - tooth.corner
          );
          ctx.closePath();

          // 3D Enamel vertical gradient
          const enamelGrad = ctx.createLinearGradient(toothX, toothTopY, toothX, toothBottomY);
          if (tooth.shade >= 0.99) {
            enamelGrad.addColorStop(0, '#f2ede4');
            enamelGrad.addColorStop(0.35, '#faf8f5');
            enamelGrad.addColorStop(0.85, '#ffffff');
            enamelGrad.addColorStop(1, '#f3f6fa'); // translucent incisal edge
          } else {
            const tone = Math.round(242 * tooth.shade);
            enamelGrad.addColorStop(0, `rgb(${tone - 15}, ${tone - 18}, ${tone - 24})`);
            enamelGrad.addColorStop(0.5, `rgb(${tone}, ${tone}, ${tone - 5})`);
            enamelGrad.addColorStop(1, `rgb(${tone + 8}, ${tone + 8}, ${tone + 5})`);
          }
          ctx.fillStyle = enamelGrad;
          ctx.fill();

          // Delicate tooth border and vertical separator shadow
          ctx.strokeStyle = 'rgba(40, 15, 20, 0.45)';
          ctx.lineWidth = 0.85;
          ctx.stroke();

          // Incisal edge translucent bevel highlight
          ctx.beginPath();
          ctx.moveTo(toothX - toothW / 2 + 1, toothBottomY - 0.75);
          ctx.lineTo(toothX + toothW / 2 - 1, toothBottomY - 0.75);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.restore();
        });

        // 3. Horizontal specular gloss reflection line running across the upper dental arch
        ctx.save();
        ctx.beginPath();
        const glossY = teethBaseY + upperTeethH * 0.38;
        ctx.ellipse(cx, glossY, archW * 0.38, upperTeethH * 0.12, 0, 0, Math.PI * 2);
        const glossGrad = ctx.createRadialGradient(cx, glossY, 2, cx, glossY, archW * 0.38);
        glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        glossGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
        glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glossGrad;
        ctx.fill();
        ctx.restore();
      } else {
        // Classic / Anime clean dental block
        ctx.beginPath();
        ctx.ellipse(cx, teethBaseY + upperTeethH * 0.5, archW / 2, upperTeethH * 0.6, 0, 0, Math.PI);
        const teethGrad = ctx.createLinearGradient(cx, teethBaseY, cx, teethBaseY + upperTeethH);
        teethGrad.addColorStop(0, '#fafaf9');
        teethGrad.addColorStop(0.7, '#e7e5e4');
        teethGrad.addColorStop(1, '#d6d3d1');
        ctx.fillStyle = teethGrad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(120, 113, 108, 0.4)';
        ctx.lineWidth = 1;
        for (let offset = -archW * 0.3; offset <= archW * 0.3; offset += archW * 0.15) {
          ctx.beginPath();
          ctx.moveTo(cx + offset, teethBaseY);
          ctx.lineTo(cx + offset, teethBaseY + upperTeethH * 0.7);
          ctx.stroke();
        }
      }

      // E. Lower Dental Arch (แถวฟันล่าง - เห็นได้ชัดเมื่ออ้าปากหรือพูดแบบในรูป)
      const showLowerTeeth = config.showLowerTeeth !== false;
      if (showLowerTeeth && (isRealistic3D ? effectiveAperture > 0.16 : effectiveAperture > 0.65)) {
        const lowerTeethW = cavityWidth * (isRealistic3D ? 0.74 : 0.6);
        const lowerTeethH = Math.min(cavityHeight * 0.34, mh * 0.24);
        const lowerTeethY = cavityY + cavityHeight / 2 - lowerTeethH * 0.45;

        if (isRealistic3D) {
          // Individual lower teeth arch
          const lowerTeethList = [
            { xRatio: -0.28, wRatio: 0.11, hRatio: 0.75 },
            { xRatio: -0.17, wRatio: 0.10, hRatio: 0.88 },
            { xRatio: -0.06, wRatio: 0.11, hRatio: 0.98 },
            { xRatio: 0.06, wRatio: 0.11, hRatio: 0.98 },
            { xRatio: 0.17, wRatio: 0.10, hRatio: 0.88 },
            { xRatio: 0.28, wRatio: 0.11, hRatio: 0.75 },
          ];

          lowerTeethList.forEach((t) => {
            const lx = cx + t.xRatio * lowerTeethW;
            const lw = t.wRatio * lowerTeethW;
            const lh = lowerTeethH * t.hRatio;
            const topY = lowerTeethY - lh * 0.5;

            ctx.save();
            ctx.beginPath();
            ctx.roundRect
              ? ctx.roundRect(lx - lw / 2, topY, lw, lh, [2, 2, 0, 0])
              : ctx.rect(lx - lw / 2, topY, lw, lh);

            const lowGrad = ctx.createLinearGradient(lx, topY, lx, topY + lh);
            lowGrad.addColorStop(0, '#ffffff');
            lowGrad.addColorStop(0.4, '#eeebe6');
            lowGrad.addColorStop(1, '#dad5ce');
            ctx.fillStyle = lowGrad;
            ctx.fill();

            ctx.strokeStyle = 'rgba(35, 12, 18, 0.4)';
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.restore();
          });

          // Soft drop shadow cast from upper teeth onto lower teeth
          ctx.save();
          const shadowGrad = ctx.createLinearGradient(
            cx,
            lowerTeethY - lowerTeethH * 0.6,
            cx,
            lowerTeethY
          );
          shadowGrad.addColorStop(0, 'rgba(10, 2, 4, 0.65)');
          shadowGrad.addColorStop(1, 'rgba(10, 2, 4, 0)');
          ctx.fillStyle = shadowGrad;
          ctx.fillRect(
            cx - lowerTeethW / 2,
            lowerTeethY - lowerTeethH * 0.6,
            lowerTeethW,
            lowerTeethH * 0.8
          );
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.ellipse(
            cx,
            lowerTeethY - lowerTeethH * 0.4,
            lowerTeethW / 2,
            lowerTeethH * 0.5,
            0,
            Math.PI,
            0
          );
          ctx.fillStyle = '#eae5e1';
          ctx.fill();
        }
      }
    }

    ctx.restore();

    // 7. Warp lower lip & chin downward with feathered alpha blend (Only if jawDisplacement is active)
    if (jawDisplacement > 0.05 && jawShift > 0.5) {
      const patchX = Math.max(charX, cx - mw * 0.85);
      const patchY = cy + mh * 0.05;
      const patchW = Math.min(charX + charW - patchX, mw * 1.7);
      const patchH = Math.min(charY + charH - patchY, mh * 2.6);

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
        const imgScaleX = img.naturalWidth / charW;
        const imgScaleY = img.naturalHeight / charH;

        const rawSrcX = (patchX - charX) * imgScaleX;
        const rawSrcY = (patchY - charY) * imgScaleY;
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

    // 8. Natural Lip Contours & Realistic Lip Gloss Highlights (เหมือนในรูปต้นฉบับ)
    ctx.save();

    // Soft commissure crease shadows (left & right corners of mouth)
    const cornerShadowW = Math.max(4, mw * 0.12);
    const cornerLeftGrad = ctx.createRadialGradient(
      cx - cavityWidth / 2,
      cavityY - smileOffset * 0.35,
      1,
      cx - cavityWidth / 2,
      cavityY - smileOffset * 0.35,
      cornerShadowW
    );
    cornerLeftGrad.addColorStop(0, 'rgba(38, 12, 18, 0.7)');
    cornerLeftGrad.addColorStop(1, 'rgba(38, 12, 18, 0)');
    ctx.fillStyle = cornerLeftGrad;
    ctx.fillRect(
      cx - cavityWidth / 2 - cornerShadowW,
      cavityY - smileOffset * 0.35 - 3,
      cornerShadowW * 2,
      6
    );

    const cornerRightGrad = ctx.createRadialGradient(
      cx + cavityWidth / 2,
      cavityY - smileOffset * 0.35,
      1,
      cx + cavityWidth / 2,
      cavityY - smileOffset * 0.35,
      cornerShadowW
    );
    cornerRightGrad.addColorStop(0, 'rgba(38, 12, 18, 0.7)');
    cornerRightGrad.addColorStop(1, 'rgba(38, 12, 18, 0)');
    ctx.fillStyle = cornerRightGrad;
    ctx.fillRect(
      cx + cavityWidth / 2 - cornerShadowW,
      cavityY - smileOffset * 0.35 - 3,
      cornerShadowW * 2,
      6
    );

    // Natural upper lip contour (Cupid's bow with soft vermilion tone)
    const upperLipY = cy - mh * 0.28;
    ctx.beginPath();
    ctx.moveTo(cx - mw * 0.42, upperLipY + smileOffset * 0.2);
    ctx.bezierCurveTo(
      cx - mw * 0.18,
      upperLipY - mh * 0.12,
      cx - mw * 0.05,
      upperLipY - mh * 0.04,
      cx,
      upperLipY - mh * 0.02
    );
    ctx.bezierCurveTo(
      cx + mw * 0.05,
      upperLipY - mh * 0.04,
      cx + mw * 0.18,
      upperLipY - mh * 0.12,
      cx + mw * 0.42,
      upperLipY + smileOffset * 0.2
    );
    ctx.strokeStyle = 'rgba(70, 24, 30, 0.28)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Natural ambient occlusion crease under lower lip
    const lowerLipY = cavityY + cavityHeight / 2 + 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, lowerLipY, mw * 0.38, mh * 0.15, 0, 0, Math.PI);
    ctx.strokeStyle = 'rgba(40, 16, 20, 0.24)';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Realistic Lip Gloss & Specular Sheen (ประกายความเงางามของริมฝีปากล่างแบบในรูป)
    if (config.lipGloss !== false && isRealistic3D) {
      const glossW = mw * 0.34;
      const glossH = Math.max(2.5, mh * 0.12);
      const glossY = lowerLipY + glossH * 0.3;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, glossY, glossW / 2, glossH / 2, 0, 0, Math.PI * 2);
      const lipGlossGrad = ctx.createRadialGradient(cx, glossY, 1, cx, glossY, glossW / 2);
      lipGlossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.48)');
      lipGlossGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.22)');
      lipGlossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = lipGlossGrad;
      ctx.fill();
      ctx.restore();
    }

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
    const chinPx = charY + (mouth.chinY / 100) * charH;
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
      const ex = charX + (eye.x / 100) * charW;
      const ey = charY + (eye.y / 100) * charH;
      const erx = (eye.radiusX / 100) * charW;
      const ery = (eye.radiusY / 100) * charH;

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

