import { create } from 'zustand';
import type { Howl } from 'howler';
import type { AudioFile, Collection, ClipConfig } from '../../../types';

export interface ClipState {
  fileId: string;
  playing: boolean;
  loop: boolean;
  volume: number;
  howlInstance?: Howl;
}

export interface AppStore {
  collections: Collection[];
  audioIndex: AudioFile[];
  clipStates: Map<string, ClipState>;
  activeCollectionId: string | null;
  audioUnlocked: boolean;
  isLoading: boolean;
  setCollections: (collections: Collection[]) => void;
  setAudioIndex: (audioIndex: AudioFile[]) => void;
  setClipState: (fileId: string, state: Partial<ClipState>) => void;
  setActiveCollection: (id: string | null) => void;
  setAudioUnlocked: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  initClipStates: (collections: Collection[]) => void;
}

function createClipState(fileId: string, clip: ClipConfig): ClipState {
  return {
    fileId,
    playing: false,
    loop: clip.loop,
    volume: clip.defaultVolume,
    howlInstance: undefined
  };
}

export const useAppStore = create<AppStore>((set, get) => ({
  collections: [],
  audioIndex: [],
  clipStates: new Map<string, ClipState>(),
  activeCollectionId: null,
  audioUnlocked: false,
  isLoading: false,
  setCollections: (collections) => set({ collections }),
  setAudioIndex: (audioIndex) => set({ audioIndex }),
  setClipState: (fileId, state) => {
    const nextClipStates = new Map(get().clipStates);
    const currentClipState = nextClipStates.get(fileId) ?? {
      fileId,
      playing: false,
      loop: false,
      volume: 1,
      howlInstance: undefined
    };

    nextClipStates.set(fileId, {
      ...currentClipState,
      ...state,
      fileId
    });

    set({ clipStates: nextClipStates });
  },
  setActiveCollection: (id) => set({ activeCollectionId: id }),
  setAudioUnlocked: (value) => set({ audioUnlocked: value }),
  setLoading: (value) => set({ isLoading: value }),
  initClipStates: (collections) => {
    const nextClipStates = new Map(get().clipStates);

    for (const collection of collections) {
      for (const clip of collection.clips) {
        if (!nextClipStates.has(clip.file)) {
          nextClipStates.set(clip.file, createClipState(clip.file, clip));
        }
      }
    }

    set({ clipStates: nextClipStates });
  }
}));

export function getClipState(fileId: string): ClipState | undefined {
  return useAppStore.getState().clipStates.get(fileId);
}