import { HomeClient } from '@/components/gif/HomeClient';
import type { KlipyPage, KlipyGif } from '@/lib/klipy/types';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { KlipyProvider } from '@/lib/klipy/provider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GifMeme — Browse Trending GIFs & Stickers',
  description: 'Discover and share the best trending GIFs and stickers on GifMeme.',
};

function getProvider(env: Record<string, unknown>): KlipyProvider | null {
  const apiKey = env.KLIPY_API_KEY as string | undefined;
  const kv = env.cache as KVNamespace | undefined;
  if (!apiKey || !kv) return null;
  return new KlipyProvider(apiKey, kv);
}

async function fetchTrending(): Promise<KlipyPage<KlipyGif>> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const provider = getProvider(env as unknown as Record<string, unknown>);
    if (!provider) return { items: [], ads: [], page: 1, perPage: 20, hasNext: false };
    return await provider.trending(1, 20);
  } catch {
    return { items: [], ads: [], page: 1, perPage: 20, hasNext: false };
  }
}

async function fetchCategories(): Promise<string[]> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const provider = getProvider(env as unknown as Record<string, unknown>);
    if (!provider) return [];
    const data = await provider.categories() as Record<string, unknown>;
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
  );
}
