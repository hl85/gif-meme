import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND'); }),
}));

const mockKV = {
  get: vi.fn(),
  put: vi.fn(),
};

const mockCloudflareEnv = {
  env: {
    KLIPY_API_KEY: 'test_key',
    cache: mockKV,
  },
};

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => Promise.resolve(mockCloudflareEnv),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

async function renderPage(params: { slug: string }) {
  const { default: CategoryPage } = await import('../page');
  return CategoryPage({ params: Promise.resolve(params) });
}

describe('CategoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKV.get.mockResolvedValue(null);
    mockKV.put.mockResolvedValue(undefined);
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { data: [{ name: 'Funny Cats' }] } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: {
            data: [
              {
                id: 1,
                title: 'Test GIF',
                slug: 'test-gif',
                type: 'gif',
                file: {
                  hd: { gif: { url: 'https://example.com/test.gif', width: 200, height: 200, size: 1000 } },
                  sm: { gif: { url: 'https://example.com/test-sm.gif', width: 100, height: 100, size: 500 } },
                },
              },
            ],
          },
        }),
      });
    });
  });

  it('calls notFound when slug is missing', async () => {
    // @ts-ignore
    await expect(renderPage({ slug: '' })).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('renders correctly with a valid slug', async () => {
    const result = await renderPage({ slug: 'funny-cats' });
    expect(result).toBeDefined();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('q=Funny+Cats'),
      expect.any(Object)
    );
  });

  it('formats category name correctly', async () => {
    await renderPage({ slug: 'trending-memes-2025' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('q=Trending+Memes+2025'),
      expect.any(Object)
    );
  });

  it('handles fetch failure gracefully', async () => {
    mockFetch.mockImplementation(() => Promise.reject(new Error('API down')));
    const result = await renderPage({ slug: 'funny-cats' });
    expect(result).toBeDefined();
  });
});
