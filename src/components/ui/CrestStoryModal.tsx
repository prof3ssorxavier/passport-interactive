import { I18N, type CrestStoryTopic, type Language } from '@/constants/i18n';
import { assetUrl } from '@/utils/assetUrl';

export interface CrestStoryModalProps {
  readonly language: Language;
  readonly activeTopic: CrestStoryTopic | null;
  readonly onSelectTopic: (topic: CrestStoryTopic) => void;
  readonly onClose: () => void;
}

export function CrestStoryModal({
  language,
  activeTopic,
  onSelectTopic,
  onClose,
}: CrestStoryModalProps) {
  if (!activeTopic) return null;

  const t = I18N[language].crestStory;
  const content = activeTopic === 'colibri' ? t.colibri : t.tangerine;

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-[#0B1B30]/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-[#D4AF37]/40 bg-[#FAF7F0]/96 p-6 text-[#102A4C] shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={assetUrl('assets/coat-of-arms.svg')}
              alt="Coat of Arms"
              className="h-12 w-12 rounded-xl bg-[#102A4C] p-1.5 object-contain shadow-sm"
            />
            <div>
              <h2 className="font-serif text-lg font-bold text-[#102A4C]">{t.title}</h2>
              <p className="text-xs text-[#4A596E]">{t.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-[#4A596E] hover:bg-[#102A4C]/10 hover:text-[#102A4C] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Topic Tabs */}
        <div className="mt-5 flex gap-2 rounded-2xl bg-[#102A4C]/8 p-1">
          <button
            type="button"
            onClick={() => onSelectTopic('colibri')}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition cursor-pointer ${
              activeTopic === 'colibri'
                ? 'bg-[#102A4C] text-[#F5DF89] shadow-sm'
                : 'text-[#4A596E] hover:text-[#102A4C]'
            }`}
          >
            {t.colibri.tab}
          </button>
          <button
            type="button"
            onClick={() => onSelectTopic('tangerine')}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition cursor-pointer ${
              activeTopic === 'tangerine'
                ? 'bg-[#E86F2C] text-white shadow-sm'
                : 'text-[#4A596E] hover:text-[#102A4C]'
            }`}
          >
            {t.tangerine.tab}
          </button>
        </div>

        {/* Story Body */}
        <div className="mt-5 rounded-2xl border border-[#102A4C]/10 bg-white/80 p-5">
          <h3 className="font-serif text-base font-bold text-[#102A4C]">{content.heading}</h3>
          <p className="mt-2.5 text-sm leading-relaxed text-[#2C3B50]">{content.body}</p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-[11px] text-[#4A596E]">{t.dateCaption}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#102A4C] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#183B68] cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
