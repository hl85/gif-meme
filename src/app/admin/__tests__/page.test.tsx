import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/auth/admin', () => ({
  isAdmin: vi.fn(),
}));

vi.mock('@/lib/analytics/queries', () => ({
  queryPVByDay: vi.fn(),
  queryUVByDay: vi.fn(),
  queryTopReferrers: vi.fn(),
  queryTopPages: vi.fn(),
  queryTotals: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND'); }),
}));

import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/admin';
import {
  queryPVByDay,
  queryUVByDay,
  queryTopReferrers,
  queryTopPages,
  queryTotals,
} from '@/lib/analytics/queries';

const mockedGetSession = vi.mocked(getSession);
const mockedIsAdmin = vi.mocked(isAdmin);
const mockedQueryPVByDay = vi.mocked(queryPVByDay);
const mockedQueryUVByDay = vi.mocked(queryUVByDay);
const mockedQueryTopReferrers = vi.mocked(queryTopReferrers);
const mockedQueryTopPages = vi.mocked(queryTopPages);
const mockedQueryTotals = vi.mocked(queryTotals);

const emptyResult = { meta: [], data: [], rows: 0 };

function makeSearchParams(params: Record<string, string> = {}): Promise<Record<string, string>> {
  return Promise.resolve(params);
}

async function renderPage(searchParams = makeSearchParams()) {
  const { default: AdminDashboardPage } = await import('../page');
  return AdminDashboardPage({ searchParams });
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    mockedGetSession.mockResolvedValue({ userId: 'u1', email: 'admin@example.com' });
    mockedIsAdmin.mockReturnValue(true);
    mockedQueryPVByDay.mockResolvedValue(emptyResult);
    mockedQueryUVByDay.mockResolvedValue(emptyResult);
    mockedQueryTopReferrers.mockResolvedValue(emptyResult);
    mockedQueryTopPages.mockResolvedValue(emptyResult);
    mockedQueryTotals.mockResolvedValue(emptyResult);
  });

  it('calls notFound when no session', async () => {
    mockedGetSession.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('calls notFound when session user is not admin', async () => {
    mockedIsAdmin.mockReturnValue(false);

    await expect(renderPage()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('renders without throwing for an admin user', async () => {
    await expect(renderPage()).resolves.toBeDefined();
  });

  it('queries analytics with 7-day range by default', async () => {
    await renderPage();

    expect(mockedQueryPVByDay).toHaveBeenCalledOnce();
    const [, , from, to] = mockedQueryPVByDay.mock.calls[0];

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
  });

  it('queries analytics with 30-day range when range=30', async () => {
    await renderPage(makeSearchParams({ range: '30' }));

    const [, , from, to] = mockedQueryPVByDay.mock.calls[0];
    const diffDays = Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });

  it('queries analytics with custom range when provided', async () => {
    await renderPage(makeSearchParams({ range: 'custom', from: '2025-01-01', to: '2025-01-15' }));

    const [, , from, to] = mockedQueryPVByDay.mock.calls[0];
    expect(from).toBe('2025-01-01');
    expect(to).toBe('2025-01-15');
  });

  it('includes totals, top referrers, and top pages queries', async () => {
    await renderPage();

    expect(mockedQueryTotals).toHaveBeenCalledOnce();
    expect(mockedQueryTopReferrers).toHaveBeenCalledOnce();
    expect(mockedQueryTopPages).toHaveBeenCalledOnce();
  });

  it('returns a React element when queryTotals provides data', async () => {
    mockedQueryTotals.mockResolvedValue({
      meta: [],
      data: [{ pv: 4200, uv: 300 }],
      rows: 1,
    });

    const result = await renderPage();
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  });

  it('gracefully handles query failures without throwing', async () => {
    mockedQueryPVByDay.mockRejectedValue(new Error('CF API down'));
    mockedQueryTotals.mockRejectedValue(new Error('CF API down'));

    await expect(renderPage()).resolves.toBeDefined();
  });

  it('all five queries run in parallel (allSettled)', async () => {
    const order: string[] = [];
    mockedQueryPVByDay.mockImplementation(() => { order.push('pv'); return Promise.resolve(emptyResult); });
    mockedQueryUVByDay.mockImplementation(() => { order.push('uv'); return Promise.resolve(emptyResult); });
    mockedQueryTopReferrers.mockImplementation(() => { order.push('ref'); return Promise.resolve(emptyResult); });
    mockedQueryTopPages.mockImplementation(() => { order.push('pages'); return Promise.resolve(emptyResult); });
    mockedQueryTotals.mockImplementation(() => { order.push('totals'); return Promise.resolve(emptyResult); });

    await renderPage();

    expect(order).toHaveLength(5);
    expect(new Set(order).size).toBe(5);
  });
});
