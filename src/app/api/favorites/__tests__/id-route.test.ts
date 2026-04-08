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

describe('DELETE /api/favorites/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getCloudflareContext as any).mockResolvedValue({ env: { 'main-db': mockD1 } });
  });

  it('returns 401 when not authenticated', async () => {
    (getSession as any).mockResolvedValue(null);

    const { DELETE } = await import('../[id]/route');
    const request = new NextRequest('http://localhost/api/favorites/fav-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: 'fav-1' }) });

    expect(response.status).toBe(401);
  });

  it('returns 404 when favorite does not exist for user', async () => {
    (getSession as any).mockResolvedValue(mockSessionUser);

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    };
    (getDb as any).mockReturnValue(mockDb);

    const { DELETE } = await import('../[id]/route');
    const request = new NextRequest('http://localhost/api/favorites/nonexistent', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(response.status).toBe(404);
  });

  it('deletes favorite successfully', async () => {
    (getSession as any).mockResolvedValue(mockSessionUser);

    const existingFav = { id: 'fav-1', userId: 'user-123', itemType: 'gif', itemId: 'gif-abc' };
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingFav]),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    };
    (getDb as any).mockReturnValue(mockDb);

    const { DELETE } = await import('../[id]/route');
    const request = new NextRequest('http://localhost/api/favorites/fav-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: 'fav-1' }) });

    expect(response.status).toBe(204);
  });
});
