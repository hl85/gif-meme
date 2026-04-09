import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { asc, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/admin';
import { getDb } from '@/lib/db';
import { categories } from '@/lib/db/schema';

const SLUG_REGEX = /^[a-z0-9-]+$/;

function normalizeIsActive(value: unknown, fallback: number): number {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value ? 1 : 0;
  return fallback;
}

export async function GET() {
  const session = await getSession();
  if (!session || !isAdmin(session.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { env } = await getCloudflareContext();
  const db = getDb(env.main_db || (env as any)['main-db']);

  const items = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.slug));
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !isAdmin(session.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const slug = String(body.slug ?? '').trim();
  const label = String(body.label ?? '').trim();
  const searchQuery = body.searchQuery == null ? null : String(body.searchQuery);
  const seoTitle = body.seoTitle == null ? null : String(body.seoTitle);
  const seoDescription = body.seoDescription == null ? null : String(body.seoDescription);
  const seoKeywords = body.seoKeywords == null ? null : String(body.seoKeywords);
  const sortOrder = Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 0;
  const isActive = normalizeIsActive(body.isActive, 1);

  if (!slug || !label) {
    return NextResponse.json({ error: 'slug and label are required' }, { status: 400 });
  }

  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      { error: 'Invalid slug. Use lowercase letters, numbers, and hyphens only.' },
      { status: 400 }
    );
  }

  const { env } = await getCloudflareContext();
  const db = getDb(env.main_db || (env as any)['main-db']);

  const existing = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.slug, slug));
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Category slug already exists' }, { status: 409 });
  }

  const now = new Date(Date.now());
  const created = {
    id: crypto.randomUUID(),
    slug,
    label,
    searchQuery,
    seoTitle,
    seoDescription,
    seoKeywords,
    sortOrder,
    isActive,
    createdAt: now,
    updatedAt: now,
  };

  const inserted = await db.insert(categories).values(created).returning();
  return NextResponse.json(inserted[0] ?? created, { status: 201 });
}
