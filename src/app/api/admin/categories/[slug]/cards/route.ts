import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { asc, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/admin';
import { getDb } from '@/lib/db';
import { categories, categoryCards } from '@/lib/db/schema';

const SLUG_REGEX = /^[a-z0-9-]+$/;

function normalizeIsActive(value: unknown, fallback: number): number {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value ? 1 : 0;
  return fallback;
}

function parsePosition(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  return null;
}

function getDbFromContext(env: any) {
  return getDb(env.main_db || env['main-db']);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session || !isAdmin(session.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      { error: 'Invalid slug. Use lowercase letters, numbers, and hyphens only.' },
      { status: 400 }
    );
  }

  const { env } = await getCloudflareContext();
  const db = getDbFromContext(env);

  const category = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.slug, slug));
  if (category.length === 0) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  const items = await db
    .select()
    .from(categoryCards)
    .where(eq(categoryCards.categorySlug, slug))
    .orderBy(asc(categoryCards.position), asc(categoryCards.id));

  return NextResponse.json({ items });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session || !isAdmin(session.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      { error: 'Invalid slug. Use lowercase letters, numbers, and hyphens only.' },
      { status: 400 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const position = parsePosition(body.position);
  const imageUrl = String(body.imageUrl ?? '').trim();
  const imageName = body.imageName == null ? null : String(body.imageName);
  const linkUrl = body.linkUrl == null ? null : String(body.linkUrl);
  const isActive = normalizeIsActive(body.isActive, 1);

  if (position === null || !imageUrl) {
    return NextResponse.json({ error: 'position (integer) and imageUrl are required' }, { status: 400 });
  }

  const { env } = await getCloudflareContext();
  const db = getDbFromContext(env);

  const category = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.slug, slug));
  if (category.length === 0) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  const now = new Date(Date.now());
  const created = {
    id: crypto.randomUUID(),
    categorySlug: slug,
    position,
    imageUrl,
    imageName,
    linkUrl,
    isActive,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const inserted = await db.insert(categoryCards).values(created).returning();
    return NextResponse.json(inserted[0] ?? created, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Card position already exists in this category' },
      { status: 409 }
    );
  }
}
