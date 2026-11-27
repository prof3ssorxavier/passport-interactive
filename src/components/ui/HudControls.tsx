import { I18N, type CrestStoryTopic, type Language } from '@/constants/i18n';
import { PASSPORT_ID } from '@/constants/tokens';
import type { PageIndex } from '@/types/passport';
import { assetUrl } from '@/utils/assetUrl';

export interface HudControlsProps {
  readonly language: Language;
  readonly currentPage: PageIndex;
  readonly isSigning: boolean;
  readonly isInspecting: boolean;
  readonly canGoPrev: boolean;
  readonly canGoNext: boolean;
  readonly onChangeLanguage: (lang: Language) => void;
  readonly onGoToPage: (page: PageIndex) => void;
  readonly onPrevPage: () => void;
  readonly onNextPage: () => void;
  readonly onToggleSigning: () => void;
  readonly onToggleInspecting: () => void;
  readonly onOpenCrestStory: (topic: CrestStoryTopic) => void;
}

export function HudControls({
  language,
  currentPage,
  isSigning,
  isInspecting,
  canGoPrev,
  canGoNext,
  onChangeLanguage,
  onGoToPage,
  onPrevPage,
  onNextPage,
  onToggleSigning,
  onToggleInspecting,
  onOpenCrestStory,
}: HudControlsProps) {
  const t = I18N[language];
  const activeMeta = t.pages[currentPage] ?? t.pages[0];

  return (
    <div className="pointer-events-none fixed inset-0 flex flex-col justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6">
      {/* Top App Bar (compact & touch-friendly on mobile, spacious on desktop) */}
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto rounded-2xl border border-[#102A4C]/15 bg-white/88 px-3 py-2 sm:px-4 sm:py-2.5 backdrop-blur-md shadow-md">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img
              src={assetUrl('assets/coat-of-arms.svg')}
              alt={t.countryName}
              className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
            />
            <div>
              <p className="hidden sm:block font-serif text-xs font-bold tracking-[0.16em] text-[#102A4C] uppercase">
                {t.countryName}
              </p>
              <p className="sm:hidden font-serif text-[11px] font-bold tracking-[0.12em] text-[#102A4C] uppercase">
                TANGERINAS
              </p>
              <p className="font-mono text-[10px] sm:text-xs text-[#4A596E]">
                <span className="hidden sm:inline">{t.passportNoLabel} </span>
                <span className="font-bold text-[#102A4C]">{PASSPORT_ID}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {/* Quick Language Switcher (PT | ES) */}
          <div className="flex items-center rounded-full border border-[#102A4C]/15 bg-white/88 p-0.5 text-[11px] font-bold shadow-sm backdrop-blur-md">
            <button
              type="button"
              onClick={() => onChangeLanguage('pt')}
              className={`min-h-[32px] rounded-full px-2.5 py-1 transition cursor-pointer ${
                language === 'pt' ? 'bg-[#102A4C] text-white' : 'text-[#4A596E] hover:text-[#102A4C]'
              }`}
            >
              PT
            </button>
            <button
              type="button"
              onClick={() => onChangeLanguage('es')}
              className={`min-h-[32px] rounded-full px-2.5 py-1 transition cursor-pointer ${
                language === 'es' ? 'bg-[#102A4C] text-white' : 'text-[#4A596E] hover:text-[#102A4C]'
              }`}
            >
              ES
            </button>
          </div>

          {currentPage === 0 ? (
            <button
              type="button"
              onClick={() => onOpenCrestStory('colibri')}
              className="min-h-[36px] rounded-full border border-[#D4AF37]/60 bg-white/90 px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold text-[#102A4C] transition active:scale-95 shadow-sm backdrop-blur-md hover:border-[#D4AF37] hover:bg-[#FAF6EC] cursor-pointer"
            >
              ✦ <span className="hidden sm:inline">{t.crestStoryButton}</span>
              <span className="sm:hidden">{language === 'pt' ? 'Brasão' : 'Escudo'}</span>
            </button>
          ) : null}

          {/* Lift / Rest on Desk Toggle */}
          <button
            type="button"
            disabled={isSigning}
            onClick={onToggleInspecting}
            className={`min-h-[36px] rounded-full border px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold transition active:scale-95 shadow-sm backdrop-blur-md cursor-pointer disabled:opacity-40 ${
              isInspecting
                ? 'border-[#102A4C] bg-[#102A4C] text-white'
                : 'border-[#102A4C]/20 bg-white/88 text-[#102A4C] hover:border-[#102A4C]'
            }`}
          >
            {isInspecting ? t.restOnDeskButton : t.inspectButton}
          </button>

          {/* Dual Signature Trigger on Spread 1 */}
          {currentPage === 1 ? (
            <button
              type="button"
              onClick={onToggleSigning}
              className={`flex min-h-[36px] items-center gap-1.5 sm:gap-2 rounded-full border px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold tracking-wide transition active:scale-95 shadow-sm backdrop-blur-md cursor-pointer ${
                isSigning
                  ? 'border-[#E86F2C] bg-[#E86F2C] text-white'
                  : 'border-[#E86F2C]/50 bg-white/90 text-[#102A4C] hover:border-[#E86F2C]'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${isSigning ? 'bg-white animate-pulse' : 'bg-[#E86F2C]'}`}
              />
              {isSigning ? t.signingActiveButton : t.signButton}
            </button>
          ) : null}
        </div>
      </header>

      {/* Bottom Native-Style Navigation Tab Bar */}
      <footer className="flex flex-col items-center gap-2">
        {activeMeta ? (
          <p className="max-w-full truncate rounded-full bg-white/88 px-3.5 py-1 text-[11px] sm:text-xs text-[#4A596E] backdrop-blur-sm border border-[#102A4C]/12 shadow-sm">
            <span className="font-bold text-[#102A4C]">{activeMeta.label}</span>
            <span className="hidden sm:inline mx-2 text-[#102A4C]/25">•</span>
            <span className="hidden sm:inline">{activeMeta.description}</span>
          </p>
        ) : null}

        <div className="pointer-events-auto flex w-full max-w-md sm:w-auto items-center justify-between gap-1 sm:gap-2 rounded-2xl border border-[#102A4C]/15 bg-white/94 p-1.5 sm:p-2 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={!canGoPrev || isSigning}
            aria-label={t.prevButton}
            className="min-h-[44px] rounded-xl px-3 sm:px-3.5 py-2 text-xs font-semibold text-[#102A4C] transition active:scale-95 hover:bg-[#102A4C]/8 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="hidden sm:inline">{t.prevButton}</span>
            <span className="sm:hidden text-base">‹</span>
          </button>

          <div className="flex flex-1 items-center justify-center gap-1 px-0.5">
            {t.pages.map((page) => {
              const isActive = page.index === currentPage;
              return (
                <button
                  key={page.index}
                  type="button"
                  disabled={isSigning}
                  onClick={() => onGoToPage(page.index)}
                  className={`min-h-[44px] flex-1 sm:flex-none rounded-xl px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold transition active:scale-95 cursor-pointer disabled:opacity-40 ${
                    isActive
                      ? 'bg-[#102A4C] text-white shadow-sm'
                      : 'text-[#4A596E] hover:bg-[#102A4C]/8 hover:text-[#102A4C]'
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
            aria-label={t.nextButton}
            className="min-h-[44px] rounded-xl px-3 sm:px-3.5 py-2 text-xs font-semibold text-[#102A4C] transition active:scale-95 hover:bg-[#102A4C]/8 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="hidden sm:inline">{t.nextButton}</span>
            <span className="sm:hidden text-base">›</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
