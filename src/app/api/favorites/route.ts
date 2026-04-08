import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { eq, count } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { favorites } from '@/lib/db/schema';
import { randomUUID } from 'crypto';

const FAVORITES_LIMIT = 500;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { env } = await getCloudflareContext();
  const db = getDb(env.main_db || (env as any)['main-db']);

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)));
  const offset = (page - 1) * perPage;

  const items = await db
    .select()
    .from(favorites)
    .where(eq(favorites.userId, session.userId))
    .orderBy(favorites.createdAt)
    .limit(perPage)
    .offset(offset);

  return NextResponse.json({ items, page, perPage });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { itemType, itemId, itemTitle, itemUrl, itemPreviewUrl } = body as Record<string, string>;

  if (!itemType || !itemId) {
    return NextResponse.json({ error: 'itemType and itemId are required' }, { status: 400 });
  }

  if (itemType !== 'gif' && itemType !== 'sticker') {
    return NextResponse.json({ error: 'itemType must be "gif" or "sticker"' }, { status: 400 });
  }

  const { env } = await getCloudflareContext();
  const db = getDb(env.main_db || (env as any)['main-db']);

  const countResult = await db
    .select({ count: count() })
    .from(favorites)
    .where(eq(favorites.userId, session.userId));

  const currentCount = countResult[0]?.count ?? 0;
  if (currentCount >= FAVORITES_LIMIT) {
    return NextResponse.json(
      { error: `Favorites limit of ${FAVORITES_LIMIT} reached` },
      { status: 400 }
    );
  }

  const newFavorite = {
    id: randomUUID(),
    userId: session.userId,
    itemType: itemType as 'gif' | 'sticker',
    itemId,
    itemTitle: itemTitle ?? null,
    itemUrl: itemUrl ?? null,
    itemPreviewUrl: itemPreviewUrl ?? null,
  };

  const inserted = await db.insert(favorites).values(newFavorite).returning();

  return NextResponse.json(inserted[0] ?? newFavorite, { status: 201 });
}
