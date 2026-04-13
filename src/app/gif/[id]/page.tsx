import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { favorites } from '@/lib/db/schema';
import { KlipyProvider } from '@/lib/klipy/provider';
import { getCanonicalBaseUrl } from '@/lib/runtime/base-url';
import type { Metadata } from 'next';
import type { KlipyGif } from '@/lib/klipy/types';
import { GifDetailClient } from './GifDetailClient';
import { GifDetailContent } from './GifDetailContent';

const getCachedGif = cache(async (id: string): Promise<KlipyGif | null> => {
  const { env } = await getCloudflareContext({ async: true });
  const apiKey = env.KLIPY_API_KEY as string;

  if (!apiKey) {
    return null;
  }

  const provider = new KlipyProvider(apiKey);
  return provider.getById(id);
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const apiKey = env.KLIPY_API_KEY as string;

  if (!apiKey) {
    return { title: 'GIF Detail — GifMeme' };
  }

  const gif = await getCachedGif(id);

  if (!gif) {
    return { title: 'GIF Not Found — GifMeme' };
  }

  const title = `${gif.title || 'GIF'} — GifMeme`;
  const description = `View and share this GIF on GifMeme.`;
  const url = `${getCanonicalBaseUrl()}/gif/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: gif.url,
          width: gif.width,
          height: gif.height,
          alt: gif.title || 'GIF',
        },
      ],
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [gif.url],
    },
  };
}

export default async function GifDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });

  const apiKey = env.KLIPY_API_KEY as string;

  if (!apiKey) {
    return (
      <div className="gif-detail__error">
        <p>Service unavailable. Please try again later.</p>
      </div>
    );
  }

  const gif = await getCachedGif(id);

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

  const baseUrl = getCanonicalBaseUrl();
  const embedUrl = `${baseUrl}/embed/${id}`;

  return (
    <GifDetailClient
      id={id}
      embedUrl={embedUrl}
      initialFavorited={initialFavorited}
      favoriteId={favoriteId}
      isAuthenticated={isAuthenticated}
    >
      <GifDetailContent
        gif={gif}
        embedUrl={embedUrl}
        initialFavorited={initialFavorited}
        favoriteId={favoriteId}
        isAuthenticated={isAuthenticated}
      />
    </GifDetailClient>
  );
}
