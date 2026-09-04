import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Video,
  SlidersHorizontal,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Camera,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MousePointer,
  Crop,
  Ruler,
} from 'lucide-react';
import { MouthLandmarks, LipSyncConfig, FrameEnergyData, EyeLandmarks } from '../types';
import { renderLipSyncFrame } from '../utils/lipsyncRenderer';
import { exportLipSyncVideo, ExportProgress } from '../utils/videoExporter';
import { getAudioContext } from '../utils/audioAnalyzer';
import {
  getCanvasPercentageCoords,
  hitTestLandmark,
  getCursorForTarget,
  DragTarget,
  DragState,
  PointerCoordEvent,
} from '../utils/landmarkInteraction';

interface StudioPlayerProps {
  imageElement: HTMLImageElement | null;
  audioBuffer: AudioBuffer | null;
  mouthLandmarks: MouthLandmarks;
  onChangeMouthLandmarks?: (mouth: MouthLandmarks) => void;
  eyeLandmarks?: EyeLandmarks;
  onChangeEyeLandmarks?: (eyes: EyeLandmarks) => void;
  frames: FrameEnergyData[];
  isGenerated: boolean;
  onGenerateLipSync: () => void;
  isGenerating: boolean;
  config: LipSyncConfig;
  onChangeConfig: (config: LipSyncConfig) => void;
  showLandmarks: boolean;
  setShowLandmarks?: (show: boolean) => void;
  lang: 'th' | 'en';
}

export const StudioPlayer: React.FC<StudioPlayerProps> = ({
  imageElement,
  audioBuffer,
  mouthLandmarks,
  onChangeMouthLandmarks,
  eyeLandmarks,
  onChangeEyeLandmarks,
  frames,
  isGenerated,
  onGenerateLipSync,
  isGenerating,
  config,
  onChangeConfig,
  showLandmarks,
  setShowLandmarks,
  lang,
}) => {
  const isTh = lang === 'th';
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isLooping, setIsLooping] = useState(true);
  const animFrameIdRef = useRef<number | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Interactive mouse placement & blink testing state
  const [mouseEditMode, setMouseEditMode] = useState(false);
  const [activeTool, setActiveTool] = useState<'mouth' | 'leftEye' | 'rightEye' | 'chin'>('mouth');
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoverTarget, setHoverTarget] = useState<DragTarget | null>(null);
  const [manualBlinkProgress, setManualBlinkProgress] = useState<number>(0);
  const blinkAnimRef = useRef<number | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedFilename, setExportedFilename] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);

  // Config Drawer toggle
  const [showConfig, setShowConfig] = useState(false);

  // Viewport Fit & Scale state ('fit': original fit, 'face': zoom to mouth/eyes, 'expand': expanded canvas)
  const [viewMode, setViewMode] = useState<'fit' | 'expand' | 'face'>('fit');

  const totalFrames = frames.length || (audioBuffer ? Math.ceil(audioBuffer.duration * config.fps) : 0);
  const duration = audioBuffer ? audioBuffer.duration : 0;

  // Render current frame to canvas
  useEffect(() => {
    if (!canvasRef.current || !imageElement) return;

    const canvas = canvasRef.current;
    // Set internal resolution matching image aspect ratio
    const imgW = imageElement.naturalWidth || 640;
    const imgH = imageElement.naturalHeight || 640;
    if (canvas.width !== imgW || canvas.height !== imgH) {
      canvas.width = imgW;
      canvas.height = imgH;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameData = frames[currentFrameIndex];
    const aperture = isGenerated && frameData ? frameData.aperture : 0;
    const timeSec = frameData ? frameData.time : currentFrameIndex / config.fps;

    renderLipSyncFrame(
      ctx,
      imageElement,
      mouthLandmarks,
      aperture,
      config,
      timeSec,
      showLandmarks || mouseEditMode,
      eyeLandmarks,
      manualBlinkProgress
    );
  }, [
    imageElement,
    mouthLandmarks,
    currentFrameIndex,
    isGenerated,
    frames,
    config,
    showLandmarks,
    mouseEditMode,
    eyeLandmarks,
    manualBlinkProgress,
  ]);

  // Trigger smooth manual blink simulation
  const handleTriggerBlink = () => {
    if (blinkAnimRef.current) cancelAnimationFrame(blinkAnimRef.current);
    const start = performance.now();
    const duration = 240;

    const animateBlink = (now: number) => {
      const elapsed = now - start;
      if (elapsed >= duration) {
        setManualBlinkProgress(0);
        return;
      }
      const t = elapsed / duration;
      const factor = Math.sin(t * Math.PI);
      setManualBlinkProgress(factor);
      blinkAnimRef.current = requestAnimationFrame(animateBlink);
    };
    blinkAnimRef.current = requestAnimationFrame(animateBlink);
  };

  // Canvas Mouse & Touch Drag/Placement Handlers
  const handlePointerDown = (e: PointerCoordEvent) => {
    if (!canvasRef.current || (!showLandmarks && !mouseEditMode)) return;
    const { pctX, pctY } = getCanvasPercentageCoords(e, canvasRef.current);

    const hit = hitTestLandmark(pctX, pctY, mouthLandmarks, eyeLandmarks);

    if (hit) {
      setDragState({
        target: hit,
        startPctX: pctX,
        startPctY: pctY,
        initialMouth: { ...mouthLandmarks },
        initialEyes: eyeLandmarks ? JSON.parse(JSON.stringify(eyeLandmarks)) : undefined,
      });
    } else {
      // Direct click-to-place selected landmark freely
      if (activeTool === 'mouth' && onChangeMouthLandmarks) {
        const chinOffset = mouthLandmarks.chinY - mouthLandmarks.y;
        const newY = Math.max(15, Math.min(88, pctY));
        const newX = Math.max(5, Math.min(95, pctX));
        onChangeMouthLandmarks({
          ...mouthLandmarks,
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          chinY: Math.round(Math.min(98, newY + chinOffset) * 10) / 10,
        });
        setDragState({
          target: 'mouth-center',
          startPctX: pctX,
          startPctY: pctY,
          initialMouth: { ...mouthLandmarks, x: newX, y: newY },
        });
      } else if (activeTool === 'leftEye' && onChangeEyeLandmarks && eyeLandmarks) {
        onChangeEyeLandmarks({
          ...eyeLandmarks,
          leftEye: { ...eyeLandmarks.leftEye, x: Math.round(pctX * 10) / 10, y: Math.round(pctY * 10) / 10 },
        });
        setDragState({
          target: 'left-eye',
          startPctX: pctX,
          startPctY: pctY,
          initialMouth: { ...mouthLandmarks },
          initialEyes: JSON.parse(JSON.stringify(eyeLandmarks)),
        });
      } else if (activeTool === 'rightEye' && onChangeEyeLandmarks && eyeLandmarks) {
        onChangeEyeLandmarks({
          ...eyeLandmarks,
          rightEye: { ...eyeLandmarks.rightEye, x: Math.round(pctX * 10) / 10, y: Math.round(pctY * 10) / 10 },
        });
        setDragState({
          target: 'right-eye',
          startPctX: pctX,
          startPctY: pctY,
          initialMouth: { ...mouthLandmarks },
          initialEyes: JSON.parse(JSON.stringify(eyeLandmarks)),
        });
      } else if (activeTool === 'chin' && onChangeMouthLandmarks) {
        onChangeMouthLandmarks({
          ...mouthLandmarks,
          chinY: Math.round(Math.max(mouthLandmarks.y + 4, pctY) * 10) / 10,
        });
        setDragState({
          target: 'chin',
          startPctX: pctX,
          startPctY: pctY,
          initialMouth: { ...mouthLandmarks },
        });
      }
    }
  };

  const handlePointerMove = (e: PointerCoordEvent) => {
    if (!canvasRef.current || (!showLandmarks && !mouseEditMode)) return;
    const { pctX, pctY } = getCanvasPercentageCoords(e, canvasRef.current);

    if (dragState) {
      const dx = pctX - dragState.startPctX;
      const dy = pctY - dragState.startPctY;

      if (dragState.target === 'mouth-center' || dragState.target === 'mouth-box') {
        if (onChangeMouthLandmarks) {
          const newX = Math.max(5, Math.min(95, dragState.initialMouth.x + dx));
          const newY = Math.max(15, Math.min(90, dragState.initialMouth.y + dy));
          const chinDiff = dragState.initialMouth.chinY - dragState.initialMouth.y;
          onChangeMouthLandmarks({
            ...dragState.initialMouth,
            x: Math.round(newX * 10) / 10,
            y: Math.round(newY * 10) / 10,
            chinY: Math.round(Math.min(98, newY + chinDiff) * 10) / 10,
          });
        }
      } else if (dragState.target === 'chin') {
        if (onChangeMouthLandmarks) {
          const newChin = Math.max(mouthLandmarks.y + mouthLandmarks.height / 2 + 2, Math.min(99, pctY));
          onChangeMouthLandmarks({
            ...mouthLandmarks,
            chinY: Math.round(newChin * 10) / 10,
          });
        }
      } else if (dragState.target === 'left-eye') {
        if (onChangeEyeLandmarks && eyeLandmarks) {
          onChangeEyeLandmarks({
            ...eyeLandmarks,
            leftEye: {
              ...eyeLandmarks.leftEye,
              x: Math.round(Math.max(5, Math.min(95, pctX)) * 10) / 10,
              y: Math.round(Math.max(5, Math.min(95, pctY)) * 10) / 10,
            },
          });
        }
      } else if (dragState.target === 'right-eye') {
        if (onChangeEyeLandmarks && eyeLandmarks) {
          onChangeEyeLandmarks({
            ...eyeLandmarks,
            rightEye: {
              ...eyeLandmarks.rightEye,
              x: Math.round(Math.max(5, Math.min(95, pctX)) * 10) / 10,
              y: Math.round(Math.max(5, Math.min(95, pctY)) * 10) / 10,
            },
          });
        }
      } else if (dragState.target.startsWith('mouth-')) {
        // Resizing mouth box
        if (onChangeMouthLandmarks) {
          let newW = mouthLandmarks.width;
          let newH = mouthLandmarks.height;
          if (dragState.target === 'mouth-e' || dragState.target === 'mouth-w') {
            newW = Math.max(6, Math.min(65, Math.abs(pctX - mouthLandmarks.x) * 2));
          } else if (dragState.target === 'mouth-n' || dragState.target === 'mouth-s') {
            newH = Math.max(4, Math.min(45, Math.abs(pctY - mouthLandmarks.y) * 2));
          } else {
            newW = Math.max(6, Math.min(65, Math.abs(pctX - mouthLandmarks.x) * 2));
            newH = Math.max(4, Math.min(45, Math.abs(pctY - mouthLandmarks.y) * 2));
          }
          onChangeMouthLandmarks({
            ...mouthLandmarks,
            width: Math.round(newW * 10) / 10,
            height: Math.round(newH * 10) / 10,
          });
        }
      }
    } else {
      const hit = hitTestLandmark(pctX, pctY, mouthLandmarks, eyeLandmarks);
      setHoverTarget(hit);
      canvasRef.current.style.cursor = getCursorForTarget(hit);
    }
  };

  const handlePointerUp = () => {
    setDragState(null);
  };

  const handlePointerLeave = () => {
    setDragState(null);
    setHoverTarget(null);
  };

  // Reset playback position if audio changes
  useEffect(() => {
    pausePlayback();
    setCurrentFrameIndex(0);
  }, [audioBuffer]);

  // Clean up timers, audio sources, and animation frames on unmount
  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      if (blinkAnimRef.current) {
        cancelAnimationFrame(blinkAnimRef.current);
        blinkAnimRef.current = null;
      }
      stopAudioSource();
    };
  }, []);

  // Synchronized Audio & Video Playback
  const startPlayback = async () => {
    if (!audioBuffer || !imageElement) return;

    const audioCtx = getAudioContext();
    if (audioCtx.state === 'suspended') {
      try {
        await audioCtx.resume();
      } catch (err) {
        console.warn('Could not resume audio context:', err);
      }
    }

    // Cancel existing animation loop and audio source
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    stopAudioSource();

    // Create & start audio source from current frame offset
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);

    const startOffset = Math.min(audioBuffer.duration, currentFrameIndex / config.fps);
    source.start(0, startOffset);
    audioSourceRef.current = source;

    playbackStartTimeRef.current = audioCtx.currentTime - startOffset;
    setIsPlaying(true);

    const loop = () => {
      const now = audioCtx.currentTime;
      const elapsed = now - playbackStartTimeRef.current;

      if (elapsed >= audioBuffer.duration) {
        if (isLooping) {
          stopAudioSource();
          if (animFrameIdRef.current) {
            cancelAnimationFrame(animFrameIdRef.current);
            animFrameIdRef.current = null;
          }
          setCurrentFrameIndex(0);
          startPlayback();
          return;
        } else {
          setIsPlaying(false);
          setCurrentFrameIndex(0);
          stopAudioSource();
          return;
        }
      }

      const frameIdx = Math.min(totalFrames - 1, Math.floor(elapsed * config.fps));
      setCurrentFrameIndex(frameIdx);
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
  };

  const pausePlayback = () => {
    setIsPlaying(false);
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    stopAudioSource();
  };

  const stopAudioSource = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch {
        // already stopped
      }
      audioSourceRef.current = null;
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  };

  const handleSeek = (frameIdx: number) => {
    const safeIdx = Math.max(0, Math.min(totalFrames - 1, frameIdx));
    setCurrentFrameIndex(safeIdx);
    if (isPlaying) {
      pausePlayback();
    }
  };

  // Video Export Handler
  const handleExport = async () => {
    if (!imageElement || !audioBuffer || !isGenerated || frames.length === 0) {
      setNoticeMessage({
        text: isTh ? 'กรุณากด "เริ่ม Lip Sync" ก่อนส่งออกวิดีโอ' : 'Please run "Start Lip Sync" first.',
        type: 'error',
      });
      setTimeout(() => setNoticeMessage(null), 4000);
      return;
    }

    pausePlayback();
    setIsExporting(true);
    setExportProgress({
      percent: 0,
      currentFrame: 0,
      totalFrames: frames.length,
      status: isTh ? 'เตรียมการเรนเดอร์...' : 'Preparing render...',
    });

    try {
      const result = await exportLipSyncVideo(
        imageElement,
        audioBuffer,
        mouthLandmarks,
        frames,
        config,
        (p) => setExportProgress(p),
        eyeLandmarks
      );

      setExportedVideoUrl(result.url);
      setExportedFilename(result.filename);
      setNoticeMessage({
        text: isTh ? 'สร้างวิดีโอสำเร็จพร้อมให้ดาวน์โหลด!' : 'Lip-sync video generated successfully!',
        type: 'success',
      });
      setTimeout(() => setNoticeMessage(null), 4000);
    } catch (err: unknown) {
      setNoticeMessage({
        text: isTh ? 'เกิดข้อผิดพลาดในการสร้างวิดีโอ กรุณาลองใหม่อีกครั้ง' : 'Export failed. Please try again.',
        type: 'error',
      });
      setTimeout(() => setNoticeMessage(null), 4000);
      console.error(err);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Download snapshot of current frame
  const handleDownloadSnapshot = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `lalamu_frame_${currentFrameIndex}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Current Frame stats
  const currentFrameData = frames[currentFrameIndex];
  const currentAperture = currentFrameData ? Math.round(currentFrameData.aperture * 100) : 0;
  const currentTimeSec = (currentFrameIndex / config.fps).toFixed(2);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
      {/* Top Header & CTAs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs ring-1 ring-amber-500/30">
            3 & 4
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm sm:text-base">
              {isTh ? 'พรีวิว & ประมวลผลวิดีโอ (Studio Preview & Export)' : 'Studio Preview & Export'}
            </h3>
            <p className="text-xs text-zinc-400">
              {isTh
                ? 'กด "เริ่ม Lip Sync" เพื่อคำนวณปากขยับ และกด "Export วิดีโอ" เพื่อดาวน์โหลด'
                : 'Click "Start Lip Sync" to compute frames, then "Export Video"'}
            </p>
          </div>
        </div>

        {/* In-app Notification Banner */}
        {noticeMessage && (
          <div
            className={`w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs font-medium transition animate-in fade-in slide-in-from-top-2 duration-200 ${
              noticeMessage.type === 'error'
                ? 'border-red-500/40 bg-red-500/10 text-red-300'
                : noticeMessage.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {noticeMessage.type === 'error' ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              )}
              <span>{noticeMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNoticeMessage(null)}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Settings button */}
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              showConfig
                ? 'border-amber-400 bg-amber-500 text-zinc-950 font-bold'
                : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isTh ? 'ตั้งค่าการขยับ' : 'Settings'}</span>
          </button>

          {/* Primary Step 3: Start Lip Sync Button */}
          <button
            type="button"
            onClick={onGenerateLipSync}
            disabled={!imageElement || !audioBuffer || isGenerating}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-zinc-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>
              {isGenerating
                ? isTh
                  ? 'กำลังประมวลผล...'
                  : 'Processing...'
                : isTh
                ? '🚀 เริ่ม Lip Sync'
                : '🚀 Start Lip Sync'}
            </span>
          </button>

          {/* Primary Step 4: Export Video Button */}
          <button
            type="button"
            onClick={handleExport}
            disabled={!isGenerated || isExporting}
            className="flex items-center gap-2 rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-700 hover:border-amber-400/50 disabled:opacity-40 transition"
          >
            <Video className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">{isTh ? '🎬 Export วิดีโอ' : '🎬 Export Video'}</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showConfig && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3.5 text-xs">
          <div>
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
              <span>{isTh ? 'ความกว้างการอ้าปาก' : 'Intensity'}</span>
              <span className="text-amber-400 font-mono">{config.intensity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.2"
              step="0.1"
              value={config.intensity}
              onChange={(e) => onChangeConfig({ ...config, intensity: Number(e.target.value) })}
              className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
              <span>{isTh ? 'การขยับคาง/ขากรรไกร' : 'Jaw Shift'}</span>
              <span className="text-amber-400 font-mono">
                {config.jawDisplacement <= 0.05
                  ? isTh
                    ? '0 (คางอยู่นิ่ง)'
                    : '0 (Fixed chin)'
                  : `${config.jawDisplacement.toFixed(1)}x`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.1"
              value={config.jawDisplacement}
              onChange={(e) =>
                onChangeConfig({ ...config, jawDisplacement: Number(e.target.value) })
              }
              className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
              <span>{isTh ? 'เฟรมเรต (FPS)' : 'Target FPS'}</span>
              <span className="text-amber-400 font-mono">{config.fps} fps</span>
            </div>
            <div className="flex gap-1">
              {[24, 30, 60].map((fps) => (
                <button
                  key={fps}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, fps })}
                  className={`flex-1 rounded py-1 text-[11px] font-mono font-semibold transition ${
                    config.fps === fps ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {fps}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center gap-1.5">
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 text-[11px]">
              <input
                type="checkbox"
                checked={config.enableTeeth}
                onChange={(e) => onChangeConfig({ ...config, enableTeeth: e.target.checked })}
                className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
              />
              <span>{isTh ? 'แสดงฟัน & ลิ้นในปาก' : 'Render Teeth & Cavity'}</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 text-[11px]">
              <input
                type="checkbox"
                checked={config.enableBlink !== false && (eyeLandmarks?.enabled ?? true)}
                onChange={(e) => {
                  const val = e.target.checked;
                  onChangeConfig({ ...config, enableBlink: val });
                  if (eyeLandmarks && onChangeEyeLandmarks) {
                    onChangeEyeLandmarks({ ...eyeLandmarks, enabled: val });
                  }
                }}
                className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
              />
              <span>{isTh ? '👁️ ดวงตากระพริบ (Eye Blinking)' : '👁️ Eye Blinking'}</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 text-[11px]">
              <input
                type="checkbox"
                checked={config.enableIdleMotion}
                onChange={(e) =>
                  onChangeConfig({ ...config, enableIdleMotion: e.target.checked })
                }
                className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
              />
              <span>{isTh ? 'ขยับคอ/ศีรษะ (Head & Neck Motion)' : 'Head & Neck Motion'}</span>
            </label>
          </div>
        </div>
      )}

      {/* Interactive Mouse Placement & Blinking Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-950/90 border border-zinc-800 px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Mouse Edit Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !mouseEditMode;
              setMouseEditMode(next);
              if (setShowLandmarks) setShowLandmarks(next);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition shadow-sm ${
              mouseEditMode
                ? 'bg-amber-500 text-zinc-950 shadow-amber-500/20'
                : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white border border-zinc-700'
            }`}
          >
            <MousePointer className="h-3.5 w-3.5" />
            <span>{isTh ? '🖱️ วางตำแหน่งด้วยเมาส์' : '🖱️ Mouse Placement'}</span>
          </button>

          {/* Tool selection chips */}
          {(mouseEditMode || showLandmarks) && (
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setActiveTool('mouth')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                  activeTool === 'mouth'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={isTh ? 'คลิกหรือลากเพื่อย้ายปาก' : 'Move mouth'}
              >
                👄 {isTh ? 'ปาก' : 'Mouth'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('leftEye')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                  activeTool === 'leftEye'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={isTh ? 'คลิกหรือลากเพื่อวางตาซ้าย' : 'Move left eye'}
              >
                👁️ {isTh ? 'ตาซ้าย' : 'Left Eye'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('rightEye')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                  activeTool === 'rightEye'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={isTh ? 'คลิกหรือลากเพื่อวางตาขวา' : 'Move right eye'}
              >
                👁️ {isTh ? 'ตาขวา' : 'Right Eye'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('chin')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                  activeTool === 'chin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={isTh ? 'คลิกหรือลากจุดคาง' : 'Move chin'}
              >
                ↕️ {isTh ? 'คาง' : 'Chin'}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tri-Scale Toggle Button */}
          <button
            type="button"
            onClick={() => onChangeConfig({ ...config, showTriScale: !config.showTriScale })}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition border shadow-sm ${
              config.showTriScale
                ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400'
                : 'bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700'
            }`}
            title={isTh ? 'เปิด/ปิด ตรีสเกล (เส้นวัด 3 ส่วนของใบหน้าและไม้บรรทัดพิกัด)' : 'Toggle Tri-Scale facial canon grid'}
          >
            <Ruler className="h-3.5 w-3.5" />
            <span>{isTh ? '📐 ตรีสเกล' : '📐 Tri-Scale'}</span>
          </button>

          {/* Seamless Lip Blend Toggle */}
          <button
            type="button"
            onClick={() => onChangeConfig({ ...config, seamlessBlend: !config.seamlessBlend })}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition border shadow-sm ${
              config.seamlessBlend !== false
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
            title={isTh ? 'เปิด/ปิด การวางปากเนียนไร้รอยต่อ (Feather Blending)' : 'Toggle Seamless Edge Blending'}
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>{isTh ? '✨ ผสานเนียน' : '✨ Blend'}</span>
          </button>

          {/* Blink Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 text-xs select-none">
            <input
              type="checkbox"
              checked={config.enableBlink !== false && (eyeLandmarks?.enabled ?? true)}
              onChange={(e) => {
                const val = e.target.checked;
                onChangeConfig({ ...config, enableBlink: val });
                if (eyeLandmarks && onChangeEyeLandmarks) {
                  onChangeEyeLandmarks({ ...eyeLandmarks, enabled: val });
                }
              }}
              className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
            />
            <span className="font-medium">{isTh ? '👁️ ดวงตากระพริบ' : '👁️ Blinking'}</span>
          </label>

          {/* Test Blink Button */}
          <button
            type="button"
            onClick={handleTriggerBlink}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition active:scale-95"
            title={isTh ? 'ทดสอบการกระพริบตาของตัวละครทันที' : 'Test blink now'}
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>{isTh ? '⚡ ทดสอบกระพริบตา' : 'Test Blink'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-black min-h-[380px] sm:min-h-[460px]">
        {imageElement ? (
          <div
            className={`relative flex w-full items-center justify-center p-2 overflow-hidden transition-all duration-300 ${
              viewMode === 'expand' ? 'max-h-[640px]' : 'max-h-[500px]'
            }`}
          >
            {/* Top-Left Tri-Scale HUD Indicator */}
            {config.showTriScale && (
              <div className="absolute top-3 left-3 z-30 flex items-center gap-2 rounded-xl bg-zinc-950/90 px-3 py-1.5 backdrop-blur-md border border-amber-500/40 text-[11px] text-amber-300 shadow-xl select-none font-mono">
                <Ruler className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold text-amber-300">
                  {isTh ? '📐 ตรีสเกล' : 'Tri-Scale'}:
                </span>
                <span className="text-zinc-300">
                  X:{mouthLandmarks.x.toFixed(1)}% Y:{mouthLandmarks.y.toFixed(1)}%
                </span>
                <span className="text-amber-400/80">
                  (ทองคำ 68%)
                </span>
                <span className="text-emerald-400 border-l border-zinc-800 pl-1.5">
                  ขอบเนียน: {mouthLandmarks.feather ?? config.lipFeather ?? 3.5}px
                </span>
              </div>
            )}

            {/* Viewport Fit & Scale Bar (Top Right) */}
            <div className="absolute top-3 right-3 z-30 flex items-center gap-1 rounded-xl bg-zinc-950/85 p-1 backdrop-blur-md border border-zinc-800/90 text-[11px] text-zinc-300 shadow-xl select-none">
              <span className="hidden sm:inline px-1 text-zinc-500 font-medium text-[10px]">
                {isTh ? 'ขนาดภาพ:' : 'Size:'}
              </span>
              <button
                type="button"
                onClick={() => setViewMode('fit')}
                className={`px-2 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                  viewMode === 'fit'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={isTh ? 'พอดีรูปต้นฉบับ 100%' : 'Fit original image'}
              >
                <span>📐</span>
                <span>{isTh ? 'พอดีรูป (Fit)' : 'Fit'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('face')}
                className={`px-2 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                  viewMode === 'face'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={isTh ? 'ซูมโฟกัสใบหน้า' : 'Focus face'}
              >
                <span>🔍</span>
                <span>{isTh ? 'โฟกัสหน้า (1.4x)' : 'Focus (1.4x)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('expand')}
                className={`px-2 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                  viewMode === 'expand'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={isTh ? 'ขยายเต็มกรอบการทำงาน' : 'Expand full canvas'}
              >
                <span>➕</span>
                <span>{isTh ? 'ขยายใหญ่' : 'Expand'}</span>
              </button>
            </div>

            <canvas
              ref={canvasRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerLeave}
              onTouchStart={(e) => {
                e.preventDefault();
                handlePointerDown(e);
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                handlePointerMove(e);
              }}
              onTouchEnd={handlePointerUp}
              onTouchCancel={handlePointerUp}
              style={{
                transform: viewMode === 'face' ? 'scale(1.36)' : 'scale(1)',
                transformOrigin: `${mouthLandmarks.x}% ${Math.max(10, mouthLandmarks.y - 12)}%`,
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className={`max-w-full rounded-xl object-contain shadow-2xl select-none touch-none transition-[max-height] duration-300 ${
                viewMode === 'expand' ? 'max-h-[600px]' : 'max-h-[480px]'
              }`}
            />

            {/* Mouse Mode Interactive Guide Bar */}
            {(mouseEditMode || showLandmarks) && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-zinc-950/90 border border-amber-500/40 px-3.5 py-1 text-[11px] text-amber-300 shadow-xl backdrop-blur-md z-20 pointer-events-none select-none">
                <span>
                  🎯 {isTh ? 'คลิกหรือลากบนใบหน้าเพื่อวางตำแหน่งปาก/ตาได้อิสระ (ลากมุมเพื่อปรับขนาด)' : 'Click or drag freely to position mouth & eyes'}
                </span>
                {dragState && (
                  <span className="bg-amber-500 text-zinc-950 font-bold px-1.5 py-0.5 rounded text-[10px]">
                    {dragState.target.includes('eye')
                      ? isTh ? 'กำลังลากดวงตา' : 'Moving eye'
                      : dragState.target === 'chin'
                      ? isTh ? 'กำลังปรับคาง' : 'Moving chin'
                      : isTh ? 'กำลังลากปาก' : 'Moving mouth'}
                  </span>
                )}
              </div>
            )}

            {/* Live Stats Overlay badge (Top Left) */}
            <div className="absolute top-4 left-4 flex flex-col gap-1 rounded-xl bg-zinc-950/80 p-2.5 backdrop-blur-md border border-zinc-800/80 text-[11px] font-mono text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">FRAME:</span>
                <span className="text-amber-400 font-bold">
                  {currentFrameIndex} / {Math.max(1, totalFrames - 1)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">TIME:</span>
                <span>{currentTimeSec}s</span>
                <span className="text-zinc-500">/ {duration.toFixed(1)}s</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">MOUTH:</span>
                <span className={currentAperture > 15 ? 'text-green-400 font-bold' : 'text-zinc-400'}>
                  {currentAperture}% open
                </span>
              </div>
            </div>

            {/* Speaking State Indicator (Top Right) */}
            {isGenerated && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-zinc-950/80 px-3 py-1 text-xs border border-zinc-800 backdrop-blur-md">
                <div
                  className={`h-2 w-2 rounded-full ${
                    currentAperture > 10 ? 'bg-green-500 animate-ping' : 'bg-zinc-600'
                  }`}
                />
                <span className={currentAperture > 10 ? 'text-green-400 font-semibold' : 'text-zinc-400'}>
                  {currentAperture > 10
                    ? isTh
                      ? 'กำลังพูด'
                      : 'Speaking'
                    : isTh
                    ? 'เงียบ / ปิดปาก'
                    : 'Mouth Closed'}
                </span>
              </div>
            )}

            {/* Snapshot button (Bottom Right) */}
            <button
              type="button"
              onClick={handleDownloadSnapshot}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white backdrop-blur-md transition"
              title={isTh ? 'บันทึกรูปเฟรมปัจจุบัน' : 'Save current frame'}
            >
              <Camera className="h-3.5 w-3.5 text-amber-400" />
              <span>PNG</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500">
            <Video className="h-12 w-12 mb-3 text-zinc-700" />
            <p className="text-sm font-semibold text-zinc-300">
              {isTh ? 'รอการเลือกรูปภาพและไฟล์เสียง' : 'Ready for Image & Audio'}
            </p>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm">
              {isTh
                ? 'เลือกรูปภาพใบหน้าในขั้นตอนที่ 1 และเลือกไฟล์เสียงในขั้นตอนที่ 2 เพื่อเริ่มสร้าง Lip Sync'
                : 'Select a face in Step 1 and audio in Step 2 to generate talking portrait'}
            </p>
          </div>
        )}
      </div>

      {/* Frame Scrubber & Playback Controls Bar */}
      <div className="flex flex-col gap-2 rounded-xl bg-zinc-950/70 p-3">
        {/* Timeline Scrubber */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!imageElement || !audioBuffer || !isGenerated}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:opacity-40 transition shadow"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Previous / Next Frame step buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSeek(currentFrameIndex - 1)}
              disabled={currentFrameIndex <= 0}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
              title="Previous Frame"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleSeek(currentFrameIndex + 1)}
              disabled={currentFrameIndex >= totalFrames - 1}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
              title="Next Frame"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Slider */}
          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min="0"
              max={Math.max(1, totalFrames - 1)}
              value={currentFrameIndex}
              onChange={(e) => handleSeek(Number(e.target.value))}
              disabled={!isGenerated}
              className="w-full accent-amber-400 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Loop toggle */}
          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`rounded-lg px-2 py-1 text-xs font-mono transition ${
              isLooping ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={isLooping ? 'Looping enabled' : 'Single pass'}
          >
            LOOP
          </button>
        </div>

        {/* Real-time Audio Energy / Aperture Histogram Track */}
        {isGenerated && frames.length > 0 && (
          <div className="relative h-7 w-full overflow-hidden rounded-lg bg-zinc-900/90 border border-zinc-800/80">
            <div className="absolute inset-0 flex items-end px-1 gap-[1px]">
              {frames.map((f, i) => {
                const isActive = i === currentFrameIndex;
                return (
                  <div
                    key={i}
                    onClick={() => handleSeek(i)}
                    className={`flex-1 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-amber-400 z-10'
                        : f.aperture > 0.05
                        ? 'bg-amber-600/60 hover:bg-amber-500'
                        : 'bg-zinc-800'
                    }`}
                    style={{ height: `${Math.max(10, f.aperture * 100)}%` }}
                    title={`Frame ${i}: ${(f.aperture * 100).toFixed(0)}%`}
                  />
                );
              })}
            </div>
            {/* Playhead marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none shadow"
              style={{ left: `${(currentFrameIndex / Math.max(1, totalFrames - 1)) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Export Modal / Progress Popup */}
      {isExporting && exportProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <Video className="h-7 w-7 animate-pulse" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">
              {isTh ? 'กำลังรวมเฟรมภาพและเสียง...' : 'Assembling Lip-Sync Video...'}
            </h4>
            <p className="text-xs text-zinc-400 mb-4">{exportProgress.status}</p>

            {/* Progress bar */}
            <div className="h-3 w-full rounded-full bg-zinc-800 overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-150"
                style={{ width: `${exportProgress.percent}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-xs text-zinc-500">
              <span>
                {exportProgress.currentFrame} / {exportProgress.totalFrames} frames
              </span>
              <span>{exportProgress.percent}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Export Completed Dialog */}
      {exportedVideoUrl && (
        <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-zinc-950 font-bold">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  {isTh ? 'วิดีโอถูกสร้างเรียบร้อยแล้ว!' : 'Lip-Sync Video Ready!'}
                </h4>
                <p className="text-xs text-zinc-300">
                  {exportedFilename} ({duration.toFixed(1)}s • {config.fps} FPS)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={exportedVideoUrl}
                download={exportedFilename || 'lalamu_video.mp4'}
                className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-green-400 transition shadow"
              >
                <Download className="h-4 w-4" />
                <span>{isTh ? 'ดาวน์โหลดวิดีโอ' : 'Download Video'}</span>
              </a>
              <button
                type="button"
                onClick={() => setExportedVideoUrl(null)}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:text-white"
              >
                {isTh ? 'ปิด' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
