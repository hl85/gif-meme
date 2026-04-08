export interface AnalyticsQueryResult {
  meta: Array<{ name: string; type: string }>;
  data: Array<Record<string, string | number>>;
  rows: number;
}

const DATASET_NAME = 'gifmeme_analytics';

async function executeQuery(
  accountId: string,
  apiToken: string,
  query: string
): Promise<AnalyticsQueryResult> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    body: query,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Analytics Engine query failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<AnalyticsQueryResult>;
}

export async function queryPVByDay(
  accountId: string,
  apiToken: string,
  from: string,
  to: string
) {
  const query = `
SELECT
  toStartOfInterval(timestamp, INTERVAL '1' DAY) AS date,
  SUM(_sample_interval * double1) AS pv
FROM ${DATASET_NAME}
WHERE
  timestamp >= toDateTime('${from}')
  AND timestamp < toDateTime('${to}')
GROUP BY date
ORDER BY date ASC
FORMAT JSON
  `.trim();

  return executeQuery(accountId, apiToken, query);
}

export async function queryUVByDay(
  accountId: string,
  apiToken: string,
  from: string,
  to: string
) {
  const query = `
SELECT
  toStartOfInterval(timestamp, INTERVAL '1' DAY) AS date,
  COUNT(DISTINCT blob1) AS uv
FROM ${DATASET_NAME}
WHERE
  timestamp >= toDateTime('${from}')
  AND timestamp < toDateTime('${to}')
GROUP BY date
ORDER BY date ASC
FORMAT JSON
  `.trim();

  return executeQuery(accountId, apiToken, query);
}

export async function queryTopReferrers(
  accountId: string,
  apiToken: string,
  from: string,
  to: string,
  limit = 10
) {
  const query = `
SELECT
  blob2 AS referrer,
  SUM(_sample_interval) AS count
FROM ${DATASET_NAME}
WHERE
  timestamp >= toDateTime('${from}')
  AND timestamp < toDateTime('${to}')
  AND blob2 != ''
GROUP BY referrer
ORDER BY count DESC
LIMIT ${limit}
FORMAT JSON
  `.trim();

  return executeQuery(accountId, apiToken, query);
}

export async function queryPageStats(
  accountId: string,
  apiToken: string,
  path: string,
  from: string,
  to: string
) {
  const query = `
SELECT
  SUM(_sample_interval * double1) AS pv,
  COUNT(DISTINCT blob1) AS uv
FROM ${DATASET_NAME}
WHERE
  blob3 = '${path}'
  AND timestamp >= toDateTime('${from}')
  AND timestamp < toDateTime('${to}')
FORMAT JSON
  `.trim();

  return executeQuery(accountId, apiToken, query);
}
