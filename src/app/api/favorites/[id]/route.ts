import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { favorites } from '@/lib/db/schema';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { env } = await getCloudflareContext();
  const db = getDb(env.main_db || (env as any)['main-db']);

  const existing = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.id, id), eq(favorites.userId, session.userId)));

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
  }

  await db
    .delete(favorites)
    .where(and(eq(favorites.id, id), eq(favorites.userId, session.userId)));

  return new NextResponse(null, { status: 204 });
}
