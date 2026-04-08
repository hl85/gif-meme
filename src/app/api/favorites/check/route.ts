import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { favorites } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const itemType = searchParams.get('itemType');
  const itemId = searchParams.get('itemId');

  if (!itemType || !itemId) {
    return NextResponse.json({ error: 'itemType and itemId query params are required' }, { status: 400 });
  }

  const { env } = await getCloudflareContext();
  const db = getDb(env.main_db || (env as any)['main-db']);

  const result = await db
    .select()
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, session.userId),
        eq(favorites.itemType, itemType as 'gif' | 'sticker'),
        eq(favorites.itemId, itemId)
      )
    );

  if (result.length === 0) {
    return NextResponse.json({ favorited: false, favoriteId: null });
  }

  return NextResponse.json({ favorited: true, favoriteId: result[0].id });
}
