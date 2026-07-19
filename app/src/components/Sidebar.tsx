import type { Collection } from '../../../types';
import { useI18n } from '../lib/i18n';

interface SidebarProps {
  collections: Collection[];
  activeCollectionId: string | null;
  onSelect: (id: string | null) => void;
  onCreateCollection: () => void;
}

export default function Sidebar({ collections, activeCollectionId, onSelect, onCreateCollection }: SidebarProps): JSX.Element {
  const { t } = useI18n();

  return (
    <aside className="sticky top-0 z-20 flex w-full shrink-0 flex-col border-b border-amber-900/70 bg-stone-950/70 px-4 py-4 backdrop-blur-xl md:h-screen md:w-80 md:border-b-0 md:border-r md:px-4 md:py-6">
      <div className="mb-4 rounded-3xl border border-amber-400/10 bg-amber-400/5 px-4 py-4 shadow-inner shadow-black/10 md:mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-300/60">{t.sidebarTitle}</p>
        <h2 className="mt-2 text-lg font-semibold text-amber-50 md:text-xl">Campfire.fm</h2>
        <p className="mt-2 text-sm leading-6 text-amber-100/60">{t.sidebarDescription}</p>
      </div>

      <nav className="flex flex-1 gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-y-auto md:overflow-x-hidden md:pb-0 md:pr-1">
        <button
          className={navButtonClass(activeCollectionId === null)}
          onClick={() => onSelect(null)}
          type="button"
        >
          {t.allClips}
        </button>

        <div className="flex gap-2 md:mt-2 md:flex-col">
          {collections.map((collection) => (
            <button
              key={collection.id}
              className={navButtonClass(activeCollectionId === collection.id)}
              onClick={() => onSelect(collection.id)}
              type="button"
            >
              {collection.name}
            </button>
          ))}
        </div>
      </nav>

      <button
        className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-50 shadow-lg shadow-black/15 transition hover:bg-amber-400/20 md:mt-6"
        onClick={onCreateCollection}
        type="button"
      >
        {t.newCollection}
      </button>
    </aside>
  );
}

function navButtonClass(isActive: boolean): string {
  return [
    'min-w-max rounded-2xl px-4 py-3 text-left text-sm font-medium transition duration-200 md:min-w-0',
    isActive
      ? 'bg-amber-300 text-slate-950 shadow-lg shadow-amber-950/30 ring-1 ring-amber-200/40'
      : 'bg-stone-950/35 text-amber-100 ring-1 ring-amber-900/60 hover:bg-amber-900/50 hover:ring-amber-700/50'
  ].join(' ');
}