import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signJwt, verifyJwt, type SessionPayload } from '../jwt';

describe('jwt', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, JWT_SECRET: 'super-secret-key-that-is-at-least-32-chars-long' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('signs and verifies a JWT', async () => {
    const payload: SessionPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
      googleId: 'google-123',
    };

    const token = await signJwt(payload);
    expect(typeof token).toBe('string');

    const verified = await verifyJwt(token);
    expect(verified).toMatchObject(payload);
    expect(verified?.exp).toBeDefined();
    expect(verified?.iat).toBeDefined();
  });

  it('returns null for invalid token', async () => {
    const verified = await verifyJwt('invalid-token');
    expect(verified).toBeNull();
  });

  it('throws if JWT_SECRET is not set when signing', async () => {
    delete process.env.JWT_SECRET;
    const payload: SessionPayload = {
      userId: 'user-123',
      email: 'test@example.com',
    };
    await expect(signJwt(payload)).rejects.toThrow('JWT_SECRET is not set');
  });

  it('returns null if JWT_SECRET is not set when verifying', async () => {
    delete process.env.JWT_SECRET;
    const verified = await verifyJwt('some-token');
    expect(verified).toBeNull();
  });
});
