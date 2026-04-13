import { CategoryClient } from '@/components/gif/CategoryClient';
import { CategoryBar } from '@/components/gif/CategoryBar';
import type { KlipyPage, KlipyGif } from '@/lib/klipy/types';
import type { CategoryItem } from '@/components/gif/CategoryBar';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { and, asc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { categories, categoryCards } from '@/lib/db/schema';
import { mergeCategoryCards, type CategoryCardForMerge } from '@/lib/categories/merge';
import { KlipyProvider } from '@/lib/klipy/provider';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

type CategoryRecord = {
  slug: string;
  searchQuery: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  isActive: number;
};

function getDbFromEnv(env: { main_db?: D1Database; 'main-db'?: D1Database }) {
  const d1 = env.main_db || env['main-db'];
  if (!d1) {
    return null;
  }
  return getDb(d1);
}

async function fetchCategoryRecord(slug: string): Promise<CategoryRecord | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = getDbFromEnv(env as unknown as { main_db?: D1Database; 'main-db'?: D1Database });
    if (!db) return null;

    const result = await db
      .select({
        slug: categories.slug,
        searchQuery: categories.searchQuery,
        seoTitle: categories.seoTitle,
        seoDescription: categories.seoDescription,
        seoKeywords: categories.seoKeywords,
        isActive: categories.isActive,
      })
      .from(categories)
      .where(eq(categories.slug, slug));

    return result[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchActiveCategoryCards(slug: string): Promise<CategoryCardForMerge[]> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = getDbFromEnv(env as unknown as { main_db?: D1Database; 'main-db'?: D1Database });
    if (!db) return [];

    const cards = await db
      .select({
        id: categoryCards.id,
        position: categoryCards.position,
        imageUrl: categoryCards.imageUrl,
        imageName: categoryCards.imageName,
        linkUrl: categoryCards.linkUrl,
      })
      .from(categoryCards)
      .where(and(eq(categoryCards.categorySlug, slug), eq(categoryCards.isActive, 1)))
      .orderBy(asc(categoryCards.position), asc(categoryCards.id));

    return cards.map((card) => ({
      id: card.id,
      position: card.position,
      imageUrl: card.imageUrl,
      imageName: card.imageName ?? '',
      linkUrl: card.linkUrl ?? undefined,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = formatCategoryName(slug);

  const fallbackTitle = `${categoryName} GIFs — GifMeme`;
  const fallbackDescription = `Explore the best ${categoryName} GIFs and memes on GifMeme.`;
  const category = await fetchCategoryRecord(slug);

  if (!category || category.isActive === 0) {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
    };
  }

  const keywords = category.seoKeywords
    ? category.seoKeywords
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean)
    : undefined;

  return {
    title: category.seoTitle || fallbackTitle,
    description: category.seoDescription || fallbackDescription,
    keywords,
  };
}

function getProvider(env: Record<string, unknown>): KlipyProvider | null {
  const apiKey = env.KLIPY_API_KEY as string | undefined;
  if (!apiKey) return null;
  return new KlipyProvider(apiKey);
}

async function fetchCategoryGifs(category: string): Promise<KlipyPage<KlipyGif>> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const provider = getProvider(env as unknown as Record<string, unknown>);
    if (!provider) return { items: [], ads: [], page: 1, perPage: 20, hasNext: false };
    return await provider.search(category, 1, 20);
  } catch (error) {
    console.error('Error fetching category GIFs:', error);
    return { items: [], ads: [], page: 1, perPage: 20, hasNext: false };
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}

async function fetchCategories(): Promise<CategoryItem[]> {
  try {
    // First try to get categories from database
    const { env } = await getCloudflareContext({ async: true });
    const db = getDbFromEnv(env as unknown as { main_db?: D1Database; 'main-db'?: D1Database });
    if (db) {
      const dbCategories = await db
        .select({
          slug: categories.slug,
          label: categories.label,
        })
        .from(categories)
        .where(eq(categories.isActive, 1))
        .orderBy(asc(categories.sortOrder));
      
      return dbCategories;
    }

    // Fallback to API if no database connection
    const provider = getProvider(env as unknown as Record<string, unknown>);
    if (!provider) return [];
    const data = await provider.categories() as Record<string, unknown>;
    const nested = (data?.data as Record<string, unknown> | undefined)?.data;
    const raw: unknown[] = Array.isArray(nested) ? nested : Array.isArray(data?.data) ? (data.data as unknown[]) : [];
    return raw
      .map((c: unknown) => {
        const cat = c as Record<string, unknown>;
        const label = String(cat.name || cat.title || cat.category || '');
        if (!label) return null;
        return {
          slug: slugify(label),
          label,
        };
      })
      .filter((item): item is CategoryItem => item !== null)
      .slice(0, 20);
  } catch {
    return [];
  }
}

function formatCategoryName(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }

  const categoryName = formatCategoryName(slug);
  const category = await fetchCategoryRecord(slug);

  if (category?.isActive === 0) {
    notFound();
  }

  const searchQuery = category?.searchQuery?.trim() || categoryName;

  const [data, categories, cards] = await Promise.all([
    fetchCategoryGifs(searchQuery),
    fetchCategories(),
    fetchActiveCategoryCards(slug),
  ]);

  const mergedGifs = mergeCategoryCards(data.items, cards);

  return (
    <div className="category-page">
      <header className="category-page__header">
        <h1 className="category-page__title">{categoryName} GIFs</h1>
      </header>
      <CategoryBar categories={categories} selected={slug} />
      <CategoryClient
        categoryName={categoryName}
        initialGifs={mergedGifs}
        initialAds={data.ads}
        initialHasNext={data.hasNext}
      />
    </div>
  );
}
