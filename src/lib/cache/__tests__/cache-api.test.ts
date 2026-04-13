import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWithCacheApi } from '../cache-api';
import { CACHE_TTL } from '../ttl-config';

describe('fetchWithCacheApi', () => {
  let mockCache: { match: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCache = {
      match: vi.fn(),
      put: vi.fn(),
    };

    mockFetch = vi.fn();

    vi.stubGlobal('caches', { default: mockCache } as unknown as CacheStorage);
    vi.stubGlobal('fetch', mockFetch);
  });

  it('returns cached response when cache hit', async () => {
    const cached = new Response('cached', { status: 200 });
    mockCache.match.mockResolvedValueOnce(cached);

    const request = new Request('https://gifmeme.org/api/gifs/trending?page=1&per_page=20');
    const result = await fetchWithCacheApi(request, 300);

    expect(mockCache.match).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockCache.put).not.toHaveBeenCalled();
    await expect(result.text()).resolves.toBe('cached');
  });

  it('fetches and caches GET 200 responses with normalized query key and s-maxage', async () => {
    mockCache.match.mockResolvedValueOnce(undefined);
    mockFetch.mockResolvedValueOnce(new Response('{"data":[]}', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }));

    const request = new Request('https://gifmeme.org/api/gifs/trending?z=2&a=1&m=3');
    const result = await fetchWithCacheApi(request, 300);

    expect(global.fetch).toHaveBeenCalledWith(request);
    expect(mockCache.match).toHaveBeenCalledTimes(1);

    const matchKey = mockCache.match.mock.calls[0][0] as Request;
    expect(matchKey.url).toBe('https://gifmeme.org/api/gifs/trending?a=1&m=3&z=2');

    expect(mockCache.put).toHaveBeenCalledTimes(1);
    const putKey = mockCache.put.mock.calls[0][0] as Request;
    const putResponse = mockCache.put.mock.calls[0][1] as Response;
    expect(putKey.url).toBe('https://gifmeme.org/api/gifs/trending?a=1&m=3&z=2');
    expect(putResponse.headers.get('Cache-Control')).toBe('s-maxage=300');
    await expect(result.text()).resolves.toBe('{"data":[]}');
  });

  it('does not use cache for non-GET requests', async () => {
    mockFetch.mockResolvedValueOnce(new Response('created', { status: 201 }));
    const request = new Request('https://gifmeme.org/api/gifs/trending', { method: 'POST' });

    const result = await fetchWithCacheApi(request, 300);

    expect(global.fetch).toHaveBeenCalledWith(request);
    expect(mockCache.match).not.toHaveBeenCalled();
    expect(mockCache.put).not.toHaveBeenCalled();
    expect(result.status).toBe(201);
  });

  it('does not cache non-200 responses', async () => {
    mockCache.match.mockResolvedValueOnce(undefined);
    mockFetch.mockResolvedValueOnce(new Response('not found', { status: 404 }));
    const request = new Request('https://gifmeme.org/api/gifs/search?q=cat');

    const result = await fetchWithCacheApi(request, 600);

    expect(mockCache.match).toHaveBeenCalledTimes(1);
    expect(mockCache.put).not.toHaveBeenCalled();
    expect(result.status).toBe(404);
  });

  it('skips cache when Authorization header is present', async () => {
    mockFetch.mockResolvedValueOnce(new Response('auth', { status: 200 }));
    const request = new Request('https://gifmeme.org/api/gifs/trending', {
      headers: {
        Authorization: 'Bearer token',
      },
    });

    await fetchWithCacheApi(request, 300);

    expect(mockCache.match).not.toHaveBeenCalled();
    expect(mockCache.put).not.toHaveBeenCalled();
  });

  it('skips cache when Cookie header is present', async () => {
    mockFetch.mockResolvedValueOnce(new Response('cookie', { status: 200 }));
    const request = new Request('https://gifmeme.org/api/gifs/trending', {
      headers: {
        Cookie: 'session=abc123',
      },
    });

    await fetchWithCacheApi(request, 300);

    expect(mockCache.match).not.toHaveBeenCalled();
    expect(mockCache.put).not.toHaveBeenCalled();
  });

  it('skips cache when X-Customer-Id header is present', async () => {
    mockFetch.mockResolvedValueOnce(new Response('customer', { status: 200 }));
    const request = new Request('https://gifmeme.org/api/gifs/trending', {
      headers: {
        'X-Customer-Id': '12345',
      },
    });

    await fetchWithCacheApi(request, 300);

    expect(mockCache.match).not.toHaveBeenCalled();
    expect(mockCache.put).not.toHaveBeenCalled();
  });

  it('bypasses cache when global cache storage is unavailable', async () => {
    vi.stubGlobal('caches', undefined);
    mockFetch.mockResolvedValueOnce(new Response('origin', { status: 200 }));
    const request = new Request('https://gifmeme.org/api/gifs/trending?page=1');

    const result = await fetchWithCacheApi(request, 300);

    expect(mockFetch).toHaveBeenCalledWith(request);
    expect(result.status).toBe(200);
  });

  it('does not cache non-JSON 200 responses', async () => {
    mockCache.match.mockResolvedValueOnce(undefined);
    mockFetch.mockResolvedValueOnce(new Response('plain text', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    }));
    const request = new Request('https://gifmeme.org/api/gifs/trending?page=1');

    const result = await fetchWithCacheApi(request, 300);

    expect(mockCache.match).toHaveBeenCalledTimes(1);
    expect(mockCache.put).not.toHaveBeenCalled();
    await expect(result.text()).resolves.toBe('plain text');
  });
});

describe('CACHE_TTL', () => {
  it('contains expected TTL mappings', () => {
    expect(CACHE_TTL.trending).toBe(300);
    expect(CACHE_TTL.stickers).toBe(300);
    expect(CACHE_TTL.search).toBe(600);
    expect(CACHE_TTL.categories).toBe(3600);
    expect(CACHE_TTL.detail).toBe(3600);
  });
});
