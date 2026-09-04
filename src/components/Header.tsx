import React from 'react';
import { Film, Code2, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

interface HeaderProps {
  lang: 'th' | 'en';
  setLang: (lang: 'th' | 'en') => void;
  onOpenCodeModal: () => void;
  onReset: () => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  onOpenCodeModal,
  onReset,
  isProcessing,
}) => {
  const isTh = lang === 'th';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/30">
            <Film className="h-5 w-5 text-zinc-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-white sm:text-xl">
                LALAMU <span className="text-amber-400">STUDIO</span>
              </span>
              <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/20">
                PROTOTYPE v1.0
              </span>
            </div>
            <p className="hidden text-xs text-zinc-400 sm:block">
              {isTh
                ? 'AI Video & Lip Sync — อัปโหลดรูปภาพ + เสียง แล้วสร้างวิดีโอปากขยับ'
                : 'AI Video & Lip Sync Studio — Talking portrait video generator'}
            </p>
          </div>
        </div>

        {/* Action Buttons & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Codebase Viewer Button */}
          <button
            type="button"
            onClick={onOpenCodeModal}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-amber-500/50 hover:bg-zinc-800 hover:text-amber-400"
            title={isTh ? 'ดูโค้ดโปรเจกต์ Python (Flask + MoviePy + Librosa)' : 'View Python Backend Project'}
          >
            <Code2 className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">
              {isTh ? 'โครงสร้างโค้ด Python' : 'Python Project Code'}
            </span>
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={onReset}
            disabled={isProcessing}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white disabled:opacity-50"
            title={isTh ? 'รีเซ็ตสตูดิโอ' : 'Reset Studio'}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {/* Language Toggle */}
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLang('th')}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                isTh ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              TH
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                !isTh ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
