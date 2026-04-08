import { notFound } from 'next/navigation';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { favorites } from '@/lib/db/schema';
import { KlipyProvider } from '@/lib/klipy/provider';
import { FavoriteButton } from '@/components/gif/FavoriteButton';
import { CopyUrlButton } from '@/components/gif/CopyUrlButton';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `GIF ${id} — GIF Meme`,
  };
}

export default async function GifDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });

  const apiKey = env.KLIPY_API_KEY as string;
  const kv = env.cache as KVNamespace;

  if (!apiKey || !kv) {
    return (
      <div className="gif-detail__error">
        <p>Service unavailable. Please try again later.</p>
      </div>
    );
  }

  const provider = new KlipyProvider(apiKey, kv);
  const gif = await provider.getById(id);

  if (!gif) {
    notFound();
  }

  const session = await getSession();
  const isAuthenticated = session !== null;

  let initialFavorited = false;
  let favoriteId: string | null = null;

  if (session) {
    const db = getDb(env.main_db || (env as any)['main-db']);
    const result = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, session.userId),
          eq(favorites.itemType, 'gif'),
          eq(favorites.itemId, id)
        )
      );
    if (result.length > 0) {
      initialFavorited = true;
      favoriteId = result[0].id;
    }
  }

  const pageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/gif/${id}`;

  return (
    <article className="gif-detail">
      <div className="gif-detail__media">
        <img
          src={gif.url}
          alt={gif.title || 'GIF'}
          className="gif-detail__img"
          width={gif.width}
          height={gif.height}
        />
      </div>

      <div className="gif-detail__info">
        {gif.title && (
          <h1 className="gif-detail__title">{gif.title}</h1>
        )}

        <div className="gif-detail__actions">
          <FavoriteButton
            initialFavorited={initialFavorited}
            favoriteId={favoriteId}
            itemType="gif"
            itemId={id}
            itemTitle={gif.title ?? null}
            itemUrl={gif.url ?? null}
            itemPreviewUrl={gif.preview_url ?? null}
            isAuthenticated={isAuthenticated}
          />

          <CopyUrlButton url={pageUrl} />
        </div>

        <dl className="gif-detail__meta">
          <div className="gif-detail__meta-row">
            <dt>Dimensions</dt>
            <dd>{gif.width} × {gif.height}</dd>
          </div>
          {gif.source && (
            <div className="gif-detail__meta-row">
              <dt>Source</dt>
              <dd>
                <a href={gif.source} target="_blank" rel="noopener noreferrer">
                  {gif.source}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}
