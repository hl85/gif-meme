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
