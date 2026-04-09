import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { and, eq } from 'drizzle-orm';
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

function parseSortOrder(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return fallback;
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

  const rows = await db.select().from(categories).where(eq(categories.slug, slug));
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

export async function PUT(
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

  const nextSlug = body.slug == null ? slug : String(body.slug).trim();
  const label = body.label == null ? undefined : String(body.label).trim();
  const searchQuery = body.searchQuery == null ? null : String(body.searchQuery);
  const seoTitle = body.seoTitle == null ? null : String(body.seoTitle);
  const seoDescription = body.seoDescription == null ? null : String(body.seoDescription);
  const seoKeywords = body.seoKeywords == null ? null : String(body.seoKeywords);

  const { env } = await getCloudflareContext();
  const db = getDbFromContext(env);

  const existing = await db.select().from(categories).where(eq(categories.slug, slug));
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  const current = existing[0];
  const finalLabel = label === undefined ? current.label : label;
  if (!finalLabel) {
    return NextResponse.json({ error: 'label is required' }, { status: 400 });
  }

  if (!SLUG_REGEX.test(nextSlug)) {
    return NextResponse.json(
      { error: 'Invalid slug. Use lowercase letters, numbers, and hyphens only.' },
      { status: 400 }
    );
  }

  if (nextSlug !== slug) {
    const duplicate = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.slug, nextSlug));
    if (duplicate.length > 0) {
      return NextResponse.json({ error: 'Category slug already exists' }, { status: 409 });
    }

    const hasCards = await db
      .select({ id: categoryCards.id })
      .from(categoryCards)
      .where(eq(categoryCards.categorySlug, slug));
    if (hasCards.length > 0) {
      return NextResponse.json(
        { error: 'Cannot change slug for category that already has cards' },
        { status: 400 }
      );
    }
  }

  const now = new Date(Date.now());
  const values = {
    slug: nextSlug,
    label: finalLabel,
    searchQuery,
    seoTitle,
    seoDescription,
    seoKeywords,
    sortOrder: parseSortOrder(body.sortOrder, current.sortOrder),
    isActive: normalizeIsActive(body.isActive, current.isActive),
    updatedAt: now,
  };

  const updated = await db
    .update(categories)
    .set(values)
    .where(eq(categories.slug, slug))
    .returning();

  return NextResponse.json(updated[0]);
}

export async function DELETE(
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

  const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug));
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  await db.delete(categories).where(and(eq(categories.slug, slug)));
  return new NextResponse(null, { status: 204 });
}
