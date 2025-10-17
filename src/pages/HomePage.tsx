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
import PopularBooksCarousel from '../components/home/Carousels/PopularBooksCarousel';
import TwinNoteBlocks, { type TwinNoteItem } from '../components/home/ReadersChoice/TwinNoteBlocks';
import WideBanners1600 from '../components/home/Carousels/WideBanners1600';

type CoverMap = {
  '400x600'?: string | null;
  '600x600'?: string | null;
  '1600x900'?: string | null;
  mainBanner?: string | null;
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

const MAX_SECTION_OCCURRENCES = 2;
const MAX_NEW_BOOKS = 20;
const MAX_POPULAR_BOOKS = 20;
const MAX_BANNERS = 5;
const MAX_NOTES = 10;

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

  const { slides, wideBanners, newSection, popularSection, twinNotes } = useMemo(() => {
    const normalizeBook = (book: PublicBook): HomeBook => {
      const rawCovers = book.cover_images ?? {};
      const covers: CoverMap = {
        '400x600': (rawCovers as Record<string, string | null | undefined>)['400x600'] ?? null,
        '600x600': (rawCovers as Record<string, string | null | undefined>)['600x600'] ?? null,
        '1600x900': (rawCovers as Record<string, string | null | undefined>)['1600x900'] ?? null,
        mainBanner:
          (rawCovers as Record<string, string | null | undefined>).mainBanner ??
          (rawCovers as Record<string, string | null | undefined>).main_banner ??
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

    const occurrences = new Map<string, number>();

    const registerBook = (book: HomeBook) => {
      if (book.id.startsWith('placeholder-')) {
        return true;
      }
      const current = occurrences.get(book.id) ?? 0;
      if (current >= MAX_SECTION_OCCURRENCES) {
        return false;
      }
      occurrences.set(book.id, current + 1);
      return true;
    };

    const pickBooks = (source: HomeBook[], limit: number) => {
      const selection: HomeBook[] = [];
      const seen = new Set<string>();
      for (const book of source) {
        if (selection.length >= limit) break;
        if (seen.has(book.id)) continue;
        if (!registerBook(book)) continue;
        selection.push(book);
        seen.add(book.id);
      }
      return selection;
    };

    const sliderCandidates: HomeBook[] = [];
    const sliderSources = [normalizedBanners, normalizedEditors, normalizedNew, normalizedPopular];
    for (const source of sliderSources) {
      for (const book of source) {
        if (sliderCandidates.length >= 3) break;
        if (!book.covers.mainBanner) continue;
        if (sliderCandidates.find((candidate) => candidate.id === book.id)) continue;
        if (!registerBook(book)) continue;
        sliderCandidates.push(book);
      }
      if (sliderCandidates.length >= 3) break;
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

    const wideBanners = pickBooks(normalizedBanners, MAX_BANNERS);
    const newSection = pickBooks(normalizedNew, MAX_NEW_BOOKS);
    const popularSection = pickBooks(normalizedPopular, MAX_POPULAR_BOOKS);

    const twinNotes: TwinNoteItem[] = [];
    const notedBooks = new Set<string>();

    const collectNotes = (source: HomeBook[]) => {
      for (const book of source) {
        if (twinNotes.length >= MAX_NOTES) break;
        if (notedBooks.has(book.id)) continue;
        if (!book.notes.length) continue;
        const current = occurrences.get(book.id) ?? 0;
        if (current >= MAX_SECTION_OCCURRENCES) continue;
        const note = book.notes.find((entry) => entry.html);
        if (!note) continue;
        twinNotes.push({
          id: note.id,
          note,
          book,
        });
        occurrences.set(book.id, current + 1);
        notedBooks.add(book.id);
      }
    };

    collectNotes(normalizedEditors);
    if (twinNotes.length < MAX_NOTES) {
      collectNotes(normalizedNew);
    }
    if (twinNotes.length < MAX_NOTES) {
      collectNotes(normalizedPopular);
    }

    return { slides, wideBanners, newSection, popularSection, twinNotes };
  }, [bannerBooks, editorPicks, newBooks, popularBooks]);

  return (
    <div className="homepage space-y-12 pb-16">
      <TopSlider slides={slides} />
      <WideBanners1600 books={wideBanners} />
      <NewBooksCarousel books={newSection} />
      <PopularBooksCarousel books={popularSection} />
      <TwinNoteBlocks notes={twinNotes} />
    </div>
  );
};

export default HomePage;
