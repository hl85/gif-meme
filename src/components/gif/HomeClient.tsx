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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategorySelect = async (category: string | null) => {
    setSelectedCategory(category);
    setPage(1);
    setIsLoading(true);
    try {
      const url = category
        ? `/api/gifs/search?q=${encodeURIComponent(category)}&page=1`
        : '/api/gifs/trending?page=1';
      const res = await fetch(url);
      if (res.ok) {
        const data: KlipyPage<KlipyGif> = await res.json();
        setGifs(data.items);
        setAds(data.ads);
        setHasNext(data.hasNext);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const nextPage = page + 1;
    try {
      const url = selectedCategory
        ? `/api/gifs/search?q=${encodeURIComponent(selectedCategory)}&page=${nextPage}`
        : `/api/gifs/trending?page=${nextPage}`;
      const res = await fetch(url);
      if (res.ok) {
        const data: KlipyPage<KlipyGif> = await res.json();
        setGifs((prev) => [...prev, ...data.items]);
        setAds(data.ads);
        setHasNext(data.hasNext);
        setPage(nextPage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="home">
      <CategoryBar
        categories={categories}
        selected={selectedCategory}
        onSelect={handleCategorySelect}
      />
      <GifGrid gifs={gifs} ads={ads} />
      <LoadMore onLoadMore={handleLoadMore} hasMore={hasNext} isLoading={isLoading} />
    </div>
  );
}
