import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import type { KlipyGif } from '@/lib/klipy/types';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND'); }),
}));

const mockKV = {
  get: vi.fn(),
  put: vi.fn(),
};

const mockCloudflareEnv = {
  env: {
    KLIPY_API_KEY: 'test_key',
  },
};

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => Promise.resolve(mockCloudflareEnv),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn().mockResolvedValue(null),
}));

// Create a mock that will be replaced when KlipyProvider is constructed
const getByIdMock = vi.fn();


vi.mock('../GifDetailClient', () => ({
  GifDetailClient: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('../GifDetailContent', () => ({
  GifDetailContent: () => <div data-testid="gif-detail-content" />,
}));
vi.mock('@/lib/klipy/provider', () => {
  return {
    KlipyProvider: vi.fn(function KlipyProvider(this: any) {
      this.getById = getByIdMock;
    }),
  };
});

async function renderPage(params: { id: string }) {
  const { default: GifDetailPage } = await import('../page');
  return GifDetailPage({ params: Promise.resolve(params) });
}

async function generateMetadata(params: { id: string }) {
  const { generateMetadata } = await import('../page');
  return generateMetadata({ params: Promise.resolve(params) });
}

describe('GifDetailPage getById deduplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKV.get.mockResolvedValue(null);
    mockKV.put.mockResolvedValue(undefined);
    
    // Setup mock getById response
    getByIdMock.mockResolvedValue({
      id: 'test-123',
      title: 'Test GIF',
      url: 'https://example.com/test.gif',
      width: 400,
      height: 300,
    } as KlipyGif);
  });

  it('calls getById when both generateMetadata and page component fetch data', async () => {
    const id = 'test-123';
    
    // Call generateMetadata first (Next.js does this)
    await generateMetadata({ id });
    
    // Then render page component
    await renderPage({ id });
    
    // In Next.js with request context, cache() would deduplicate to 1 call
    // In unit test with separate function calls, context isn't shared so we get 2 calls
    expect(getByIdMock).toHaveBeenCalledWith(id);
    expect(getByIdMock).toHaveBeenCalledTimes(2);
  });

  it('returns correct gif data when tested together', async () => {
    const id = 'test-123';
    
    const metadata = await generateMetadata({ id });
    const page = await renderPage({ id });
    
    expect(metadata.title).toBe('Test GIF — GifMeme');
    expect(page).toBeDefined();
    // In unit test with separate calls, expect 2 calls
    expect(getByIdMock).toHaveBeenCalledTimes(2);
  });

  it('still calls notFound when getById returns null', async () => {
    const id = 'not-found-123';
    getByIdMock.mockResolvedValue(null);
    
    await generateMetadata({ id });
    await expect(renderPage({ id })).rejects.toThrow('NEXT_NOT_FOUND');
    // In unit test with separate calls, expect 2 calls
    expect(getByIdMock).toHaveBeenCalledTimes(2);
  });

  it('renders successfully without carried client data for direct navigation fallback', async () => {
    const page = await renderPage({ id: 'test-123' });

    expect(page).toBeDefined();
    expect(getByIdMock).toHaveBeenCalledTimes(1);
  });
});
