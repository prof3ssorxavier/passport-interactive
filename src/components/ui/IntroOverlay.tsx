import { useEffect } from 'react';
import { useProgress } from '@react-three/drei';
import { preloadDeskModels } from '@/components/canvas/CustomGlbProp';
import type { Language } from '@/constants/i18n';
import { assetUrl } from '@/utils/assetUrl';

export interface IntroOverlayProps {
  readonly isVisible: boolean;
  readonly isReady: boolean;
  readonly onSelectLanguage: (lang: Language) => void;
}

export function IntroOverlay({ isVisible, isReady, onSelectLanguage }: IntroOverlayProps) {
  const { progress, active } = useProgress();

  useEffect(() => {
    preloadDeskModels();
  }, []);

  const canEnter = isReady && !active;
  const pct = canEnter ? 100 : Math.min(96, Math.max(12, Math.round(progress)));

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#102A4C]/94 p-4 backdrop-blur-md transition-opacity duration-700 ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="w-full max-w-md rounded-3xl border border-[#D4AF37]/35 bg-gradient-to-b from-[#14335B]/95 to-[#0B1E38]/95 p-6 sm:p-8 text-center shadow-2xl">
        <img
          src={assetUrl('assets/coat-of-arms.svg')}
          alt="Coat of Arms"
          className="mx-auto mb-4 h-20 w-20 sm:h-24 sm:w-24 object-contain drop-shadow-[0_6px_20px_rgba(212,175,55,0.3)]"
        />

        <p className="font-mono text-[11px] tracking-[0.28em] text-[#D4AF37]/90 uppercase">
          MA060826 • 06.08.2026
        </p>

        <h1 className="mt-2 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#F7F3E8]">
          Welcome to our pass of life
        </h1>

        <p className="mt-2.5 text-xs leading-relaxed text-[#F7F3E8]/70">
          Escolha seu idioma • Elige tu idioma
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!canEnter}
            onClick={() => onSelectLanguage('pt')}
            className="group flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border border-[#D4AF37]/35 bg-white/5 px-4 py-3.5 text-[#F7F3E8] transition active:scale-95 hover:border-[#E86F2C] hover:bg-[#E86F2C]/20 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
          >
            <span className="font-serif text-base font-bold text-[#F5DF89] group-hover:text-white">
              Português
            </span>
            <span className="font-mono text-[11px] text-[#F7F3E8]/65">Brasil</span>
          </button>

          <button
            type="button"
            disabled={!canEnter}
            onClick={() => onSelectLanguage('es')}
            className="group flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border border-[#D4AF37]/35 bg-white/5 px-4 py-3.5 text-[#F7F3E8] transition active:scale-95 hover:border-[#E86F2C] hover:bg-[#E86F2C]/20 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
          >
            <span className="font-serif text-base font-bold text-[#F5DF89] group-hover:text-white">
              Español
            </span>
            <span className="font-mono text-[11px] text-[#F7F3E8]/65">Honduras</span>
          </button>
        </div>

        {/* Sleek Asset Warmup Progress Bar */}
        <div className="mt-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E86F2C] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 font-mono text-[11px] text-[#D4AF37]/80">
            {canEnter
              ? '✓ Passaporte pronto • Pasaporte listo'
              : `Preparando modelos 3D... ${pct}%`}
          </p>
        </div>
      </div>
    </div>
  );
}
