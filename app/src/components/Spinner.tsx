import { useI18n } from '../lib/i18n';

interface SpinnerProps {
  message?: string;
}

export default function Spinner({ message }: SpinnerProps): JSX.Element {
  const { t } = useI18n();
  const resolvedMessage = message ?? t.loading;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-6">
      <div className="flex items-center gap-4 rounded-2xl border border-amber-400/20 bg-amber-950 px-6 py-4 shadow-xl shadow-black/40">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        <p className="text-sm font-medium text-amber-50">{resolvedMessage}</p>
      </div>
    </div>
  );
}