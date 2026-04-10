const DEFAULT_LOCAL_PORT = '8787';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

export function getLocalPort() {
  const value = process.env.LOCAL_PORT?.trim();
  return value && /^\d+$/.test(value) ? value : DEFAULT_LOCAL_PORT;
}

export function getAppBaseUrl() {
  // Prefer runtime-only env vars (not inlined by Next.js webpack at build time).
  // NEXT_PUBLIC_* vars are replaced with literal strings during `next build`,
  // so they can't be overridden by Cloudflare Worker secrets at runtime.
  const runtimeBaseUrl = process.env.APP_BASE_URL?.trim();
  if (runtimeBaseUrl) {
    return trimTrailingSlash(runtimeBaseUrl);
  }

  const runtimeAppUrl = process.env.APP_URL?.trim();
  if (runtimeAppUrl) {
    return trimTrailingSlash(runtimeAppUrl);
  }

  const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return trimTrailingSlash(configuredBaseUrl);
  }

  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredAppUrl) {
    return trimTrailingSlash(configuredAppUrl);
  }

  return `http://localhost:${getLocalPort()}`;
}

export function getCanonicalBaseUrl() {
  const runtimeBaseUrl = process.env.APP_BASE_URL?.trim();
  if (runtimeBaseUrl) {
    return trimTrailingSlash(runtimeBaseUrl);
  }

  const runtimeAppUrl = process.env.APP_URL?.trim();
  if (runtimeAppUrl) {
    return trimTrailingSlash(runtimeAppUrl);
  }

  const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return trimTrailingSlash(configuredBaseUrl);
  }

  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredAppUrl) {
    return trimTrailingSlash(configuredAppUrl);
  }

  return 'https://gifmeme.org';
}

export function toAppUrl(path: string) {
  return `${getAppBaseUrl()}${normalizePath(path)}`;
}
