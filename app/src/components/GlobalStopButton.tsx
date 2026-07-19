import { stopAll } from '../lib/audioEngine';

export default function GlobalStopButton(): JSX.Element {
  return (
    <button
      className="rounded-full border border-red-400/20 bg-stone-950/30 px-4 py-2 text-sm font-semibold text-red-100 transition hover:border-red-400/40 hover:bg-red-500/15"
      onClick={() => stopAll()}
      type="button"
    >
      ⏹ Stop tutto
    </button>
  );
}