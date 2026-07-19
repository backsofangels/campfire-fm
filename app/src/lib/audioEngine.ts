import { Howl, Howler } from 'howler';
import { useAppStore } from '../store/useAppStore';

const howlInstances = new Map<string, Howl>();

/**
 * Resumes the Web Audio context when the browser requires a user gesture.
 */
export function unlockAudio(): void {
  void Howler.ctx?.resume();
}

/**
 * Starts playback for a clip, creating a Howl instance when needed.
 */
export function play(fileId: string, url: string, loop: boolean, volume: number): void {
  const howl = getOrCreateHowl(fileId, url, loop, volume);
  howl.loop(loop);
  howl.volume(volume);
  howl.play();
  useAppStore.getState().setClipState(fileId, { playing: true, loop, volume, howlInstance: howl });
}

/**
 * Stops playback for a single clip.
 */
export function stop(fileId: string): void {
  const howl = howlInstances.get(fileId);

  if (!howl) {
    useAppStore.getState().setClipState(fileId, { playing: false });
    return;
  }

  howl.stop();
  useAppStore.getState().setClipState(fileId, { playing: false, howlInstance: howl });
}

/**
 * Updates the volume for a clip.
 */
export function setVolume(fileId: string, volume: number): void {
  const howl = howlInstances.get(fileId);

  if (howl) {
    howl.volume(volume);
  }

  useAppStore.getState().setClipState(fileId, { volume, howlInstance: howl });
}

/**
 * Updates the loop flag for a clip.
 */
export function setLoop(fileId: string, loop: boolean): void {
  const howl = howlInstances.get(fileId);

  if (howl) {
    howl.loop(loop);
  }

  useAppStore.getState().setClipState(fileId, { loop, howlInstance: howl });
}

/**
 * Stops all active clips and marks them as not playing.
 */
export function stopAll(): void {
  Howler.stop();

  const currentState = useAppStore.getState();
  for (const fileId of currentState.clipStates.keys()) {
    currentState.setClipState(fileId, { playing: false });
  }
}

function getOrCreateHowl(fileId: string, url: string, loop: boolean, volume: number): Howl {
  const existingHowl = howlInstances.get(fileId);

  if (existingHowl) {
    existingHowl.loop(loop);
    existingHowl.volume(volume);
    return existingHowl;
  }

  const howl = new Howl({
    src: [url],
    loop,
    volume,
    html5: false,
    onend: () => {
      const clipState = useAppStore.getState().clipStates.get(fileId);
      if (!clipState?.loop) {
        useAppStore.getState().setClipState(fileId, { playing: false, howlInstance: howl });
      }
    }
  });

  howlInstances.set(fileId, howl);
  useAppStore.getState().setClipState(fileId, { howlInstance: howl });
  return howl;
}