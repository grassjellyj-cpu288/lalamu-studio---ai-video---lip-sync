import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  FolderTree,
  Terminal,
  FileCode,
  ExternalLink,
} from 'lucide-react';
import { PYTHON_SOURCE_FILES } from '../data/presets';

interface PythonProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'th' | 'en';
}

export const PythonProjectModal: React.FC<PythonProjectModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const isTh = lang === 'th';
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentFile = PYTHON_SOURCE_FILES[selectedFileIndex];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.filename.split('/').pop() || 'file.py';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-sm">
      <div className="flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {isTh ? 'โครงสร้างโปรเจกต์ Python (LALAMU_STUDIO/)' : 'Python Backend Architecture'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isTh
                  ? 'ซอร์สโค้ด Python สำหรับรัน Flask + Librosa + MediaPipe + MoviePy ในเครื่อง'
                  : 'Source code for local Python + Flask + Librosa + MoviePy setup'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick run command helper */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-950/60 px-5 py-2.5 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-amber-400" />
            <span>
              <code className="text-zinc-200">pip install -r requirements.txt</code> &rarr;{' '}
              <code className="text-amber-400">python LALAMU_STUDIO.py</code>
            </span>
          </div>
          <span className="text-[11px] text-zinc-500">
            {isTh ? 'เปิดเบราว์เซอร์: http://127.0.0.1:5000' : 'Web UI: http://127.0.0.1:5000'}
          </span>
        </div>

        {/* Main Body: File List + Code View */}
        <div className="flex flex-1 overflow-hidden">
          {/* File sidebar */}
          <div className="w-56 shrink-0 border-r border-zinc-800 bg-zinc-950/40 p-3 overflow-y-auto">
            <span className="mb-2 block px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Project Files
            </span>
            <div className="flex flex-col gap-1">
              {PYTHON_SOURCE_FILES.map((file, idx) => {
                const isSelected = selectedFileIndex === idx;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setSelectedFileIndex(idx)}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 font-semibold shadow'
                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <FileCode
                      className={`h-3.5 w-3.5 shrink-0 ${
                        isSelected ? 'text-zinc-950' : 'text-amber-400'
                      }`}
                    />
                    <span className="truncate">{file.filename}</span>
                  </button>
                );
              })}
            </div>

            {/* Folder layout tree note */}
            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 text-[11px] text-zinc-400">
              <span className="font-semibold text-zinc-200 block mb-1">
                {isTh ? 'โฟลเดอร์ในเครื่อง:' : 'Folders:'}
              </span>
              <ul className="space-y-0.5 font-mono text-[10px] text-zinc-400">
                <li>assets/ (ภาพต้นฉบับ)</li>
                <li>audio/ (ไฟล์เสียง)</li>
                <li>outputs/ (เฟรม + MP4)</li>
                <li>modules/ (แกนประมวลผล)</li>
              </ul>
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="flex flex-1 flex-col overflow-hidden bg-zinc-950">
            {/* File info bar */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4 py-2">
              <div>
                <span className="font-mono text-xs font-semibold text-amber-400">
                  {currentFile.path}
                </span>
                <p className="text-[11px] text-zinc-400">{currentFile.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-700 hover:text-white"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? (isTh ? 'คัดลอกแล้ว' : 'Copied') : isTh ? 'คัดลอก' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadFile}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-zinc-950 hover:bg-amber-400"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isTh ? 'ดาวน์โหลดไฟล์' : 'Download'}</span>
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-zinc-300">
              <pre>
                <code>{currentFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
