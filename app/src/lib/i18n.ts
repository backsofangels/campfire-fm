import { useAppStore } from '../store/useAppStore';

export const languages = ['it', 'en'] as const;

export type Language = (typeof languages)[number];

export interface Messages {
  appTitle: string;
  appSubtitle: string;
  collectionPanel: string;
  collectionPanelAllDescription: string;
  collectionPanelSingleDescription: string;
  playAll: string;
  stopAll: string;
  noClips: string;
  noCollectionClips: string;
  deleteClip: string;
  deleteClipConfirm: string;
  deleteClipError: string;
  sidebarTitle: string;
  sidebarDescription: string;
  allClips: string;
  newCollection: string;
  uploadAudio: string;
  uploadError: string;
  globalStop: string;
  loading: string;
  unlockTitle: string;
  unlockHeading: string;
  unlockBody: string;
  unlockButton: string;
  createCollectionTitle: string;
  createCollectionHeading: string;
  close: string;
  collectionName: string;
  collectionPlaceholder: string;
  invalidCollectionName: string;
  create: string;
  cancel: string;
  cannotCreateCollection: string;
  play: string;
  stop: string;
  loopOn: string;
  loopOff: string;
  volume: string;
  collection: string;
  free: string;
  language: string;
  languageSelectorLabel: string;
  languageIt: string;
  languageEn: string;
  loadDataError: string;
}

export const messages: Record<Language, Messages> = {
  it: {
    appTitle: 'Soundboard di campagna',
    appSubtitle: 'Tutto pronto per il tavolo',
    collectionPanel: 'Pannello collezione',
    collectionPanelAllDescription: 'Tutte le clip disponibili in libreria, pronte per il tavolo.',
    collectionPanelSingleDescription: 'Riproduci tutta la scena o bilancia rapidamente i singoli strati.',
    playAll: 'Play All',
    stopAll: 'Stop All',
    noClips: 'Nessuna clip disponibile. Carica dei file audio per iniziare.',
    noCollectionClips: 'Questa collezione non contiene clip.',
    deleteClip: 'Elimina clip',
    deleteClipConfirm: 'Eliminare definitivamente questa clip?',
    deleteClipError: 'Impossibile eliminare la clip.',
    sidebarTitle: 'Scelte rapide',
    sidebarDescription: "Seleziona una scena o cambia rapidamente l'atmosfera.",
    allClips: 'Tutte le clip',
    newCollection: '+ Nuova collezione',
    uploadAudio: 'Carica audio',
    uploadError: 'Impossibile caricare il file audio.',
    globalStop: 'Stop tutto',
    loading: 'Caricamento...',
    unlockTitle: 'Sblocco audio',
    unlockHeading: 'Abilita audio',
    unlockBody: "Il browser richiede un tocco esplicito prima di riprodurre l'audio.",
    unlockButton: '🔥 Abilita audio',
    createCollectionTitle: 'Nuova collezione',
    createCollectionHeading: 'Crea collezione',
    close: 'Chiudi',
    collectionName: 'Nome collezione',
    collectionPlaceholder: 'Foresta, Taverna, Combattimento...',
    invalidCollectionName: 'Inserisci un nome valido.',
    create: 'Crea',
    cancel: 'Annulla',
    cannotCreateCollection: 'Impossibile creare la collezione.',
    play: 'Play',
    stop: 'Stop',
    loopOn: 'Loop on',
    loopOff: 'Loop off',
    volume: 'Volume',
    collection: 'Collezione',
    free: 'Libera',
    language: 'Lingua',
    languageSelectorLabel: 'Selettore lingua',
    languageIt: 'IT',
    languageEn: 'EN',
    loadDataError: 'Impossibile caricare i dati di Campfire.'
  },
  en: {
    appTitle: 'Campaign soundboard',
    appSubtitle: 'Ready for the table',
    collectionPanel: 'Collection panel',
    collectionPanelAllDescription: 'All clips available in the library, ready for the table.',
    collectionPanelSingleDescription: 'Play the whole scene or quickly balance individual layers.',
    playAll: 'Play All',
    stopAll: 'Stop All',
    noClips: 'No clips available. Upload audio files to get started.',
    noCollectionClips: 'This collection has no clips.',
    deleteClip: 'Delete clip',
    deleteClipConfirm: 'Delete this clip permanently?',
    deleteClipError: 'Unable to delete the clip.',
    sidebarTitle: 'Quick picks',
    sidebarDescription: 'Pick a scene or change the atmosphere quickly.',
    allClips: 'All clips',
    newCollection: '+ New collection',
    uploadAudio: 'Upload audio',
    uploadError: 'Unable to upload the audio file.',
    globalStop: 'Stop all',
    loading: 'Loading...',
    unlockTitle: 'Audio unlock',
    unlockHeading: 'Enable audio',
    unlockBody: 'The browser requires an explicit tap before it can play audio.',
    unlockButton: '🔥 Enable audio',
    createCollectionTitle: 'New collection',
    createCollectionHeading: 'Create collection',
    close: 'Close',
    collectionName: 'Collection name',
    collectionPlaceholder: 'Forest, Tavern, Combat...',
    invalidCollectionName: 'Enter a valid name.',
    create: 'Create',
    cancel: 'Cancel',
    cannotCreateCollection: 'Unable to create the collection.',
    play: 'Play',
    stop: 'Stop',
    loopOn: 'Loop on',
    loopOff: 'Loop off',
    volume: 'Volume',
    collection: 'Collection',
    free: 'Free',
    language: 'Language',
    languageSelectorLabel: 'Language selector',
    languageIt: 'IT',
    languageEn: 'EN',
    loadDataError: 'Unable to load Campfire data.'
  }
};

export function normalizeLanguage(language: string | null | undefined): Language {
  return language === 'en' ? 'en' : 'it';
}

export function useI18n(): {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Messages;
} {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  return {
    language,
    setLanguage,
    t: messages[language]
  };
}