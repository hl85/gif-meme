import type { Metadata } from 'next';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { KlipyProvider } from '@/lib/klipy/provider';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Embed GIF — GifMeme',
  robots: {
    index: false,
  },
};

export default async function EmbedGifPage({ params }: PageProps) {
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });

  const apiKey = env.KLIPY_API_KEY as string;
  const kv = env.cache as KVNamespace;

  const gif = apiKey && kv ? await new KlipyProvider(apiKey, kv).getById(id) : null;

  return (
    <section className="embed-page" aria-label="Embedded GIF">
      <div className="embed-page__frame">
        {gif ? (
          <div className="embed-page__media">
            <img
              src={gif.url}
              alt={gif.title || 'GIF'}
              className="embed-page__img"
              width={gif.width}
              height={gif.height}
            />
          </div>
        ) : (
          <div className="embed-page__empty">GIF unavailable.</div>
        )}

        <a
          href={`/gif/${id}`}
          className="embed-page__link"
          target="_top"
          rel="noopener noreferrer"
        >
          Powered by GifMeme
        </a>
      </div>
    </section>
  );
}
