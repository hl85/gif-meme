import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KlipyProvider } from '../provider';

function makeKlipyItem(id: number, title: string, baseUrl: string) {
  return {
    id,
    title,
    slug: title.toLowerCase().replace(/\s+/g, '-'),
    type: 'gif',
    tags: [],
    blur_preview: 'data:image/jpeg;base64,placeholder',
    file: {
      hd: {
        gif: { url: `${baseUrl}/hd.gif`, width: 498, height: 498, size: 5000 },
        webp: { url: `${baseUrl}/hd.webp`, width: 498, height: 498, size: 3000 },
      },
      sm: {
        gif: { url: `${baseUrl}/sm.gif`, width: 249, height: 249, size: 1500 },
        webp: { url: `${baseUrl}/sm.webp`, width: 249, height: 249, size: 1000 },
      },
    },
  };
}

describe('KlipyProvider', () => {
  let mockCache: { match: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };
  let provider: KlipyProvider;

  beforeEach(() => {
    mockCache = {
      match: vi.fn(),
      put: vi.fn(),
    };
    (globalThis as unknown as { caches: { default: Cache } }).caches = {
      default: mockCache as unknown as Cache,
    };
    provider = new KlipyProvider('test-api-key');
    global.fetch = vi.fn();
  });

  it('should fetch trending gifs and cache the result', async () => {
    const mockApiResponse = {
      data: {
        data: [
          makeKlipyItem(123, 'Funny Cat', 'https://static.klipy.com/cat'),
          {
            is_ad: true,
            id: 'ad1',
            image_url: 'https://example.com/ad.png',
            click_url: 'https://example.com/click',
            impression_url: 'https://example.com/imp',
            width: 300,
            height: 250,
          },
        ],
      },
    };

    mockCache.match.mockResolvedValueOnce(undefined);
    (global.fetch as any).mockResolvedValueOnce(
      new Response(JSON.stringify(mockApiResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await provider.trending(1, 20);

    expect(mockCache.match).toHaveBeenCalledTimes(1);
    const fetchRequest = (global.fetch as any).mock.calls[0][0] as Request;
    expect(fetchRequest.url).toContain('https://api.klipy.com/api/v1/test-api-key/gifs/trending');
    expect(fetchRequest.headers.get('User-Agent')).toBeTruthy();
    expect(mockCache.put).toHaveBeenCalledTimes(1);
    const cachedResponse = mockCache.put.mock.calls[0][1] as Response;
    expect(cachedResponse.headers.get('Cache-Control')).toBe('s-maxage=300');

    expect(result.items).toHaveLength(1);
    expect(result.ads).toHaveLength(1);
    expect(result.items[0].id).toBe('123');
    expect(result.items[0].url).toBe('https://static.klipy.com/cat/hd.webp');
    expect(result.items[0].preview_url).toBe('https://static.klipy.com/cat/sm.webp');
    expect(result.ads[0].id).toBe('ad1');
  });

  it('should return cached result if available', async () => {
    const cachedData = {
      data: {
        data: [makeKlipyItem(456, 'Dog', 'https://static.klipy.com/dog')],
      },
    };

    mockCache.match.mockResolvedValueOnce(
      new Response(JSON.stringify(cachedData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await provider.trending(1, 20);

    expect(mockCache.match).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockCache.put).not.toHaveBeenCalled();

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('456');
    expect(result.items[0].url).toBe('https://static.klipy.com/dog/hd.webp');
  });
});
