import { FrameEnergyData } from '../types';

let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioCtx = new AudioCtxClass();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

/**
 * Decodes an audio ArrayBuffer or Blob into an AudioBuffer.
 */
export async function decodeAudio(data: ArrayBuffer | Blob): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  let buffer: ArrayBuffer;
  if (data instanceof Blob) {
    buffer = await data.arrayBuffer();
  } else {
    buffer = data;
  }
  return await ctx.decodeAudioData(buffer.slice(0));
}

/**
 * Analyzes audio energy (RMS) per frame based on target FPS.
 */
export function extractAudioEnergyCurve(
  audioBuffer: AudioBuffer,
  fps: number = 30,
  smoothness: number = 0.35,
  openThreshold: number = 0.03
): { duration: number; frames: FrameEnergyData[]; maxRms: number } {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0); // primary channel
  const totalSamples = channelData.length;
  const duration = audioBuffer.duration;

  const samplesPerFrame = Math.floor(sampleRate / fps);
  const totalFrames = Math.ceil(totalSamples / samplesPerFrame);

  const rawRms: number[] = [];
  let peakRms = 0;

  // 1. Calculate RMS per frame
  for (let f = 0; f < totalFrames; f++) {
    const startIdx = f * samplesPerFrame;
    const endIdx = Math.min(startIdx + samplesPerFrame, totalSamples);
    const count = endIdx - startIdx;

    if (count <= 0) {
      rawRms.push(0);
      continue;
    }

    let sumSq = 0;
    for (let i = startIdx; i < endIdx; i++) {
      const val = channelData[i];
      sumSq += val * val;
    }
    const rms = Math.sqrt(sumSq / count);
    rawRms.push(rms);
    if (rms > peakRms) peakRms = rms;
  }

  // 2. Normalize & smooth with exponential moving average
  const frames: FrameEnergyData[] = [];
  let prevSmoothed = 0;
  const safePeak = peakRms > 0.001 ? peakRms : 1;

  for (let f = 0; f < totalFrames; f++) {
    const time = f / fps;
    const norm = rawRms[f] / safePeak;

    // Smoothing filter
    const smoothed = prevSmoothed * smoothness + norm * (1 - smoothness);
    prevSmoothed = smoothed;

    // Apply silence threshold
    let aperture = smoothed;
    if (aperture < openThreshold) {
      aperture = 0;
    } else {
      // Scale from [openThreshold..1] to [0..1]
      aperture = (aperture - openThreshold) / (1 - openThreshold);
      // Non-linear perceptual curve (mouth opens faster on vowel peaks)
      aperture = Math.pow(aperture, 0.85);
    }

    // Bound aperture to 0-1
    aperture = Math.min(1, Math.max(0, aperture));

    frames.push({
      time,
      rms: rawRms[f],
      aperture,
      jawOffset: aperture * 16, // px base displacement
      isSpeaking: aperture > 0.08,
    });
  }

  return { duration, frames, maxRms: peakRms };
}

/**
 * Synthesizes a vocal-like speech waveform with realistic syllables, formants and rhythmic pauses.
 * Used for presets or when offline/testing without uploading files.
 */
export function generateSyntheticSpeechAudio(
  type: 'intro' | 'excited' | 'smooth' = 'intro',
  durationSec: number = 3.5
): AudioBuffer {
  const ctx = getAudioContext();
  const sampleRate = ctx.sampleRate;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // Formant speech synthesis simulation
  const numSyllables = type === 'excited' ? 16 : 12;
  const syllableDur = durationSec / numSyllables;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const syllableIndex = Math.floor(t / syllableDur);
    const syllablePhase = (t % syllableDur) / syllableDur;

    // Envelopes for syllable onset & decay, with natural pauses between words
    const isPause = (syllableIndex % 4 === 3 && syllablePhase > 0.5) || (syllableIndex === numSyllables - 1 && syllablePhase > 0.7);
    if (isPause) {
      data[i] = 0;
      continue;
    }

    const envelope = Math.sin(syllablePhase * Math.PI) * Math.min(1, syllablePhase * 8);

    // Glottal pulse fundamental frequency (f0 around 120-180Hz) + formants
    const f0 = 135 + Math.sin(t * 3) * 25 + (type === 'excited' ? Math.sin(t * 8) * 30 : 0);
    const f1 = 600 + Math.sin(syllableIndex * 2.1) * 200; // Vowel formant 1
    const f2 = 1400 + Math.cos(syllableIndex * 1.7) * 400; // Vowel formant 2

    const osc0 = Math.sin(2 * Math.PI * f0 * t);
    const osc1 = Math.sin(2 * Math.PI * f1 * t) * 0.4;
    const osc2 = Math.sin(2 * Math.PI * f2 * t) * 0.2;
    const noise = (Math.random() * 2 - 1) * 0.05; // breathiness / fricative

    data[i] = (osc0 + osc1 + osc2 + noise) * envelope * 0.35;
  }

  return buffer;
}

/**
 * Converts an AudioBuffer to a WAV blob for playback / download.
 */
export function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numOfChan = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  writeString('RIFF');
  setUint32(length - 8);
  writeString('WAVE');
  writeString('fmt ');
  setUint32(16); // subchunk 1 size
  setUint16(1); // PCM format
  setUint16(numOfChan);
  setUint32(audioBuffer.sampleRate);
  setUint32(audioBuffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample
  writeString('data');
  setUint32(length - pos - 4);

  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  while (offset < audioBuffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}
