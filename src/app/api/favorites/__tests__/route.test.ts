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
    count: vi.fn(() => ({ type: 'count' })),
  };
});

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';

const mockD1 = {};
const mockSessionUser = { userId: 'user-123', email: 'test@example.com' };

function makeMockDb(overrides: Record<string, any> = {}) {
  const base = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    query: {},
    ...overrides,
  };
  return base;
}

describe('GET /api/favorites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getCloudflareContext as any).mockResolvedValue({ env: { 'main-db': mockD1 } });
  });

  it('returns 401 when not authenticated', async () => {
    (getSession as any).mockResolvedValue(null);

    const { GET } = await import('../route');
    const request = new NextRequest('http://localhost/api/favorites');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json() as Record<string, unknown>;
    expect(body.error).toBeDefined();
  });

  it('returns list of favorites for authenticated user', async () => {
    (getSession as any).mockResolvedValue(mockSessionUser);
    const mockFavorites = [
      {
        id: 'fav-1',
        userId: 'user-123',
        itemType: 'gif',
        itemId: 'gif-abc',
        itemTitle: 'Funny cat',
        itemUrl: 'https://example.com/cat.gif',
        itemPreviewUrl: 'https://example.com/cat_thumb.gif',
        createdAt: new Date(),
      },
    ];

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(mockFavorites),
              }),
            }),
          }),
        }),
      }),
    };
    (getDb as any).mockReturnValue(mockDb);

    const { GET } = await import('../route');
    const request = new NextRequest('http://localhost/api/favorites');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json() as Record<string, unknown>;
    expect(body.items).toHaveLength(1);
    expect((body.items as Array<Record<string, unknown>>)[0].itemId).toBe('gif-abc');
  });
});

describe('POST /api/favorites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getCloudflareContext as any).mockResolvedValue({ env: { 'main-db': mockD1 } });
  });

  it('returns 401 when not authenticated', async () => {
    (getSession as any).mockResolvedValue(null);

    const { POST } = await import('../route');
    const request = new NextRequest('http://localhost/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ itemType: 'gif', itemId: 'gif-1', itemTitle: 'test', itemUrl: 'http://x.com', itemPreviewUrl: 'http://x.com/t' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    (getSession as any).mockResolvedValue(mockSessionUser);

    const mockDb = makeMockDb();
    (getDb as any).mockReturnValue(mockDb);

    const { POST } = await import('../route');
    const request = new NextRequest('http://localhost/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ itemType: 'gif' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when favorites limit (500) is reached', async () => {
    (getSession as any).mockResolvedValue(mockSessionUser);

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 500 }]),
        }),
      }),
    };
    (getDb as any).mockReturnValue(mockDb);

    const { POST } = await import('../route');
    const request = new NextRequest('http://localhost/api/favorites', {
      method: 'POST',
      body: JSON.stringify({
        itemType: 'gif',
        itemId: 'gif-new',
        itemTitle: 'New gif',
        itemUrl: 'http://x.com/new.gif',
        itemPreviewUrl: 'http://x.com/new_t.gif',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json() as Record<string, unknown>;
    expect(body.error).toMatch(/limit/i);
  });

  it('adds favorite successfully when under limit', async () => {
    (getSession as any).mockResolvedValue(mockSessionUser);

    const insertResult = { id: 'new-fav-id', userId: 'user-123', itemType: 'gif', itemId: 'gif-new', itemTitle: 'New gif', itemUrl: 'http://x.com/new.gif', itemPreviewUrl: 'http://x.com/new_t.gif', createdAt: new Date() };

    const mockInsertValuesReturning = vi.fn().mockResolvedValue([insertResult]);
    const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertValuesReturning });
    const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 10 }]),
        }),
      }),
      insert: mockInsert,
    };
    (getDb as any).mockReturnValue(mockDb);

    const { POST } = await import('../route');
    const request = new NextRequest('http://localhost/api/favorites', {
      method: 'POST',
      body: JSON.stringify({
        itemType: 'gif',
        itemId: 'gif-new',
        itemTitle: 'New gif',
        itemUrl: 'http://x.com/new.gif',
        itemPreviewUrl: 'http://x.com/new_t.gif',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mockInsert).toHaveBeenCalled();
  });
});
