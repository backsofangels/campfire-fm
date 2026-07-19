import { unlockAudio } from '../lib/audioEngine';
import { useI18n } from '../lib/i18n';
import { useAppStore } from '../store/useAppStore';

export default function AudioUnlock(): JSX.Element | null {
  const { t } = useI18n();
  const audioUnlocked = useAppStore((state) => state.audioUnlocked);
  const setAudioUnlocked = useAppStore((state) => state.setAudioUnlocked);

  if (audioUnlocked) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-6">
      <div className="w-full max-w-md rounded-3xl border border-amber-400/30 bg-amber-950 px-8 py-10 text-center shadow-2xl shadow-black/40">
        <p className="mb-2 text-xs uppercase tracking-[0.35em] text-amber-300/70">{t.unlockTitle}</p>
        <h2 className="text-3xl font-semibold text-amber-50">{t.unlockHeading}</h2>
        <p className="mt-4 text-sm leading-6 text-amber-100/80">{t.unlockBody}</p>

        <button
          className="mt-8 rounded-full bg-amber-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-300"
          onClick={() => {
            unlockAudio();
            setAudioUnlocked(true);
          }}
          type="button"
        >
          {t.unlockButton}
        </button>
      </div>
    </div>
  );
}