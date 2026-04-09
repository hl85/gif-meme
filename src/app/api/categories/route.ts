import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { eq, asc } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { categories } from '@/lib/db/schema';

export async function GET() {
  try {
    const { env } = await getCloudflareContext();
    const db = getDb(env.main_db || (env as any)['main-db']);

    const result = await db
      .select({
        slug: categories.slug,
        label: categories.label,
        seoTitle: categories.seoTitle,
      })
      .from(categories)
      .where(eq(categories.isActive, 1))
      .orderBy(asc(categories.sortOrder));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
