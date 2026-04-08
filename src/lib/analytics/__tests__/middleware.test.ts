import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../../../middleware';
import * as collector from '../collector';

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn().mockResolvedValue({
    env: {
      gifmeme_analytics: {
        writeDataPoint: vi.fn(),
      },
    },
  }),
}));

vi.mock('../collector', () => ({
  writePageView: vi.fn(),
}));

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips API routes', async () => {
    const req = new NextRequest('http://localhost:3000/api/gifs/trending');
    const res = await middleware(req);
    
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(collector.writePageView).not.toHaveBeenCalled();
  });

  it('skips static assets', async () => {
    const req = new NextRequest('http://localhost:3000/_next/static/css/app.css');
    const res = await middleware(req);
    
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(collector.writePageView).not.toHaveBeenCalled();
  });

  it('sets visitor_id cookie if not present', async () => {
    const req = new NextRequest('http://localhost:3000/');
    const res = await middleware(req);
    
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('visitor_id=');
    expect(setCookie).toContain('Max-Age=31536000');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=lax');
    
    expect(collector.writePageView).toHaveBeenCalled();
  });

  it('preserves existing visitor_id cookie', async () => {
    const req = new NextRequest('http://localhost:3000/', {
      headers: {
        cookie: 'visitor_id=existing-id-123',
      },
    });
    const res = await middleware(req);
    
    expect(res.headers.get('set-cookie')).toBeNull();
    
    expect(collector.writePageView).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        visitorId: 'existing-id-123',
      })
    );
  });
});
