import { MouthLandmarks, EyeLandmarks, FaceDetectionResult } from '../types';

/**
 * High-Precision Computer Vision Face & Mouth Detection Algorithm.
 * Performs skin-tone clustering, facial symmetry axis calculation,
 * Tri-Scale (Rule of Thirds facial canon) partitioning, oral fissure / lip
 * chrominance analysis, and eye socket localization.
 */
export async function detectFaceAndMouthLandmarks(
  img: HTMLImageElement
): Promise<FaceDetectionResult> {
  return new Promise((resolve) => {
    // Ensure image is loaded
    if (!img.complete || img.naturalWidth === 0) {
      img.onload = () => {
        resolve(runDetection(img));
      };
      img.onerror = () => {
        resolve(getFallbackResult());
      };
    } else {
      resolve(runDetection(img));
    }
  });
}

function getFallbackResult(): FaceDetectionResult {
  return {
    mouth: {
      x: 50,
      y: 67,
      width: 19,
      height: 9.5,
      chinY: 82,
      angle: 0,
      feather: 4,
      curvature: 0,
    },
    eyes: {
      enabled: true,
      blinkInterval: 3.2,
      leftEye: { x: 37, y: 44, radiusX: 6.5, radiusY: 7.5 },
      rightEye: { x: 63, y: 44, radiusX: 6.5, radiusY: 7.5 },
    },
    confidence: 65,
    faceBounds: {
      top: 15,
      bottom: 88,
      left: 20,
      right: 80,
      centerX: 50,
    },
    triScale: {
      upperThirdY: 15,
      middleThirdY: 39,
      lowerThirdY: 64,
      anatomicalLipY: 67,
    },
  };
}

function runDetection(img: HTMLImageElement): FaceDetectionResult {
  try {
    const analysisSize = 256;
    const canvas = document.createElement('canvas');
    canvas.width = analysisSize;
    canvas.height = analysisSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) return getFallbackResult();

    // Draw image centered & fitted into analysis canvas
    ctx.drawImage(img, 0, 0, analysisSize, analysisSize);
    const imgData = ctx.getImageData(0, 0, analysisSize, analysisSize);
    const data = imgData.data;

    // 1. Skin & Face Chromaticity Analysis
    const skinMask = new Uint8Array(analysisSize * analysisSize);
    const lipMask = new Float32Array(analysisSize * analysisSize);

    // Profile accumulators
    const rowSkinCount = new Int32Array(analysisSize);
    const colSkinCount = new Int32Array(analysisSize);

    for (let y = 0; y < analysisSize; y++) {
      for (let x = 0; x < analysisSize; x++) {
        const idx = (y * analysisSize + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

        // Skip absolute borders & pure backgrounds
        if (x < 10 || x > analysisSize - 10 || y < 10 || y > analysisSize - 10) continue;
        if (brightness < 16 || brightness > 250) continue;

        // Check if pixel belongs to human or anime skin spectrum
        const total = r + g + b + 1;
        const normR = r / total;
        const normG = g / total;

        const isRealSkin =
          r > 70 &&
          g > 40 &&
          b > 25 &&
          r > g &&
          r > b &&
          r - g >= 10 &&
          normR > 0.35 &&
          normR < 0.62 &&
          normG > 0.25 &&
          normG < 0.42;

        const isAnimeSkin =
          r >= 140 &&
          g >= 110 &&
          b >= 100 &&
          r >= g &&
          g >= b &&
          normR >= 0.34 &&
          normR <= 0.52;

        if (isRealSkin || isAnimeSkin) {
          skinMask[y * analysisSize + x] = 1;
          rowSkinCount[y]++;
          colSkinCount[x]++;
        }

        // Lip Chrominance Index: Enhanced red/pink saturation relative to green/blue
        // Lips have higher red-to-green contrast, especially in lower facial region
        const lipMetric = (2 * r - g - b) / total;
        if (lipMetric > 0.12 && r > 90) {
          lipMask[y * analysisSize + x] = lipMetric;
        }
      }
    }

    // 2. Determine Facial Bounding Box (Top, Bottom, Left, Right)
    let faceTop = Math.floor(analysisSize * 0.14);
    let faceBottom = Math.floor(analysisSize * 0.88);
    let faceLeft = Math.floor(analysisSize * 0.2);
    let faceRight = Math.floor(analysisSize * 0.8);

    // Find top boundary of face (first row with significant skin density)
    const minSkinThreshold = analysisSize * 0.08;
    for (let y = 15; y < analysisSize * 0.5; y++) {
      if (rowSkinCount[y] > minSkinThreshold) {
        faceTop = Math.max(10, y - 10);
        break;
      }
    }

    // Find bottom boundary of face (chin tip)
    for (let y = analysisSize - 20; y > analysisSize * 0.6; y--) {
      if (rowSkinCount[y] > minSkinThreshold) {
        faceBottom = Math.min(analysisSize - 10, y + 6);
        break;
      }
    }

    // Find left & right cheeks
    for (let x = 15; x < analysisSize * 0.45; x++) {
      if (colSkinCount[x] > minSkinThreshold) {
        faceLeft = Math.max(10, x);
        break;
      }
    }
    for (let x = analysisSize - 15; x > analysisSize * 0.55; x--) {
      if (colSkinCount[x] > minSkinThreshold) {
        faceRight = Math.min(analysisSize - 10, x);
        break;
      }
    }

    const faceHeight = Math.max(80, faceBottom - faceTop);
    const faceWidth = Math.max(70, faceRight - faceLeft);

    // 3. Facial Symmetry Axis (X-center)
    let bestCenterX = Math.round((faceLeft + faceRight) / 2);
    let minSymDiff = Infinity;
    const testRange = Math.round(faceWidth * 0.12);

    for (let cx = bestCenterX - testRange; cx <= bestCenterX + testRange; cx++) {
      let diff = 0;
      let count = 0;
      for (let y = faceTop + Math.round(faceHeight * 0.3); y < faceBottom - Math.round(faceHeight * 0.1); y += 3) {
        for (let offset = 4; offset < Math.round(faceWidth * 0.4); offset += 3) {
          const x1 = cx - offset;
          const x2 = cx + offset;
          if (x1 >= 0 && x2 < analysisSize) {
            const val1 = skinMask[y * analysisSize + x1];
            const val2 = skinMask[y * analysisSize + x2];
            diff += Math.abs(val1 - val2);
            count++;
          }
        }
      }
      if (count > 0 && diff < minSymDiff) {
        minSymDiff = diff;
        bestCenterX = cx;
      }
    }

    // 4. Tri-Scale Partitioning (Rule of Thirds Facial Canon)
    // Classic Da Vinci / Anthropometric facial proportions:
    // Third 1: Trichion (hairline) to Glabella (brow line): 0% to 33.3%
    // Third 2: Glabella to Subnasale (base of nose): 33.3% to 66.7%
    // Third 3: Subnasale to Menton (chin): 66.7% to 100%
    const thirdHeight = faceHeight / 3;
    const upperThirdY = (faceTop / analysisSize) * 100;
    const middleThirdY = ((faceTop + thirdHeight) / analysisSize) * 100;
    const lowerThirdY = ((faceTop + thirdHeight * 2) / analysisSize) * 100;
    const chinBaseY = (faceBottom / analysisSize) * 100;

    // Anatomical golden ratio lip placement sits at ~1/3 of the lower third
    const anatomicalLipY = lowerThirdY + (chinBaseY - lowerThirdY) * 0.36;

    // 5. Oral Fissure & Lip Localization (in Lower Third)
    const mouthSearchTop = Math.round(faceTop + faceHeight * 0.58);
    const mouthSearchBottom = Math.round(faceTop + faceHeight * 0.84);
    const mouthSearchLeft = Math.max(10, Math.round(bestCenterX - faceWidth * 0.32));
    const mouthSearchRight = Math.min(analysisSize - 10, Math.round(bestCenterX + faceWidth * 0.32));

    let maxLipScore = -1;
    let detectedMouthY = Math.round(faceTop + faceHeight * 0.68);
    let detectedMouthX = bestCenterX;
    let leftMouthCorner = detectedMouthX - Math.round(faceWidth * 0.14);
    let rightMouthCorner = detectedMouthX + Math.round(faceWidth * 0.14);

    // Search for horizontal oral fissure (dark line between lips with red chrominance)
    for (let y = mouthSearchTop; y <= mouthSearchBottom; y++) {
      let rowScore = 0;
      let lipPixelsInRow = 0;
      let rowWeightedX = 0;

      for (let x = mouthSearchLeft; x <= mouthSearchRight; x++) {
        const idx = y * analysisSize + x;
        const lipStrength = lipMask[idx];
        const pixelIdx = idx * 4;
        const brightness =
          0.299 * data[pixelIdx] + 0.587 * data[pixelIdx + 1] + 0.114 * data[pixelIdx + 2];

        // Contrast with row above and below (horizontal lip crease/fissure)
        const aboveIdx = ((y - 2) * analysisSize + x) * 4;
        const belowIdx = ((y + 2) * analysisSize + x) * 4;
        const aboveBright =
          0.299 * data[aboveIdx] + 0.587 * data[aboveIdx + 1] + 0.114 * data[aboveIdx + 2];
        const belowBright =
          0.299 * data[belowIdx] + 0.587 * data[belowIdx + 1] + 0.114 * data[belowIdx + 2];

        const fissureContrast = Math.max(0, (aboveBright + belowBright) / 2 - brightness);

        const score = lipStrength * 2.5 + (fissureContrast / 255) * 1.8;
        if (score > 0.1) {
          rowScore += score;
          lipPixelsInRow++;
          rowWeightedX += x * score;
        }
      }

      if (rowScore > maxLipScore && lipPixelsInRow >= 6) {
        maxLipScore = rowScore;
        detectedMouthY = y;
        if (rowScore > 0) {
          detectedMouthX = Math.round(rowWeightedX / rowScore);
        }
      }
    }

    // Refine mouth width by tracing lips horizontally along detectedMouthY
    for (let x = detectedMouthX; x >= mouthSearchLeft; x--) {
      const idx = detectedMouthY * analysisSize + x;
      if (lipMask[idx] > 0.08 || skinMask[idx] === 1) {
        leftMouthCorner = x;
      } else if (x < detectedMouthX - 10) {
        break;
      }
    }
    for (let x = detectedMouthX; x <= mouthSearchRight; x++) {
      const idx = detectedMouthY * analysisSize + x;
      if (lipMask[idx] > 0.08 || skinMask[idx] === 1) {
        rightMouthCorner = x;
      } else if (x > detectedMouthX + 10) {
        break;
      }
    }

    // Blend detected coordinates with anatomical tri-scale expectation
    const detectedYPercent = (detectedMouthY / analysisSize) * 100;
    const finalMouthY =
      maxLipScore > 0.5
        ? Math.round((detectedYPercent * 0.65 + anatomicalLipY * 0.35) * 10) / 10
        : Math.round(anatomicalLipY * 10) / 10;

    const detectedXPercent = (detectedMouthX / analysisSize) * 100;
    const finalMouthX = Math.round((detectedXPercent * 0.7 + (bestCenterX / analysisSize) * 100 * 0.3) * 10) / 10;

    const rawWidthPercent = ((rightMouthCorner - leftMouthCorner) / analysisSize) * 100;
    const finalMouthWidth = Math.round(Math.max(14, Math.min(32, rawWidthPercent || (faceWidth / analysisSize) * 100 * 0.32)) * 10) / 10;
    const finalMouthHeight = Math.round(Math.max(6, Math.min(18, finalMouthWidth * 0.52)) * 10) / 10;
    const finalChinY = Math.round(Math.min(95, Math.max(finalMouthY + 8, chinBaseY)) * 10) / 10;

    // 6. Eye Detection in Middle Third
    const eyeSearchTop = Math.round(faceTop + faceHeight * 0.35);
    const eyeSearchBottom = Math.round(faceTop + faceHeight * 0.52);

    let leftEyeX = bestCenterX - Math.round(faceWidth * 0.22);
    let rightEyeX = bestCenterX + Math.round(faceWidth * 0.22);
    let eyesY = Math.round(faceTop + faceHeight * 0.44);

    // Scan for dark pupils in left and right eye zones
    let minLeftBright = 255;
    let minRightBright = 255;

    for (let y = eyeSearchTop; y <= eyeSearchBottom; y++) {
      // Left eye region
      for (let x = Math.round(bestCenterX - faceWidth * 0.38); x <= Math.round(bestCenterX - faceWidth * 0.08); x++) {
        const pIdx = (y * analysisSize + x) * 4;
        const b = 0.299 * data[pIdx] + 0.587 * data[pIdx + 1] + 0.114 * data[pIdx + 2];
        if (b < minLeftBright) {
          minLeftBright = b;
          leftEyeX = x;
          eyesY = y;
        }
      }
      // Right eye region
      for (let x = Math.round(bestCenterX + faceWidth * 0.08); x <= Math.round(bestCenterX + faceWidth * 0.38); x++) {
        const pIdx = (y * analysisSize + x) * 4;
        const b = 0.299 * data[pIdx] + 0.587 * data[pIdx + 1] + 0.114 * data[pIdx + 2];
        if (b < minRightBright) {
          minRightBright = b;
          rightEyeX = x;
        }
      }
    }

    const leftEyeXPercent = Math.round((leftEyeX / analysisSize) * 100 * 10) / 10;
    const rightEyeXPercent = Math.round((rightEyeX / analysisSize) * 100 * 10) / 10;
    const eyesYPercent = Math.round((eyesY / analysisSize) * 100 * 10) / 10;
    const eyeRadiusX = Math.round(Math.max(4.5, Math.min(9.0, (faceWidth / analysisSize) * 100 * 0.11)) * 10) / 10;
    const eyeRadiusY = Math.round((eyeRadiusX * 1.15) * 10) / 10;

    const confidence = maxLipScore > 1.2 ? 96 : maxLipScore > 0.4 ? 85 : 72;

    return {
      mouth: {
        x: finalMouthX,
        y: finalMouthY,
        width: finalMouthWidth,
        height: finalMouthHeight,
        chinY: finalChinY,
        angle: 0,
        feather: 3.5,
        curvature: 0,
      },
      eyes: {
        enabled: true,
        blinkInterval: 3.2,
        leftEye: {
          x: leftEyeXPercent,
          y: eyesYPercent,
          radiusX: eyeRadiusX,
          radiusY: eyeRadiusY,
        },
        rightEye: {
          x: rightEyeXPercent,
          y: eyesYPercent,
          radiusX: eyeRadiusX,
          radiusY: eyeRadiusY,
        },
      },
      confidence,
      faceBounds: {
        top: Math.round((faceTop / analysisSize) * 100),
        bottom: Math.round((faceBottom / analysisSize) * 100),
        left: Math.round((faceLeft / analysisSize) * 100),
        right: Math.round((faceRight / analysisSize) * 100),
        centerX: Math.round((bestCenterX / analysisSize) * 100),
      },
      triScale: {
        upperThirdY: Math.round(upperThirdY * 10) / 10,
        middleThirdY: Math.round(middleThirdY * 10) / 10,
        lowerThirdY: Math.round(lowerThirdY * 10) / 10,
        anatomicalLipY: Math.round(anatomicalLipY * 10) / 10,
      },
    };
  } catch (err) {
    console.error('Detection error:', err);
    return getFallbackResult();
  }
}
