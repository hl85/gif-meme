import { beforeEach, describe, expect, it, vi } from 'vitest';

type CloudflareEnv = {
  KLIPY_API_KEY?: string;
  cache?: {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
  };
  main_db?: object;
  'main-db'?: object;
};

const mockKV = {
  get: vi.fn(),
  put: vi.fn(),
};

const mockCloudflareEnv: { env: CloudflareEnv } = {
  env: {
    KLIPY_API_KEY: 'test_key',
    cache: mockKV,
  },
};

const mockDbCategories = vi.fn<() => Promise<Array<{ slug: string; label: string }>>>();
const mockProviderTrending = vi.fn();
const mockProviderCategories = vi.fn();

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => Promise.resolve(mockCloudflareEnv),
}));

vi.mock('@/lib/db', () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => mockDbCategories(),
        }),
      }),
    }),
  }),
}));

vi.mock('@/lib/klipy/provider', () => ({
  KlipyProvider: class MockKlipyProvider {
    trending = mockProviderTrending;
    categories = mockProviderCategories;
  },
}));

async function renderPage() {
  const { default: Home } = await import('../page');
  return Home();
}

describe('Home page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    mockCloudflareEnv.env = {
      KLIPY_API_KEY: 'test_key',
      cache: mockKV,
    };

    mockDbCategories.mockResolvedValue([
      { slug: 'reactions', label: 'Reactions' },
      { slug: 'animals', label: 'Animals' },
    ]);

    mockProviderTrending.mockResolvedValue({
      items: [],
      ads: [],
      page: 1,
      perPage: 20,
      hasNext: false,
    });

    mockProviderCategories.mockResolvedValue({
      data: {
        data: [{ name: 'Funny Cats' }],
      },
    });
  });

  it('prefers D1 categories when database binding is available', async () => {
    mockCloudflareEnv.env.main_db = {};

    const result = await renderPage();
    const homeClientElement = result.props.children[1];

    expect(homeClientElement.props.categories).toEqual([
      { slug: 'reactions', label: 'Reactions' },
      { slug: 'animals', label: 'Animals' },
    ]);
    expect(mockProviderCategories).not.toHaveBeenCalled();
  });

  it('falls back to provider categories when D1 binding is unavailable', async () => {
    const result = await renderPage();
    const homeClientElement = result.props.children[1];

    expect(homeClientElement.props.categories).toEqual([
      { slug: 'funny-cats', label: 'Funny Cats' },
    ]);
    expect(mockProviderCategories).toHaveBeenCalledTimes(1);
  });
});
