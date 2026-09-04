import { MouthLandmarks, LipSyncConfig, FrameEnergyData, EyeLandmarks } from '../types';
import { renderLipSyncFrame } from './lipsyncRenderer';
import { getAudioContext } from './audioAnalyzer';

export interface ExportProgress {
  percent: number;
  currentFrame: number;
  totalFrames: number;
  status: string;
}

/**
 * Exports lip-sync video by rendering every frame into a canvas stream
 * combined with the decoded audio buffer via Web Audio API + MediaRecorder.
 */
export async function exportLipSyncVideo(
  image: HTMLImageElement,
  audioBuffer: AudioBuffer,
  mouth: MouthLandmarks,
  frames: FrameEnergyData[],
  config: LipSyncConfig,
  onProgress: (progress: ExportProgress) => void,
  eyes?: EyeLandmarks
): Promise<{ blob: Blob; url: string; filename: string; mimeType: string }> {
  const fps = config.fps || 30;
  const totalFrames = frames.length;
  const duration = audioBuffer.duration;

  // Setup offscreen render canvas
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || 640;
  canvas.height = image.naturalHeight || 640;

  // Limit max dimensions to avoid memory issues (e.g. max 1080p)
  if (canvas.width > 1280 || canvas.height > 1280) {
    const scale = Math.min(1280 / canvas.width, 1280 / canvas.height);
    canvas.width = Math.round(canvas.width * scale);
    canvas.height = Math.round(canvas.height * scale);
  }

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Could not initialize 2D canvas context');

  // Determine supported mime type
  const mimeTypes = [
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  let selectedMimeType = 'video/webm';
  for (const mt of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mt)) {
      selectedMimeType = mt;
      break;
    }
  }

  // Setup Audio Context & Source Stream
  const audioCtx = getAudioContext();
  if (audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
    } catch (err) {
      console.warn('Could not resume audio context for export:', err);
    }
  }

  const audioSource = audioCtx.createBufferSource();
  audioSource.buffer = audioBuffer;

  const audioDest = audioCtx.createMediaStreamDestination();
  audioSource.connect(audioDest);

  // Setup Canvas Stream
  const canvasStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioDest.stream.getAudioTracks(),
  ]);

  const recorderOptions: MediaRecorderOptions = {};
  if (selectedMimeType) {
    recorderOptions.mimeType = selectedMimeType;
  }
  try {
    recorderOptions.videoBitsPerSecond = 3_500_000;
  } catch {}

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(combinedStream, recorderOptions);
  } catch {
    recorder = new MediaRecorder(combinedStream);
  }

  const recordedChunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  return new Promise((resolve, reject) => {
    recorder.onerror = (e) => {
      try {
        audioSource.stop();
      } catch {}
      reject(new Error(`MediaRecorder error: ${e}`));
    };

    recorder.onstop = () => {
      try {
        audioSource.stop();
      } catch {}
      const blob = new Blob(recordedChunks, { type: selectedMimeType });
      const url = URL.createObjectURL(blob);
      const isMp4 = selectedMimeType.includes('mp4');
      const filename = `lalamu_lipsync_${Date.now()}.${isMp4 ? 'mp4' : 'webm'}`;
      resolve({ blob, url, filename, mimeType: selectedMimeType });
    };

    // Start recorder
    recorder.start(100);
    audioSource.start(0);

    const frameIntervalMs = 1000 / fps;
    let currentFrame = 0;
    const startTime = performance.now();

    function renderNext() {
      if (currentFrame >= totalFrames) {
        onProgress({
          percent: 100,
          currentFrame: totalFrames,
          totalFrames,
          status: 'Finalizing video stream...',
        });

        setTimeout(() => {
          try {
            audioSource.stop();
          } catch {
            // Already ended
          }
          if (recorder.state !== 'inactive') {
            try {
              recorder.stop();
            } catch {}
          }
        }, 200);
        return;
      }

      try {
        const frameData = frames[currentFrame];
        const timeSec = frameData ? frameData.time : currentFrame / fps;
        const aperture = frameData ? frameData.aperture : 0;

        // Render frame
        renderLipSyncFrame(ctx!, image, mouth, aperture, config, timeSec, false, eyes);

        currentFrame++;
        const percent = Math.min(99, Math.round((currentFrame / totalFrames) * 100));

        if (currentFrame % 5 === 0 || currentFrame === totalFrames) {
          onProgress({
            percent,
            currentFrame,
            totalFrames,
            status: `Rendering frame ${currentFrame}/${totalFrames} (${percent}%)`,
          });
        }

        // Schedule next frame in sync with audio time
        const targetTime = startTime + currentFrame * frameIntervalMs;
        const delay = Math.max(0, targetTime - performance.now());
        setTimeout(renderNext, delay);
      } catch (err) {
        try {
          audioSource.stop();
        } catch {}
        if (recorder.state !== 'inactive') {
          try {
            recorder.stop();
          } catch {}
        }
        reject(err);
      }
    }

    renderNext();
  });
}
