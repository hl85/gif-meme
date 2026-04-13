'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { getCarriedGifData } from '@/lib/client/carry-gif-data';
import { GifDetailContent } from './GifDetailContent';
import type { KlipyGif } from '@/lib/klipy/types';

interface GifDetailClientProps {
  id: string;
  embedUrl: string;
  initialFavorited: boolean;
  favoriteId: string | null;
  isAuthenticated: boolean;
  children: ReactNode;
}

export function GifDetailClient({
  id,
  embedUrl,
  initialFavorited,
  favoriteId,
  isAuthenticated,
  children,
}: GifDetailClientProps) {
  const [carriedGif, setCarriedGif] = useState<KlipyGif | null>(null);

  useEffect(() => {
    const gif = getCarriedGifData();

    if (gif && gif.id === id) {
      setCarriedGif(gif);
    }
  }, [id]);

  if (!carriedGif) {
    return <>{children}</>;
  }

  return (
    <GifDetailContent
      gif={carriedGif}
      embedUrl={embedUrl}
      initialFavorited={initialFavorited}
      favoriteId={favoriteId}
      isAuthenticated={isAuthenticated}
    />
  );
}
