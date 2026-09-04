import React, { useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Sliders,
  Sparkles,
  RefreshCw,
  Palette,
  Eye,
  Maximize2,
  Trash2,
  Check,
} from 'lucide-react';
import { BackgroundConfig, BackgroundPreset } from '../types';
import { BACKGROUND_PRESETS, BACKGROUND_CATEGORIES } from '../data/backgrounds';

interface BackgroundSelectorProps {
  config: BackgroundConfig;
  onChangeConfig: (newConfig: BackgroundConfig) => void;
  lang: 'th' | 'en';
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  config,
  onChangeConfig,
  lang,
}) => {
  const isTh = lang === 'th';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectPreset = (preset: BackgroundPreset) => {
    onChangeConfig({
      ...config,
      enabled: preset.type !== 'original',
      selectedPresetId: preset.id,
      type: preset.type,
      customImageUrl: preset.type === 'custom' ? config.customImageUrl : undefined,
      color: preset.color,
      blur: preset.blur ?? config.blur ?? 0,
      brightness: preset.brightness ?? config.brightness ?? 100,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onChangeConfig({
        ...config,
        enabled: true,
        selectedPresetId: 'custom-uploaded',
        type: 'custom',
        customImageUrl: dataUrl,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleReset = () => {
    onChangeConfig({
      enabled: false,
      selectedPresetId: 'original',
      type: 'original',
      customImageUrl: undefined,
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
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-zinc-100 text-sm sm:text-base">
                {isTh ? 'เปลี่ยนฉากหลังการ์ตูน & อนิเมะ' : 'Cartoon & Anime Backgrounds'}
              </h3>
              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-400 ring-1 ring-violet-500/20">
                {isTh ? 'รองรับรูปจาก PC' : 'Custom PC Image'}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {isTh
                ? 'เลือกฉากหลังสำเร็จรูป หรืออัปโหลดรูปจากเครื่องของคุณ พร้อมระบบตัดฉากหลังอัตโนมัติ'
                : 'Select preset anime/studio scenes or upload your PC background image with smart matting.'}
            </p>
          </div>
        </div>

        {/* Quick Reset */}
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          title={isTh ? 'รีเซ็ตฉากหลังกลับเป็นภาพต้นฉบับ' : 'Reset to original background'}
        >
          <RefreshCw className="h-3 w-3" />
          <span>{isTh ? 'ใช้ฉากเดิม' : 'Reset Original'}</span>
        </button>
      </div>

      {/* Upload Button from PC & Presets */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-300">
            {isTh ? '1. เลือกฉากหลัง หรือ นำรูปจากคอมพิวเตอร์ (PC)' : '1. Select Background or Upload from PC'}
          </label>
        </div>

        {/* Custom PC Upload Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative col-span-1 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-500/40 bg-violet-950/20 p-3 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-900/30 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400 group-hover:scale-110 transition-transform">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-violet-200">
                {isTh ? '📁 เลือกรูปจาก PC / คอมพิวเตอร์' : '📁 Upload Image from PC'}
              </p>
              <p className="text-[10px] text-violet-300/70">
                {isTh ? 'PNG, JPG, WebP ทุกขนาด' : 'PNG, JPG, WebP any size'}
              </p>
            </div>
          </div>

          {/* Active Custom Image Card (if uploaded) */}
          {config.customImageUrl && (
            <div
              onClick={() =>
                onChangeConfig({
                  ...config,
                  enabled: true,
                  selectedPresetId: 'custom-uploaded',
                  type: 'custom',
                })
              }
              className={`relative col-span-1 sm:col-span-2 flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer transition-all overflow-hidden ${
                config.type === 'custom'
                  ? 'border-violet-500 bg-violet-950/40 ring-2 ring-violet-500/40'
                  : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
              }`}
            >
              <img
                src={config.customImageUrl}
                alt="Custom PC background"
                className="h-16 w-24 rounded-lg object-cover border border-zinc-700 shadow-md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300">
                    {isTh ? 'รูปจาก PC ปัจจุบัน' : 'Your PC Image'}
                  </span>
                  {config.type === 'custom' && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <Check className="h-3 w-3" />
                      {isTh ? 'กำลังใช้งาน' : 'Active'}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-zinc-300">
                  {isTh ? 'ฉากหลังที่คุณนำเข้ามาเอง' : 'Custom imported background'}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeConfig({
                    ...config,
                    customImageUrl: undefined,
                    selectedPresetId: 'original',
                    type: 'original',
                    enabled: false,
                  });
                }}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                title={isTh ? 'ลบรูปนี้' : 'Delete image'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Preset Backgrounds Grid */}
        <div className="mt-2 flex flex-col gap-2">
          <div className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
            {isTh ? 'ฉากหลังการ์ตูน, อนิเมะ & สตูดิโอสำเร็จรูป' : 'Preset Anime & Studio Scenes'}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {BACKGROUND_PRESETS.map((preset) => {
              const isSelected =
                config.selectedPresetId === preset.id ||
                (!config.enabled && preset.type === 'original');

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`group relative flex flex-col rounded-xl border p-1.5 text-left transition-all overflow-hidden ${
                    isSelected
                      ? 'border-violet-500 bg-violet-950/30 ring-2 ring-violet-500/50'
                      : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-950">
                    <img
                      src={preset.thumbnail}
                      alt={preset.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-white shadow">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-col px-0.5">
                    <span className="truncate text-[11px] font-medium text-zinc-200">
                      {isTh ? preset.nameTh : preset.name}
                    </span>
                    <span className="truncate text-[9px] text-zinc-400">
                      {isTh ? preset.descriptionTh : preset.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Advanced Matting & Placement Controls (visible when background enabled) */}
      {config.enabled && config.type !== 'original' && (
        <div className="mt-1 flex flex-col gap-4 rounded-xl border border-zinc-800/90 bg-zinc-950/50 p-3 sm:p-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-semibold text-zinc-200">
                {isTh ? '2. เทคนิคการตัดขอบตัวการ์ตูน (Matting / Keying)' : '2. Character Edge Matting'}
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">
              {isTh ? 'ปรับแต่งให้เนียนเหมาะกับลายเส้นการ์ตูน' : 'Fine-tune for crisp anime outlines'}
            </span>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                id: 'auto',
                labelTh: '⚡ Smart Auto (แนะนำ)',
                labelEn: '⚡ Smart Auto (Best)',
                descTh: 'ตัดขอบรอบนอกอัตโนมัติ ไม่กินตา/ฟัน',
              },
              {
                id: 'chroma',
                labelTh: '🟢 Chroma Key',
                labelEn: '🟢 Chroma Key',
                descTh: 'ดูดสีฉากหลังออกตามค่าสีที่กำหนด',
              },
              {
                id: 'vignette',
                labelTh: '🎨 Soft Vignette',
                labelEn: '🎨 Soft Vignette',
                descTh: 'เบลอไล่เงาขอบนุ่มรอบตัวละคร',
              },
              {
                id: 'none',
                labelTh: '🖼️ วางทับเดิม',
                labelEn: '🖼️ Normal Overlay',
                descTh: 'คงภาพเดิม ซ้อนบนฉากหลัง',
              },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() =>
                  onChangeConfig({ ...config, keyingMode: mode.id as BackgroundConfig['keyingMode'] })
                }
                className={`flex flex-col rounded-lg border p-2 text-left transition-all ${
                  config.keyingMode === mode.id
                    ? 'border-violet-500 bg-violet-950/40 text-violet-200 ring-1 ring-violet-500'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="text-xs font-medium">
                  {isTh ? mode.labelTh : mode.labelEn}
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5">
                  {mode.descTh}
                </span>
              </button>
            ))}
          </div>

          {/* Chroma key color picker if chroma mode */}
          {config.keyingMode === 'chroma' && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5">
              <span className="text-xs text-zinc-300">
                {isTh ? 'สีฉากที่ต้องการตัดออก:' : 'Key Color:'}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.keyColor || '#00FF00'}
                  onChange={(e) => onChangeConfig({ ...config, keyColor: e.target.value })}
                  className="h-7 w-9 cursor-pointer rounded border border-zinc-700 bg-transparent"
                />
                <span className="text-xs font-mono text-zinc-300">{config.keyColor}</span>
              </div>
              <div className="flex gap-1.5">
                {[
                  { name: 'Green', color: '#00FF00' },
                  { name: 'Blue', color: '#0047AB' },
                  { name: 'White', color: '#FFFFFF' },
                  { name: 'Black', color: '#000000' },
                ].map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, keyColor: c.color })}
                    className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 hover:border-violet-400"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sliders: Tolerance & Feather (for auto & chroma) */}
          {(config.keyingMode === 'auto' || config.keyingMode === 'chroma') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                  <span>{isTh ? 'ความไวในการตัดขอบ (Tolerance)' : 'Tolerance'}</span>
                  <span className="font-mono text-violet-400">{config.tolerance}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  step="1"
                  value={config.tolerance}
                  onChange={(e) => onChangeConfig({ ...config, tolerance: Number(e.target.value) })}
                  className="w-full accent-violet-500 h-1.5 rounded-lg bg-zinc-800 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                  <span>{isTh ? 'ความนุ่มของขอบ (Feather)' : 'Edge Feather'}</span>
                  <span className="font-mono text-violet-400">{config.feather}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={config.feather}
                  onChange={(e) => onChangeConfig({ ...config, feather: Number(e.target.value) })}
                  className="w-full accent-violet-500 h-1.5 rounded-lg bg-zinc-800 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Background Effects: Blur & Brightness */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                <span>{isTh ? 'เบลอฉากหลัง (Cinematic Bokeh)' : 'Background Blur'}</span>
                <span className="font-mono text-violet-400">{config.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={config.blur}
                onChange={(e) => onChangeConfig({ ...config, blur: Number(e.target.value) })}
                className="w-full accent-violet-500 h-1.5 rounded-lg bg-zinc-800 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                <span>{isTh ? 'ความสว่างฉากหลัง (Brightness)' : 'Background Brightness'}</span>
                <span className="font-mono text-violet-400">{config.brightness}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="160"
                step="5"
                value={config.brightness}
                onChange={(e) => onChangeConfig({ ...config, brightness: Number(e.target.value) })}
                className="w-full accent-violet-500 h-1.5 rounded-lg bg-zinc-800 cursor-pointer"
              />
            </div>
          </div>

          {/* Character Scale & Position Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800/80">
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                <span>{isTh ? 'ขนาดตัวละคร (Scale)' : 'Character Scale'}</span>
                <span className="font-mono text-violet-400">{Math.round(config.characterScale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={config.characterScale}
                onChange={(e) =>
                  onChangeConfig({ ...config, characterScale: Number(e.target.value) })
                }
                className="w-full accent-violet-500 h-1.5 rounded-lg bg-zinc-800 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                <span>{isTh ? 'ตำแหน่ง แนวนอน (X)' : 'Position X'}</span>
                <span className="font-mono text-violet-400">{config.characterPositionX}%</span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                step="1"
                value={config.characterPositionX}
                onChange={(e) =>
                  onChangeConfig({ ...config, characterPositionX: Number(e.target.value) })
                }
                className="w-full accent-violet-500 h-1.5 rounded-lg bg-zinc-800 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
                <span>{isTh ? 'ตำแหน่ง แนวตั้ง (Y)' : 'Position Y'}</span>
                <span className="font-mono text-violet-400">{config.characterPositionY}%</span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                step="1"
                value={config.characterPositionY}
                onChange={(e) =>
                  onChangeConfig({ ...config, characterPositionY: Number(e.target.value) })
                }
                className="w-full accent-violet-500 h-1.5 rounded-lg bg-zinc-800 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
