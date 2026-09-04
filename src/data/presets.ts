import { AvatarPreset, AudioPreset, ProjectSourceFile } from '../types';
import smiling3DImg from '../assets/images/smiling_3d_character_1788503436812.jpg';
import cartoonArchaeologistImg from '../assets/images/cartoon_archaeologist_1788493512804.jpg';
import cartoonBoyImg from '../assets/images/cartoon_boy_1788418367099.jpg';
import cartoonGirlImg from '../assets/images/cartoon_girl_1788418386904.jpg';
import cartoonCatImg from '../assets/images/cartoon_cat_1788418398616.jpg';
import cartoonAnimeImg from '../assets/images/cartoon_anime_hero_1788418430512.jpg';
import cartoonRobotImg from '../assets/images/cartoon_robot_1788418413245.jpg';

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'smiling-3d-character',
    name: 'Anya (3D Smile / ปากยิ้มฟันสวยแบบในรูป)',
    category: 'character',
    styleType: 'realistic',
    imageUrl: smiling3DImg,
    defaultMouthBox: {
      x: 50,
      y: 69,
      width: 22,
      height: 11,
      chinY: 82,
    },
    defaultEyes: {
      enabled: true,
      blinkInterval: 3.2,
      leftEye: { x: 38, y: 46, radiusX: 6.0, radiusY: 6.5 },
      rightEye: { x: 62, y: 46, radiusX: 6.0, radiusY: 6.5 },
    },
  },
  {
    id: 'cartoon-archaeologist',
    name: 'Dr. Maya (นักโบราณคดีแดนสยาม)',
    category: 'cartoon',
    styleType: 'cartoon',
    imageUrl: cartoonArchaeologistImg,
    defaultMouthBox: {
      x: 50,
      y: 67,
      width: 18,
      height: 9,
      chinY: 81,
    },
    defaultEyes: {
      enabled: true,
      blinkInterval: 3.2,
      leftEye: { x: 37, y: 46, radiusX: 6.5, radiusY: 7.5 },
      rightEye: { x: 63, y: 46, radiusX: 6.5, radiusY: 7.5 },
    },
  },
  {
    id: 'cartoon-boy',
    name: 'Leo (3D Cartoon Boy)',
    category: 'cartoon',
    styleType: 'cartoon',
    imageUrl: cartoonBoyImg,
    defaultMouthBox: {
      x: 50,
      y: 67,
      width: 17,
      height: 9,
      chinY: 81,
    },
    defaultEyes: {
      enabled: true,
      blinkInterval: 3.2,
      leftEye: { x: 38, y: 46, radiusX: 6.5, radiusY: 7.5 },
      rightEye: { x: 62, y: 46, radiusX: 6.5, radiusY: 7.5 },
    },
  },
  {
    id: 'cartoon-girl',
    name: 'Mia (3D Cartoon Girl)',
    category: 'cartoon',
    styleType: 'cartoon',
    imageUrl: cartoonGirlImg,
    defaultMouthBox: {
      x: 50,
      y: 66,
      width: 16,
      height: 9,
      chinY: 80,
    },
    defaultEyes: {
      enabled: true,
      blinkInterval: 3.2,
      leftEye: { x: 37, y: 45, radiusX: 7.0, radiusY: 8.0 },
      rightEye: { x: 63, y: 45, radiusX: 7.0, radiusY: 8.0 },
    },
  },
  {
    id: 'cartoon-cat',
    name: 'Milo (Cute Cat Mascot)',
    category: 'cartoon',
    styleType: 'cartoon',
    imageUrl: cartoonCatImg,
    defaultMouthBox: {
      x: 50,
      y: 65,
      width: 16,
      height: 8,
      chinY: 77,
    },
    defaultEyes: {
      enabled: true,
      blinkInterval: 3.0,
      leftEye: { x: 34, y: 44, radiusX: 8.0, radiusY: 9.0 },
      rightEye: { x: 66, y: 44, radiusX: 8.0, radiusY: 9.0 },
    },
  },
  {
    id: 'cartoon-anime',
    name: 'Kenji (2D Anime Hero)',
    category: 'anime',
    styleType: 'cartoon',
    imageUrl: cartoonAnimeImg,
    defaultMouthBox: {
      x: 50,
      y: 68,
      width: 17,
      height: 8,
      chinY: 81,
    },
    defaultEyes: {
      enabled: true,
      blinkInterval: 3.5,
      leftEye: { x: 37, y: 47, radiusX: 7.0, radiusY: 6.0 },
      rightEye: { x: 63, y: 47, radiusX: 7.0, radiusY: 6.0 },
    },
  },
  {
    id: 'cartoon-robot',
    name: 'Sparky (Cartoon Robot)',
    category: 'cartoon',
    styleType: 'cartoon',
    imageUrl: cartoonRobotImg,
    defaultMouthBox: {
      x: 50,
      y: 66,
      width: 22,
      height: 10,
      chinY: 80,
    },
    defaultEyes: {
      enabled: true,
      blinkInterval: 3.2,
      leftEye: { x: 35, y: 45, radiusX: 7.5, radiusY: 7.5 },
      rightEye: { x: 65, y: 45, radiusX: 7.5, radiusY: 7.5 },
    },
  },
  {
    id: 'presenter-female',
    name: 'Sarah (Presenter)',
    category: 'photoreal',
    styleType: 'realistic',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    defaultMouthBox: {
      x: 50,
      y: 64,
      width: 20,
      height: 12,
      chinY: 79,
    },
    defaultEyes: {
      enabled: true,
      blinkInterval: 3.5,
      leftEye: { x: 42, y: 45, radiusX: 4.5, radiusY: 4.0 },
      rightEye: { x: 58, y: 45, radiusX: 4.5, radiusY: 4.0 },
    },
  },
  {
    id: 'presenter-male',
    name: 'Alex (Tech Host)',
    category: 'photoreal',
    styleType: 'realistic',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
    defaultMouthBox: {
      x: 50,
      y: 65,
      width: 21,
      height: 11,
      chinY: 80,
    },
    defaultEyes: {
      enabled: true,
      blinkInterval: 3.5,
      leftEye: { x: 43, y: 43, radiusX: 4.5, radiusY: 4.0 },
      rightEye: { x: 57, y: 43, radiusX: 4.5, radiusY: 4.0 },
    },
  },
  {
    id: 'classic-monalisa',
    name: 'Mona Lisa (Artwork)',
    category: 'artistic',
    styleType: 'realistic',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/687px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
    defaultMouthBox: {
      x: 52,
      y: 53,
      width: 15,
      height: 8,
      chinY: 66,
    },
    defaultEyes: {
      enabled: true,
      blinkInterval: 3.5,
      leftEye: { x: 45, y: 38, radiusX: 3.5, radiusY: 3.0 },
      rightEye: { x: 55, y: 38, radiusX: 3.5, radiusY: 3.0 },
    },
  },
];

export const AUDIO_PRESETS: AudioPreset[] = [
  {
    id: 'thai-intro',
    title: 'สวัสดีครับ ยินดีต้อนรับสู่ LALAMU (ไทย)',
    language: 'th',
    duration: 3.8,
    description: 'เสียงทักทายแนะนำสตูดิโอ ภาษาไทย ชัดถ้อยชัดคำ',
    type: 'speech',
    sampleText: 'สวัสดีครับ ยินดีต้อนรับสู่ ลาลามู สตูดิโอ สตูดิโอสร้างวิดีโอปากขยับด้วย เอไอ',
    frequencyPattern: 'intro',
  },
  {
    id: 'thai-story',
    title: 'เรื่องเล่าแอนิเมชันสั้น (ไทย)',
    language: 'th',
    duration: 4.5,
    description: 'จังหวะการเล่าเรื่องพร้อมไดนามิกเสียงขึ้นลงเป็นธรรมชาติ',
    type: 'expressive',
    sampleText: 'วันนี้เราจะพามาดูเทคโนโลยี ลิปซิงก์ ที่แปลงรูปภาพนิ่งให้พูดได้ง่ายๆ ภายในไม่กี่วินาทีครับ',
    frequencyPattern: 'excited',
  },
  {
    id: 'en-welcome',
    title: 'Welcome to LALAMU Studio (English)',
    language: 'en',
    duration: 3.5,
    description: 'Clear studio intro greeting in English with distinct syllables',
    type: 'speech',
    sampleText: 'Hello and welcome to LALAMU Studio. Turn any still photo into a talking video with realistic mouth movement.',
    frequencyPattern: 'intro',
  },
  {
    id: 'en-dynamic',
    title: 'Exciting Tech Presentation (English)',
    language: 'en',
    duration: 4.2,
    description: 'Dynamic energetic speech rhythm with pauses and emphasis',
    type: 'expressive',
    sampleText: 'Check this out! With real-time audio waveform analysis, lips open and close dynamically with every syllable.',
    frequencyPattern: 'excited',
  },
];

export const PYTHON_SOURCE_FILES: ProjectSourceFile[] = [
  {
    filename: 'LALAMU_STUDIO.py',
    path: 'LALAMU_STUDIO/LALAMU_STUDIO.py',
    description: 'Flask backend หลัก + API routes สำหรับอัปโหลดและประมวลผล',
    language: 'python',
    content: `"""
LALAMU STUDIO - Backend Entrypoint
Flask REST API for Face Detection, Audio Energy Extraction & Lip-Sync Video Export
"""

import os
import uuid
from flask import Flask, request, jsonify, send_file, render_template_string
from werkzeug.utils import secure_filename

from modules.audio import analyze_audio_energy
from modules.face import detect_face_landmarks
from modules.lipsync import generate_lipsync_frames
from modules.export import assemble_video

app = Flask(__name__)
app.config['UPLOAD_FOLDER_ASSETS'] = 'assets'
app.config['UPLOAD_FOLDER_AUDIO'] = 'audio'
app.config['OUTPUT_FOLDER'] = 'outputs'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB max

# Create directory structure
for folder in [app.config['UPLOAD_FOLDER_ASSETS'], 
              app.config['UPLOAD_FOLDER_AUDIO'], 
              app.config['OUTPUT_FOLDER']]:
    os.makedirs(folder, exist_ok=True)


@app.route('/')
def index():
    """Serves the main studio frontend."""
    if os.path.exists('index.html'):
        with open('index.html', 'r', encoding='utf-8') as f:
            return f.read()
    return "<h1>LALAMU STUDIO Backend Running</h1><p>index.html not found</p>"


@app.route('/api/upload_image', methods=['POST'])
def upload_image():
    """Step 1: Upload portrait image and detect face & mouth coordinates."""
    if 'image' not in request.files:
        return jsonify({'error': 'No image file uploaded'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
        
    ext = os.path.splitext(file.filename)[1].lower()
    filename = f"face_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER_ASSETS'], filename)
    file.save(filepath)

    # Detect facial landmarks via MediaPipe
    landmarks = detect_face_landmarks(filepath)
    
    return jsonify({
        'status': 'success',
        'image_path': filepath,
        'landmarks': landmarks
    })


@app.route('/api/upload_audio', methods=['POST'])
def upload_audio():
    """Step 2: Upload speech audio file and analyze energy envelopes."""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file uploaded'}), 400
        
    file = request.files['audio']
    fps = int(request.form.get('fps', 30))
    
    ext = os.path.splitext(file.filename)[1].lower()
    filename = f"audio_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER_AUDIO'], filename)
    file.save(filepath)

    # Analyze audio energy using librosa
    analysis = analyze_audio_energy(filepath, target_fps=fps)
    
    return jsonify({
        'status': 'success',
        'audio_path': filepath,
        'duration': analysis['duration'],
        'fps': fps,
        'total_frames': analysis['total_frames'],
        'energy_curve': analysis['energy_curve'][:100]  # preview snippet
    })


@app.route('/api/lipsync', methods=['POST'])
def run_lipsync():
    """Step 3: Generate mouth-warped frames from image & audio energy."""
    data = request.json or {}
    image_path = data.get('image_path')
    audio_path = data.get('audio_path')
    mouth_box = data.get('mouth_box')  # optional manual override
    intensity = float(data.get('intensity', 1.0))
    fps = int(data.get('fps', 30))

    if not image_path or not audio_path:
        return jsonify({'error': 'Both image_path and audio_path are required'}), 400

    job_id = uuid.uuid4().hex[:8]
    session_dir = os.path.join(app.config['OUTPUT_FOLDER'], job_id)
    os.makedirs(session_dir, exist_ok=True)

    result = generate_lipsync_frames(
        image_path=image_path,
        audio_path=audio_path,
        output_dir=session_dir,
        mouth_box=mouth_box,
        intensity=intensity,
        fps=fps
    )

    return jsonify({
        'status': 'success',
        'job_id': job_id,
        'frame_count': result['frame_count'],
        'fps': fps,
        'frames_dir': session_dir
    })


@app.route('/api/export', methods=['POST'])
def export_video():
    """Step 4: Combine frames + audio into output MP4 via MoviePy / ffmpeg."""
    data = request.json or {}
    job_id = data.get('job_id')
    audio_path = data.get('audio_path')
    fps = int(data.get('fps', 30))

    if not job_id or not audio_path:
        return jsonify({'error': 'job_id and audio_path are required'}), 400

    session_dir = os.path.join(app.config['OUTPUT_FOLDER'], job_id)
    output_video = os.path.join(app.config['OUTPUT_FOLDER'], f"lalamu_{job_id}.mp4")

    success = assemble_video(
        frames_dir=session_dir,
        audio_path=audio_path,
        output_path=output_video,
        fps=fps
    )

    if success and os.path.exists(output_video):
        return jsonify({
            'status': 'success',
            'video_url': f"/outputs/lalamu_{job_id}.mp4",
            'download_path': output_video
        })
    return jsonify({'error': 'Export failed'}), 500


@app.route('/outputs/<path:filename>')
def serve_output(filename):
    return send_file(os.path.join(app.config['OUTPUT_FOLDER'], filename))


if __name__ == '__main__':
    print("🚀 LALAMU STUDIO Backend starting at http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
`,
  },
  {
    filename: 'modules/audio.py',
    path: 'LALAMU_STUDIO/modules/audio.py',
    description: 'วิเคราะห์พลังงานเสียง (RMS Energy) ต่อเฟรมตาม FPS ด้วย librosa',
    language: 'python',
    content: `"""
Module: audio.py
Extracts RMS energy envelope and audio feature curves per frame.
"""

import numpy as np
import librosa

def analyze_audio_energy(audio_path, target_fps=30):
    """
    Loads audio file, computes RMS energy envelope,
    and resamples to target FPS.
    """
    # Load audio at 22050 Hz sampling rate
    y, sr = librosa.load(audio_path, sr=22050)
    duration = librosa.get_duration(y=y, sr=sr)
    
    # Hop length configured to match target FPS
    hop_length = int(sr / target_fps)
    frame_length = hop_length * 2
    
    # Calculate Root Mean Square (RMS) energy
    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    
    # Normalize energy to 0.0 - 1.0 range
    if np.max(rms) > 0:
        norm_energy = rms / (np.max(rms) + 1e-6)
    else:
        norm_energy = rms

    # Apply exponential moving average for smooth mouth open/close
    alpha = 0.35
    smoothed_energy = np.zeros_like(norm_energy)
    smoothed_energy[0] = norm_energy[0]
    for i in range(1, len(norm_energy)):
        smoothed_energy[i] = alpha * norm_energy[i] + (1 - alpha) * smoothed_energy[i-1]

    # Silence threshold gating
    silence_gate = 0.05
    smoothed_energy[smoothed_energy < silence_gate] = 0.0

    return {
        'duration': float(duration),
        'total_frames': len(smoothed_energy),
        'energy_curve': smoothed_energy.tolist()
    }
`,
  },
  {
    filename: 'modules/face.py',
    path: 'LALAMU_STUDIO/modules/face.py',
    description: 'ตรวจจับตำแหน่งใบหน้าและปาก (MediaPipe Face Mesh หรือ Haar Cascade)',
    language: 'python',
    content: `"""
Module: face.py
Detects facial landmarks, lip contours, and mouth region bounding box.
"""

import cv2
import numpy as np

def detect_face_landmarks(image_path):
    """
    Detects face and mouth landmarks using OpenCV / MediaPipe.
    Returns normalized bounding box {x, y, width, height, chin_y}.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image at {image_path}")
    
    h, w, _ = img.shape

    # Default heuristic mouth box (center lower third of face)
    mouth_box = {
        'x': int(w * 0.5),
        'y': int(h * 0.65),
        'width': int(w * 0.22),
        'height': int(h * 0.12),
        'chin_y': int(h * 0.80)
    }

    try:
        # Attempt OpenCV Haar Cascade if available
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.py')
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.2, 4)

        if len(faces) > 0:
            fx, fy, fw, fh = faces[0]
            mouth_box = {
                'x': int(fx + fw * 0.5),
                'y': int(fy + fh * 0.72),
                'width': int(fw * 0.40),
                'height': int(fh * 0.20),
                'chin_y': int(fy + fh * 0.95)
            }
    except Exception as e:
        print(f"Heuristic fallback for face detection: {e}")

    return mouth_box
`,
  },
  {
    filename: 'modules/lipsync.py',
    path: 'LALAMU_STUDIO/modules/lipsync.py',
    description: 'สร้างเฟรมภาพปากขยับจากพลังงานเสียงด้วย image warping และ mouth cavity blending',
    language: 'python',
    content: `"""
Module: lipsync.py
Warps mouth region based on frame energy curve to simulate speech articulation.

NOTE: This prototype uses non-rigid affine warping & cavity synthesis.
For production neural lip-sync, replace run_lipsync with Wav2Lip / SadTalker!
"""

import os
import cv2
import numpy as np
from modules.audio import analyze_audio_energy
from modules.face import detect_face_landmarks

def warp_mouth_frame(base_img, mouth_box, energy, intensity=1.0):
    """
    Deforms lower lip and synthesizes inner mouth cavity based on energy (0.0 - 1.0).
    """
    if energy <= 0.01:
        return base_img.copy()

    frame = base_img.copy()
    h, w, _ = frame.shape

    cx = mouth_box['x']
    cy = mouth_box['y']
    mw = mouth_box['width']
    mh = mouth_box['height']

    open_amount = int(mh * energy * intensity * 0.85)

    # 1. Extract lower jaw/chin region and translate downward
    y_start = cy
    y_end = min(h, cy + int(mh * 2.2))
    x_start = max(0, cx - int(mw * 0.7))
    x_end = min(w, cx + int(mw * 0.7))

    jaw_patch = frame[y_start:y_end, x_start:x_end].copy()

    # Draw oral cavity (dark mouth interior)
    cavity_center = (cx, cy + open_amount // 2)
    cavity_axes = (int(mw * 0.45), max(2, open_amount))
    cv2.ellipse(frame, cavity_center, cavity_axes, 0, 0, 360, (25, 20, 25), -1)

    # Upper teeth hint
    if open_amount > 8:
        teeth_axes = (int(mw * 0.35), max(2, open_amount // 3))
        teeth_center = (cx, cy + open_amount // 4)
        cv2.ellipse(frame, teeth_center, teeth_axes, 0, 0, 180, (230, 230, 235), -1)

    # Blend displaced lower lip back with soft alpha mask
    displaced_y = min(h - jaw_patch.shape[0], y_start + open_amount)
    if displaced_y > y_start:
        blend_h = min(jaw_patch.shape[0], h - displaced_y)
        frame[displaced_y:displaced_y+blend_h, x_start:x_end] = jaw_patch[:blend_h, :]

    return frame

def generate_lipsync_frames(image_path, audio_path, output_dir, mouth_box=None, intensity=1.0, fps=30):
    """
    Iterates through each audio frame, renders deformed mouth frame, and saves to output_dir.
    """
    base_img = cv2.imread(image_path)
    if mouth_box is None:
        mouth_box = detect_face_landmarks(image_path)

    analysis = analyze_audio_energy(audio_path, target_fps=fps)
    energy_curve = analysis['energy_curve']

    os.makedirs(output_dir, exist_ok=True)

    for frame_idx, energy in enumerate(energy_curve):
        frame = warp_mouth_frame(base_img, mouth_box, energy, intensity=intensity)
        frame_filename = os.path.join(output_dir, f"frame_{frame_idx:05d}.jpg")
        cv2.imwrite(frame_filename, frame)

    return {
        'frame_count': len(energy_curve),
        'fps': fps,
        'output_dir': output_dir
    }
`,
  },
  {
    filename: 'modules/export.py',
    path: 'LALAMU_STUDIO/modules/export.py',
    description: 'รวมรูปภาพเฟรมทั้งหมด + ไฟล์เสียง ให้เป็นวิดีโอ MP4 ด้วย MoviePy / ffmpeg',
    language: 'python',
    content: `"""
Module: export.py
Combines sequenced image frames and the audio track into a single MP4 video file.
"""

import os
import glob
from moviepy.editor import ImageSequenceClip, AudioFileClip

def assemble_video(frames_dir, audio_path, output_path, fps=30):
    """
    Loads all frame_*.jpg images in order, attaches audio, and writes MP4.
    """
    frame_files = sorted(glob.glob(os.path.join(frames_dir, "frame_*.jpg")))
    if not frame_files:
        print("No frames found to assemble.")
        return False

    print(f"Compiling {len(frame_files)} frames into {output_path} at {fps} FPS...")
    
    # Load image sequence
    video_clip = ImageSequenceClip(frame_files, fps=fps)
    
    # Load and sync audio
    audio_clip = AudioFileClip(audio_path)
    
    # Trim video clip to match audio duration
    video_clip = video_clip.set_duration(audio_clip.duration)
    final_video = video_clip.set_audio(audio_clip)

    # Export MP4 with H.264 video codec and AAC audio codec
    final_video.write_videofile(
        output_path,
        codec='libx264',
        audio_codec='aac',
        fps=fps,
        preset='medium',
        ffmpeg_params=['-pix_fmt', 'yuv420p']
    )

    video_clip.close()
    audio_clip.close()
    final_video.close()

    return True
`,
  },
  {
    filename: 'requirements.txt',
    path: 'LALAMU_STUDIO/requirements.txt',
    description: 'รายการ Python packages ที่ต้องติดตั้งสำหรับโปรเจกต์',
    language: 'text',
    content: `flask>=2.3.0
librosa>=0.10.0
opencv-python>=4.8.0
numpy>=1.24.0
moviepy>=1.0.3
mediapipe>=0.10.0
soundfile>=0.12.1
werkzeug>=2.3.0
gunicorn>=21.2.0
`,
  },
];
