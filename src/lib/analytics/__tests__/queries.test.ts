import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryPVByDay, queryUVByDay, queryTopReferrers, queryPageStats, queryTopPages, queryTotals } from '../queries';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Analytics Queries', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        meta: [],
        data: [{ date: '2024-01-01', pv: 100 }],
        rows: 1,
      }),
    });
  });

  it('queryPVByDay sends correct SQL query', async () => {
    await queryPVByDay('acc-123', 'token-456', '2024-01-01 00:00:00', '2024-01-02 00:00:00');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.cloudflare.com/client/v4/accounts/acc-123/analytics_engine/sql',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer token-456',
        },
        body: expect.stringContaining('SUM(_sample_interval * double1) AS pv'),
      })
    );
  });

  it('queryUVByDay sends correct SQL query', async () => {
    await queryUVByDay('acc-123', 'token-456', '2024-01-01 00:00:00', '2024-01-02 00:00:00');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('COUNT(DISTINCT blob1) AS uv'),
      })
    );
  });

  it('queryTopReferrers sends correct SQL query', async () => {
    await queryTopReferrers('acc-123', 'token-456', '2024-01-01 00:00:00', '2024-01-02 00:00:00', 5);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('LIMIT 5'),
      })
    );
  });

  it('queryPageStats sends correct SQL query', async () => {
    await queryPageStats('acc-123', 'token-456', '/search', '2024-01-01 00:00:00', '2024-01-02 00:00:00');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining("blob2 = '/search'"),
      })
    );
  });

  it('throws error on failed response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    });

    await expect(
      queryPVByDay('acc-123', 'token-456', '2024-01-01', '2024-01-02')
    ).rejects.toThrow('Analytics Engine query failed (400): Bad Request');
  });

  it('queryTopPages sends correct SQL query with LIMIT', async () => {
    await queryTopPages('acc-123', 'token-456', '2024-01-01 00:00:00', '2024-01-02 00:00:00', 5);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('LIMIT 5'),
      })
    );
    const body = mockFetch.mock.calls[0][1].body as string;
    expect(body).toContain('blob2 AS path');
    expect(body).toContain('SUM(_sample_interval * double1) AS pv');
    expect(body).toContain('COUNT(DISTINCT blob1) AS uv');
  });

  it('queryTopReferrers reads the referrer blob column', async () => {
    await queryTopReferrers('acc-123', 'token-456', '2024-01-01 00:00:00', '2024-01-02 00:00:00', 5);

    const body = mockFetch.mock.calls[0][1].body as string;
    expect(body).toContain('blob3 AS referrer');
    expect(body).toContain("AND blob3 != ''");
  });

  it('queryTotals sends a summary query without GROUP BY', async () => {
    await queryTotals('acc-123', 'token-456', '2024-01-01 00:00:00', '2024-01-02 00:00:00');

    const body = mockFetch.mock.calls[0][1].body as string;
    expect(body).toContain('SUM(_sample_interval * double1) AS pv');
    expect(body).toContain('COUNT(DISTINCT blob1) AS uv');
    expect(body).not.toContain('GROUP BY');
  });
});
