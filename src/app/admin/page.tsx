import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  queryPVByDay,
  queryUVByDay,
  queryTopReferrers,
  queryTopPages,
  queryTotals,
} from '@/lib/analytics/queries';
import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/admin';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard — GifMeme',
  robots: {
    index: false,
  },
};

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function offsetDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function shortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

interface SearchParams {
  range?: string;
  from?: string;
  to?: string;
}

interface AdminDashboardPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const session = await getSession();
  if (!session || !isAdmin(session.email)) {
    notFound();
  }

  const params = await searchParams;
  const range = params.range ?? '7';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = offsetDays(today, 1);

  let fromDate: Date;
  let toDate: Date = tomorrow;

  if (range === 'custom' && params.from && params.to) {
    fromDate = new Date(params.from);
    toDate = new Date(params.to);
  } else {
    const days = range === '30' ? 30 : 7;
    fromDate = offsetDays(today, -days + 1);
  }

  const from = toISODate(fromDate);
  const to = toISODate(toDate);

  const accountId = process.env.CF_ACCOUNT_ID ?? '';
  const apiToken = process.env.CF_ANALYTICS_TOKEN ?? '';

  const [pvByDay, uvByDay, topReferrers, topPages, totals] = await Promise.allSettled([
    queryPVByDay(accountId, apiToken, from, to),
    queryUVByDay(accountId, apiToken, from, to),
    queryTopReferrers(accountId, apiToken, from, to),
    queryTopPages(accountId, apiToken, from, to),
    queryTotals(accountId, apiToken, from, to),
  ]);

  type DayRow = { date: string; value: number };

  const pvRows: DayRow[] =
    pvByDay.status === 'fulfilled'
      ? pvByDay.value.data.map((r) => ({ date: String(r.date).slice(0, 10), value: Number(r.pv) }))
      : [];

  const uvRows: DayRow[] =
    uvByDay.status === 'fulfilled'
      ? uvByDay.value.data.map((r) => ({ date: String(r.date).slice(0, 10), value: Number(r.uv) }))
      : [];

  const referrers: { referrer: string; count: number }[] =
    topReferrers.status === 'fulfilled'
      ? topReferrers.value.data.map((r) => ({ referrer: String(r.referrer), count: Number(r.count) }))
      : [];

  const pages: { path: string; pv: number; uv: number }[] =
    topPages.status === 'fulfilled'
      ? topPages.value.data.map((r) => ({ path: String(r.path), pv: Number(r.pv), uv: Number(r.uv) }))
      : [];

  const totalPV =
    totals.status === 'fulfilled' && totals.value.data[0]
      ? Number(totals.value.data[0].pv)
      : 0;
  const totalUV =
    totals.status === 'fulfilled' && totals.value.data[0]
      ? Number(totals.value.data[0].uv)
      : 0;

  const pvMax = Math.max(...pvRows.map((r) => r.value), 1);
  const uvMax = Math.max(...uvRows.map((r) => r.value), 1);
  const referrerMax = Math.max(...referrers.map((r) => r.count), 1);
  const pageMax = Math.max(...pages.map((r) => r.pv), 1);

  const hasError =
    pvByDay.status === 'rejected' ||
    uvByDay.status === 'rejected' ||
    topReferrers.status === 'rejected' ||
    topPages.status === 'rejected';

  return (
    <div className="admin-page">
      <div className="admin-page__top">
        <h1 className="admin-page__title">Analytics</h1>
        <nav className="admin-main-nav" aria-label="Admin navigation">
          <Link href="/admin/categories" className="admin-main-nav__link">
            Categories
          </Link>
        </nav>
        <nav className="admin-range-nav" aria-label="Date range">
          <Link
            href="/admin?range=7"
            className={`admin-range-nav__btn${range === '7' ? ' admin-range-nav__btn--active' : ''}`}
          >
            7d
          </Link>
          <Link
            href="/admin?range=30"
            className={`admin-range-nav__btn${range === '30' ? ' admin-range-nav__btn--active' : ''}`}
          >
            30d
          </Link>
        </nav>
      </div>

      {hasError && (
        <p className="admin-page__error">
          Some data failed to load. Check CF_ACCOUNT_ID / CF_ANALYTICS_TOKEN env vars.
        </p>
      )}

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Page Views</span>
          <span className="admin-stat-card__value" data-testid="total-pv">{fmtNum(totalPV)}</span>
          <span className="admin-stat-card__sub">{from} — {toISODate(offsetDays(toDate, -1))}</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Unique Visitors</span>
          <span className="admin-stat-card__value" data-testid="total-uv">{fmtNum(totalUV)}</span>
          <span className="admin-stat-card__sub">{from} — {toISODate(offsetDays(toDate, -1))}</span>
        </div>
      </div>

      <section className="admin-section">
        <h2 className="admin-section__title">Page Views / day</h2>
        {pvRows.length === 0 ? (
          <p className="admin-section__empty">No data for this period.</p>
        ) : (
          <div className="admin-bar-chart" role="img" aria-label="Daily page views bar chart">
            {pvRows.map((row) => (
              <div key={row.date} className="admin-bar-chart__col">
                <span className="admin-bar-chart__value">{fmtNum(row.value)}</span>
                <div
                  className="admin-bar-chart__bar"
                  style={{ '--bar-pct': `${Math.max((row.value / pvMax) * 100, 2)}%` } as React.CSSProperties}
                  title={`${row.date}: ${row.value} PV`}
                />
                <span className="admin-bar-chart__label">{shortDate(row.date)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2 className="admin-section__title">Unique Visitors / day</h2>
        {uvRows.length === 0 ? (
          <p className="admin-section__empty">No data for this period.</p>
        ) : (
          <div className="admin-bar-chart admin-bar-chart--uv" role="img" aria-label="Daily unique visitors bar chart">
            {uvRows.map((row) => (
              <div key={row.date} className="admin-bar-chart__col">
                <span className="admin-bar-chart__value">{fmtNum(row.value)}</span>
                <div
                  className="admin-bar-chart__bar"
                  style={{ '--bar-pct': `${Math.max((row.value / uvMax) * 100, 2)}%` } as React.CSSProperties}
                  title={`${row.date}: ${row.value} UV`}
                />
                <span className="admin-bar-chart__label">{shortDate(row.date)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="admin-tables-grid">
        <section className="admin-section">
          <h2 className="admin-section__title">Top Referrers</h2>
          {referrers.length === 0 ? (
            <p className="admin-section__empty">No referrer data.</p>
          ) : (
            <table className="admin-table" data-testid="referrers-table">
              <thead>
                <tr>
                  <th>Referrer</th>
                  <th className="admin-table__num">Hits</th>
                  <th className="admin-table__bar-col" aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {referrers.map((r) => (
                  <tr key={r.referrer}>
                    <td className="admin-table__url" title={r.referrer}>
                      {r.referrer || <span className="admin-table__direct">(direct)</span>}
                    </td>
                    <td className="admin-table__num">{fmtNum(r.count)}</td>
                    <td className="admin-table__bar-col" aria-hidden="true">
                      <div
                        className="admin-table__bar"
                        style={{ '--bar-pct': `${(r.count / referrerMax) * 100}%` } as React.CSSProperties}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="admin-section">
          <h2 className="admin-section__title">Top Pages</h2>
          {pages.length === 0 ? (
            <p className="admin-section__empty">No page data.</p>
          ) : (
            <table className="admin-table" data-testid="pages-table">
              <thead>
                <tr>
                  <th>Path</th>
                  <th className="admin-table__num">PV</th>
                  <th className="admin-table__num">UV</th>
                  <th className="admin-table__bar-col" aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.path}>
                    <td className="admin-table__url" title={p.path}>{p.path}</td>
                    <td className="admin-table__num">{fmtNum(p.pv)}</td>
                    <td className="admin-table__num">{fmtNum(p.uv)}</td>
                    <td className="admin-table__bar-col" aria-hidden="true">
                      <div
                        className="admin-table__bar"
                        style={{ '--bar-pct': `${(p.pv / pageMax) * 100}%` } as React.CSSProperties}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
