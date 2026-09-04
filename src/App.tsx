/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { FaceUploader } from './components/FaceUploader';
import { AudioUploader } from './components/AudioUploader';
import { StudioPlayer } from './components/StudioPlayer';
import { EthicsNotice } from './components/EthicsNotice';
import { PythonProjectModal } from './components/PythonProjectModal';
import { AvatarPreset, MouthLandmarks, LipSyncConfig, FrameEnergyData, EyeLandmarks, BackgroundConfig } from './types';
import { AVATAR_PRESETS, AUDIO_PRESETS } from './data/presets';
import { BackgroundSelector } from './components/BackgroundSelector';
import {
  decodeAudio,
  extractAudioEnergyCurve,
  generateSyntheticSpeechAudio,
  audioBufferToWavBlob,
} from './utils/audioAnalyzer';

export default function App() {
  const [lang, setLang] = useState<'th' | 'en'>('th');
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  // Avatar & Image state
  const [selectedPreset, setSelectedPreset] = useState<AvatarPreset | null>(AVATAR_PRESETS[0]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(AVATAR_PRESETS[0].imageUrl);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [mouthLandmarks, setMouthLandmarks] = useState<MouthLandmarks>(
    AVATAR_PRESETS[0].defaultMouthBox
  );
  const [eyeLandmarks, setEyeLandmarks] = useState<EyeLandmarks>(
    AVATAR_PRESETS[0].defaultEyes || {
      enabled: true,
      blinkInterval: 3.2,
      leftEye: { x: 38, y: 46, radiusX: 6.5, radiusY: 7.5 },
      rightEye: { x: 62, y: 46, radiusX: 6.5, radiusY: 7.5 },
    }
  );
  const [showLandmarks, setShowLandmarks] = useState(false);

  // Background Customization & PC Upload state
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>({
    enabled: false,
    selectedPresetId: 'original',
    type: 'original',
    color: '#18181b',
    blur: 0,
    brightness: 100,
    keyingMode: 'auto',
    tolerance: 30,
    feather: 6,
    keyColor: '#00FF00',
    characterScale: 1.0,
    characterPositionX: 0,
    characterPositionY: 0,
  });

  // Audio state
  const [currentAudioBuffer, setCurrentAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioName, setAudioName] = useState<string>(AUDIO_PRESETS[0].title);

  // Lip-Sync Generation state (คางและคอไม่ขยับ - Chin and Neck stationary)
  const [config, setConfig] = useState<LipSyncConfig>({
    fps: 30,
    intensity: 1.0,
    smoothness: 0.35,
    openThreshold: 0.03,
    enableTeeth: true,
    enableIdleMotion: false, // คอและศีรษะไม่ขยับ (Neck stays still)
    jawDisplacement: 0, // คางไม่ขยับ (Chin locked in place)
    enableBlink: true,
    blinkInterval: 3.2,
    mouthStyle: 'realistic-3d', // ปากขยับแบบ 3D ยิ้มเห็นฟันเรียงสวยเหมือนในรูป
    showLowerTeeth: true,
    lipGloss: true,
    smileCurve: 3,
    seamlessBlend: true,
    lipFeather: 4,
  });

  const [frames, setFrames] = useState<FrameEnergyData[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load initial preset image
  useEffect(() => {
    loadImageFromUrl(AVATAR_PRESETS[0].imageUrl);
  }, []);

  // Load initial preset audio
  useEffect(() => {
    loadInitialAudio();
  }, []);

  const loadImageFromUrl = (url: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
    };
    img.src = url;
  };

  const loadInitialAudio = async () => {
    try {
      const defaultPreset = AUDIO_PRESETS[0];
      const buffer = generateSyntheticSpeechAudio('intro', defaultPreset.duration);
      const blob = audioBufferToWavBlob(buffer);
      setCurrentAudioBuffer(buffer);
      setAudioBlob(blob);
      setAudioName(defaultPreset.title);

      // Auto-compute initial lip sync frames so app is immediately alive
      const analysis = extractAudioEnergyCurve(
        buffer,
        config.fps,
        config.smoothness,
        config.openThreshold
      );
      setFrames(analysis.frames);
      setIsGenerated(true);
    } catch (err) {
      console.error('Initial audio loading error:', err);
    }
  };

  // Handlers for Step 1
  const handleSelectPresetAvatar = (preset: AvatarPreset) => {
    setSelectedPreset(preset);
    setCurrentImageUrl(preset.imageUrl);
    setMouthLandmarks(preset.defaultMouthBox);
    if (preset.defaultEyes) {
      setEyeLandmarks(preset.defaultEyes);
    } else {
      setEyeLandmarks({
        enabled: true,
        blinkInterval: 3.2,
        leftEye: { x: preset.defaultMouthBox.x - 12, y: preset.defaultMouthBox.y - 21, radiusX: 6.5, radiusY: 7.5 },
        rightEye: { x: preset.defaultMouthBox.x + 12, y: preset.defaultMouthBox.y - 21, radiusX: 6.5, radiusY: 7.5 },
      });
    }
    loadImageFromUrl(preset.imageUrl);
  };

  const handleCustomImageUpload = (_file: File, url: string) => {
    setSelectedPreset(null);
    setCurrentImageUrl(url);
    loadImageFromUrl(url);
    // Reset to sensible default mouth & eye positions for custom portrait
    setMouthLandmarks({
      x: 50,
      y: 65,
      width: 20,
      height: 11,
      chinY: 80,
    });
    setEyeLandmarks({
      enabled: true,
      blinkInterval: 3.2,
      leftEye: { x: 38, y: 44, radiusX: 6.5, radiusY: 7.5 },
      rightEye: { x: 62, y: 44, radiusX: 6.5, radiusY: 7.5 },
    });
  };

  // Handlers for Step 2
  const handleAudioLoaded = (buffer: AudioBuffer, blob: Blob, name: string) => {
    setCurrentAudioBuffer(buffer);
    setAudioBlob(blob);
    setAudioName(name);

    // Auto-extract energy frames for the newly loaded audio
    const analysis = extractAudioEnergyCurve(
      buffer,
      config.fps,
      config.smoothness,
      config.openThreshold
    );
    setFrames(analysis.frames);
    setIsGenerated(true);
  };

  // Step 3: Start Lip Sync Generation
  const handleGenerateLipSync = () => {
    if (!currentAudioBuffer) return;

    setIsGenerating(true);
    // Simulate short computation step for UX feedback
    setTimeout(() => {
      const analysis = extractAudioEnergyCurve(
        currentAudioBuffer,
        config.fps,
        config.smoothness,
        config.openThreshold
      );
      setFrames(analysis.frames);
      setIsGenerated(true);
      setIsGenerating(false);
    }, 450);
  };

  // Update frames when config parameters change
  const handleChangeConfig = (newConfig: LipSyncConfig) => {
    setConfig(newConfig);
    if (currentAudioBuffer) {
      const analysis = extractAudioEnergyCurve(
        currentAudioBuffer,
        newConfig.fps,
        newConfig.smoothness,
        newConfig.openThreshold
      );
      setFrames(analysis.frames);
    }
  };

  const handleResetStudio = () => {
    handleSelectPresetAvatar(AVATAR_PRESETS[0]);
    loadInitialAudio();
    setBackgroundConfig({
      enabled: false,
      selectedPresetId: 'original',
      type: 'original',
      color: '#18181b',
      blur: 0,
      brightness: 100,
      keyingMode: 'auto',
      tolerance: 30,
      feather: 6,
      keyColor: '#00FF00',
      characterScale: 1.0,
      characterPositionX: 0,
      characterPositionY: 0,
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Studio Header */}
      <Header
        lang={lang}
        setLang={setLang}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onReset={handleResetStudio}
        isProcessing={isGenerating}
      />

      {/* Main Studio Body */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6">
        {/* Top Hero Banner / Introduction */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                🎬 LALAMU STUDIO
              </span>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                AI Lip-Sync
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              {lang === 'th'
                ? 'เลือกรูปการ์ตูน / อนิเมะ เปลี่ยนฉากหลัง หรืออัปโหลดรูปจาก PC + เสียงพากย์ แล้วสร้างและเซฟเป็นไฟล์วิดีโอ (MP4/WebM)'
                : 'Select cartoon/anime character, customize backgrounds or upload from PC + speech audio, and export as video.'}
            </p>
          </div>

          {/* Quick Steps Navigation Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
            <span className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-zinc-300">
              <span className="text-amber-400 font-bold mr-1">1.</span>
              {lang === 'th' ? 'รูปการ์ตูน' : 'Character'}
            </span>
            <span className="text-zinc-600">&rarr;</span>
            <span className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-zinc-300">
              <span className="text-violet-400 font-bold mr-1">2.</span>
              {lang === 'th' ? 'ฉากหลัง / PC' : 'Background / PC'}
            </span>
            <span className="text-zinc-600">&rarr;</span>
            <span className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-zinc-300">
              <span className="text-amber-400 font-bold mr-1">3.</span>
              {lang === 'th' ? 'เสียงพากย์' : 'Audio'}
            </span>
            <span className="text-zinc-600">&rarr;</span>
            <span className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-amber-300 font-semibold">
              <span className="text-amber-400 font-bold mr-1">4.</span>
              {lang === 'th' ? 'Lip Sync & เซฟวิดีโอ' : 'Sync & Save Video'}
            </span>
          </div>
        </div>

        {/* 2-Column Setup: Step 1 (Face) + Step 2 (Audio) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Step 1: Face Upload / Presets (Left Side) */}
          <FaceUploader
            selectedPreset={selectedPreset}
            currentImageUrl={currentImageUrl}
            onSelectPreset={handleSelectPresetAvatar}
            onCustomImageUpload={handleCustomImageUpload}
            mouthLandmarks={mouthLandmarks}
            onChangeMouthLandmarks={setMouthLandmarks}
            eyeLandmarks={eyeLandmarks}
            onChangeEyeLandmarks={setEyeLandmarks}
            showLandmarks={showLandmarks}
            setShowLandmarks={setShowLandmarks}
            config={config}
            onChangeConfig={setConfig}
            lang={lang}
          />

          {/* Step 2: Audio Upload / Presets / Mic / TTS (Right Side) */}
          <AudioUploader
            currentAudioBuffer={currentAudioBuffer}
            audioBlob={audioBlob}
            audioName={audioName}
            onAudioLoaded={handleAudioLoaded}
            lang={lang}
            fps={config.fps}
          />
        </div>

        {/* Step 2.5: Custom Background Selector & PC Image Upload */}
        <BackgroundSelector
          config={backgroundConfig}
          onChangeConfig={setBackgroundConfig}
          lang={lang}
        />

        {/* Step 3 & 4: Main Studio Monitor & Video Exporter */}
        <StudioPlayer
          imageElement={imageElement}
          audioBuffer={currentAudioBuffer}
          mouthLandmarks={mouthLandmarks}
          onChangeMouthLandmarks={setMouthLandmarks}
          eyeLandmarks={eyeLandmarks}
          onChangeEyeLandmarks={setEyeLandmarks}
          frames={frames}
          isGenerated={isGenerated}
          onGenerateLipSync={handleGenerateLipSync}
          isGenerating={isGenerating}
          config={config}
          onChangeConfig={handleChangeConfig}
          showLandmarks={showLandmarks}
          setShowLandmarks={setShowLandmarks}
          lang={lang}
          backgroundConfig={backgroundConfig}
          onChangeBackgroundConfig={setBackgroundConfig}
        />

        {/* Information & Ethical Usage Safeguards */}
        <EthicsNotice lang={lang} />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-5 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>🎬 LALAMU STUDIO — AI Video & Lip Sync Prototype</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsCodeModalOpen(true)}
              className="text-amber-400 hover:underline"
            >
              {lang === 'th' ? 'ดูโครงสร้างโปรเจกต์ Python' : 'View Python Project'}
            </button>
            <span>•</span>
            <span>Image Warping + Audio RMS Energy Engine</span>
          </div>
        </div>
      </footer>

      {/* Python Source Code Modal */}
      <PythonProjectModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
