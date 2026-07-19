import { useEffect, useMemo, useState } from 'react';
import { deleteAudio, getAudio, getCollections } from '../lib/api';
import { startPolling } from '../lib/polling';
import { useAppStore } from '../store/useAppStore';
import AudioUnlock from './AudioUnlock';
import AudioUpload from './AudioUpload';
import CollectionPanel from './CollectionPanel';
import GlobalStopButton from './GlobalStopButton';
import LanguageSwitcher from './LanguageSwitcher';
import NewCollectionModal from './NewCollectionModal';
import Sidebar from './Sidebar';
import Spinner from './Spinner';
import { messages, useI18n, normalizeLanguage } from '../lib/i18n';

export default function App(): JSX.Element {
  const { language, setLanguage, t } = useI18n();
  const collections = useAppStore((state) => state.collections);
  const audioIndex = useAppStore((state) => state.audioIndex);
  const clipStates = useAppStore((state) => state.clipStates);
  const activeCollectionId = useAppStore((state) => state.activeCollectionId);
  const isLoading = useAppStore((state) => state.isLoading);
  const setCollections = useAppStore((state) => state.setCollections);
  const setAudioIndex = useAppStore((state) => state.setAudioIndex);
  const setActiveCollection = useAppStore((state) => state.setActiveCollection);
  const setLoading = useAppStore((state) => state.setLoading);
  const initClipStates = useAppStore((state) => state.initClipStates);

  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeCollection = useMemo(
    () => collections.find((collection) => collection.id === activeCollectionId) ?? null,
    [activeCollectionId, collections]
  );

  useEffect(() => {
    const savedLanguage = normalizeLanguage(window.localStorage.getItem('campfire-language'));
    setLanguage(savedLanguage);
  }, [setLanguage]);

  useEffect(() => {
    window.localStorage.setItem('campfire-language', language);
    document.documentElement.lang = language;
    document.title = language === 'it' ? 'Campfire.fm - Soundboard di campagna' : 'Campfire.fm - Campaign soundboard';
  }, [language]);

  useEffect(() => {
    let stopPolling = () => undefined;
    let isCancelled = false;

    const initialize = async (): Promise<void> => {
      setLoading(true);

      try {
        const [nextAudioIndex, nextCollections] = await Promise.all([getAudio(), getCollections()]);

        if (isCancelled) {
          return;
        }

        setAudioIndex(nextAudioIndex);
        setCollections(nextCollections);
        initClipStates(nextCollections);
        setActiveCollection(null);
        stopPolling = startPolling(useAppStore.getState());
      } catch (error) {
        const currentLanguage = useAppStore.getState().language;
        const message = error instanceof Error ? error.message : messages[currentLanguage].loadDataError;
        setErrorMessage(message);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      isCancelled = true;
      stopPolling();
    };
  }, [initClipStates, setActiveCollection, setAudioIndex, setCollections, setLoading]);

  const refreshData = async (): Promise<void> => {
    const [nextAudioIndex, nextCollections] = await Promise.all([getAudio(), getCollections()]);
    setAudioIndex(nextAudioIndex);
    setCollections(nextCollections);
    initClipStates(nextCollections);
  };

  const handleDeleteClip = async (fileName: string): Promise<void> => {
    await deleteAudio(fileName);
    await refreshData();
  };

  return (
    <>
      <AudioUnlock />
      {isLoading ? <Spinner message={t.loading} /> : null}

      <div className="relative isolate flex min-h-screen overflow-hidden text-amber-50">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(120,53,15,0.32),_transparent_26%),linear-gradient(180deg,_rgba(120,53,15,0.28),_transparent_24%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:72px_72px] opacity-70 [mask-image:linear-gradient(180deg,rgba(0,0,0,0.6),transparent_100%)]" />

        <Sidebar
          collections={collections}
          activeCollectionId={activeCollectionId}
          onSelect={setActiveCollection}
          onCreateCollection={() => setIsCreateCollectionOpen(true)}
        />

        <main className="relative z-10 flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-amber-900/70 bg-stone-950/75 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-300/70">Campfire.fm</p>
              <h1 className="text-2xl font-semibold text-amber-50 sm:text-3xl">{t.appTitle}</h1>
              <p className="mt-1 text-sm text-amber-100/60">{t.appSubtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <LanguageSwitcher />
              <AudioUpload />
              <GlobalStopButton />
            </div>
          </header>

          {errorMessage ? (
            <div className="mx-4 mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100 shadow-lg shadow-black/20 sm:mx-6">
              {errorMessage}
            </div>
          ) : null}

          <section className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
            <CollectionPanel
              collection={activeCollection}
              collections={collections}
              audioIndex={audioIndex}
              clipStates={clipStates}
              onDeleteClip={handleDeleteClip}
            />
          </section>
        </main>
      </div>

      <NewCollectionModal isOpen={isCreateCollectionOpen} onClose={() => setIsCreateCollectionOpen(false)} />
    </>
  );
}