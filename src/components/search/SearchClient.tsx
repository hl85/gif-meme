'use client';

import { useState } from 'react';
import { GifGrid } from '@/components/gif/GifGrid';
import { LoadMore } from '@/components/gif/LoadMore';
import type { KlipyGif, KlipyAd, KlipyPage } from '@/lib/klipy/types';

type MediaType = 'gif' | 'sticker';

interface SearchClientProps {
  query: string;
  initialGifs: KlipyGif[];
  initialAds: KlipyAd[];
  initialHasNext: boolean;
  initialType: MediaType;
}

export function SearchClient({
  query,
  initialGifs,
  initialAds,
  initialHasNext,
  initialType,
}: SearchClientProps) {
  const [gifs, setGifs] = useState<KlipyGif[]>(initialGifs);
  const [ads, setAds] = useState<KlipyAd[]>(initialAds);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeType, setActiveType] = useState<MediaType>(initialType);
  const [error, setError] = useState<string | null>(null);

  const handleTabSwitch = async (type: MediaType) => {
    if (type === activeType || !query) return;
    setActiveType(type);
    setPage(1);
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = type === 'gif' ? '/api/gifs/search' : '/api/stickers/search';
      const res = await fetch(`${endpoint}?q=${encodeURIComponent(query)}&page=1`);
      if (res.ok) {
        const data: KlipyPage<KlipyGif> = await res.json();
        setGifs(data.items);
        setAds(data.ads);
        setHasNext(data.hasNext);
      } else {
        setError('Failed to fetch results. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoading || !query) return;
    setIsLoading(true);
    setError(null);
    const nextPage = page + 1;
    try {
      const endpoint = activeType === 'gif' ? '/api/gifs/search' : '/api/stickers/search';
      const res = await fetch(`${endpoint}?q=${encodeURIComponent(query)}&page=${nextPage}`);
      if (res.ok) {
        const data: KlipyPage<KlipyGif> = await res.json();
        setGifs((prev) => [...prev, ...data.items]);
        setAds(data.ads);
        setHasNext(data.hasNext);
        setPage(nextPage);
      } else {
        setError('Failed to load more results.');
      }
    } catch (err) {
      setError('An error occurred while loading more results.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!query) {
    return (
      <div className="search-empty" data-testid="search-empty">
        <p className="search-empty__text">enter a search query to find GIFs and stickers</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="search-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeType === 'gif'}
          className={`search-tabs__tab${activeType === 'gif' ? ' search-tabs__tab--active' : ''}`}
          data-testid="tab-gif"
          onClick={() => handleTabSwitch('gif')}
          disabled={isLoading}
        >
          GIFs
        </button>
        <button
          role="tab"
          aria-selected={activeType === 'sticker'}
          className={`search-tabs__tab${activeType === 'sticker' ? ' search-tabs__tab--active' : ''}`}
          data-testid="tab-sticker"
          onClick={() => handleTabSwitch('sticker')}
          disabled={isLoading}
        >
          Stickers
        </button>
      </div>

      {error && (
        <div className="search-error" data-testid="search-error">
          <p className="search-error__text">{error}</p>
        </div>
      )}

      {isLoading && gifs.length === 0 ? (
        <div className="search-loading" data-testid="search-loading">
          <p className="search-loading__text">searching for &ldquo;{query}&rdquo;...</p>
        </div>
      ) : gifs.length === 0 && !isLoading ? (
        <div className="search-no-results" data-testid="search-no-results">
          <p className="search-no-results__text">no results for &ldquo;{query}&rdquo;</p>
          <p className="search-no-results__subtext">try different keywords or check your spelling</p>
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
