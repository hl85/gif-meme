// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('@/components/gif/GifGrid', () => ({
  GifGrid: ({ gifs, ads }: { gifs: { id: string; title: string }[]; ads: unknown[] }) => (
    <div data-testid="gif-grid" data-count={gifs.length} data-ad-count={(ads as unknown[]).length}>
      {gifs.map((g) => <div key={g.id} data-testid={`gif-${g.id}`}>{g.title}</div>)}
    </div>
  ),
}));

vi.mock('@/components/gif/LoadMore', () => ({
  LoadMore: ({ onLoadMore, hasMore, isLoading }: { onLoadMore: () => void; hasMore: boolean; isLoading: boolean }) =>
    hasMore ? (
      <button data-testid="load-more" onClick={onLoadMore} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Load More'}
      </button>
    ) : null,
}));

import { SearchClient } from '../SearchClient';
import type { KlipyGif, KlipyAd } from '@/lib/klipy/types';

const makeGif = (i: number): KlipyGif => ({
  id: `gif-${i}`,
  title: `GIF ${i}`,
  url: `https://example.com/gif${i}.gif`,
  preview_url: `https://example.com/gif${i}-preview.gif`,
  width: 200,
  height: 200,
  source: 'giphy',
});

const noAds: KlipyAd[] = [];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SearchClient', () => {
  it('renders the gif-grid with initial gifs', () => {
    render(
      <SearchClient
        query="cats"
        initialGifs={[makeGif(1), makeGif(2)]}
        initialAds={noAds}
        initialHasNext={false}
        initialType="gif"
      />
    );
    expect(screen.getByTestId('gif-grid')).toBeInTheDocument();
    expect(screen.getByTestId('gif-gif-1')).toBeInTheDocument();
    expect(screen.getByTestId('gif-gif-2')).toBeInTheDocument();
  });

  it('shows empty state when no gifs and no query', () => {
    render(
      <SearchClient
        query=""
        initialGifs={[]}
        initialAds={noAds}
        initialHasNext={false}
        initialType="gif"
      />
    );
    expect(screen.getByTestId('search-empty')).toBeInTheDocument();
  });

  it('shows no-results message when query has no results', () => {
    render(
      <SearchClient
        query="xyznotfound"
        initialGifs={[]}
        initialAds={noAds}
        initialHasNext={false}
        initialType="gif"
      />
    );
    expect(screen.getByTestId('search-no-results')).toBeInTheDocument();
  });

  it('renders GIF/Sticker tab toggle', () => {
    render(
      <SearchClient
        query="cats"
        initialGifs={[]}
        initialAds={noAds}
        initialHasNext={false}
        initialType="gif"
      />
    );
    expect(screen.getByTestId('tab-gif')).toBeInTheDocument();
    expect(screen.getByTestId('tab-sticker')).toBeInTheDocument();
  });

  it('gif tab is active by default when initialType is gif', () => {
    render(
      <SearchClient
        query="cats"
        initialGifs={[]}
        initialAds={noAds}
        initialHasNext={false}
        initialType="gif"
      />
    );
    expect(screen.getByTestId('tab-gif')).toHaveClass('search-tabs__tab--active');
    expect(screen.getByTestId('tab-sticker')).not.toHaveClass('search-tabs__tab--active');
  });

  it('switches to sticker tab on click and fetches stickers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [makeGif(99)], ads: [], hasNext: false, page: 1, perPage: 20 }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(
      <SearchClient
        query="cats"
        initialGifs={[makeGif(1)]}
        initialAds={noAds}
        initialHasNext={false}
        initialType="gif"
      />
    );

    fireEvent.click(screen.getByTestId('tab-sticker'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stickers/search')
      );
    });
  });

  it('renders load more button when hasNext is true', () => {
    render(
      <SearchClient
        query="cats"
        initialGifs={[makeGif(1)]}
        initialAds={noAds}
        initialHasNext={true}
        initialType="gif"
      />
    );
    expect(screen.getByTestId('load-more')).toBeInTheDocument();
  });

  it('does not render load more when hasNext is false', () => {
    render(
      <SearchClient
        query="cats"
        initialGifs={[makeGif(1)]}
        initialAds={noAds}
        initialHasNext={false}
        initialType="gif"
      />
    );
    expect(screen.queryByTestId('load-more')).not.toBeInTheDocument();
  });

  it('loads more gifs on load more click', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [makeGif(10), makeGif(11)], ads: [], hasNext: false, page: 2, perPage: 20 }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(
      <SearchClient
        query="cats"
        initialGifs={[makeGif(1)]}
        initialAds={noAds}
        initialHasNext={true}
        initialType="gif"
      />
    );

    fireEvent.click(screen.getByTestId('load-more'));

    await waitFor(() => {
      expect(screen.getByTestId('gif-gif-10')).toBeInTheDocument();
    });
    expect(screen.getByTestId('gif-gif-11')).toBeInTheDocument();
    expect(screen.queryByTestId('load-more')).not.toBeInTheDocument();
  });
});
