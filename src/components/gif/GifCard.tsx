import Link from 'next/link';
import type { KlipyGif } from '@/lib/klipy/types';

interface GifCardProps {
  gif: KlipyGif;
  className?: string;
}

export function GifCard({ gif, className = '' }: GifCardProps) {
  return (
    <Link
      href={`/gif/${gif.id}`}
      className={`gif-card ${className}`}
      data-testid="gif-card"
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
    </Link>
  );
}
