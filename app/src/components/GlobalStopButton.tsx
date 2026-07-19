import { stopAll } from '../lib/audioEngine';
import { useI18n } from '../lib/i18n';

export default function GlobalStopButton(): JSX.Element {
  const { t } = useI18n();

  return (
    <button
      className="rounded-full border border-red-400/20 bg-stone-950/30 px-4 py-2 text-sm font-semibold text-red-100 transition hover:border-red-400/40 hover:bg-red-500/15"
      onClick={() => stopAll()}
      type="button"
    >
      ⏹ {t.globalStop}
    </button>
  );
}