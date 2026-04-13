function buildNormalizedCacheKey(request: Request): Request {
  const url = new URL(request.url);
  const entries = Array.from(url.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b));
  const normalizedParams = new URLSearchParams(entries);
  url.search = normalizedParams.toString();

  return new Request(url.toString(), {
    method: 'GET',
    headers: request.headers,
  });
}

function shouldBypassCache(request: Request): boolean {
  if (request.method !== 'GET') {
    return true;
  }

  if (
    request.headers.has('Cookie') ||
    request.headers.has('Authorization') ||
    request.headers.has('X-Customer-Id')
  ) {
    return true;
  }

  return false;
}

function getCacheDefault(): Cache | undefined {
  const cacheStorage = (globalThis as typeof globalThis & { caches?: { default?: Cache } }).caches;
  return cacheStorage?.default;
}

function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get('Content-Type');
  if (!contentType) {
    return false;
  }

  return contentType.toLowerCase().includes('application/json');
}

export async function fetchWithCacheApi(request: Request, ttlSeconds: number): Promise<Response> {
  if (shouldBypassCache(request)) {
    return fetch(request);
  }

  const cache = getCacheDefault();
  if (!cache) {
    return fetch(request);
  }

  const cacheKey = buildNormalizedCacheKey(request);
  const cached = await cache.match(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  if (response.status !== 200 || !isJsonResponse(response)) {
    return response;
  }

  const cacheableResponse = new Response(response.body, response);
  cacheableResponse.headers.set('Cache-Control', `s-maxage=${ttlSeconds}`);
  await cache.put(cacheKey, cacheableResponse.clone());

  return cacheableResponse;
}
