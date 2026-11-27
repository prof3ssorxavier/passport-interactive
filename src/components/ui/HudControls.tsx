import { COUNTRY_NAME, PASSPORT_ID, PASSPORT_PAGES } from '@/constants/tokens';
import type { PageIndex } from '@/types/passport';

export interface HudControlsProps {
  readonly currentPage: PageIndex;
  readonly isSigning: boolean;
  readonly canGoPrev: boolean;
  readonly canGoNext: boolean;
  readonly onGoToPage: (page: PageIndex) => void;
  readonly onPrevPage: () => void;
  readonly onNextPage: () => void;
  readonly onToggleSigning: () => void;
}

export function HudControls({
  currentPage,
  isSigning,
  canGoPrev,
  canGoNext,
  onGoToPage,
  onPrevPage,
  onNextPage,
  onToggleSigning,
}: HudControlsProps) {
  const activeMeta = PASSPORT_PAGES[currentPage] ?? PASSPORT_PAGES[0];

  return (
    <div className="pointer-events-none fixed inset-0 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Identity Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="pointer-events-auto rounded-2xl border border-[#D4AF37]/30 bg-[#102A4C]/80 px-4 py-2.5 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3">
            <img
              src="/assets/coat-of-arms.svg"
              alt="Brasão da República das Tangerinas"
              className="h-8 w-8 object-contain"
            />
            <div>
              <p className="font-serif text-xs tracking-[0.2em] text-[#D4AF37] uppercase">
                {COUNTRY_NAME}
              </p>
              <p className="font-mono text-xs text-[#F7F3E8]/80">
                PASSAPORTE Nº <span className="font-bold text-[#F7F3E8]">{PASSPORT_ID}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Touch Isolation Toggle on Page 1 (Profile + Signature) */}
        {currentPage === 1 ? (
          <button
            type="button"
            onClick={onToggleSigning}
            className={`pointer-events-auto flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-wide transition shadow-lg backdrop-blur-md cursor-pointer ${
              isSigning
                ? 'border-[#E86F2C] bg-[#E86F2C] text-white'
                : 'border-[#D4AF37]/40 bg-[#102A4C]/80 text-[#F7F3E8] hover:border-[#E86F2C]'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isSigning ? 'bg-white animate-pulse' : 'bg-[#D4AF37]'}`}
            />
            {isSigning ? 'Assinando (OrbitControls Travado)' : 'Modo Assinatura'}
          </button>
        ) : null}
      </header>

      {/* Bottom Navigation Dock */}
      <footer className="flex flex-col items-center gap-3">
        {activeMeta ? (
          <p className="rounded-full bg-[#091930]/75 px-3.5 py-1 text-xs text-[#F7F3E8]/85 backdrop-blur-sm border border-white/10">
            <span className="font-semibold text-[#D4AF37]">{activeMeta.label}</span>
            <span className="mx-2 text-white/30">•</span>
            <span>{activeMeta.description}</span>
          </p>
        ) : null}

        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-[#D4AF37]/25 bg-[#102A4C]/85 p-2 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={!canGoPrev || isSigning}
            className="rounded-xl px-3.5 py-2 text-xs font-semibold text-[#F7F3E8] transition hover:bg-white/10 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
          >
            ← Anterior
          </button>

          <div className="flex items-center gap-1 px-1">
            {PASSPORT_PAGES.map((page) => {
              const isActive = page.index === currentPage;
              return (
                <button
                  key={page.index}
                  type="button"
                  disabled={isSigning}
                  onClick={() => onGoToPage(page.index)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition cursor-pointer disabled:opacity-40 ${
                    isActive
                      ? 'bg-[#E86F2C] text-white shadow-sm'
                      : 'text-[#F7F3E8]/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {page.shortLabel}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onNextPage}
            disabled={!canGoNext || isSigning}
            className="rounded-xl px-3.5 py-2 text-xs font-semibold text-[#F7F3E8] transition hover:bg-white/10 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
          >
            Próxima →
          </button>
        </div>
      </footer>
    </div>
  );
}
