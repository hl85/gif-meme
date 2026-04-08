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
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    if (!isAuthenticated) {
      window.location.href = '/api/auth/login';
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (favorited && favId) {
        const res = await fetch(`/api/favorites/${favId}`, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
          setFavorited(false);
          setFavId(null);
        } else {
          setError('Failed to remove');
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
        } else {
          setError('Failed to save');
        }
      }
    } catch (err) {
      setError('Error');
    } finally {
      setLoading(false);
      if (error) {
        setTimeout(() => setError(null), 3000);
      }
    }
  }

  return (
    <div className="fav-btn-container">
      <button
        className={`fav-btn${favorited ? ' fav-btn--active' : ''}${error ? ' fav-btn--error' : ''}`}
        onClick={handleToggle}
        disabled={loading}
        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        aria-pressed={favorited}
      >
        <span className="fav-btn__icon" aria-hidden="true">
          {error ? '!' : favorited ? '♥' : '♡'}
        </span>
        <span className="fav-btn__label">
          {loading ? '…' : error ? error : favorited ? 'Saved' : 'Save'}
        </span>
      </button>
    </div>
  );
}
