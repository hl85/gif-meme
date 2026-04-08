'use client';

import { useState } from 'react';
import { GifGrid } from '@/components/gif/GifGrid';
import { LoadMore } from '@/components/gif/LoadMore';
import type { KlipyGif, KlipyAd, KlipyPage } from '@/lib/klipy/types';

interface CategoryClientProps {
  categoryName: string;
  initialGifs: KlipyGif[];
  initialAds: KlipyAd[];
  initialHasNext: boolean;
}

export function CategoryClient({
  categoryName,
  initialGifs,
  initialAds,
  initialHasNext,
}: CategoryClientProps) {
  const [gifs, setGifs] = useState<KlipyGif[]>(initialGifs);
  const [ads, setAds] = useState<KlipyAd[]>(initialAds);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadMore = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    const nextPage = page + 1;
    try {
      const url = `/api/gifs/search?q=${encodeURIComponent(categoryName)}&page=${nextPage}`;
      const res = await fetch(url);
      if (res.ok) {
        const data: KlipyPage<KlipyGif> = await res.json();
        setGifs((prev) => [...prev, ...data.items]);
        setAds(data.ads);
        setHasNext(data.hasNext);
        setPage(nextPage);
      } else {
        setError('Failed to load more GIFs.');
      }
    } catch (err) {
      setError('An error occurred while loading more GIFs.');
      console.error('Failed to load more GIFs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="category-page__content">
      {error && (
        <div className="category-error" data-testid="category-error">
          <p className="category-error__text">{error}</p>
        </div>
      )}
      
      {gifs.length === 0 && !isLoading ? (
        <div className="category-empty" data-testid="category-empty">
          <p className="category-empty__text">no GIFs found in this category</p>
        </div>
      ) : (
        <>
          <GifGrid gifs={gifs} ads={ads} />
          <LoadMore onLoadMore={handleLoadMore} hasMore={hasNext} isLoading={isLoading} />
        </>
      )}
    </div>
  );
}
