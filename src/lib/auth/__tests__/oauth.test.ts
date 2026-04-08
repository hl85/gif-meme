import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getGoogleAuthUrl, getGoogleToken, getGoogleUser } from '../oauth';

describe('oauth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    };
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('getGoogleAuthUrl', () => {
    it('generates a valid Google OAuth URL', () => {
      const { url, state } = getGoogleAuthUrl();
      
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      
      const parsedUrl = new URL(url);
      expect(parsedUrl.origin).toBe('https://accounts.google.com');
      expect(parsedUrl.pathname).toBe('/o/oauth2/v2/auth');
      expect(parsedUrl.searchParams.get('client_id')).toBe('test-client-id');
      expect(parsedUrl.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/auth/callback');
      expect(parsedUrl.searchParams.get('response_type')).toBe('code');
      expect(parsedUrl.searchParams.get('scope')).toContain('openid');
      expect(parsedUrl.searchParams.get('scope')).toContain('email');
      expect(parsedUrl.searchParams.get('scope')).toContain('profile');
      expect(parsedUrl.searchParams.get('state')).toBe(state);
    });

    it('throws if GOOGLE_CLIENT_ID is missing', () => {
      delete process.env.GOOGLE_CLIENT_ID;
      expect(() => getGoogleAuthUrl()).toThrow('GOOGLE_CLIENT_ID is not set');
    });
  });

  describe('getGoogleToken', () => {
    it('exchanges code for token', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          access_token: 'mock-access-token',
          id_token: 'mock-id-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const tokenData = await getGoogleToken('mock-code');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
      
      expect(tokenData.access_token).toBe('mock-access-token');
    });

    it('throws if fetch fails', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Bad Request',
        text: vi.fn().mockResolvedValue('Invalid code'),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(getGoogleToken('invalid-code')).rejects.toThrow('Failed to fetch Google token: Bad Request - Invalid code');
    });
  });

  describe('getGoogleUser', () => {
    it('fetches user info using access token', async () => {
      const mockUser = {
        id: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.png',
      };
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockUser),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const user = await getGoogleUser('mock-access-token');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer mock-access-token',
          },
        })
      );
      
      expect(user).toEqual(mockUser);
    });
  });
});
