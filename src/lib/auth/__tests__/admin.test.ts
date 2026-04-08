import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isAdmin } from '../admin';

describe('isAdmin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns true if email is in ADMIN_EMAILS', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com,test@example.com';
    expect(isAdmin('admin@example.com')).toBe(true);
    expect(isAdmin('test@example.com')).toBe(true);
  });

  it('returns false if email is not in ADMIN_EMAILS', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com,test@example.com';
    expect(isAdmin('user@example.com')).toBe(false);
  });

  it('returns false if ADMIN_EMAILS is not set', () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdmin('admin@example.com')).toBe(false);
  });

  it('handles spaces in ADMIN_EMAILS', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com, test@example.com , another@example.com';
    expect(isAdmin('test@example.com')).toBe(true);
    expect(isAdmin('another@example.com')).toBe(true);
  });

  it('is case insensitive', () => {
    process.env.ADMIN_EMAILS = 'Admin@Example.com';
    expect(isAdmin('admin@example.com')).toBe(true);
    expect(isAdmin('ADMIN@EXAMPLE.COM')).toBe(true);
  });
});
