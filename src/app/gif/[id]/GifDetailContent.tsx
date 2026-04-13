import { FavoriteButton } from '@/components/gif/FavoriteButton';
import { CopyUrlButton } from '@/components/gif/CopyUrlButton';
import { EmbedCodeButton } from '@/components/gif/EmbedCodeButton';
import type { KlipyGif } from '@/lib/klipy/types';

interface GifDetailContentProps {
  gif: KlipyGif;
  embedUrl: string;
  initialFavorited: boolean;
  favoriteId: string | null;
  isAuthenticated: boolean;
}

export function GifDetailContent({
  gif,
  embedUrl,
  initialFavorited,
  favoriteId,
  isAuthenticated,
}: GifDetailContentProps) {
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
            itemId={gif.id}
            itemTitle={gif.title ?? null}
            itemUrl={gif.url ?? null}
            itemPreviewUrl={gif.preview_url ?? null}
            isAuthenticated={isAuthenticated}
          />

          <EmbedCodeButton embedUrl={embedUrl} />

          <CopyUrlButton
            url={gif.url}
            label="Copy GIF URL"
            ariaLabel="Copy source GIF URL"
          />
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
