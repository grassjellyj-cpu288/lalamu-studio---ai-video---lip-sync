import React, { useRef, useState, useEffect } from 'react';
import {
  Upload,
  Camera,
  Crosshair,
  Sliders,
  CheckCircle2,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  User,
  Eye,
  Crop,
  ZoomIn,
  ZoomOut,
  Move,
  Check,
  X,
} from 'lucide-react';
import { AvatarPreset, MouthLandmarks, EyeLandmarks, LipSyncConfig, FaceDetectionResult } from '../types';
import { AVATAR_PRESETS } from '../data/presets';
import { detectFaceAndMouthLandmarks } from '../utils/faceDetectionAlgorithm';
import {
  Cpu,
  Binary,
  Ruler,
  Compass,
  SlidersHorizontal,
  Wand2,
} from 'lucide-react';

interface FaceUploaderProps {
  selectedPreset: AvatarPreset | null;
  currentImageUrl?: string;
  onSelectPreset: (preset: AvatarPreset) => void;
  onCustomImageUpload: (imageFile: File, imageUrl: string) => void;
  mouthLandmarks: MouthLandmarks;
  onChangeMouthLandmarks: (landmarks: MouthLandmarks) => void;
  eyeLandmarks?: EyeLandmarks;
  onChangeEyeLandmarks?: (eyes: EyeLandmarks) => void;
  showLandmarks: boolean;
  setShowLandmarks: (show: boolean) => void;
  config?: LipSyncConfig;
  onChangeConfig?: (config: LipSyncConfig) => void;
  lang: 'th' | 'en';
}

export const FaceUploader: React.FC<FaceUploaderProps> = ({
  selectedPreset,
  currentImageUrl,
  onSelectPreset,
  onCustomImageUpload,
  mouthLandmarks,
  onChangeMouthLandmarks,
  eyeLandmarks,
  onChangeEyeLandmarks,
  showLandmarks,
  setShowLandmarks,
  config,
  onChangeConfig,
  lang,
}) => {
  const isTh = lang === 'th';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationTab, setCalibrationTab] = useState<'mouth' | 'scale-numeric' | 'blend' | 'eyes'>('scale-numeric');
  const [activeCategory, setActiveCategory] = useState<'cartoon' | 'all' | 'photoreal'>('cartoon');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Auto-detection state
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);
  const [detectionConfidence, setDetectionConfidence] = useState<number | null>(null);

  // Image Framing / Fit & Crop state
  const [showFitModal, setShowFitModal] = useState(false);
  const [fitZoom, setFitZoom] = useState(1.0);
  const [fitPanX, setFitPanX] = useState(0); // -40% to 40%
  const [fitPanY, setFitPanY] = useState(0); // -40% to 40%
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);

  const handleApplyFittedCrop = () => {
    const activeUrl = currentImageUrl || selectedPreset?.imageUrl;
    if (!activeUrl) return;

    setIsProcessingCrop(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const targetSize = 1024;
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, targetSize, targetSize);

        const baseW = img.naturalWidth || 640;
        const baseH = img.naturalHeight || 640;
        const minDim = Math.min(baseW, baseH);

        const cropW = minDim / fitZoom;
        const cropH = minDim / fitZoom;

        const centerX = baseW * 0.5 + (fitPanX / 100) * baseW;
        const centerY = baseH * 0.5 + (fitPanY / 100) * baseH;

        const srcX = Math.max(0, Math.min(baseW - cropW, centerX - cropW / 2));
        const srcY = Math.max(0, Math.min(baseH - cropH, centerY - cropH / 2));

        ctx.drawImage(img, srcX, srcY, cropW, cropH, 0, 0, targetSize, targetSize);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `avatar_fitted_${Date.now()}.jpg`, { type: 'image/jpeg' });
              const url = URL.createObjectURL(blob);
              onCustomImageUpload(file, url);
              onChangeMouthLandmarks({
                x: 50,
                y: 67,
                width: 18,
                height: 9,
                chinY: 81,
              });
              if (onChangeEyeLandmarks) {
                onChangeEyeLandmarks({
                  enabled: true,
                  blinkInterval: 3.2,
                  leftEye: { x: 37, y: 46, radiusX: 6.5, radiusY: 7.5 },
                  rightEye: { x: 63, y: 46, radiusX: 6.5, radiusY: 7.5 },
                });
              }
              setShowFitModal(false);
            }
            setIsProcessingCrop(false);
          },
          'image/jpeg',
          0.95
        );
      } catch (e) {
        console.error('Crop error', e);
        setIsProcessingCrop(false);
      }
    };
    img.onerror = () => {
      setIsProcessingCrop(false);
    };
    img.src = activeUrl;
  };

  const filteredPresets = AVATAR_PRESETS.filter((preset) => {
    if (activeCategory === 'cartoon') {
      return preset.category === 'cartoon' || preset.category === 'anime' || preset.styleType === 'cartoon';
    }
    if (activeCategory === 'photoreal') {
      return preset.category === 'photoreal' || preset.category === 'artistic';
    }
    return true;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onCustomImageUpload(file, url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      onCustomImageUpload(file, url);
    }
  };

  // Camera handling
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 720 }, height: { ideal: 720 }, facingMode: 'user' },
      });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err: unknown) {
      setCameraError(
        isTh ? 'ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง' : 'Camera permission denied.'
      );
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `snap_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        onCustomImageUpload(file, url);
        stopCamera();
      }
    }, 'image/jpeg');
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  // Clean up camera hardware if component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Computer Vision & Tri-Scale Facial Landmark Algorithm
  const handleRunMouthDetection = async () => {
    const targetUrl = currentImageUrl || selectedPreset?.imageUrl;
    if (!targetUrl) return;

    setIsDetecting(true);
    setDetectionMessage(
      isTh
        ? '⚡ กำลังวิเคราะห์สัดส่วนใบหน้าด้วยอัลกอริทึม & ตรีสเกล...'
        : 'Analyzing facial features & Rule-of-Thirds tri-scale...'
    );

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = targetUrl;
      await new Promise((resolve, reject) => {
        if (img.complete && img.naturalWidth > 0) resolve(true);
        else {
          img.onload = () => resolve(true);
          img.onerror = reject;
        }
      });

      const result = await detectFaceAndMouthLandmarks(img);

      onChangeMouthLandmarks(result.mouth);
      if (result.eyes && onChangeEyeLandmarks) {
        onChangeEyeLandmarks(result.eyes);
      }
      setShowLandmarks(true);
      setIsCalibrating(true);
      setDetectionConfidence(result.confidence);

      // Also enable Tri-Scale in config if available
      if (config && onChangeConfig && !config.showTriScale) {
        onChangeConfig({ ...config, showTriScale: true });
      }

      setDetectionMessage(
        isTh
          ? `คำนวณสำเร็จ! ตรวจพบตำแหน่งปากที่ X: ${result.mouth.x}%, Y: ${result.mouth.y}% (ความกว้าง ${result.mouth.width}%, ความแม่นยำ ${result.confidence}%)`
          : `Mouth detected at X: ${result.mouth.x}%, Y: ${result.mouth.y}% (Width: ${result.mouth.width}%, Confidence: ${result.confidence}%)`
      );
      setTimeout(() => setDetectionMessage(null), 8000);
    } catch (err) {
      console.error('Detection error:', err);
      setDetectionMessage(
        isTh ? '⚠️ ไม่สามารถตรวจจับอัตโนมัติได้ กรุณาปรับตำแหน่งด้วยตนเอง' : 'Auto-detection failed, please adjust manually'
      );
      setTimeout(() => setDetectionMessage(null), 5000);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleAutoCalibrate = () => {
    if (selectedPreset) {
      onChangeMouthLandmarks(selectedPreset.defaultMouthBox);
      if (selectedPreset.defaultEyes && onChangeEyeLandmarks) {
        onChangeEyeLandmarks(selectedPreset.defaultEyes);
      }
    } else {
      onChangeMouthLandmarks({
        x: 50,
        y: 65,
        width: 20,
        height: 11,
        chinY: 80,
      });
      if (onChangeEyeLandmarks) {
        onChangeEyeLandmarks({
          enabled: true,
          blinkInterval: 3.2,
          leftEye: { x: 38, y: 44, radiusX: 6.5, radiusY: 7.5 },
          rightEye: { x: 62, y: 44, radiusX: 6.5, radiusY: 7.5 },
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs ring-1 ring-amber-500/30">
            1
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm sm:text-base">
              {isTh ? 'รูปภาพใบหน้า (Face Image)' : 'Step 1: Face Portrait'}
            </h3>
            <p className="text-xs text-zinc-400">
              {isTh ? 'เลือกรูปภาพใบหน้า หรืออัปโหลดรูปภาพของคุณ' : 'Choose preset or upload your photo'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-detect mouth using algorithm */}
          <button
            type="button"
            onClick={handleRunMouthDetection}
            disabled={isDetecting}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all shadow-sm ${
              isDetecting
                ? 'border-amber-500 bg-amber-500/20 text-amber-300 animate-pulse'
                : 'border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400'
            }`}
            title={isTh ? 'คำนวณตำแหน่งปากอัตโนมัติด้วยอัลกอริทึม Computer Vision & ตรีสเกล' : 'Auto-detect mouth with algorithm'}
          >
            <Cpu className="h-3.5 w-3.5 text-amber-400" />
            <span>{isDetecting ? (isTh ? 'กำลังคำนวณ...' : 'Analyzing...') : (isTh ? '⚡ คำนวณปากอัตโนมัติ' : '⚡ Auto-Detect')}</span>
          </button>

          {/* Tri-Scale Toggle Button */}
          {config && onChangeConfig && (
            <button
              type="button"
              onClick={() => onChangeConfig({ ...config, showTriScale: !config.showTriScale })}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all border ${
                config.showTriScale
                  ? 'border-amber-500 bg-amber-500 text-zinc-950 font-bold'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white'
              }`}
              title={isTh ? 'เปิด/ปิด ตรีสเกล (สเกล 3 ส่วนใบหน้า & ไม้บรรทัดพิกัด)' : 'Toggle Tri-Scale Rulers'}
            >
              <Ruler className="h-3.5 w-3.5" />
              <span>{isTh ? '📐 ตรีสเกล' : '📐 Tri-Scale'}</span>
            </button>
          )}

          {/* Fit & Crop Button */}
          <button
            type="button"
            onClick={() => setShowFitModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors shadow-sm"
            title={isTh ? 'ปรับขนาดและสัดส่วนภาพให้พอดีกับโปรแกรม' : 'Fit & Crop Image'}
          >
            <Crop className="h-3.5 w-3.5 text-amber-400" />
            <span>{isTh ? 'ปรับขนาดให้พอดี' : 'Fit Image'}</span>
          </button>

          {/* Calibration Toggle */}
          <button
            type="button"
            onClick={() => setIsCalibrating(!isCalibrating)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isCalibrating
                ? 'bg-amber-500 text-zinc-950 font-semibold'
                : 'border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
            title={isTh ? 'ปรับตำแหน่งปากและคาง' : 'Calibrate Mouth Box'}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{isTh ? 'ปรับตำแหน่งปาก' : 'Calibrate'}</span>
          </button>
        </div>
      </div>

      {/* Detection status message */}
      {detectionMessage && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-300 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
            <span>{detectionMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setDetectionMessage(null)}
            className="text-amber-400/70 hover:text-white text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Category Tabs & Suitability Note */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveCategory('cartoon')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                activeCategory === 'cartoon'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🎨</span>
              <span>{isTh ? 'การ์ตูน / อนิเมะ' : 'Cartoon & Anime'}</span>
              <span className="text-[10px] ml-0.5 px-1 py-0.2 rounded bg-amber-600/30 text-zinc-900 font-semibold">
                {isTh ? 'แนะนำ' : 'Best'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('photoreal')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                activeCategory === 'photoreal'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>📸</span>
              <span>{isTh ? 'ภาพถ่ายคนจริง' : 'Real Photo'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-2 py-1 rounded-md transition-all font-medium ${
                activeCategory === 'all'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>{isTh ? 'ทั้งหมด' : 'All'}</span>
            </button>
          </div>

          <span className="text-[11px] text-zinc-500">{filteredPresets.length} presets</span>
        </div>

        {/* Highlight Why Cartoon is Best */}
        {activeCategory === 'cartoon' && (
          <div className="mb-2.5 flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-300">
            <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
            <span>
              {isTh
                ? 'รูปการ์ตูนและอนิเมะเหมาะกับงาน Lip Sync ที่สุด เพราะขยับปากได้ลื่นไหล มีชีวิตชีวา และไม่ติด Uncanny Valley'
                : 'Cartoon and anime characters are optimal for lip-sync: expressive, vibrant mouth movements with zero uncanny valley.'}
            </span>
          </div>
        )}

        {/* Preset Face Thumbnails */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {filteredPresets.map((preset) => {
            const isSelected = selectedPreset?.id === preset.id;
            const isCartoon = preset.styleType === 'cartoon' || preset.category === 'cartoon' || preset.category === 'anime';
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`group relative aspect-square overflow-hidden rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/40'
                    : 'border-zinc-800 hover:border-zinc-600 bg-zinc-950'
                }`}
              >
                <img
                  src={preset.imageUrl}
                  alt={preset.name}
                  crossOrigin="anonymous"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {isSelected && (
                  <div className="absolute top-1 right-1 rounded-full bg-amber-500 p-0.5 text-zinc-950 shadow z-10">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                )}
                {isCartoon && (
                  <div className="absolute top-1 left-1 rounded bg-black/60 backdrop-blur-xs px-1 py-0.2 text-[9px] font-semibold text-amber-300">
                    {preset.category === 'anime' ? '2D' : '3D'}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1 text-center">
                  <span className="truncate block text-[10px] font-medium text-white">
                    {preset.name.split(' ')[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload or Camera Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950/40 p-4 transition-colors hover:border-amber-500/50"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700 hover:text-white"
          >
            <Upload className="h-4 w-4 text-amber-400" />
            <span>{isTh ? 'อัปโหลดรูปภาพ' : 'Upload Image'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFitModal(true)}
            className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
          >
            <Crop className="h-4 w-4 text-amber-400" />
            <span>{isTh ? '📐 ปรับขนาดรูปให้พอดี' : 'Fit & Crop'}</span>
          </button>

          <span className="hidden sm:inline text-xs text-zinc-500">{isTh ? 'หรือ' : 'or'}</span>

          <button
            type="button"
            onClick={startCamera}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            <Camera className="h-4 w-4 text-zinc-400" />
            <span>{isTh ? 'ถ่ายภาพด้วยกล้อง' : 'Snap Photo'}</span>
          </button>
        </div>

        <p className="mt-2 text-center text-[11px] text-zinc-500">
          {isTh
            ? 'รองรับไฟล์ JPG, PNG, WEBP (ภาพหน้าตรงความคมชัดสูงจะให้ผลลัพธ์ดีที่สุด)'
            : 'Supports JPG, PNG, WEBP (Front-facing portrait gives best results)'}
        </p>
      </div>

      {/* Interactive Calibration Panel */}
      {isCalibrating && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1 p-0.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <button
                type="button"
                onClick={() => setCalibrationTab('scale-numeric')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                  calibrationTab === 'scale-numeric'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={isTh ? 'ใส่ตัวเลขตามสเกลแบบละเอียด และเปิดใช้ตรีสเกล 3 ส่วน' : 'Tri-Scale & Precision Numeric Inputs'}
              >
                <Ruler className="h-3 w-3" />
                <span>{isTh ? '📐 ตรีสเกล & ป้อนตัวเลขละเอียด' : 'Tri-Scale & Numbers'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCalibrationTab('blend')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                  calibrationTab === 'blend'
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={isTh ? 'ตั้งค่าการวางปากให้เนียนไปกับรูปภาพ เบลอขอบ และมุมเอียง' : 'Seamless Edge Feather & Blend'}
              >
                <Sparkles className="h-3 w-3" />
                <span>{isTh ? '✨ วางปากเนียนไปกับรูป' : 'Seamless Blend'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCalibrationTab('mouth')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                  calibrationTab === 'mouth'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>👄</span>
                <span>{isTh ? 'สไลเดอร์ตำแหน่งปาก' : 'Mouth Sliders'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCalibrationTab('eyes')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                  calibrationTab === 'eyes'
                    ? 'bg-cyan-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>👁️</span>
                <span>{isTh ? 'ตา & กะพริบ' : 'Eyes & Blink'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={showLandmarks}
                  onChange={(e) => setShowLandmarks(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                />
                <span>{isTh ? 'แสดง Marks' : 'Show Marks'}</span>
              </label>
              <button
                type="button"
                onClick={handleAutoCalibrate}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
              >
                <RotateCcw className="h-3 w-3" />
                <span>{isTh ? 'รีเซ็ต' : 'Reset'}</span>
              </button>
            </div>
          </div>

          {/* TAB 1: TRI-SCALE & COMPLEX NUMERIC INPUTS */}
          {calibrationTab === 'scale-numeric' && (
            <div className="space-y-3.5">
              {/* Tri-Scale Switch & Guide Card */}
              <div className="rounded-lg bg-zinc-950/80 p-2.5 border border-amber-500/20">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-amber-400" />
                    <div>
                      <div className="font-semibold text-zinc-200 text-xs">
                        {isTh ? '📐 ระบบตรีสเกลกายวิภาคใบหน้า (Tri-Scale Canon & Rulers)' : 'Tri-Scale Canon System'}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {isTh ? 'แบ่งสัดส่วนใบหน้า 3 ส่วนตามหลักสรีระศาสตร์เพื่อวางปากได้สมดุลแม่นยำ' : 'Rule-of-Thirds facial anatomical ratio'}
                      </div>
                    </div>
                  </div>

                  {config && onChangeConfig && (
                    <label className="flex items-center gap-2 cursor-pointer bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-md">
                      <input
                        type="checkbox"
                        checked={config.showTriScale}
                        onChange={(e) => onChangeConfig({ ...config, showTriScale: e.target.checked })}
                        className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-[11px] font-semibold text-amber-300">
                        {config.showTriScale ? (isTh ? 'เปิดตรีสเกลอยู่' : 'Tri-Scale Active') : (isTh ? 'เปิดใช้ตรีสเกล' : 'Enable Tri-Scale')}
                      </span>
                    </label>
                  )}
                </div>

                {/* 3 Zones visual breakdown */}
                <div className="grid grid-cols-3 gap-2 mt-2 text-center text-[10px]">
                  <div className="p-1.5 rounded bg-sky-950/40 border border-sky-800/40 text-sky-300">
                    <div className="font-bold">1/3 ส่วนบน (0-33%)</div>
                    <div className="text-zinc-400 text-[9px]">หน้าผาก - แนวกึ่งกลางคิ้ว</div>
                  </div>
                  <div className="p-1.5 rounded bg-orange-950/40 border border-orange-800/40 text-orange-300">
                    <div className="font-bold">2/3 ส่วนกลาง (33-67%)</div>
                    <div className="text-zinc-400 text-[9px]">แนวคิ้ว - ฐานใต้จมูก</div>
                  </div>
                  <div className="p-1.5 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300">
                    <div className="font-bold">3/3 ส่วนล่าง (67-100%)</div>
                    <div className="text-zinc-400 text-[9px]">🎯 ปากสัดส่วนทองคำ ~68%</div>
                  </div>
                </div>
              </div>

              {/* Complex Numeric Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Position X (แนวนอน %) */}
                <div className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-amber-400">
                      {isTh ? '📍 พิกัด X (แนวนอน %)' : 'Position X (%)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, x: 50.0 })}
                      className="text-[10px] px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 rounded"
                    >
                      🎯 กึ่งกลาง 50%
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, x: Math.max(5, Math.round((mouthLandmarks.x - 1) * 10) / 10) })}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs"
                    >
                      -1%
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, x: Math.max(5, Math.round((mouthLandmarks.x - 0.1) * 10) / 10) })}
                      className="px-1.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs"
                    >
                      -0.1
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      min="5"
                      max="95"
                      value={mouthLandmarks.x}
                      onChange={(e) => onChangeMouthLandmarks({ ...mouthLandmarks, x: Number(e.target.value) })}
                      className="w-full text-center bg-zinc-900 border border-zinc-700 rounded py-1 px-1 font-mono font-bold text-amber-400 text-xs focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, x: Math.min(95, Math.round((mouthLandmarks.x + 0.1) * 10) / 10) })}
                      className="px-1.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs"
                    >
                      +0.1
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, x: Math.min(95, Math.round((mouthLandmarks.x + 1) * 10) / 10) })}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs"
                    >
                      +1%
                    </button>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="0.1"
                    value={mouthLandmarks.x}
                    onChange={(e) => onChangeMouthLandmarks({ ...mouthLandmarks, x: Number(e.target.value) })}
                    className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded cursor-pointer"
                  />
                </div>

                {/* Position Y (แนวตั้ง %) */}
                <div className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-amber-400">
                      {isTh ? '📍 พิกัด Y (แนวตั้ง %)' : 'Position Y (%)'}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, y: 65.0 })}
                        className="text-[10px] px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                      >
                        65%
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, y: 68.0 })}
                        className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded"
                      >
                        📐 68% สัดส่วนทองคำ
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, y: Math.max(15, Math.round((mouthLandmarks.y - 1) * 10) / 10) })}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs"
                    >
                      -1%
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, y: Math.max(15, Math.round((mouthLandmarks.y - 0.1) * 10) / 10) })}
                      className="px-1.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs"
                    >
                      -0.1
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      min="20"
                      max="90"
                      value={mouthLandmarks.y}
                      onChange={(e) => onChangeMouthLandmarks({ ...mouthLandmarks, y: Number(e.target.value) })}
                      className="w-full text-center bg-zinc-900 border border-zinc-700 rounded py-1 px-1 font-mono font-bold text-amber-400 text-xs focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, y: Math.min(90, Math.round((mouthLandmarks.y + 0.1) * 10) / 10) })}
                      className="px-1.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs"
                    >
                      +0.1
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, y: Math.min(90, Math.round((mouthLandmarks.y + 1) * 10) / 10) })}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs"
                    >
                      +1%
                    </button>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="88"
                    step="0.1"
                    value={mouthLandmarks.y}
                    onChange={(e) => onChangeMouthLandmarks({ ...mouthLandmarks, y: Number(e.target.value) })}
                    className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded cursor-pointer"
                  />
                </div>

                {/* Mouth Width W (%) */}
                <div className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-zinc-200">
                      {isTh ? '↔️ ความกว้างปาก W (%)' : 'Mouth Width (%)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, width: 20.0 })}
                      className="text-[10px] px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                    >
                      20% แนะนำ
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, width: Math.max(5, Math.round((mouthLandmarks.width - 1) * 10) / 10) })}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs"
                    >
                      -1%
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      min="5"
                      max="55"
                      value={mouthLandmarks.width}
                      onChange={(e) => onChangeMouthLandmarks({ ...mouthLandmarks, width: Number(e.target.value) })}
                      className="w-full text-center bg-zinc-900 border border-zinc-700 rounded py-1 px-1 font-mono font-bold text-amber-400 text-xs focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, width: Math.min(55, Math.round((mouthLandmarks.width + 1) * 10) / 10) })}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs"
                    >
                      +1%
                    </button>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="50"
                    step="0.1"
                    value={mouthLandmarks.width}
                    onChange={(e) => onChangeMouthLandmarks({ ...mouthLandmarks, width: Number(e.target.value) })}
                    className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded cursor-pointer"
                  />
                </div>

                {/* Mouth Height H (%) */}
                <div className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-zinc-200">
                      {isTh ? '↕️ ความสูงช่องปาก H (%)' : 'Mouth Height (%)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, height: 11.0 })}
                      className="text-[10px] px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                    >
                      11% แนะนำ
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, height: Math.max(3, Math.round((mouthLandmarks.height - 0.5) * 10) / 10) })}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs"
                    >
                      -0.5
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      min="3"
                      max="30"
                      value={mouthLandmarks.height}
                      onChange={(e) => onChangeMouthLandmarks({ ...mouthLandmarks, height: Number(e.target.value) })}
                      className="w-full text-center bg-zinc-900 border border-zinc-700 rounded py-1 px-1 font-mono font-bold text-amber-400 text-xs focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, height: Math.min(30, Math.round((mouthLandmarks.height + 0.5) * 10) / 10) })}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs"
                    >
                      +0.5
                    </button>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="28"
                    step="0.1"
                    value={mouthLandmarks.height}
                    onChange={(e) => onChangeMouthLandmarks({ ...mouthLandmarks, height: Number(e.target.value) })}
                    className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Chin Anchor Level */}
              <div className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-zinc-200">
                    {isTh ? '⚓ ระดับจุดยึดคาง (Chin / Jaw Level %)' : 'Chin / Jaw Level (%)'}
                  </span>
                  <div className="flex items-center gap-1 text-zinc-400 text-[11px]">
                    <button
                      type="button"
                      onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, chinY: 80.0 })}
                      className="text-[10px] px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                    >
                      80% คาง
                    </button>
                    <span className="font-mono text-amber-400 font-bold">{mouthLandmarks.chinY}%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="55"
                  max="98"
                  step="0.5"
                  value={mouthLandmarks.chinY}
                  onChange={(e) => onChangeMouthLandmarks({ ...mouthLandmarks, chinY: Number(e.target.value) })}
                  className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 2: SEAMLESS BLEND & LIP FEATHERING */}
          {calibrationTab === 'blend' && (
            <div className="space-y-3.5">
              <div className="rounded-lg bg-zinc-950/80 p-3 border border-emerald-500/20">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-zinc-200 text-xs">
                        {isTh ? '✨ การวางปากเนียนไปกับรูป (Seamless Edge Blending)' : 'Seamless Edge Blending'}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {isTh ? 'เบลอฟุ้งขอบปากและไล่ระดับแสงเงาแบบ Alpha Feathering ให้กลมกลืนเป็นเนื้อเดียวกับภาพ' : 'Soft radial feathering for natural lip integration'}
                      </div>
                    </div>
                  </div>

                  {config && onChangeConfig && (
                    <label className="flex items-center gap-2 cursor-pointer bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-md">
                      <input
                        type="checkbox"
                        checked={config.seamlessBlend !== false}
                        onChange={(e) => onChangeConfig({ ...config, seamlessBlend: e.target.checked })}
                        className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-[11px] font-semibold text-emerald-300">
                        {config.seamlessBlend !== false ? (isTh ? 'เปิดผสานเนียนอยู่' : 'Blending Active') : (isTh ? 'ปิดผสาน' : 'Disabled')}
                      </span>
                    </label>
                  )}
                </div>

                {/* Lip Feather Slider */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-zinc-200 font-medium">
                      {isTh ? 'ความฟุ้งเบลอขอบปาก (Lip Feather)' : 'Edge Feathering'}
                    </span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {(mouthLandmarks.feather ?? config?.lipFeather ?? 3.5).toFixed(1)} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={mouthLandmarks.feather ?? config?.lipFeather ?? 3.5}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onChangeMouthLandmarks({ ...mouthLandmarks, feather: val });
                      if (config && onChangeConfig) {
                        onChangeConfig({ ...config, lipFeather: val });
                      }
                    }}
                    className="w-full accent-emerald-400 h-1.5 bg-zinc-800 rounded cursor-pointer"
                  />

                  {/* Feather Presets */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {[
                      { label: isTh ? 'คมชัดการ์ตูน (1.5px)' : 'Crisp Anime (1.5px)', val: 1.5 },
                      { label: isTh ? 'เนียนธรรมชาติ (3.5px)' : 'Natural (3.5px)', val: 3.5 },
                      { label: isTh ? 'ฟุ้งละมุนพิเศษ (6.0px)' : 'Soft Cinematic (6.0px)', val: 6.0 },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => {
                          onChangeMouthLandmarks({ ...mouthLandmarks, feather: p.val });
                          if (config && onChangeConfig) onChangeConfig({ ...config, lipFeather: p.val });
                        }}
                        className={`flex-1 text-[10px] py-1 rounded font-medium transition ${
                          (mouthLandmarks.feather ?? config?.lipFeather ?? 3.5) === p.val
                            ? 'bg-emerald-500 text-zinc-950 font-bold'
                            : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tilt Angle (องศาการเอียงปาก) */}
                <div className="mt-4 pt-3 border-t border-zinc-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-zinc-200 font-medium">
                      {isTh ? 'องศาการเอียงปาก (Face Tilt Angle)' : 'Mouth Angle (Degrees)'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onChangeMouthLandmarks({ ...mouthLandmarks, angle: 0 })}
                        className="text-[10px] px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                      >
                        0° ตรง
                      </button>
                      <span className="text-emerald-400 font-mono font-bold">
                        {(mouthLandmarks.angle ?? 0).toFixed(1)}°
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-15"
                    max="15"
                    step="0.5"
                    value={mouthLandmarks.angle ?? 0}
                    onChange={(e) =>
                      onChangeMouthLandmarks({ ...mouthLandmarks, angle: Number(e.target.value) })
                    }
                    className="w-full accent-emerald-400 h-1.5 bg-zinc-800 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>-15° (เอียงซ้าย)</span>
                    <span>0° (ตรง)</span>
                    <span>+15° (เอียงขวา)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRADITIONAL MOUTH SLIDERS */}
          {calibrationTab === 'mouth' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>{isTh ? 'ตำแหน่ง X (แนวนอน)' : 'Position X'}</span>
                  <span>{Math.round(mouthLandmarks.x)}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={mouthLandmarks.x}
                  onChange={(e) =>
                    onChangeMouthLandmarks({ ...mouthLandmarks, x: Number(e.target.value) })
                  }
                  className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>{isTh ? 'ตำแหน่ง Y (แนวตั้ง)' : 'Position Y'}</span>
                  <span>{Math.round(mouthLandmarks.y)}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="85"
                  value={mouthLandmarks.y}
                  onChange={(e) =>
                    onChangeMouthLandmarks({ ...mouthLandmarks, y: Number(e.target.value) })
                  }
                  className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>{isTh ? 'ความกว้างปาก' : 'Mouth Width'}</span>
                  <span>{Math.round(mouthLandmarks.width)}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={mouthLandmarks.width}
                  onChange={(e) =>
                    onChangeMouthLandmarks({ ...mouthLandmarks, width: Number(e.target.value) })
                  }
                  className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>{isTh ? 'ความสูงปาก' : 'Mouth Height'}</span>
                  <span>{Math.round(mouthLandmarks.height)}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={mouthLandmarks.height}
                  onChange={(e) =>
                    onChangeMouthLandmarks({ ...mouthLandmarks, height: Number(e.target.value) })
                  }
                  className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="col-span-2">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>{isTh ? 'ตำแหน่งจุดคาง (Chin Anchor)' : 'Chin / Jaw Anchor'}</span>
                  <span>{Math.round(mouthLandmarks.chinY)}%</span>
                </div>
                <input
                  type="range"
                  min="55"
                  max="95"
                  value={mouthLandmarks.chinY}
                  onChange={(e) =>
                    onChangeMouthLandmarks({ ...mouthLandmarks, chinY: Number(e.target.value) })
                  }
                  className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 4: EYES & BLINKING */}
          {calibrationTab === 'eyes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-200 font-medium">
                  <input
                    type="checkbox"
                    checked={eyeLandmarks?.enabled ?? true}
                    onChange={(e) => {
                      if (onChangeEyeLandmarks && eyeLandmarks) {
                        onChangeEyeLandmarks({ ...eyeLandmarks, enabled: e.target.checked });
                      }
                    }}
                    className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>{isTh ? 'เปิดระบบดวงตากระพริบ (Blinking System)' : 'Enable Eye Blinking'}</span>
                </label>

                {eyeLandmarks && (
                  <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                    <span>{isTh ? 'ความถี่:' : 'Interval:'}</span>
                    <span className="text-cyan-400 font-mono">
                      {(eyeLandmarks.blinkInterval ?? 3.2).toFixed(1)}s
                    </span>
                  </div>
                )}
              </div>

              {eyeLandmarks && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Left Eye */}
                  <div className="rounded-lg bg-zinc-950/60 p-2 border border-zinc-800/80">
                    <div className="text-[11px] font-semibold text-cyan-400 mb-1.5 flex items-center gap-1">
                      <span>👁️</span>
                      <span>{isTh ? 'ตาซ้าย (Left Eye)' : 'Left Eye'}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-400">
                          <span>X: {Math.round(eyeLandmarks.leftEye.x)}%</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="85"
                          value={eyeLandmarks.leftEye.x}
                          onChange={(e) =>
                            onChangeEyeLandmarks?.({
                              ...eyeLandmarks,
                              leftEye: { ...eyeLandmarks.leftEye, x: Number(e.target.value) },
                            })
                          }
                          className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-400">
                          <span>Y: {Math.round(eyeLandmarks.leftEye.y)}%</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="75"
                          value={eyeLandmarks.leftEye.y}
                          onChange={(e) =>
                            onChangeEyeLandmarks?.({
                              ...eyeLandmarks,
                              leftEye: { ...eyeLandmarks.leftEye, y: Number(e.target.value) },
                            })
                          }
                          className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Eye */}
                  <div className="rounded-lg bg-zinc-950/60 p-2 border border-zinc-800/80">
                    <div className="text-[11px] font-semibold text-cyan-400 mb-1.5 flex items-center gap-1">
                      <span>👁️</span>
                      <span>{isTh ? 'ตาขวา (Right Eye)' : 'Right Eye'}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-400">
                          <span>X: {Math.round(eyeLandmarks.rightEye.x)}%</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="85"
                          value={eyeLandmarks.rightEye.x}
                          onChange={(e) =>
                            onChangeEyeLandmarks?.({
                              ...eyeLandmarks,
                              rightEye: { ...eyeLandmarks.rightEye, x: Number(e.target.value) },
                            })
                          }
                          className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-400">
                          <span>Y: {Math.round(eyeLandmarks.rightEye.y)}%</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="75"
                          value={eyeLandmarks.rightEye.y}
                          onChange={(e) =>
                            onChangeEyeLandmarks?.({
                              ...eyeLandmarks,
                              rightEye: { ...eyeLandmarks.rightEye, y: Number(e.target.value) },
                            })
                          }
                          className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Eye Size */}
                  <div className="col-span-2">
                    <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                      <span>{isTh ? 'ขนาดดวงตา / รัศมีเปลือกตา' : 'Eye Radius'}</span>
                      <span className="text-cyan-400 font-mono">
                        {Math.round(eyeLandmarks.leftEye.radiusX)}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="15"
                      step="0.5"
                      value={eyeLandmarks.leftEye.radiusX}
                      onChange={(e) => {
                        const r = Number(e.target.value);
                        onChangeEyeLandmarks?.({
                          ...eyeLandmarks,
                          leftEye: { ...eyeLandmarks.leftEye, radiusX: r, radiusY: r * 1.15 },
                          rightEye: { ...eyeLandmarks.rightEye, radiusX: r, radiusY: r * 1.15 },
                        });
                      }}
                      className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Quick Notice */}
          <div className="mt-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80 p-2 text-[11px] text-zinc-400 flex items-center gap-1.5">
            <span>🖱️</span>
            <span>
              {isTh
                ? 'เคล็ดลับ: สามารถคลิกปุ่ม "🖱️ วางตำแหน่งด้วยเมาส์" บนจอสตูดิโอด้านล่าง เพื่อคลิกหรือลากปากและตาได้อย่างอิสระ!'
                : 'Tip: Click "🖱️ Mouse Placement" on the Studio monitor below to freely drag mouth and eyes!'}
            </span>
          </div>
        </div>
      )}

      {/* Webcam Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <h4 className="font-semibold text-white mb-2">
              {isTh ? 'ถ่ายภาพใบหน้าของคุณ' : 'Capture Portrait'}
            </h4>
            {cameraError ? (
              <p className="text-red-400 text-xs py-4">{cameraError}</p>
            ) : (
              <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="h-48 w-40 rounded-full border border-amber-400/50" />
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={stopCamera}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                {isTh ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={captureCameraPhoto}
                disabled={!!cameraError}
                className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
              >
                {isTh ? 'ถ่ายภาพ' : 'Capture'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fit & Crop Image Modal */}
      {showFitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Crop className="h-5 w-5 text-amber-400" />
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    {isTh ? '📐 ปรับขนาดและจัดกรอบรูปภาพให้พอดี' : 'Crop & Fit Image to Frame'}
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    {isTh ? 'ปรับซูมและเลื่อนตำแหน่งใบหน้าให้อยู่กึ่งกลางพอดีกับโปรแกรม' : 'Center and zoom face to fit standard studio frame'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFitModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Framing Canvas Preview */}
            <div className="relative aspect-square w-full max-w-[290px] mx-auto overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 flex items-center justify-center shadow-inner">
              {(currentImageUrl || selectedPreset?.imageUrl) ? (
                <div className="relative h-full w-full overflow-hidden flex items-center justify-center select-none">
                  <img
                    src={currentImageUrl || selectedPreset?.imageUrl}
                    alt="Crop preview"
                    className="h-full w-full object-cover transition-transform duration-75"
                    style={{
                      transform: `scale(${fitZoom}) translate(${fitPanX}%, ${fitPanY}%)`,
                      transformOrigin: 'center center',
                    }}
                  />
                  {/* Studio Framing Guide Overlay */}
                  <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-amber-400/60 rounded-xl flex flex-col items-center justify-center">
                    {/* Face oval guide */}
                    <div className="h-44 w-36 rounded-full border border-amber-400/50 bg-amber-400/5" />
                    {/* Lips region guide */}
                    <div className="absolute top-[65%] w-16 h-8 rounded-full border border-amber-300/60 border-dashed" />
                    {/* Eyes line guide */}
                    <div className="absolute top-[44%] w-32 border-t border-cyan-400/50" />
                    {/* Center Crosshair */}
                    <div className="absolute top-1/2 left-0 right-0 border-t border-zinc-500/20" />
                    <div className="absolute left-1/2 top-0 bottom-0 border-l border-zinc-500/20" />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">{isTh ? 'ไม่มีรูปภาพที่เลือก' : 'No image loaded'}</p>
              )}
            </div>

            {/* Quick Presets */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFitZoom(1.45);
                  setFitPanX(0);
                  setFitPanY(-12);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition"
              >
                <span>🎯 {isTh ? 'โฟกัสใบหน้า (Face 1.45x)' : 'Focus Face'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFitZoom(1.0);
                  setFitPanX(0);
                  setFitPanY(0);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-700 hover:text-white transition"
              >
                <span>🔄 {isTh ? 'พอดีรูปเดิม (Reset)' : 'Reset Fit'}</span>
              </button>
            </div>

            {/* Sliders */}
            <div className="space-y-2.5 text-xs bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span className="flex items-center gap-1 text-zinc-300 font-medium">
                    <ZoomIn className="h-3.5 w-3.5 text-amber-400" />
                    {isTh ? 'ระดับการซูม (Zoom)' : 'Zoom Level'}:
                  </span>
                  <span className="text-amber-400 font-mono font-bold">{fitZoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={fitZoom}
                  onChange={(e) => setFitZoom(Number(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>{isTh ? 'เลื่อนซ้าย-ขวา (X)' : 'Pan X'}:</span>
                    <span className="text-zinc-200 font-mono">{fitPanX}%</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    step="1"
                    value={fitPanX}
                    onChange={(e) => setFitPanX(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>{isTh ? 'เลื่อนบน-ล่าง (Y)' : 'Pan Y'}:</span>
                    <span className="text-zinc-200 font-mono">{fitPanY}%</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    step="1"
                    value={fitPanY}
                    onChange={(e) => setFitPanY(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowFitModal(false)}
                className="rounded-lg border border-zinc-700 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition"
              >
                {isTh ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleApplyFittedCrop}
                disabled={isProcessingCrop}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition disabled:opacity-50 shadow-md"
              >
                <Check className="h-4 w-4" />
                <span>
                  {isProcessingCrop
                    ? (isTh ? 'กำลังประมวลผล...' : 'Processing...')
                    : (isTh ? 'บันทึกและใช้ขนาดนี้' : 'Apply & Fit Image')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
