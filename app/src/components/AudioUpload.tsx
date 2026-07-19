import { useRef, useState } from 'react';
import { uploadAudio } from '../lib/api';
import { useAppStore } from '../store/useAppStore';

interface UploadItem {
  name: string;
  progress: number;
}

export default function AudioUpload(): JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setLoading = useAppStore((state) => state.setLoading);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesSelected = async (files: FileList | null): Promise<void> => {
    if (!files || files.length === 0) {
      return;
    }

    const queuedFiles = Array.from(files);
    setErrorMessage(null);
    setLoading(true);
    setUploads(queuedFiles.map((file) => ({ name: file.name, progress: 0 })));

    try {
      for (const file of queuedFiles) {
        await uploadAudio(file, (progress) => {
          setUploads((currentUploads) =>
            currentUploads.map((item) => (item.name === file.name ? { ...item, progress } : item))
          );
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossibile caricare il file audio.';
      setErrorMessage(message);
    } finally {
      setUploads([]);
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-300"
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        Carica audio
      </button>

      <input
        ref={inputRef}
        accept="audio/*"
        className="hidden"
        multiple
        onChange={(event) => {
          void handleFilesSelected(event.target.files);
        }}
        type="file"
      />

      {errorMessage ? (
        <div className="max-w-md rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100 shadow-lg shadow-black/10">
          {errorMessage}
        </div>
      ) : null}

      {uploads.length > 0 ? (
        <div className="min-w-72 max-w-md rounded-2xl border border-amber-900/60 bg-amber-950/80 p-3 text-xs text-amber-100 sm:min-w-80">
          <div className="space-y-3">
            {uploads.map((upload) => (
              <div key={upload.name}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="truncate">{upload.name}</span>
                  <span>{upload.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-amber-950">
                  <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${upload.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}