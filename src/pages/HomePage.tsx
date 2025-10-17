import React, { useEffect, useState } from 'react';
import {
  fetchBannerBooks,
  fetchEditorsPicks,
  fetchNewBooks,
  fetchPopularBooks,
  type PublicBook,
} from '../api/books';
import NewBooksCarousel from '../components/home/Carousels/NewBooksCarousel';
import PopularBooksCarousel from '../components/home/Carousels/PopularBooksCarousel';
import TwinNoteBlocks from '../components/home/ReadersChoice/TwinNoteBlocks';
import WideBanners1600 from '../components/home/Carousels/WideBanners1600';

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

  const twinNoteBook = editorPicks.find(
    (book) => book.cover_images?.notes_1 && book.cover_images?.notes_2,
  );

  return (
    <div className="homepage space-y-10">
      {bannerBooks.length > 0 && <WideBanners1600 books={bannerBooks} />}

      {twinNoteBook && <TwinNoteBlocks book={twinNoteBook} />}

      <NewBooksCarousel books={newBooks} />

      <PopularBooksCarousel books={popularBooks} />
    </div>
  );
};

export default HomePage;
