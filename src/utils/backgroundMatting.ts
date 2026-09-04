import { BackgroundConfig } from '../types';

/**
 * Parses hex color to [r, g, b]
 */
export function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [0, 255, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Draws an image covering target width/height while preserving aspect ratio (center-cropped)
 */
export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  targetW: number,
  targetH: number
) {
  const srcW = 'naturalWidth' in img ? img.naturalWidth || targetW : img.width;
  const srcH = 'naturalHeight' in img ? img.naturalHeight || targetH : img.height;

  if (srcW === 0 || srcH === 0) return;

  const targetRatio = targetW / targetH;
  const srcRatio = srcW / srcH;

  let renderW: number;
  let renderH: number;
  let offsetX: number;
  let offsetY: number;

  if (srcRatio > targetRatio) {
    // Image is wider than target
    renderH = targetH;
    renderW = targetH * srcRatio;
    offsetX = (targetW - renderW) / 2;
    offsetY = 0;
  } else {
    // Image is taller than target
    renderW = targetW;
    renderH = targetW / srcRatio;
    offsetX = 0;
    offsetY = (targetH - renderH) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
}

/**
 * Generates an isolated character cutout canvas according to the keying mode.
 * Result is cached so subsequent frames render at full 60fps.
 */
export function createCharacterCutout(
  img: HTMLImageElement,
  config: BackgroundConfig
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const w = img.naturalWidth || 640;
  const h = img.naturalHeight || 640;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  // Draw initial base image
  ctx.drawImage(img, 0, 0, w, h);

  if (!config.enabled || config.type === 'original' || config.keyingMode === 'none') {
    return canvas;
  }

  if (config.keyingMode === 'vignette') {
    // Apply soft portrait vignette mask
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    const centerX = w * 0.5;
    const centerY = h * 0.52;
    const radiusX = w * 0.46;
    const radiusY = h * 0.5;

    const grad = ctx.createRadialGradient(
      centerX,
      centerY,
      Math.min(radiusX, radiusY) * 0.65,
      centerX,
      centerY,
      Math.max(radiusX, radiusY)
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.9)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return canvas;
  }

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const totalPixels = w * h;

  if (config.keyingMode === 'chroma') {
    const [kr, kg, kb] = hexToRgb(config.keyColor || '#00FF00');
    const tol = (config.tolerance || 35) * 2.5; // range roughly 25 to 250
    const feather = (config.feather || 5) * 12;

    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const dr = r - kr;
      const dg = g - kg;
      const db = b - kb;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      if (dist < tol) {
        data[idx + 3] = 0; // completely transparent
      } else if (dist < tol + feather) {
        const factor = (dist - tol) / feather;
        data[idx + 3] = Math.round(data[idx + 3] * factor);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  if (config.keyingMode === 'auto') {
    // Smart Edge-Connected Background Removal for Cartoon & Anime Images
    // Sample the corner pixels and border pixels to find the background color
    const sampleIndices = [
      0, // top-left
      (w - 1) * 4, // top-right
      (h - 1) * w * 4, // bottom-left
      (h * w - 1) * 4, // bottom-right
      Math.floor(w / 2) * 4, // top-center
      (w * 5 + 5) * 4, // near corner
    ];

    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let count = 0;

    for (const sIdx of sampleIndices) {
      if (sIdx < data.length) {
        sumR += data[sIdx];
        sumG += data[sIdx + 1];
        sumB += data[sIdx + 2];
        count++;
      }
    }

    const bgR = Math.round(sumR / count);
    const bgG = Math.round(sumG / count);
    const bgB = Math.round(sumB / count);

    const tol = Math.max(18, (config.tolerance || 30) * 1.8);
    const feather = (config.feather || 6) * 10;

    // Fast border-connected flood fill or border proximity mask
    // We use a visited map to only remove pixels that connect to the outer frame
    // so we don't accidentally cut out the character's white collar, eyes, or teeth!
    const visited = new Uint8Array(totalPixels);
    const queue: number[] = [];

    // Helper: color distance to background
    const isBgPixel = (x: number, y: number): boolean => {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const dr = r - bgR;
      const dg = g - bgG;
      const db = b - bgB;
      return Math.sqrt(dr * dr + dg * dg + db * db) < tol + feather;
    };

    // Seed outer borders into queue
    for (let x = 0; x < w; x++) {
      if (isBgPixel(x, 0)) {
        visited[x] = 1;
        queue.push(x);
      }
      const bIdx = (h - 1) * w + x;
      if (isBgPixel(x, h - 1)) {
        visited[bIdx] = 1;
        queue.push(bIdx);
      }
    }
    for (let y = 0; y < h; y++) {
      const lIdx = y * w;
      if (!visited[lIdx] && isBgPixel(0, y)) {
        visited[lIdx] = 1;
        queue.push(lIdx);
      }
      const rIdx = y * w + (w - 1);
      if (!visited[rIdx] && isBgPixel(w - 1, y)) {
        visited[rIdx] = 1;
        queue.push(rIdx);
      }
    }

    // BFS Flood Fill outward-to-inward
    let head = 0;
    while (head < queue.length) {
      const curr = queue[head++];
      const cx = curr % w;
      const cy = Math.floor(curr / w);

      // 4-neighbor expansion
      const neighbors = [
        cx > 0 ? curr - 1 : -1,
        cx < w - 1 ? curr + 1 : -1,
        cy > 0 ? curr - w : -1,
        cy < h - 1 ? curr + w : -1,
      ];

      for (const n of neighbors) {
        if (n >= 0 && visited[n] === 0) {
          const nx = n % w;
          const ny = Math.floor(n / w);
          if (isBgPixel(nx, ny)) {
            visited[n] = 1;
            queue.push(n);
          }
        }
      }
    }

    // Apply transparency only to visited background pixels
    for (let i = 0; i < totalPixels; i++) {
      if (visited[i] === 1) {
        const idx = i * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const dr = r - bgR;
        const dg = g - bgG;
        const db = b - bgB;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);

        if (dist < tol) {
          data[idx + 3] = 0;
        } else if (dist < tol + feather) {
          const factor = (dist - tol) / feather;
          data[idx + 3] = Math.round(data[idx + 3] * factor);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  return canvas;
}
