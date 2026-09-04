export interface BackgroundPreset {
  id: string;
  name: string;
  nameTh: string;
  category: 'office' | 'studio' | 'education' | 'anime' | 'chroma' | 'creative';
  type?: 'preset' | 'custom' | 'color' | 'original';
  imageUrl?: string;
  thumbnail?: string;
  color?: string;
  gradient?: string;
  description: string;
  descriptionTh: string;
  blur?: number;
  brightness?: number;
}

export interface BackgroundConfig {
  enabled: boolean;
  type: 'preset' | 'custom' | 'color' | 'original';
  presetId?: string;
  customImageUrl?: string;
  customImageName?: string;
  color?: string;
  gradient?: string;
  blur: number; // 0 to 20 px for depth-of-field bokeh
  brightness: number; // 50% to 150%
  // Subject matting / Chroma key
  keyingMode: 'auto' | 'chroma' | 'vignette' | 'transparent' | 'none';
  keyColor: string; // hex color e.g. #00ff00 or #ffffff
  tolerance: number; // 5 to 100
  feather: number; // 0 to 15 px
  characterScale: number; // 0.5 to 1.5 (default 1.0)
  characterPositionX: number; // -50% to 50% (default 0)
  characterPositionY: number; // -50% to 50% (default 0)
}

export interface EyePosition {
  x: number; // percentage of image width (0-100)
  y: number; // percentage of image height (0-100)
  radiusX: number; // percentage of image width (0-100)
  radiusY: number; // percentage of image height (0-100)
}

export interface EyeLandmarks {
  enabled: boolean;
  leftEye: EyePosition;
  rightEye: EyePosition;
  blinkInterval: number; // seconds between blinks
}

export interface AvatarPreset {
  id: string;
  name: string;
  category: 'cartoon' | 'anime' | 'character' | 'photoreal' | 'artistic';
  styleType?: 'cartoon' | 'realistic';
  imageUrl: string;
  defaultMouthBox: {
    x: number; // percentage of image width (0-100)
    y: number; // percentage of image height (0-100)
    width: number; // percentage
    height: number; // percentage
    chinY: number; // percentage for chin/jaw movement
  };
  defaultEyes?: EyeLandmarks;
}

export interface AudioPreset {
  id: string;
  title: string;
  language: 'th' | 'en';
  duration: number; // in seconds
  description: string;
  type: 'speech' | 'dialogue' | 'expressive';
  // Generates or plays an audio synthetic speech or audio element
  sampleText?: string;
  frequencyPattern?: 'intro' | 'excited' | 'smooth';
}

export interface MouthLandmarks {
  x: number; // Center X percentage (0-100)
  y: number; // Center Y percentage (0-100)
  width: number; // Width percentage (0-100)
  height: number; // Height percentage (0-100)
  chinY: number; // Chin displacement anchor percentage (0-100)
  angle?: number; // Rotation/tilt in degrees (-15 to 15)
  feather?: number; // Edge blending feather radius in pixels (0-10)
  curvature?: number; // Lip curve/smile offset (-10 to 10)
}

export interface FaceDetectionResult {
  mouth: MouthLandmarks;
  eyes?: EyeLandmarks;
  confidence: number; // 0 - 100%
  faceBounds: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    centerX: number;
  };
  triScale: {
    upperThirdY: number; // Hairline to Brow (%)
    middleThirdY: number; // Brow to Subnasale (%)
    lowerThirdY: number; // Subnasale to Menton (%)
    anatomicalLipY: number; // Anatomical golden ratio lip placement (%)
  };
}

export interface LipSyncConfig {
  fps: number; // 24, 30, or 60
  intensity: number; // 0.5 to 2.5 (mouth open multiplier)
  smoothness: number; // 0 to 0.8 (energy smoothing filter)
  openThreshold: number; // 0.01 to 0.1 (silence gate)
  enableTeeth: boolean;
  enableIdleMotion: boolean; // subtle natural breathing/movement
  jawDisplacement: number; // 0 to 1.5
  enableBlink: boolean; // eye blinking simulation
  blinkInterval: number; // seconds between blinks (default 3.2s)
  showTriScale?: boolean; // toggle Tri-Scale (3-part facial rule of thirds) & coordinate ruler
  seamlessBlend?: boolean; // smooth edge feathering and lip tone blending
  lipFeather?: number; // feather blur radius (0-10px)
  mouthStyle?: 'realistic-3d' | 'anime' | 'classic'; // 'realistic-3d' matches the user's smiling teeth photo
  showLowerTeeth?: boolean; // realistic lower teeth visible when opening mouth
  lipGloss?: boolean; // glossy reflection on lower lip like in photo
  smileCurve?: number; // smile curvature (-5 to 10, default 3)
  lipColor?: 'natural' | 'terracotta' | 'nude-rose' | 'ruby';
}

export interface FrameEnergyData {
  time: number;
  rms: number;
  aperture: number; // 0 (closed) to 1 (wide open)
  jawOffset: number; // vertical pixel shift
  isSpeaking: boolean;
}

export interface ProjectSourceFile {
  filename: string;
  path: string;
  description: string;
  language: string;
  content: string;
}
