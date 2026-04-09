import { afterEach, describe, expect, it } from 'vitest';
import { getAppBaseUrl, getCanonicalBaseUrl, getLocalPort, toAppUrl } from '../base-url';

describe('base-url helpers', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('prefers NEXT_PUBLIC_BASE_URL', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_BASE_URL: 'http://localhost:8787/',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    };

    expect(getAppBaseUrl()).toBe('http://localhost:8787');
  });

  it('falls back to NEXT_PUBLIC_APP_URL', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_APP_URL: 'http://localhost:8787/',
    };

    expect(getAppBaseUrl()).toBe('http://localhost:8787');
  });

  it('falls back to LOCAL_PORT for local development', () => {
    process.env = {
      ...originalEnv,
      LOCAL_PORT: '8899',
    };

    expect(getLocalPort()).toBe('8899');
    expect(getAppBaseUrl()).toBe('http://localhost:8899');
    expect(toAppUrl('/api/gifs/trending?page=1')).toBe('http://localhost:8899/api/gifs/trending?page=1');
  });

  it('uses production canonical fallback when no public base url is configured', () => {
    process.env = { ...originalEnv };

    expect(getCanonicalBaseUrl()).toBe('https://gifmeme.org');
  });
});
