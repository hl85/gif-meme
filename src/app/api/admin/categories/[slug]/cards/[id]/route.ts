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

function parsePosition(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  return fallback;
}

function getDbFromContext(env: any) {
  return getDb(env.main_db || env['main-db']);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdmin(session.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug, id } = await params;
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

  const { env } = await getCloudflareContext();
  const db = getDbFromContext(env);

  const category = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.slug, slug));
  if (category.length === 0) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(categoryCards)
    .where(and(eq(categoryCards.id, id), eq(categoryCards.categorySlug, slug)));

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  const current = existing[0];
  const imageUrl = body.imageUrl == null ? current.imageUrl : String(body.imageUrl).trim();
  if (!imageUrl) {
    return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
  }

  const now = new Date(Date.now());
  const values = {
    position: parsePosition(body.position, current.position),
    imageUrl,
    imageName: body.imageName == null ? null : String(body.imageName),
    linkUrl: body.linkUrl == null ? null : String(body.linkUrl),
    isActive: normalizeIsActive(body.isActive, current.isActive),
    updatedAt: now,
  };

  try {
    const updated = await db
      .update(categoryCards)
      .set(values)
      .where(and(eq(categoryCards.id, id), eq(categoryCards.categorySlug, slug)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch {
    return NextResponse.json(
      { error: 'Card position already exists in this category' },
      { status: 409 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdmin(session.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug, id } = await params;
  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      { error: 'Invalid slug. Use lowercase letters, numbers, and hyphens only.' },
      { status: 400 }
    );
  }

  const { env } = await getCloudflareContext();
  const db = getDbFromContext(env);

  const existing = await db
    .select({ id: categoryCards.id })
    .from(categoryCards)
    .where(and(eq(categoryCards.id, id), eq(categoryCards.categorySlug, slug)));

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  await db
    .delete(categoryCards)
    .where(and(eq(categoryCards.id, id), eq(categoryCards.categorySlug, slug)));

  return new NextResponse(null, { status: 204 });
}
