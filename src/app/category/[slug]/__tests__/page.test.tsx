import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notFound } from 'next/navigation';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND'); }),
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
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/gifs/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { data: [{ name: 'Funny Cats' }] } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          items: [],
          ads: [],
          page: 1,
          perPage: 20,
          hasNext: false,
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
      expect.stringContaining('q=Funny%20Cats'),
      expect.any(Object)
    );
  });

  it('formats category name correctly', async () => {
    await renderPage({ slug: 'trending-memes-2025' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('q=Trending%20Memes%202025'),
      expect.any(Object)
    );
  });

  it('handles fetch failure gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('API down'));
    const result = await renderPage({ slug: 'funny-cats' });
    expect(result).toBeDefined();
  });
});
