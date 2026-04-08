'use client';

import { useState } from 'react';
import { GifGrid } from '@/components/gif/GifGrid';
import { CategoryBar } from '@/components/gif/CategoryBar';
import { LoadMore } from '@/components/gif/LoadMore';
import type { KlipyGif, KlipyAd, KlipyPage } from '@/lib/klipy/types';

interface HomeClientProps {
  initialGifs: KlipyGif[];
  initialAds: KlipyAd[];
  initialHasNext: boolean;
  categories: string[];
}

export function HomeClient({ initialGifs, initialAds, initialHasNext, categories }: HomeClientProps) {
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
      const url = `/api/gifs/trending?page=${nextPage}`;
      const res = await fetch(url);
      if (res.ok) {
        const data: KlipyPage<KlipyGif> = await res.json();
        setGifs((prev) => [...prev, ...data.items]);
        setAds(data.ads);
        setHasNext(data.hasNext);
        setPage(nextPage);
      } else {
        setError('Failed to load more trending GIFs.');
      }
    } catch (err) {
      setError('An error occurred while loading more GIFs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="home">
      <CategoryBar
        categories={categories}
        selected={null}
      />
      {error && (
        <div className="home-error" data-testid="home-error">
          <p className="home-error__text">{error}</p>
        </div>
      )}
      <GifGrid gifs={gifs} ads={ads} />
      <LoadMore onLoadMore={handleLoadMore} hasMore={hasNext} isLoading={isLoading} />
    </div>
  );
}
