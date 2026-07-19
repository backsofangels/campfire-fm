import { useI18n } from '../lib/i18n';

export default function LanguageSwitcher(): JSX.Element {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="flex items-center gap-2 rounded-full border border-amber-900/70 bg-stone-950/35 p-1">
      <span className="sr-only">{t.languageSelectorLabel}</span>
      {(['it', 'en'] as const).map((option) => {
        const isActive = language === option;

        return (
          <button
            key={option}
            aria-pressed={isActive}
            className={[
              'min-w-12 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition',
              isActive ? 'bg-amber-300 text-slate-950' : 'text-amber-100/70 hover:bg-amber-900/40 hover:text-amber-50'
            ].join(' ')}
            onClick={() => setLanguage(option)}
            type="button"
          >
            {option === 'it' ? t.languageIt : t.languageEn}
          </button>
        );
      })}
    </div>
  );
}