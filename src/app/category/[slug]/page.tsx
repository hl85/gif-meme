import { CategoryClient } from '@/components/gif/CategoryClient';
import { CategoryBar } from '@/components/gif/CategoryBar';
import type { KlipyPage, KlipyGif } from '@/lib/klipy/types';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = formatCategoryName(slug);

  return {
    title: `${categoryName} GIFs — GifMeme`,
    description: `Explore the best ${categoryName} GIFs and memes on GifMeme.`,
  };
}

async function fetchCategoryGifs(category: string): Promise<KlipyPage<KlipyGif>> {
  try {
    const res = await fetch(`http://localhost:8787/api/gifs/search?q=${encodeURIComponent(category)}&page=1`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) throw new Error('fetch failed');
    return res.json();
  } catch (error) {
    console.error('Error fetching category GIFs:', error);
    return { items: [], ads: [], page: 1, perPage: 20, hasNext: false };
  }
}

async function fetchCategories(): Promise<string[]> {
  try {
    const res = await fetch('http://localhost:8787/api/gifs/categories', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json() as Record<string, unknown>;
    const nested = (data?.data as Record<string, unknown> | undefined)?.data;
    const raw: unknown[] = Array.isArray(nested) ? nested : Array.isArray(data?.data) ? (data.data as unknown[]) : [];
    return raw
      .map((c: unknown) => {
        const cat = c as Record<string, unknown>;
        return String(cat.name || cat.title || cat.category || '');
      })
      .filter(Boolean)
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
  const [data, categories] = await Promise.all([
    fetchCategoryGifs(categoryName),
    fetchCategories(),
  ]);

  return (
    <div className="category-page">
      <header className="category-page__header">
        <h1 className="category-page__title">{categoryName} GIFs</h1>
      </header>
      <CategoryBar categories={categories} selected={categoryName} />
      <CategoryClient
        categoryName={categoryName}
        initialGifs={data.items}
        initialAds={data.ads}
        initialHasNext={data.hasNext}
      />
    </div>
  );
}
