import { KlipyPage, KlipyGif } from './types';
import { parseKlipyData } from './ad-parser';
import { fetchWithCacheApi } from '@/lib/cache/cache-api';
import { CACHE_TTL } from '@/lib/cache/ttl-config';

export class KlipyProvider {
  private apiKey: string;
  private baseUrl = 'https://api.klipy.com/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchWithCache<T>(
    endpoint: string,
    params: Record<string, string | number>,
    ttlSeconds: number,
    customerId?: string
  ): Promise<T> {
    const searchParams = new URLSearchParams();
    searchParams.set('rating', 'pg-13');
    searchParams.set('locale', 'en');
    
    for (const [key, value] of Object.entries(params)) {
      searchParams.set(key, String(value));
    }

    const url = `${this.baseUrl}/${this.apiKey}${endpoint}?${searchParams.toString()}`;

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    if (customerId) {
      headers['X-Customer-Id'] = customerId;
    }

    if (this.apiKey === 'dummy_key') {
      return {
        data: {
          data: [
            {
              id: 1,
              title: 'Mock GIF',
              slug: 'mock-gif',
              type: 'gif',
              file: {
                hd: { gif: { url: 'https://example.com/mock.gif', width: 200, height: 200, size: 1000 } },
                sm: { gif: { url: 'https://example.com/mock-sm.gif', width: 100, height: 100, size: 500 } },
              },
            },
            { is_ad: true, id: 'ad1', image_url: 'https://example.com/ad.png', click_url: 'https://example.com/click', width: 300, height: 250 },
          ],
        },
      } as T;
    }

    const request = new Request(url, {
      method: 'GET',
      headers,
    });

    const response = await fetchWithCacheApi(request, ttlSeconds);
    if (!response.ok) {
      throw new Error(`Klipy API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return data as T;
  }

  private formatPageResponse(rawData: any, page: number, perPage: number): KlipyPage<KlipyGif> {
    const dataArray = rawData?.data?.data || rawData?.data || [];
    const { items, ads } = parseKlipyData(dataArray);
    
    return {
      items,
      ads,
      page,
      perPage,
      hasNext: items.length === perPage,
    };
  }

  async trending(page: number = 1, perPage: number = 20, customerId?: string): Promise<KlipyPage<KlipyGif>> {
    const data = await this.fetchWithCache<any>('/gifs/trending', { page, per_page: perPage }, CACHE_TTL.trending, customerId);
    return this.formatPageResponse(data, page, perPage);
  }

  async search(query: string, page: number = 1, perPage: number = 20, customerId?: string): Promise<KlipyPage<KlipyGif>> {
    const data = await this.fetchWithCache<any>('/gifs/search', { q: query, page, per_page: perPage }, CACHE_TTL.search, customerId);
    return this.formatPageResponse(data, page, perPage);
  }

  async categories(customerId?: string): Promise<any> {
    return this.fetchWithCache<any>('/gifs/categories', {}, CACHE_TTL.categories, customerId);
  }

  async getById(id: string, customerId?: string): Promise<KlipyGif | null> {
    try {
      const data = await this.fetchWithCache<any>(`/gifs/${id}`, {}, CACHE_TTL.detail, customerId);
      const { items } = parseKlipyData([data?.data || data]);
      return items.length > 0 ? items[0] : null;
    } catch (e) {
      return null;
    }
  }

  async trendingStickers(page: number = 1, perPage: number = 20, customerId?: string): Promise<KlipyPage<KlipyGif>> {
    const data = await this.fetchWithCache<any>('/stickers/trending', { page, per_page: perPage }, CACHE_TTL.stickers, customerId);
    return this.formatPageResponse(data, page, perPage);
  }

  async searchStickers(query: string, page: number = 1, perPage: number = 20, customerId?: string): Promise<KlipyPage<KlipyGif>> {
    const data = await this.fetchWithCache<any>('/stickers/search', { q: query, page, per_page: perPage }, CACHE_TTL.search, customerId);
    return this.formatPageResponse(data, page, perPage);
  }
}
