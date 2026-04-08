import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => { throw new Error('NEXT_REDIRECT'); }),
}));

import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

const mockSession = { userId: 'user-abc', email: 'test@example.com' };

const mockFavoriteItem = {
  id: 'fav-1',
  userId: 'user-abc',
  itemType: 'gif',
  itemId: 'gif-xyz',
  itemTitle: 'Cool GIF',
  itemUrl: 'https://example.com/cool.gif',
  itemPreviewUrl: 'https://example.com/cool_thumb.gif',
  createdAt: new Date(),
};

async function renderPage() {
  vi.resetModules();
  const { default: FavoritesPage } = await import('../page');
  return FavoritesPage();
}

describe('FavoritesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('redirects unauthenticated users to login', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/api/auth/login');
  });

  it('renders favorites page for authenticated users', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [mockFavoriteItem], page: 1, perPage: 50 }),
    });

    const result = await renderPage();
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  });

  it('renders empty state when favorites list is empty', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], page: 1, perPage: 50 }),
    });

    const result = await renderPage();
    expect(result).toBeTruthy();
  });

  it('gracefully handles fetch failure', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const result = await renderPage();
    expect(result).toBeTruthy();
  });

  it('gracefully handles non-ok fetch response', async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const result = await renderPage();
    expect(result).toBeTruthy();
  });
});
