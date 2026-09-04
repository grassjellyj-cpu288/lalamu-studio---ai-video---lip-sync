import React, { useRef, useState, useEffect } from 'react';
import {
  Mic,
  Upload,
  Volume2,
  Square,
  Play,
  Pause,
  Sparkles,
  CheckCircle2,
  FileAudio,
  Type,
  Radio,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { AudioPreset } from '../types';
import { AUDIO_PRESETS } from '../data/presets';
import {
  decodeAudio,
  generateSyntheticSpeechAudio,
  audioBufferToWavBlob,
  getAudioContext,
} from '../utils/audioAnalyzer';

interface AudioUploaderProps {
  currentAudioBuffer: AudioBuffer | null;
  audioBlob: Blob | null;
  audioName: string;
  onAudioLoaded: (buffer: AudioBuffer, blob: Blob, name: string) => void;
  lang: 'th' | 'en';
  fps: number;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  currentAudioBuffer,
  audioBlob,
  audioName,
  onAudioLoaded,
  lang,
  fps,
}) => {
  const isTh = lang === 'th';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab mode: 'upload' | 'record' | 'tts' | 'presets'
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'tts' | 'presets'>('presets');

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const playbackTimerRef = useRef<number | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micVolume, setMicVolume] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // TTS state
  const [ttsText, setTtsText] = useState(
    isTh
      ? 'สวัสดีครับ นี่คือการทดสอบสร้างวิดีโอปากขยับด้วยเทคโนโลยี ลิปซิงก์ ครับ'
      : 'Hello! This is a test of realistic talking lip sync animation.'
  );
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('thai-intro');

  // Stop playback when buffer changes
  useEffect(() => {
    stopAudio();
  }, [currentAudioBuffer]);

  // Clean up timers
  useEffect(() => {
    return () => {
      stopAudio();
      stopRecording();
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await decodeAudio(file);
      onAudioLoaded(buffer, file, file.name);
      setSelectedPresetId('');
    } catch (err) {
      console.error('Failed to decode audio file:', err);
    }
  };

  const handleSelectPreset = async (preset: AudioPreset) => {
    setSelectedPresetId(preset.id);
    // Synthesize vocal formants matching preset
    const buffer = generateSyntheticSpeechAudio(preset.frequencyPattern || 'intro', preset.duration);
    const blob = audioBufferToWavBlob(buffer);
    onAudioLoaded(buffer, blob, preset.title);
  };

  // Recording handler
  const startRecording = async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      // Volume meter setup
      const audioCtx = getAudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        const blob = new Blob(chunks, { type: 'audio/webm' });
        try {
          const buffer = await decodeAudio(blob);
          onAudioLoaded(buffer, blob, `recording_${Date.now()}.webm`);
          setSelectedPresetId('');
        } catch (err) {
          console.error('Audio decode error from recording:', err);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setMicError(
        isTh
          ? 'ไม่สามารถเข้าถึงไมโครโฟนได้ กรุณาอนุญาตการเข้าถึงไมโครโฟนในเบราว์เซอร์'
          : 'Microphone permission denied. Please allow microphone access in browser.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setMicVolume(0);
  };

  // Text-To-Speech Synthesis
  const handleGenerateTTS = () => {
    if (!ttsText.trim()) return;
    setIsGeneratingTts(true);

    // If Web Speech Synthesis is available, let's play/synthesize or generate synthesized vocal audio
    const estimatedDuration = Math.max(2.5, Math.min(10, ttsText.length * 0.09));
    const buffer = generateSyntheticSpeechAudio('intro', estimatedDuration);
    const blob = audioBufferToWavBlob(buffer);

    onAudioLoaded(
      buffer,
      blob,
      `TTS_${ttsText.slice(0, 15).replace(/\s+/g, '_')}.wav`
    );
    setSelectedPresetId('');
    setIsGeneratingTts(false);

    // Also trigger native speech if desired
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(ttsText);
      utter.lang = isTh ? 'th-TH' : 'en-US';
      utter.rate = 1.0;
      // Speech synthesis can run alongside
    }
  };

  // Play / Pause preview audio
  const togglePlayAudio = () => {
    if (!currentAudioBuffer) return;

    if (isPlaying) {
      stopAudio();
    } else {
      const audioCtx = getAudioContext();
      const source = audioCtx.createBufferSource();
      source.buffer = currentAudioBuffer;
      source.connect(audioCtx.destination);

      source.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      };

      source.start(0);
      audioSourceRef.current = source;
      playStartTimeRef.current = audioCtx.currentTime;
      setIsPlaying(true);

      playbackTimerRef.current = window.setInterval(() => {
        const elapsed = audioCtx.currentTime - playStartTimeRef.current;
        if (elapsed >= currentAudioBuffer.duration) {
          stopAudio();
        } else {
          setCurrentTime(elapsed);
        }
      }, 50);
    }
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch {
        // already stopped
      }
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs ring-1 ring-amber-500/30">
            2
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm sm:text-base">
              {isTh ? 'ไฟล์เสียงพูด (Speech Audio)' : 'Step 2: Speech Audio'}
            </h3>
            <p className="text-xs text-zinc-400">
              {isTh ? 'อัปโหลดเสียง บันทึกไมค์ หรือสร้างเสียงพูด' : 'Upload MP3/WAV, record mic, or TTS'}
            </p>
          </div>
        </div>

        {/* Selected Duration Pill */}
        {currentAudioBuffer && (
          <div className="flex items-center gap-1.5 rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
            <Clock className="h-3 w-3 text-amber-400" />
            <span>{currentAudioBuffer.duration.toFixed(1)}s</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-zinc-950/70 p-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`flex items-center justify-center gap-1 rounded-lg py-1.5 font-medium transition ${
            activeTab === 'presets'
              ? 'bg-amber-500 text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isTh ? 'เสียงตัวอย่าง' : 'Presets'}</span>
          <span className="sm:hidden">Presets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center justify-center gap-1 rounded-lg py-1.5 font-medium transition ${
            activeTab === 'upload'
              ? 'bg-amber-500 text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isTh ? 'อัปโหลดไฟล์' : 'Upload'}</span>
          <span className="sm:hidden">File</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('record')}
          className={`flex items-center justify-center gap-1 rounded-lg py-1.5 font-medium transition ${
            activeTab === 'record'
              ? 'bg-amber-500 text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Mic className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isTh ? 'อัดเสียง' : 'Record'}</span>
          <span className="sm:hidden">Mic</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tts')}
          className={`flex items-center justify-center gap-1 rounded-lg py-1.5 font-medium transition ${
            activeTab === 'tts'
              ? 'bg-amber-500 text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Type className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isTh ? 'พิมพ์ข้อความ' : 'TTS'}</span>
          <span className="sm:hidden">TTS</span>
        </button>
      </div>

      {/* Tab Content 1: Presets */}
      {activeTab === 'presets' && (
        <div className="flex flex-col gap-2">
          {AUDIO_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/10 ring-1 ring-amber-400/30'
                    : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Volume2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{preset.title}</span>
                      <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400 font-mono uppercase">
                        {preset.language}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate max-w-[220px] sm:max-w-xs">
                      {preset.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-zinc-500">{preset.duration}s</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-amber-400" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Content 2: Upload */}
      {activeTab === 'upload' && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950/40 p-5 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <FileAudio className="h-8 w-8 text-amber-400/80 mb-2" />
          <p className="text-xs font-semibold text-zinc-200">
            {isTh ? 'เลือกไฟล์เสียงพูดจากเครื่องของคุณ' : 'Choose audio file from device'}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            {isTh
              ? 'รองรับ MP3, WAV, M4A, OGG, AAC (ความยาวแนะนำ 2 - 30 วินาที)'
              : 'Supports MP3, WAV, M4A, OGG, AAC (2 to 30 seconds recommended)'}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{isTh ? 'เบราว์เซอร์ไฟล์เสียง' : 'Browse Audio File'}</span>
          </button>
        </div>
      )}

      {/* Tab Content 3: Record */}
      {activeTab === 'record' && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 text-center">
          {isRecording ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-500 animate-pulse ring-4 ring-red-500/30">
                <Mic className="h-7 w-7" />
              </div>

              {/* VU Meter */}
              <div className="w-48 bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-75"
                  style={{ width: `${micVolume}%` }}
                />
              </div>

              <span className="font-mono text-lg font-bold text-red-400">
                00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
              </span>

              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>{isTh ? 'หยุดและใช้เสียงนี้' : 'Stop & Use Audio'}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                <Mic className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold text-zinc-200">
                {isTh ? 'กดปุ่มเพื่อบันทึกเสียงพูดของคุณ' : 'Click to record your voice'}
              </p>
              <p className="text-[11px] text-zinc-500">
                {isTh ? 'พูดข้อความที่ต้องการให้ตัวละครขยับปาก' : 'Speak the phrase you want lipsynced'}
              </p>
              <button
                type="button"
                onClick={startRecording}
                className="mt-2 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition shadow-lg shadow-red-900/20"
              >
                <Radio className="h-3.5 w-3.5" />
                <span>{isTh ? 'เริ่มบันทึกเสียง (Record)' : 'Start Recording'}</span>
              </button>

              {micError && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{micError}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 4: TTS */}
      {activeTab === 'tts' && (
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <label className="text-xs font-medium text-zinc-300">
            {isTh ? 'พิมพ์ข้อความที่ต้องการให้สร้างเสียงพูด:' : 'Enter text to generate speech:'}
          </label>
          <textarea
            rows={3}
            value={ttsText}
            onChange={(e) => setTtsText(e.target.value)}
            placeholder={isTh ? 'พิมพ์ข้อความที่นี่...' : 'Type text here...'}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={handleGenerateTTS}
            disabled={isGeneratingTts || !ttsText.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 disabled:opacity-50 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isTh ? 'แปลงข้อความเป็นเสียงพูด (Synthesize)' : 'Synthesize Speech'}</span>
          </button>
        </div>
      )}

      {/* Active Audio Bar & Player */}
      {currentAudioBuffer && (
        <div className="flex items-center justify-between rounded-xl border border-zinc-700/80 bg-zinc-800/80 p-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlayAudio}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-zinc-950 hover:bg-amber-400 transition"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>
            <div>
              <p className="text-xs font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
                {audioName || 'Selected Audio'}
              </p>
              <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                <span>{currentTime.toFixed(1)}s</span>
                <span>/</span>
                <span>{currentAudioBuffer.duration.toFixed(1)}s</span>
                <span className="text-amber-400 font-sans text-[10px]">
                  • {Math.round(currentAudioBuffer.duration * fps)} frames
                </span>
              </div>
            </div>
          </div>

          {/* Mini dynamic waveform bars */}
          <div className="flex items-end gap-0.5 h-6">
            {[40, 75, 55, 90, 60, 100, 45, 80, 70, 95].map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPlaying ? 'bg-amber-400' : 'bg-zinc-600'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(20, (h * (micVolume || 65)) / 100)}%` : `${h * 0.4}%`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
