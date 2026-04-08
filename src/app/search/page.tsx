import { SearchInput } from '@/components/search/SearchInput';
import { SearchClient } from '@/components/search/SearchClient';
import type { KlipyPage, KlipyGif } from '@/lib/klipy/types';

async function fetchSearchResults(query: string, type: 'gif' | 'sticker'): Promise<KlipyPage<KlipyGif>> {
  if (!query) return { items: [], ads: [], page: 1, perPage: 20, hasNext: false };
  try {
    const endpoint = type === 'gif' ? '/api/gifs/search' : '/api/stickers/search';
    const res = await fetch(
      `http://localhost:8787${endpoint}?q=${encodeURIComponent(query)}&page=1`,
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error('fetch failed');
    return res.json();
  } catch {
    return { items: [], ads: [], page: 1, perPage: 20, hasNext: false };
  }
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q ?? '').trim();
  const type = params.type === 'sticker' ? 'sticker' : 'gif';

  const results = await fetchSearchResults(query, type);

  return (
    <div className="search-page">
      <header className="search-page__header">
        <h1 className="search-page__heading">
          {query ? (
            <>search: <span className="search-page__query">{query}</span></>
          ) : (
            'search'
          )}
        </h1>
        <div className="search-page__input-wrap">
          <SearchInput defaultValue={query} placeholder="search GIFs and stickers..." />
        </div>
      </header>

      <SearchClient
        query={query}
        initialGifs={results.items}
        initialAds={results.ads}
        initialHasNext={results.hasNext}
        initialType={type}
      />
    </div>
  );
}
