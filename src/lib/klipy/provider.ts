import { KlipyPage, KlipyGif } from './types';
import { parseKlipyData } from './ad-parser';

export class KlipyProvider {
  private apiKey: string;
  private kv: KVNamespace;
  private baseUrl = 'https://api.klipy.com/api/v1';

  constructor(apiKey: string, kvNamespace: KVNamespace) {
    this.apiKey = apiKey;
    this.kv = kvNamespace;
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
    const cacheKey = `klipy:${endpoint}:${searchParams.toString()}`;

    const cached = await this.kv.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as T;
    }

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

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Klipy API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    await this.kv.put(cacheKey, JSON.stringify(data), { expirationTtl: ttlSeconds });

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
    const data = await this.fetchWithCache<any>('/gifs/trending', { page, per_page: perPage }, 300, customerId);
    return this.formatPageResponse(data, page, perPage);
  }

  async search(query: string, page: number = 1, perPage: number = 20, customerId?: string): Promise<KlipyPage<KlipyGif>> {
    const data = await this.fetchWithCache<any>('/gifs/search', { q: query, page, per_page: perPage }, 600, customerId);
    return this.formatPageResponse(data, page, perPage);
  }

  async categories(customerId?: string): Promise<any> {
    return this.fetchWithCache<any>('/gifs/categories', {}, 3600, customerId);
  }

  async getById(id: string, customerId?: string): Promise<KlipyGif | null> {
    try {
      const data = await this.fetchWithCache<any>(`/gifs/${id}`, {}, 3600, customerId);
      const { items } = parseKlipyData([data?.data || data]);
      return items.length > 0 ? items[0] : null;
    } catch (e) {
      return null;
    }
  }

  async trendingStickers(page: number = 1, perPage: number = 20, customerId?: string): Promise<KlipyPage<KlipyGif>> {
    const data = await this.fetchWithCache<any>('/stickers/trending', { page, per_page: perPage }, 300, customerId);
    return this.formatPageResponse(data, page, perPage);
  }

  async searchStickers(query: string, page: number = 1, perPage: number = 20, customerId?: string): Promise<KlipyPage<KlipyGif>> {
    const data = await this.fetchWithCache<any>('/stickers/search', { q: query, page, per_page: perPage }, 600, customerId);
    return this.formatPageResponse(data, page, perPage);
  }
}
