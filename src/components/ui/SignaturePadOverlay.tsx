import { useEffect, useRef, useState } from 'react';
import SignaturePad from 'signature_pad';
import { I18N, type Language } from '@/constants/i18n';
import type { DualSignatures } from '@/types/passport';

export interface SignaturePadOverlayProps {
  readonly language: Language;
  readonly isOpen: boolean;
  readonly currentSignatures: DualSignatures;
  readonly onSave: (sigs: DualSignatures) => void;
  readonly onClose: () => void;
}

function initPad(canvas: HTMLCanvasElement | null): SignaturePad | null {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;

  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  const ctx = canvas.getContext('2d');
  ctx?.scale(ratio, ratio);

  return new SignaturePad(canvas, {
    penColor: '#102A4C',
    minWidth: 1.4,
    maxWidth: 3.1,
    throttle: 8,
  });
}

export function SignaturePadOverlay({
  language,
  isOpen,
  currentSignatures,
  onSave,
  onClose,
}: SignaturePadOverlayProps) {
  const t = I18N[language].signatureModal;
  const [mobileTab, setMobileTab] = useState<'marcos' | 'allison'>('marcos');

  const marcosCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const allisonCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const marcosPadRef = useRef<SignaturePad | null>(null);
  const allisonPadRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Defer 1 frame so mobile tabbed flex/grid layout has computed dimensions
    const raf = requestAnimationFrame(() => {
      if (!marcosPadRef.current) {
        marcosPadRef.current = initPad(marcosCanvasRef.current);
      }
      if (!allisonPadRef.current) {
        allisonPadRef.current = initPad(allisonCanvasRef.current);
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [isOpen, mobileTab]);

  useEffect(() => {
    if (!isOpen) {
      marcosPadRef.current?.off();
      allisonPadRef.current?.off();
      marcosPadRef.current = null;
      allisonPadRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    const mPad = marcosPadRef.current;
    const aPad = allisonPadRef.current;

    const marcos = mPad && !mPad.isEmpty() ? mPad.toDataURL('image/png') : currentSignatures.marcos;
    const allison =
      aPad && !aPad.isEmpty() ? aPad.toDataURL('image/png') : currentSignatures.allison;

    onSave({ marcos, allison });
    onClose();
  };

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-0 sm:bottom-24 z-30 mx-auto w-full sm:w-[94%] max-w-2xl rounded-t-3xl sm:rounded-2xl border border-[#102A4C]/15 bg-white/97 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4 shadow-2xl backdrop-blur-lg">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-serif text-sm font-bold text-[#102A4C]">{t.title}</p>
          <p className="text-[11px] text-[#4A596E]">{t.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[36px] min-w-[36px] rounded-lg px-2 py-1 text-xs text-[#4A596E] hover:bg-[#102A4C]/10 hover:text-[#102A4C] cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Mobile Tab Selector so each signature gets full width on portrait screens */}
      <div className="mb-3 flex gap-1.5 rounded-xl bg-[#102A4C]/8 p-1 sm:hidden">
        <button
          type="button"
          onClick={() => setMobileTab('marcos')}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
            mobileTab === 'marcos' ? 'bg-[#102A4C] text-white shadow-sm' : 'text-[#4A596E]'
          }`}
        >
          1. Marcos
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('allison')}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
            mobileTab === 'allison' ? 'bg-[#102A4C] text-white shadow-sm' : 'text-[#4A596E]'
          }`}
        >
          2. Allison
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Marcos Signature Field */}
        <div className={mobileTab === 'marcos' ? 'block' : 'hidden sm:block'}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#102A4C]">
              1. Marcos da Silva Xavier
            </span>
            <button
              type="button"
              onClick={() => {
                marcosPadRef.current?.clear();
                onSave({ ...currentSignatures, marcos: null });
              }}
              className="text-[11px] text-[#E86F2C] hover:underline cursor-pointer"
            >
              {t.clear}
            </button>
          </div>
          <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-[#102A4C]/25 bg-[#F4EFE3]">
            <canvas
              ref={marcosCanvasRef}
              className="h-40 sm:h-28 w-full touch-none cursor-crosshair block"
            />
            <div className="pointer-events-none absolute inset-x-4 bottom-6 border-b border-[#102A4C]/25" />
          </div>
        </div>

        {/* Allison Signature Field */}
        <div className={mobileTab === 'allison' ? 'block' : 'hidden sm:block'}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#102A4C]">
              2. Allison Pamela Ardon Segura
            </span>
            <button
              type="button"
              onClick={() => {
                allisonPadRef.current?.clear();
                onSave({ ...currentSignatures, allison: null });
              }}
              className="text-[11px] text-[#E86F2C] hover:underline cursor-pointer"
            >
              {t.clear}
            </button>
          </div>
          <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-[#102A4C]/25 bg-[#F4EFE3]">
            <canvas
              ref={allisonCanvasRef}
              className="h-40 sm:h-28 w-full touch-none cursor-crosshair block"
            />
            <div className="pointer-events-none absolute inset-x-4 bottom-6 border-b border-[#102A4C]/25" />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[40px] rounded-xl border border-[#102A4C]/15 px-3.5 py-1.5 text-xs font-medium text-[#102A4C] transition hover:bg-[#102A4C]/5 cursor-pointer"
        >
          {t.cancel}
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="min-h-[40px] rounded-xl bg-[#E86F2C] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#d86120] cursor-pointer"
        >
          {t.apply}
        </button>
      </div>
    </div>
  );
}
