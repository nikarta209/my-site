import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  buildEditorsChoice,
  buildFeatured400,
  buildNewArrivals,
  buildReadersChoice,
  buildSquare600,
  buildTopSlider,
  buildWideBanners,
  createSeen,
  generatePlaceholders,
  getHomeMedia,
  loadBooks,
  type Book,
  type HomeMedia,
  type Slide,
} from '@/api/books';
import { TopSlider } from '@/components/home/TopSlider';
import { TabsNav, type TabKey } from '@/components/home/TabsNav';
import { BookCarousel400 } from '@/components/home/Carousels/BookCarousel400';
import { BookCarousel600 } from '@/components/home/Carousels/BookCarousel600';
import { WideBanners1600 } from '@/components/home/Carousels/WideBanners1600';
import { Featured400 } from '@/components/home/Carousels/Featured400';
import { TwinNoteBlocks } from '@/components/home/ReadersChoice/TwinNoteBlocks';
import { useTranslation } from '@/components/i18n/SimpleI18n';

type DerivedContent = {
  slider: Slide[];
  newArrivals: ReturnType<typeof buildNewArrivals>;
  wideBanners: Book[];
  square600: Book[];
  featured: Book | null;
  readersChoice: Book[][];
  editorsChoice: Book[];
};

const initialContent: DerivedContent = {
  slider: [],
  newArrivals: { first400: [], second400: [] },
  wideBanners: [],
  square600: [],
  featured: null,
  readersChoice: [],
  editorsChoice: [],
};

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [homeMedia, setHomeMedia] = useState<HomeMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('novelties');
  const { t } = useTranslation();

  const deriveMediaFromBooks = useCallback((items: Book[]): HomeMedia => {
    const slider: string[] = [];
    const banners: string[] = [];
    const notes: string[] = [];
    const pushUnique = (collection: string[], value?: string) => {
      if (!value) return;
      if (!collection.includes(value)) {
        collection.push(value);
      }
    };

    items.forEach((book) => {
      pushUnique(slider, book.covers.mainBanner ?? book.covers['1600x900'] ?? book.covers['400x600']);
      pushUnique(banners, book.covers['1600x900'] ?? book.covers.mainBanner ?? book.covers['400x600']);
      book.noteImages?.forEach((image) => pushUnique(notes, image));
    });

    return {
      topSlider: slider.slice(0, 6),
      wideBanners: banners.slice(0, 6),
      notes: notes.slice(0, 2),
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const fallbackBooks = generatePlaceholders(40);

    const raceWithTimeout = <T,>(factory: () => Promise<T>, fallback: T, timeoutMs: number): Promise<T> => {
      if (controller.signal.aborted) {
        return Promise.resolve(fallback);
      }
      return new Promise<T>((resolve, reject) => {
        const timer = window.setTimeout(() => resolve(fallback), timeoutMs);
        factory()
          .then((value) => {
            window.clearTimeout(timer);
            resolve(value);
          })
          .catch((error) => {
            window.clearTimeout(timer);
            if (controller.signal.aborted) {
              reject(controller.signal.reason ?? error);
            } else {
              resolve(fallback);
            }
          });
      });
    };

    const load = async () => {
      try {
        const loadedBooks = await raceWithTimeout(
          () => loadBooks({ signal: controller.signal }),
          fallbackBooks,
          5000
        );
        const resolvedBooks = Array.isArray(loadedBooks) && loadedBooks.length > 0 ? loadedBooks : fallbackBooks;
        if (controller.signal.aborted) return;
        setBooks(resolvedBooks);

        const mediaFallback = deriveMediaFromBooks(resolvedBooks);
        const media = await raceWithTimeout(
          () => getHomeMedia({ signal: controller.signal, books: resolvedBooks }),
          mediaFallback,
          4000
        );
        if (!controller.signal.aborted) {
          setHomeMedia(media);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (import.meta.env?.DEV) {
          console.error('[home] failed to load homepage data', error);
        }
        setBooks(fallbackBooks);
        setHomeMedia(deriveMediaFromBooks(fallbackBooks));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deriveMediaFromBooks]);

  const content = useMemo<DerivedContent>(() => {
    if (!books.length) {
      return initialContent;
    }

    const seen = createSeen();
    const slider = buildTopSlider(books, seen);
    const wideBanners = buildWideBanners(books, seen);
    const newArrivals = buildNewArrivals(books, seen);
    const featured = buildFeatured400(books, seen);
    const square600 = buildSquare600(books, seen);
    const readersChoice = buildReadersChoice(books, seen);
    const editorsChoice = buildEditorsChoice(books, seen);

    return { slider, newArrivals, wideBanners, square600, featured, readersChoice, editorsChoice };
  }, [books]);

  const tabs: { key: TabKey; label: string }[] = useMemo(
    () => [
      { key: 'novelties', label: t('home.tabs.novelties', {}, 'Новинки') },
      { key: 'readers', label: t('home.tabs.readers', {}, 'Выбор читателей') },
      { key: 'taste', label: t('home.tabs.taste', {}, 'На ваш вкус') },
      { key: 'editors', label: t('home.tabs.editors', {}, 'Выбор редакции') },
    ],
    [t]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-4 py-6">
        <TopSlider slides={content.slider} />
        <TabsNav tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
        <div className="space-y-8">
          <TabPanel tab="novelties" activeTab={activeTab}>
            <div className="space-y-12">
              <BookCarousel400
                id="novelties-first"
                title={t('home.sections.noveltiesFirst', {}, 'Главные новинки')}
                books={content.newArrivals.first400}
              />
              <BookCarousel400
                id="novelties-second"
                title={t('home.sections.noveltiesSecond', {}, 'Ещё новинки')}
                books={content.newArrivals.second400}
              />
              <WideBanners1600 id="novelties-wide" books={content.wideBanners} />
              <BookCarousel600
                id="novelties-square"
                title={t('home.sections.square600', {}, 'В квадратном формате')}
                books={content.square600}
              />
              <Featured400 book={content.featured} />
            </div>
          </TabPanel>
          <TabPanel tab="readers" activeTab={activeTab}>
            <TwinNoteBlocks pairs={content.readersChoice} fallbackImages={homeMedia?.notes} />
          </TabPanel>
          <TabPanel tab="taste" activeTab={activeTab}>
            <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground">
              {t('home.sections.tasteDescription', {}, 'Мы собираем коллекцию рекомендаций специально под ваш вкус.')}
            </div>
          </TabPanel>
          <TabPanel tab="editors" activeTab={activeTab}>
            <BookCarousel400
              id="editors-choice"
              title={t('home.sections.editorsChoice', {}, 'Выбор редакции')}
              books={content.editorsChoice}
            />
          </TabPanel>
        </div>
        {loading && (
          <div className="text-center text-sm text-muted-foreground">
            {t('common.loading', {}, 'Загружаем новые подборки...')}
          </div>
        )}
      </div>
    </div>
  );
}

type TabPanelProps = {
  tab: TabKey;
  activeTab: TabKey;
  children: ReactNode;
};

function TabPanel({ tab, activeTab, children }: TabPanelProps) {
  const hidden = tab !== activeTab;
  return (
    <div
      role="tabpanel"
      id={`home-tabpanel-${tab}`}
      aria-labelledby={`home-tab-${tab}`}
      hidden={hidden}
      className={hidden ? 'hidden' : 'space-y-4'}
    >
      {!hidden && children}
    </div>
  );
}
