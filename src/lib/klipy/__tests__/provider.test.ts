import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KlipyProvider } from '../provider';

describe('KlipyProvider', () => {
  let mockKV: any;
  let provider: KlipyProvider;

  beforeEach(() => {
    mockKV = {
      get: vi.fn(),
      put: vi.fn(),
    };
    provider = new KlipyProvider('test-api-key', mockKV);
    global.fetch = vi.fn();
  });

  it('should fetch trending gifs and cache the result', async () => {
    const mockApiResponse = {
      data: {
        data: [
          { id: 'gif1', title: 'Funny Cat', url: 'cat.gif' },
          { is_ad: true, id: 'ad1', image_url: 'ad.png' }
        ]
      }
    };

    mockKV.get.mockResolvedValueOnce(null);
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    const result = await provider.trending(1, 20);

    expect(mockKV.get).toHaveBeenCalledWith(expect.stringContaining('klipy:/gifs/trending'));
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://api.klipy.com/api/v1/test-api-key/gifs/trending'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.any(String)
        })
      })
    );
    expect(mockKV.put).toHaveBeenCalledWith(
      expect.stringContaining('klipy:/gifs/trending'),
      JSON.stringify(mockApiResponse),
      { expirationTtl: 300 }
    );

    expect(result.items).toHaveLength(1);
    expect(result.ads).toHaveLength(1);
    expect(result.items[0].id).toBe('gif1');
    expect(result.ads[0].id).toBe('ad1');
  });

  it('should return cached result if available', async () => {
    const cachedData = {
      data: {
        data: [
          { id: 'gif2', title: 'Dog', url: 'dog.gif' }
        ]
      }
    };

    mockKV.get.mockResolvedValueOnce(JSON.stringify(cachedData));

    const result = await provider.trending(1, 20);

    expect(mockKV.get).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockKV.put).not.toHaveBeenCalled();

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('gif2');
  });
});
