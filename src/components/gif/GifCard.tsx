import type { KlipyGif } from '@/lib/klipy/types';

interface GifCardProps {
  gif: KlipyGif;
  onClick?: (gif: KlipyGif) => void;
  className?: string;
}

export function GifCard({ gif, onClick, className = '' }: GifCardProps) {
  return (
    <div
      className={`gif-card ${className}`}
      data-testid="gif-card"
      onClick={() => onClick?.(gif)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(gif);
        }
      }}
    >
      <div className="gif-card__media">
        <img
          src={gif.preview_url}
          alt={gif.title}
          className="gif-card__img"
          loading="lazy"
          width={gif.width}
          height={gif.height}
        />
        <div className="gif-card__overlay">
          <span className="gif-card__title">{gif.title}</span>
        </div>
      </div>
    </div>
  );
}
