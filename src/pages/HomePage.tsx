import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchBannerBooks,
  fetchEditorsPicks,
  fetchNewBooks,
  fetchPopularBooks,
  type PublicBook,
} from '../api/books';
import { TopSlider, type TopSliderSlide, type PromoSlide } from '../components/home/TopSlider';
import NewBooksCarousel, { type NewCarouselBook } from '../components/home/Carousels/NewBooksCarousel';
import Carousel400Section from '../components/home/Carousels/Carousel400Section';
import Carousel600Section from '../components/home/Carousels/Carousel600Section';
import WideBanners1600 from '../components/home/Carousels/WideBanners1600';
import TwinNoteBlocks, { type TwinNoteItem } from '../components/home/ReadersChoice/TwinNoteBlocks';
import { TabsNav, type TabKey } from '../components/home/TabsNav';

type CoverMap = {
  '400x600'?: string | null;
  '600x600'?: string | null;
  '1600x900'?: string | null;
  mainBanner?: string | null;
  default?: string | null;
};

type HomeNote = {
  id: string;
  bookId: string;
  html: string;
  bgImageUrl?: string | null;
};

type HomeBook = NewCarouselBook & {
  covers: CoverMap;
  notes: HomeNote[];
};

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'promo-immersive-reading',
    type: 'promo',
    title: 'Читайте без границ',
    description: 'Подписка KASBOOK открывает доступ к эксклюзивным релизам и заметкам сообщества.',
    image:
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=80',
    href: '/subscribe',
  },
  {
    id: 'promo-sync',
    type: 'promo',
    title: 'Продолжайте чтение где угодно',
    description: 'Синхронизируйте заметки и прогресс между вебом и приложением KASBOOK.',
    image:
      'https://images.unsplash.com/photo-1522199992905-038f3ca1d2f1?auto=format&fit=crop&w=1600&q=80',
    href: '/app',
  },
];

const MAX_SLIDER_BOOKS = 3;
const MAX_BANNERS = 5;
const MAX_PRIMARY_400 = 20;
const MAX_SECONDARY_400 = 20;
const MAX_EXTRA_400 = 12;
const MAX_SQUARE_600 = 15;
const MAX_NOTES = 10;

const HOME_TABS: { key: TabKey; label: string; description: string }[] = [
  { key: 'novelties', label: 'Новинки', description: 'Свежие поступления и релизы' },
  { key: 'taste', label: 'На ваш вкус', description: 'Популярные заметки читателей' },
];

const HomePage: React.FC = () => {
  const [newBooks, setNewBooks] = useState<PublicBook[]>([]);
  const [popularBooks, setPopularBooks] = useState<PublicBook[]>([]);
  const [editorPicks, setEditorPicks] = useState<PublicBook[]>([]);
  const [bannerBooks, setBannerBooks] = useState<PublicBook[]>([]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const [{ data: newData }, { data: popularData }, { data: editorsData }, { data: bannersData }] = await Promise.all([
        fetchNewBooks(),
        fetchPopularBooks(),
        fetchEditorsPicks(),
        fetchBannerBooks(),
      ]);

      if (!isMounted) return;

      setNewBooks(newData ?? []);
      setPopularBooks(popularData ?? []);
      setEditorPicks(editorsData ?? []);
      setBannerBooks(bannersData ?? []);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const [activeTab, setActiveTab] = useState<TabKey>('novelties');

  const { slides, sections } = useMemo(() => {
    const normalizeBook = (book: PublicBook): HomeBook => {
      const rawCovers = book.cover_images ?? {};
      const coverRecord = rawCovers as Record<string, string | null | undefined>;
      const covers: CoverMap = {
        '400x600': coverRecord['400x600'] ?? coverRecord['400_600'] ?? null,
        '600x600': coverRecord['600x600'] ?? coverRecord['600_600'] ?? null,
        '1600x900': coverRecord['1600x900'] ?? coverRecord['1600_900'] ?? null,
        mainBanner:
          coverRecord.mainBanner ??
          coverRecord.main_banner ??
          coverRecord['1600x900'] ??
          null,
        default:
          coverRecord.default ??
          coverRecord.cover ??
          coverRecord.square ??
          null,
      };

      const description = (book as unknown as { description?: string | null }).description ?? null;
      const rawNotes = (book as unknown as { notes?: unknown }).notes;
      const notes: HomeNote[] = Array.isArray(rawNotes)
        ? rawNotes
            .map((note, index) => {
              if (!note || typeof note !== 'object') return null;
              const record = note as Record<string, unknown>;
              const id = typeof record.id === 'string' ? record.id : `${book.id}-note-${index}`;
              const htmlCandidate =
                typeof record.html === 'string'
                  ? record.html
                  : typeof record.content === 'string'
                  ? record.content
                  : typeof record.text === 'string'
                  ? record.text
                  : '';
              if (!htmlCandidate) return null;
              const bookId =
                typeof record.bookId === 'string'
                  ? record.bookId
                  : typeof record.book_id === 'string'
                  ? record.book_id
                  : book.id;
              const bgImageUrl =
                typeof record.bgImageUrl === 'string'
                  ? record.bgImageUrl
                  : typeof record.bg_image_url === 'string'
                  ? record.bg_image_url
                  : covers['1600x900'] ?? covers.mainBanner ?? null;
              return {
                id,
                bookId,
                html: htmlCandidate,
                bgImageUrl,
              } satisfies HomeNote;
            })
            .filter((note): note is HomeNote => Boolean(note?.html))
        : [];

      const authorName = book.author ?? book.author_name ?? 'Неизвестный автор';

      return {
        ...book,
        covers,
        authorName,
        description,
        notes,
      } satisfies HomeBook;
    };

    const normalizedNew = newBooks.map(normalizeBook);
    const normalizedPopular = popularBooks.map(normalizeBook);
    const normalizedEditors = editorPicks.map(normalizeBook);
    const normalizedBanners = bannerBooks.map(normalizeBook);

    type SectionFormat = 'slider' | '400x600' | '600x600' | '1600x900';

    type UsageRecord = {
      count: number;
      formats: Set<SectionFormat>;
    };

    const cloneUsage = (usage: Map<string, UsageRecord>) => {
      const clone = new Map<string, UsageRecord>();
      usage.forEach((record, key) => {
        clone.set(key, { count: record.count, formats: new Set(record.formats) });
      });
      return clone;
    };

    const getCoverForFormat = (book: HomeBook, format: SectionFormat | 'slider') => {
      switch (format) {
        case 'slider':
          return (
            book.covers.mainBanner ??
            book.covers['1600x900'] ??
            book.covers['600x600'] ??
            book.covers['400x600'] ??
            book.covers.default ??
            null
          );
        case '400x600':
          return (
            book.covers['400x600'] ??
            book.covers['600x600'] ??
            book.covers['1600x900'] ??
            book.covers.mainBanner ??
            book.covers.default ??
            null
          );
        case '600x600':
          return (
            book.covers['600x600'] ??
            book.covers['400x600'] ??
            book.covers['1600x900'] ??
            book.covers.mainBanner ??
            book.covers.default ??
            null
          );
        case '1600x900':
        default:
          return (
            book.covers['1600x900'] ??
            book.covers.mainBanner ??
            book.covers['600x600'] ??
            book.covers['400x600'] ??
            book.covers.default ??
            null
          );
      }
    };

    const useWithFormat = (
      book: HomeBook,
      format: SectionFormat,
      usage: Map<string, UsageRecord>
    ) => {
      let record = usage.get(book.id);
      if (!record) {
        record = { count: 0, formats: new Set<SectionFormat>() };
        usage.set(book.id, record);
      }

      if (format === 'slider' && record.count > 0) {
        return false;
      }

      if (record.formats.has(format)) {
        return false;
      }

      record.count += 1;
      record.formats.add(format);
      return true;
    };

    const baseUsage = new Map<string, UsageRecord>();

    const sliderCandidates: HomeBook[] = [];
    const sliderSources = [normalizedBanners, normalizedEditors, normalizedNew, normalizedPopular];
    for (const source of sliderSources) {
      for (const book of source) {
        if (sliderCandidates.length >= MAX_SLIDER_BOOKS) break;
        if (!getCoverForFormat(book, 'slider')) continue;
        if (!useWithFormat(book, 'slider', baseUsage)) continue;
        sliderCandidates.push(book);
      }
      if (sliderCandidates.length >= MAX_SLIDER_BOOKS) break;
    }

    const composeSlides = (books: HomeBook[]): TopSliderSlide[] => {
      if (PROMO_SLIDES.length < 2) {
        return books.slice(0, 5).map((book) => ({
          id: `top-slide-${book.id}`,
          type: 'book' as const,
          book,
        }));
      }
      const [leadPromo, trailPromo] = PROMO_SLIDES;
      const slides: TopSliderSlide[] = [
        { ...leadPromo, id: `${leadPromo.id}-lead` },
        ...books.map((book) => ({ id: `top-slide-${book.id}`, type: 'book' as const, book })),
        { ...trailPromo, id: `${trailPromo.id}-trail` },
      ];

      let fallbackIndex = 0;
      while (slides.length < 5) {
        const source = PROMO_SLIDES[fallbackIndex % PROMO_SLIDES.length];
        slides.splice(slides.length - 1, 0, {
          ...source,
          id: `${source.id}-extra-${fallbackIndex}`,
        });
        fallbackIndex += 1;
      }

      return slides.slice(0, 5);
    };

    const slides = composeSlides(sliderCandidates);

    const sliderUsage = cloneUsage(baseUsage);

    const collectFromSources = (
      sources: HomeBook[][],
      limit: number,
      format: SectionFormat,
      usage: Map<string, UsageRecord>,
      predicate: (book: HomeBook) => boolean = () => true
    ) => {
      const selection: HomeBook[] = [];
      const seen = new Set<string>();
      for (const source of sources) {
        for (const book of source) {
          if (selection.length >= limit) break;
          if (seen.has(book.id)) continue;
          if (!predicate(book)) continue;
          if (!getCoverForFormat(book, format)) continue;
          if (!useWithFormat(book, format, usage)) continue;
          selection.push(book);
          seen.add(book.id);
        }
        if (selection.length >= limit) break;
      }
      return selection;
    };

    const buildNovelties = () => {
      const usage = cloneUsage(sliderUsage);
      const primary400 = collectFromSources(
        [normalizedNew],
        MAX_PRIMARY_400,
        '400x600',
        usage,
        () => true
      );
      const secondary400 = collectFromSources(
        [normalizedPopular, normalizedEditors, normalizedNew],
        MAX_SECONDARY_400,
        '400x600',
        usage,
        () => true
      );
      const wideBanners = collectFromSources(
        [normalizedBanners, normalizedEditors, normalizedPopular],
        MAX_BANNERS,
        '1600x900',
        usage,
        () => true
      );
      const square600 = collectFromSources(
        [normalizedEditors, normalizedPopular, normalizedNew],
        MAX_SQUARE_600,
        '600x600',
        usage,
        () => true
      );
      const extra400 = collectFromSources(
        [normalizedNew, normalizedPopular, normalizedEditors],
        MAX_EXTRA_400,
        '400x600',
        usage,
        () => true
      );

      return { primary400, secondary400, wideBanners, square600, extra400 };
    };

    const buildTaste = () => {
      const usage = cloneUsage(sliderUsage);
      const items: TwinNoteItem[] = [];
      const noted = new Set<string>();

      const collectNotes = (source: HomeBook[]) => {
        for (const book of source) {
          if (items.length >= MAX_NOTES) break;
          if (noted.has(book.id)) continue;
          if (!book.notes.length) continue;
          if (!getCoverForFormat(book, '600x600')) continue;
          const note = book.notes.find((entry) => entry.html);
          if (!note) continue;
          if (!useWithFormat(book, '600x600', usage)) continue;
          items.push({ id: note.id, note, book });
          noted.add(book.id);
        }
      };

      collectNotes(normalizedPopular);
      if (items.length < MAX_NOTES) {
        collectNotes(normalizedNew);
      }
      if (items.length < MAX_NOTES) {
        collectNotes(normalizedEditors);
      }

      return { notes: items };
    };

    return { slides, sections: { novelties: buildNovelties(), taste: buildTaste() } };
  }, [bannerBooks, editorPicks, newBooks, popularBooks]);

  const novelties = sections.novelties;
  const taste = sections.taste;

  return (
    <div className="homepage space-y-10 pb-16">
      <TopSlider slides={slides} />
      <div className="space-y-10">
        <TabsNav tabs={HOME_TABS} activeKey={activeTab} onChange={setActiveTab} />
        {activeTab === 'novelties' ? (
          <div
            id="home-tabpanel-novelties"
            role="tabpanel"
            aria-labelledby="home-tab-novelties"
            className="space-y-12"
          >
            <NewBooksCarousel books={novelties.primary400} />
            <Carousel400Section
              id="novelties-curated"
              title="Подборка новинок"
              books={novelties.secondary400}
              target={MAX_SECONDARY_400}
              placeholderTitle="Ещё новинки в пути"
              placeholderDescription="Команда KASBOOK готовит новые поступления — следите за обновлениями."
            />
            <WideBanners1600 books={novelties.wideBanners} />
            <Carousel600Section
              id="novelties-square"
              title="Квадратные премьеры"
              books={novelties.square600}
              target={MAX_SQUARE_600}
              placeholderTitle="Эксклюзивы скоро здесь"
              placeholderDescription="Новые премиальные квадратные обложки появятся в этой секции скоро."
            />
            <Carousel400Section
              id="novelties-extra"
              title="Ещё подборки"
              books={novelties.extra400}
              target={MAX_EXTRA_400}
              placeholderTitle="Подборка готовится"
              placeholderDescription="Мы собираем для вас дополнительные рекомендации."
            />
          </div>
        ) : (
          <div
            id="home-tabpanel-taste"
            role="tabpanel"
            aria-labelledby="home-tab-taste"
            className="space-y-12"
          >
            <TwinNoteBlocks notes={taste.notes} />
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
