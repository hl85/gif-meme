import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPrewarmUrls } from '../url-whitelist';
import { handleScheduled } from '../handler';

describe('getPrewarmUrls', () => {
  it('builds whitelist with required static and dynamic category URLs', () => {
    const urls = getPrewarmUrls('https://gifmeme.org', ['cats', 'funny-dogs']);

    expect(urls).toEqual([
      'https://gifmeme.org/',
      'https://gifmeme.org/api/gifs/categories',
      'https://gifmeme.org/api/gifs/trending?page=1',
      'https://gifmeme.org/api/gifs/trending?page=2',
      'https://gifmeme.org/api/gifs/trending?page=3',
      'https://gifmeme.org/api/stickers/trending?page=1',
      'https://gifmeme.org/api/stickers/trending?page=2',
      'https://gifmeme.org/category/cats',
      'https://gifmeme.org/category/funny-dogs',
    ]);
  });

  it('does not include search, detail, or deep pagination URLs', () => {
    const urls = getPrewarmUrls('https://gifmeme.org', ['cats']);

    expect(urls).not.toContain('https://gifmeme.org/api/gifs/search?q=cats');
    expect(urls).not.toContain('https://gifmeme.org/api/stickers/search?q=cats');
    expect(urls).not.toContain('https://gifmeme.org/gif/123');
    expect(urls).not.toContain('https://gifmeme.org/api/gifs/trending?page=4');
    expect(urls).not.toContain('https://gifmeme.org/api/stickers/trending?page=3');
  });

  it('caps category URLs at 50', () => {
    const categories = Array.from({ length: 60 }, (_, i) => `cat-${i + 1}`);
    const urls = getPrewarmUrls('https://gifmeme.org', categories);

    const categoryUrls = urls.filter((url) => url.includes('/category/'));
    expect(categoryUrls).toHaveLength(50);
    expect(categoryUrls[0]).toBe('https://gifmeme.org/category/cat-1');
    expect(categoryUrls[49]).toBe('https://gifmeme.org/category/cat-50');
    expect(categoryUrls).not.toContain('https://gifmeme.org/category/cat-51');
  });
});

describe('handleScheduled', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches categories first and returns success summary for full batch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1088);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            data: [{ slug: 'cats' }, { name: 'Funny Dogs' }],
          },
        }),
        { status: 200 }
      )
    );
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    const result = await handleScheduled({ APP_BASE_URL: 'https://gifmeme.org' } as unknown as CloudflareEnv);

    expect(fetchMock).toHaveBeenCalled();
    expect(fetchMock.mock.calls[0][0]).toBe('https://gifmeme.org/api/gifs/categories');
    expect(fetchMock).toHaveBeenCalledWith('https://gifmeme.org/category/cats');
    expect(fetchMock).toHaveBeenCalledWith('https://gifmeme.org/category/funny-dogs');

    expect(result).toEqual({
      total: 9,
      succeeded: 9,
      failed: 0,
      failedUrls: [],
      durationMs: 88,
    });
  });

  it('isolates failed URLs and logs failures without aborting batch', async () => {
    const fetchMock = vi.fn();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', fetchMock);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { data: [{ slug: 'cats' }] } }), { status: 200 })
    );

    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/api/gifs/trending?page=2')) {
        return Promise.resolve(new Response(null, { status: 500 }));
      }
      if (url.endsWith('/category/cats')) {
        return Promise.reject(new Error('network down'));
      }
      return Promise.resolve(new Response(null, { status: 200 }));
    });

    const result = await handleScheduled({ APP_BASE_URL: 'https://gifmeme.org' } as unknown as CloudflareEnv);

    expect(result.total).toBe(8);
    expect(result.succeeded).toBe(6);
    expect(result.failed).toBe(2);
    expect(result.failedUrls).toEqual(
      expect.arrayContaining([
        'https://gifmeme.org/api/gifs/trending?page=2',
        'https://gifmeme.org/category/cats',
      ])
    );
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it('continues with static URLs when categories endpoint fails', async () => {
    const fetchMock = vi.fn();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', fetchMock);

    fetchMock.mockResolvedValueOnce(new Response('bad', { status: 500 }));
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    const result = await handleScheduled({ APP_BASE_URL: 'https://gifmeme.org' } as unknown as CloudflareEnv);

    expect(errorSpy).toHaveBeenCalled();
    expect(result.total).toBe(7);
    expect(result.succeeded).toBe(7);
    expect(result.failed).toBe(0);
  });
});
