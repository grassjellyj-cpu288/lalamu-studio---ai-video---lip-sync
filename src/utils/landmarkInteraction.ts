import React from 'react';
import { MouthLandmarks, EyeLandmarks } from '../types';

export type DragTarget =
  | 'mouth-center'
  | 'mouth-box'
  | 'mouth-nw'
  | 'mouth-ne'
  | 'mouth-se'
  | 'mouth-sw'
  | 'mouth-n'
  | 'mouth-s'
  | 'mouth-w'
  | 'mouth-e'
  | 'chin'
  | 'left-eye'
  | 'right-eye';

export interface DragState {
  target: DragTarget;
  startPctX: number;
  startPctY: number;
  initialMouth: MouthLandmarks;
  initialEyes?: EyeLandmarks;
}

export type PointerCoordEvent =
  | React.MouseEvent<HTMLCanvasElement>
  | MouseEvent
  | React.TouchEvent<HTMLCanvasElement>
  | TouchEvent;

/**
 * Normalizes client mouse and touch coordinates into canvas percentage coordinates (0 - 100)
 */
export function getCanvasPercentageCoords(
  e: PointerCoordEvent,
  canvas: HTMLCanvasElement
): { pctX: number; pctY: number } {
  const rect = canvas.getBoundingClientRect();
  let clientX = 0;
  let clientY = 0;

  if ('touches' in e && e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if ('changedTouches' in e && e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else if ('clientX' in e) {
    clientX = (e as MouseEvent).clientX;
    clientY = (e as MouseEvent).clientY;
  }

  const rawX = clientX - rect.left;
  const rawY = clientY - rect.top;

  const pctX = Math.max(0, Math.min(100, (rawX / Math.max(1, rect.width)) * 100));
  const pctY = Math.max(0, Math.min(100, (rawY / Math.max(1, rect.height)) * 100));

  return { pctX, pctY };
}

/**
 * Calculates Euclidean distance between two points
 */
function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x1 - x2, y1 - y2);
}

/**
 * Detects which landmark handle or zone is hovered/clicked
 */
export function hitTestLandmark(
  pctX: number,
  pctY: number,
  mouth: MouthLandmarks,
  eyes?: EyeLandmarks
): DragTarget | null {
  const left = mouth.x - mouth.width / 2;
  const right = mouth.x + mouth.width / 2;
  const top = mouth.y - mouth.height / 2;
  const bottom = mouth.y + mouth.height / 2;

  // 1. Chin anchor check
  if (dist(pctX, pctY, mouth.x, mouth.chinY) < 5.5) {
    return 'chin';
  }

  // 2. Eye checks (left eye & right eye)
  if (eyes) {
    if (dist(pctX, pctY, eyes.leftEye.x, eyes.leftEye.y) < Math.max(5.5, eyes.leftEye.radiusX * 1.1)) {
      return 'left-eye';
    }
    if (dist(pctX, pctY, eyes.rightEye.x, eyes.rightEye.y) < Math.max(5.5, eyes.rightEye.radiusX * 1.1)) {
      return 'right-eye';
    }
  }

  // 3. Mouth 4 Corner resize handles
  if (dist(pctX, pctY, left, top) < 4.5) return 'mouth-nw';
  if (dist(pctX, pctY, right, top) < 4.5) return 'mouth-ne';
  if (dist(pctX, pctY, right, bottom) < 4.5) return 'mouth-se';
  if (dist(pctX, pctY, left, bottom) < 4.5) return 'mouth-sw';

  // 4. Edge handles
  if (dist(pctX, pctY, mouth.x, top) < 4.0) return 'mouth-n';
  if (dist(pctX, pctY, mouth.x, bottom) < 4.0) return 'mouth-s';
  if (dist(pctX, pctY, left, mouth.y) < 4.0) return 'mouth-w';
  if (dist(pctX, pctY, right, mouth.y) < 4.0) return 'mouth-e';

  // 5. Mouth center anchor
  if (dist(pctX, pctY, mouth.x, mouth.y) < 5.0) {
    return 'mouth-center';
  }

  // 6. Inside mouth box
  if (pctX >= left && pctX <= right && pctY >= top && pctY <= bottom) {
    return 'mouth-box';
  }

  return null;
}

/**
 * Determines CSS cursor string based on hit target
 */
export function getCursorForTarget(target: DragTarget | null): string {
  if (!target) return 'crosshair';
  switch (target) {
    case 'mouth-center':
    case 'mouth-box':
      return 'move';
    case 'chin':
    case 'mouth-n':
    case 'mouth-s':
      return 'ns-resize';
    case 'mouth-w':
    case 'mouth-e':
      return 'ew-resize';
    case 'mouth-nw':
    case 'mouth-se':
      return 'nwse-resize';
    case 'mouth-ne':
    case 'mouth-sw':
      return 'nesw-resize';
    case 'left-eye':
    case 'right-eye':
      return 'grab';
    default:
      return 'crosshair';
  }
}
