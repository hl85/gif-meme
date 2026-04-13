// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { GifDetailClient } from '../GifDetailClient';
import { CARRIED_GIF_DATA_KEY } from '@/lib/client/carry-gif-data';
import type { KlipyGif } from '@/lib/klipy/types';

vi.mock('@/components/gif/FavoriteButton', () => ({
  FavoriteButton: () => <button type="button">Favorite</button>,
}));

vi.mock('@/components/gif/CopyUrlButton', () => ({
  CopyUrlButton: () => <button type="button">Copy URL</button>,
}));

vi.mock('@/components/gif/EmbedCodeButton', () => ({
  EmbedCodeButton: () => <button type="button">Embed</button>,
}));

const carriedGif: KlipyGif = {
  id: 'gif-1',
  title: 'Carried GIF',
  url: 'https://example.com/carried.gif',
  preview_url: 'https://example.com/carried-preview.gif',
  width: 500,
  height: 320,
  source: 'https://example.com/carried-source',
};

function renderClient(id = 'gif-1') {
  return render(
    <GifDetailClient
      id={id}
      embedUrl={`https://gifmeme.org/embed/${id}`}
      initialFavorited={false}
      favoriteId={null}
      isAuthenticated={false}
    >
      <div data-testid="server-content">server content</div>
    </GifDetailClient>
  );
}

describe('GifDetailClient', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders carried gif data and clears storage when ids match', async () => {
    window.sessionStorage.setItem(CARRIED_GIF_DATA_KEY, JSON.stringify(carriedGif));

    renderClient();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Carried GIF' })).toBeInTheDocument();
    });

    expect(screen.queryByTestId('server-content')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Carried GIF' })).toHaveAttribute('src', carriedGif.url);
    expect(window.sessionStorage.getItem(CARRIED_GIF_DATA_KEY)).toBeNull();
  });

  it('falls back to server content when there is no carried data', () => {
    renderClient();

    expect(screen.getByTestId('server-content')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Carried GIF' })).not.toBeInTheDocument();
  });

  it('treats direct navigation like fallback when carried data is for another gif', async () => {
    window.sessionStorage.setItem(
      CARRIED_GIF_DATA_KEY,
      JSON.stringify({ ...carriedGif, id: 'other-gif' })
    );

    renderClient('gif-1');

    await waitFor(() => {
      expect(window.sessionStorage.getItem(CARRIED_GIF_DATA_KEY)).toBeNull();
    });

    expect(screen.getByTestId('server-content')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Carried GIF' })).not.toBeInTheDocument();
  });
});
