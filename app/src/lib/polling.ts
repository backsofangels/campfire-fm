import type { AppStore } from '../store/useAppStore';
import { useAppStore } from '../store/useAppStore';
import { getAudio, getCollections } from './api';

/**
 * Starts polling the server for audio and collection updates.
 */
export function startPolling(store: AppStore, intervalMs = 2000): () => void {
  let previousAudioSignature = serializeState(store.audioIndex);
  let previousCollectionsSignature = serializeState(store.collections);

  const tick = async (): Promise<void> => {
    const currentStore = useAppStore.getState();

    if (currentStore.isLoading) {
      return;
    }

    try {
      const [audioIndex, collections] = await Promise.all([getAudio(), getCollections()]);
      const nextAudioSignature = serializeState(audioIndex);
      const nextCollectionsSignature = serializeState(collections);

      if (nextAudioSignature !== previousAudioSignature) {
        currentStore.setAudioIndex(audioIndex);
        previousAudioSignature = nextAudioSignature;
      }

      if (nextCollectionsSignature !== previousCollectionsSignature) {
        currentStore.setCollections(collections);
        currentStore.initClipStates(collections);
        previousCollectionsSignature = nextCollectionsSignature;
      }
    } catch {
      // Polling should fail silently and retry on the next tick.
    }
  };

  void tick();
  const timer = setInterval(() => {
    void tick();
  }, intervalMs);

  return () => {
    clearInterval(timer);
  };
}

function serializeState(value: unknown): string {
  return JSON.stringify(value);
}