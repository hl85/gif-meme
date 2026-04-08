'use client';

import { useState } from 'react';

interface FavoriteButtonProps {
  initialFavorited: boolean;
  favoriteId: string | null;
  itemType: 'gif' | 'sticker';
  itemId: string;
  itemTitle: string | null;
  itemUrl: string | null;
  itemPreviewUrl: string | null;
  isAuthenticated: boolean;
}

export function FavoriteButton({
  initialFavorited,
  favoriteId: initialFavoriteId,
  itemType,
  itemId,
  itemTitle,
  itemUrl,
  itemPreviewUrl,
  isAuthenticated,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [favId, setFavId] = useState<string | null>(initialFavoriteId);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (!isAuthenticated) {
      window.location.href = '/api/auth/login';
      return;
    }

    setLoading(true);
    try {
      if (favorited && favId) {
        const res = await fetch(`/api/favorites/${favId}`, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
          setFavorited(false);
          setFavId(null);
        }
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemType, itemId, itemTitle, itemUrl, itemPreviewUrl }),
        });
        if (res.ok) {
          const data = (await res.json()) as { id: string };
          setFavorited(true);
          setFavId(data.id);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className={`fav-btn${favorited ? ' fav-btn--active' : ''}`}
      onClick={handleToggle}
      disabled={loading}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={favorited}
    >
      <span className="fav-btn__icon" aria-hidden="true">
        {favorited ? '♥' : '♡'}
      </span>
      <span className="fav-btn__label">
        {loading ? '…' : favorited ? 'Saved' : 'Save'}
      </span>
    </button>
  );
}
