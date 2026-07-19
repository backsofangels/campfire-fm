import type { AudioFile, Collection } from '../../../types';
import ClipCard from './ClipCard';
import type { ClipState } from '../store/useAppStore';
import { stop, play } from '../lib/audioEngine';
import { updateCollection } from '../lib/api';
import { useAppStore } from '../store/useAppStore';

interface CollectionPanelProps {
  collection: Collection | null;
  collections: Collection[];
  audioIndex: AudioFile[];
  clipStates: Map<string, ClipState>;
}

export default function CollectionPanel({ collection, collections, audioIndex, clipStates }: CollectionPanelProps): JSX.Element {
  const clips = collection ? collection.clips : [];
  const panelAudioFiles = collection ? clips.map((clip) => resolveAudioFile(clip.file, audioIndex)) : audioIndex;
  const title = collection?.name ?? 'Tutte le clip';
  const setCollections = useAppStore((state) => state.setCollections);
  const initClipStates = useAppStore((state) => state.initClipStates);

  const handlePlayAll = (): void => {
    for (const audioFile of panelAudioFiles) {
      const clipState = clipStates.get(audioFile.id);
      play(audioFile.id, audioFile.url, clipState?.loop ?? false, clipState?.volume ?? 1);
    }
  };

  const handleStopAll = (): void => {
    for (const audioFile of panelAudioFiles) {
      stop(audioFile.id);
    }
  };

  const handleAssignCollection = async (fileName: string, targetCollectionId: string | null): Promise<void> => {
    const fileKey = normalizeClipFileKey(fileName);
    const sourceCollection = collections.find((candidate) => candidate.clips.some((clip) => normalizeClipFileKey(clip.file) === fileKey)) ?? null;
    const sourceCollectionId = sourceCollection?.id ?? null;

    if (sourceCollectionId === targetCollectionId) {
      return;
    }

    const currentClipState = clipStates.get(fileKey);
    const clipConfig = {
      file: fileName,
      loop: currentClipState?.loop ?? false,
      defaultVolume: currentClipState?.volume ?? 1
    };

    const nextCollections = collections.map((candidate) => {
      const withoutClip = candidate.clips.filter((clip) => normalizeClipFileKey(clip.file) !== fileKey);

      if (targetCollectionId === candidate.id) {
        return {
          ...candidate,
          clips: withoutClip.some((clip) => normalizeClipFileKey(clip.file) === fileKey) ? withoutClip : [...withoutClip, clipConfig]
        };
      }

      if (candidate.id === sourceCollectionId) {
        return {
          ...candidate,
          clips: withoutClip
        };
      }

      return candidate;
    });

    const uniqueNextCollections = targetCollectionId === null
      ? nextCollections.map((candidate) => (candidate.id === sourceCollectionId ? { ...candidate, clips: candidate.clips.filter((clip) => normalizeClipFileKey(clip.file) !== fileKey) } : candidate))
      : nextCollections;

    if (sourceCollectionId) {
      const source = uniqueNextCollections.find((candidate) => candidate.id === sourceCollectionId);
      if (source) {
        await updateCollection(sourceCollectionId, { clips: source.clips });
      }
    }

    if (targetCollectionId) {
      const target = uniqueNextCollections.find((candidate) => candidate.id === targetCollectionId);
      if (target) {
        await updateCollection(targetCollectionId, { clips: target.clips });
      }
    }

    setCollections(uniqueNextCollections);
    initClipStates(uniqueNextCollections);
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-[2rem] border border-amber-400/10 bg-stone-950/35 px-5 py-5 shadow-lg shadow-black/10 backdrop-blur-xl sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300/60">Collection panel</p>
          <h2 className="mt-2 text-3xl font-semibold text-amber-50 sm:text-4xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-100/65">
            {collection ? 'Riproduci tutta la scena o bilancia rapidamente i singoli strati.' : 'Tutte le clip disponibili in libreria, pronte per il tavolo.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            onClick={handlePlayAll}
            type="button"
          >
            ▶ Play All
          </button>
          <button
            className="rounded-full border border-red-400/30 bg-red-500/10 px-5 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
            onClick={handleStopAll}
            type="button"
          >
            ⏹ Stop All
          </button>
        </div>
      </div>

      {panelAudioFiles.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-amber-900/80 bg-stone-950/35 px-8 py-14 text-center text-amber-100/70 shadow-lg shadow-black/10 backdrop-blur-xl">
          Nessuna clip disponibile. Carica dei file audio per iniziare.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
          {panelAudioFiles.map((audioFile) => {
            const clipState = clipStates.get(audioFile.id) ?? {
              fileId: audioFile.id,
              playing: false,
              loop: false,
              volume: 1
            };
            const assignedCollection = findAssignedCollection(audioFile.filename, collections);

            return (
              <ClipCard
                key={audioFile.id}
                audioFile={audioFile}
                assignedCollectionId={assignedCollection?.id ?? null}
                assignedCollectionName={assignedCollection?.name ?? null}
                clipState={clipState}
                collections={collections}
                onAssignCollection={handleAssignCollection}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function resolveAudioFile(fileName: string, audioIndex: AudioFile[]): AudioFile {
  const foundAudioFile = audioIndex.find((entry) => entry.filename === fileName || entry.id === fileName.replace(/\.[^.]+$/, ''));

  if (foundAudioFile) {
    return foundAudioFile;
  }

  const id = fileName.replace(/\.[^.]+$/, '');
  return {
    id,
    filename: fileName,
    url: `/audio/${fileName}`
  };
}

function findAssignedCollection(fileName: string, collections: Collection[]): Collection | null {
  const fileKey = normalizeClipFileKey(fileName);
  return collections.find((candidate) =>
    candidate.clips.some((clip) => normalizeClipFileKey(clip.file) === fileKey)
  ) ?? null;
}

function normalizeClipFileKey(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}