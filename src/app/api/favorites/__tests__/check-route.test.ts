import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: vi.fn((a: any, b: any) => ({ type: 'eq', a, b })),
    and: vi.fn((...args: any[]) => ({ type: 'and', args })),
  };
});

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';

const mockD1 = {};
const mockSessionUser = { userId: 'user-123', email: 'test@example.com' };

describe('GET /api/favorites/check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getCloudflareContext as any).mockResolvedValue({ env: { 'main-db': mockD1 } });
  });

  it('returns 401 when not authenticated', async () => {
    (getSession as any).mockResolvedValue(null);

    const { GET } = await import('../check/route');
    const request = new NextRequest('http://localhost/api/favorites/check?itemType=gif&itemId=gif-1');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns 400 when query params are missing', async () => {
    (getSession as any).mockResolvedValue(mockSessionUser);

    const { GET } = await import('../check/route');
    const request = new NextRequest('http://localhost/api/favorites/check');
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('returns favorited: false when item is not in favorites', async () => {
    (getSession as any).mockResolvedValue(mockSessionUser);

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    };
    (getDb as any).mockReturnValue(mockDb);

    const { GET } = await import('../check/route');
    const request = new NextRequest('http://localhost/api/favorites/check?itemType=gif&itemId=gif-not-faved');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json() as Record<string, unknown>;
    expect(body.favorited).toBe(false);
    expect(body.favoriteId).toBeNull();
  });

  it('returns favorited: true with favoriteId when item is in favorites', async () => {
    (getSession as any).mockResolvedValue(mockSessionUser);

    const existingFav = { id: 'fav-1', userId: 'user-123', itemType: 'gif', itemId: 'gif-abc' };
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingFav]),
        }),
      }),
    };
    (getDb as any).mockReturnValue(mockDb);

    const { GET } = await import('../check/route');
    const request = new NextRequest('http://localhost/api/favorites/check?itemType=gif&itemId=gif-abc');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json() as Record<string, unknown>;
    expect(body.favorited).toBe(true);
    expect(body.favoriteId).toBe('fav-1');
  });
});
