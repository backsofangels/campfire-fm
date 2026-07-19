import { useEffect, useState, type ReactElement } from 'react';
import type { AudioFile, Collection } from '../../../types';
import type { ClipState } from '../store/useAppStore';
import { play, setLoop, setVolume, stop } from '../lib/audioEngine';

interface ClipCardProps {
  audioFile: AudioFile;
  clipState: ClipState;
  collections: Collection[];
  assignedCollectionId: string | null;
  assignedCollectionName: string | null;
  onAssignCollection: (fileName: string, targetCollectionId: string | null) => Promise<void> | void;
}

export default function ClipCard({
  audioFile,
  clipState,
  collections,
  assignedCollectionId,
  assignedCollectionName,
  onAssignCollection
}: ClipCardProps): ReactElement {
  const [localVolume, setLocalVolume] = useState(clipState.volume);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    setLocalVolume(clipState.volume);
  }, [clipState.volume]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVolume(audioFile.id, localVolume);
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [audioFile.id, localVolume]);

  const handlePlayToggle = (): void => {
    if (clipState.playing) {
      stop(audioFile.id);
      return;
    }

    play(audioFile.id, audioFile.url, clipState.loop, localVolume);
  };

  const handleAssignmentChange = async (targetCollectionId: string): Promise<void> => {
    const nextCollectionId = targetCollectionId === '' ? null : targetCollectionId;

    if (nextCollectionId === assignedCollectionId) {
      return;
    }

    setIsMoving(true);
    try {
      await onAssignCollection(audioFile.filename, nextCollectionId);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <article
      className={[
        'group rounded-[1.75rem] border p-4 shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/20',
        clipState.playing
          ? 'border-amber-300/70 bg-[linear-gradient(180deg,rgba(251,191,36,0.14),rgba(41,37,36,0.72))]'
          : 'border-amber-900/60 bg-[linear-gradient(180deg,rgba(28,25,23,0.92),rgba(41,37,36,0.74))]'
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-amber-50 transition group-hover:text-amber-100">{audioFile.id}</h3>
          <p className="mt-1 text-xs text-amber-200/60">{audioFile.filename}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.24em]">
            <span
              className={[
                'rounded-full px-3 py-1 ring-1',
                assignedCollectionName
                  ? 'bg-amber-300/10 text-amber-100 ring-amber-300/20'
                  : 'bg-stone-950/50 text-amber-200/70 ring-amber-900/60'
              ].join(' ')}
            >
              {assignedCollectionName ?? 'Libera'}
            </span>
          </div>
        </div>

        <button
          className={[
            'rounded-full px-4 py-2 text-sm font-semibold transition',
            clipState.playing ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
          ].join(' ')}
          onClick={handlePlayToggle}
          type="button"
        >
          {clipState.playing ? 'Stop' : 'Play'}
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <button
            className={[
              'rounded-full border px-4 py-2 text-sm font-medium transition duration-200',
              clipState.loop
                ? 'border-amber-300 bg-amber-300/15 text-amber-50'
                : 'border-amber-900/60 bg-stone-950/30 text-amber-100 hover:bg-amber-900/50'
            ].join(' ')}
            onClick={() => setLoop(audioFile.id, !clipState.loop)}
            type="button"
          >
            🔁 Loop {clipState.loop ? 'on' : 'off'}
          </button>

          <label className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-amber-200/50 lg:min-w-[16rem] lg:justify-end">
            <span>Collezione</span>
            <select
              className="w-full rounded-full border border-amber-900/60 bg-stone-950/60 px-3 py-2 text-sm tracking-normal text-amber-50 outline-none transition focus:border-amber-400 lg:max-w-[14rem]"
              disabled={isMoving}
              onChange={(event) => {
                void handleAssignmentChange(event.target.value);
              }}
              value={assignedCollectionId ?? ''}
            >
              <option value="">Libera</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.3em] text-amber-200/50">Volume</span>
          <input
            className="campfire-range h-2 w-full cursor-pointer"
            max="1"
            min="0"
            onChange={(event) => setLocalVolume(Number(event.target.value))}
            step="0.01"
            type="range"
            value={localVolume}
          />
          <span className="w-10 text-right text-xs text-amber-100/60">{Math.round(localVolume * 100)}%</span>
        </div>
      </div>
    </article>
  );
}