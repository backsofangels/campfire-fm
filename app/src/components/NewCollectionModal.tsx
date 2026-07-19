import { useState } from 'react';
import { createCollection } from '../lib/api';
import { useAppStore } from '../store/useAppStore';

interface NewCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewCollectionModal({ isOpen, onClose }: NewCollectionModalProps): JSX.Element | null {
  const setLoading = useAppStore((state) => state.setLoading);
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleCreate = async (): Promise<void> => {
    const trimmedName = name.trim();

    if (trimmedName === '') {
      setErrorMessage('Inserisci un nome valido.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);
    setIsSubmitting(true);

    try {
      await createCollection(trimmedName);
      setName('');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossibile creare la collezione.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 px-6">
      <div className="w-full max-w-lg rounded-3xl border border-amber-400/20 bg-amber-950 p-6 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-300/60">New collection</p>
            <h2 className="mt-2 text-2xl font-semibold text-amber-50">Crea collezione</h2>
          </div>

          <button className="text-sm text-amber-200/60 transition hover:text-amber-100" onClick={onClose} type="button">
            Chiudi
          </button>
        </div>

        <label className="mt-6 block text-sm text-amber-100/80">
          Nome collezione
          <input
            className="mt-2 w-full rounded-2xl border border-amber-900/60 bg-slate-950 px-4 py-3 text-amber-50 outline-none ring-0 placeholder:text-amber-100/30 focus:border-amber-400"
            onChange={(event) => setName(event.target.value)}
            placeholder="Foresta, Taverna, Combattimento..."
            type="text"
            value={name}
          />
        </label>

        {errorMessage ? <p className="mt-3 text-sm text-red-300">{errorMessage}</p> : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-full border border-amber-900/70 px-5 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-900/40"
            onClick={onClose}
            type="button"
          >
            Annulla
          </button>
          <button
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={() => {
              void handleCreate();
            }}
            type="button"
          >
            Crea
          </button>
        </div>
      </div>
    </div>
  );
}