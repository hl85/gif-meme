import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { GifGrid } from '@/components/gif/GifGrid';
import type { KlipyGif } from '@/lib/klipy/types';

const FAVORITES_LIMIT = 500;

interface FavoriteItem {
  id: string;
  userId: string;
  itemType: string;
  itemId: string;
  itemTitle: string | null;
  itemUrl: string | null;
  itemPreviewUrl: string | null;
  createdAt: Date;
}

function favoriteToGif(item: FavoriteItem): KlipyGif {
  return {
    id: item.itemId,
    title: item.itemTitle ?? item.itemId,
    url: item.itemUrl ?? '',
    preview_url: item.itemPreviewUrl ?? item.itemUrl ?? '',
    width: 320,
    height: 240,
    source: '',
  };
}

async function fetchFavorites(perPage = 50): Promise<{ items: FavoriteItem[]; total: number }> {
  try {
    const res = await fetch(
      `http://localhost:8787/api/favorites?page=1&per_page=${perPage}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return { items: [], total: 0 };
    const data = (await res.json()) as { items: FavoriteItem[]; page: number; perPage: number };
    return { items: data.items ?? [], total: data.items?.length ?? 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session) {
    redirect('/api/auth/login');
  }

  const { items } = await fetchFavorites();
  const count = items.length;
  const gifs = items.map(favoriteToGif);

  return (
    <div className="favorites-page">
      <header className="favorites-page__header">
        <h1 className="favorites-page__title">favorites</h1>
        <span className="favorites-page__count" aria-label={`${count} of ${FAVORITES_LIMIT} favorites used`}>
          {count} / {FAVORITES_LIMIT}
        </span>
      </header>

      {gifs.length === 0 ? (
        <div className="favorites-empty" data-testid="favorites-empty">
          <p className="favorites-empty__text">you haven&rsquo;t saved any favorites yet</p>
          <p className="favorites-empty__subtext">start exploring and click the heart icon to save your favorite GIFs and stickers</p>
        </div>
      ) : (
        <GifGrid gifs={gifs} ads={[]} />
      )}
    </div>
  );
}
