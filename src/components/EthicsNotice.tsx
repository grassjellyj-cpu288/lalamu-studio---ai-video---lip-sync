import React from 'react';
import { AlertTriangle, ShieldCheck, Cpu, Sparkles } from 'lucide-react';

interface EthicsNoticeProps {
  lang: 'th' | 'en';
}

export const EthicsNotice: React.FC<EthicsNoticeProps> = ({ lang }) => {
  const isTh = lang === 'th';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Prototype Quality Notice */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2">
          <AlertTriangle className="h-4 w-4" />
          <h4>{isTh ? '⚠️ หมายเหตุเกี่ยวกับคุณภาพ' : '⚠️ Quality & Architecture Note'}</h4>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          {isTh ? (
            <>
              ระบบ <span className="text-amber-300 font-semibold">LALAMU STUDIO</span> เวอร์ชันต้นแบบนี้ใช้เทคนิค{' '}
              <strong className="text-white">Image Warping & Mesh Deformation</strong> ตามพลังงานเสียง (RMS Energy) 
              ซึ่งเหมาะสำหรับทำตัวอย่าง (Prototype), แอนิเมชันเร็ว และสร้างคอนเทนต์เบื้องต้น
              <br className="mt-1" />
              หากต้องการคุณภาพระดับโปรดักชัน (ปากขยับตรงหน่วยเสียงสมจริงระดับโฟนีม) สามารถเชื่อมต่อโมเดล Deep Learning เช่น{' '}
              <span className="text-amber-300 font-mono">Wav2Lip</span> หรือ{' '}
              <span className="text-amber-300 font-mono">SadTalker</span> แทนในฟังก์ชัน{' '}
              <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-200">run_lipsync()</code> ได้ทันที
            </>
          ) : (
            <>
              This prototype uses <strong className="text-white">Image Warping & Oral Cavity Synthesis</strong> based on audio RMS energy. It is optimized for instant browser preview and rapid prototyping.
              <br className="mt-1" />
              For production-grade phoneme-accurate lip syncing, plug in deep learning models such as{' '}
              <span className="text-amber-300 font-mono">Wav2Lip</span> or{' '}
              <span className="text-amber-300 font-mono">SadTalker</span> in{' '}
              <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-200">modules/lipsync.py</code>.
            </>
          )}
        </p>
      </div>

      {/* Ethical Usage Safeguards */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-2">
          <ShieldCheck className="h-4 w-4" />
          <h4>{isTh ? '🔒 ข้อควรระวังและจริยธรรมการใช้งาน' : '🔒 Responsible AI & Ethics Notice'}</h4>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          {isTh ? (
            <>
              โปรดใช้เฉพาะรูปภาพและเสียงที่คุณมีสิทธิ์ใช้งานตามกฎหมาย (รูปของตนเองหรือได้รับอนุญาตอย่างชัดแจ้ง) 
              <br className="mt-1" />
              <strong className="text-white">ข้อห้ามเคร่งครัด:</strong> หลีกเลี่ยงการสร้างวิดีโอปลอม (Deepfakes) ของบุคคลจริงโดยไม่ได้รับความยินยอม
              (การใช้ <span className="text-amber-300 font-semibold">ตัวละครการ์ตูนและอวตาร</span> เป็นแนวทางที่ปลอดภัย ถูกลิขสิทธิ์ และเหมาะสำหรับแอนิเมชันคอนเทนต์ที่สุด)
            </>
          ) : (
            <>
              Please use only images and audio that you own or have explicit permission to use.
              <br className="mt-1" />
              <strong className="text-white">Strict Notice:</strong> Do not generate deceptive deepfakes of real individuals without their explicit consent, or use this tool for fraud, harassment, or spreading disinformation.
            </>
          )}
        </p>
      </div>
    </div>
  );
};
