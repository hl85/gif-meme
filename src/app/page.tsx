import { Shell } from '@/components/layout/Shell';
import { HomeClient } from '@/components/gif/HomeClient';
import type { KlipyPage, KlipyGif } from '@/lib/klipy/types';

async function fetchTrending(): Promise<KlipyPage<KlipyGif>> {
  try {
    const res = await fetch('http://localhost:8787/api/gifs/trending?page=1', {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error('fetch failed');
    return res.json();
  } catch {
    return { items: [], ads: [], page: 1, perPage: 20, hasNext: false };
  }
}

async function fetchCategories(): Promise<string[]> {
  try {
    const res = await fetch('http://localhost:8787/api/gifs/categories', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json() as Record<string, unknown>;
    const nested = (data?.data as Record<string, unknown> | undefined)?.data;
    const raw: unknown[] = Array.isArray(nested) ? nested : Array.isArray(data?.data) ? (data.data as unknown[]) : [];
    return raw
      .map((c: unknown) => {
        const cat = c as Record<string, unknown>;
        return String(cat.name || cat.title || cat.category || '');
      })
      .filter(Boolean)
      .slice(0, 20);
  } catch {
    return [];
  }
}

export default async function Home() {
  const [trending, categories] = await Promise.all([fetchTrending(), fetchCategories()]);

  return (
    <Shell>
      <div className="home-page">
        <header className="home-page__hero">
          <h1 className="home-page__heading">gif.meme</h1>
          <p className="home-page__sub">trending GIFs &amp; memes</p>
        </header>
        <HomeClient
          initialGifs={trending.items}
          initialAds={trending.ads}
          initialHasNext={trending.hasNext}
          categories={categories}
        />
      </div>
    </Shell>
  );
}
