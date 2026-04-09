// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { GifGrid } from '../GifGrid';
import { copyToClipboard } from '@/lib/utils/clipboard';
import type { KlipyGif, KlipyAd } from '@/lib/klipy/types';

vi.mock('@/lib/utils/clipboard', () => ({
  copyToClipboard: vi.fn(),
}));

vi.mock('@/components/ads/AdSlot', () => ({
  AdSlot: ({ index }: { index: number }) => (
    <div data-testid={`mock-ad-slot-${index}`}>Ad at {index}</div>
  ),
}));

vi.mock('../GifCard', () => ({
  GifCard: ({ gif }: { gif: KlipyGif }) => (
    <div data-testid={`mock-gif-card-${gif.id}`}>{gif.title}</div>
  ),
}));

const makeGif = (i: number): KlipyGif => ({
  id: `gif-${i}`,
  title: `GIF ${i}`,
  url: `https://example.com/gif${i}.gif`,
  preview_url: `https://example.com/gif${i}-preview.gif`,
  width: 200,
  height: 200,
  source: 'giphy',
});

const mockAds: KlipyAd[] = [
  {
    type: 'ad',
    id: 'ad-1',
    image_url: 'https://example.com/ad.png',
    click_url: 'https://example.com/click',
    impression_url: 'https://example.com/imp',
    width: 300,
    height: 250,
  },
];

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  cleanup();
});

describe('GifGrid', () => {
  it('renders with data-testid', () => {
    render(<GifGrid gifs={[]} ads={[]} />);
    expect(screen.getByTestId('gif-grid')).toBeInTheDocument();
  });

  it('renders all gif cards', () => {
    const gifs = [makeGif(1), makeGif(2), makeGif(3)];
    render(<GifGrid gifs={gifs} ads={[]} />);
    expect(screen.getByTestId('mock-gif-card-gif-1')).toBeInTheDocument();
    expect(screen.getByTestId('mock-gif-card-gif-2')).toBeInTheDocument();
    expect(screen.getByTestId('mock-gif-card-gif-3')).toBeInTheDocument();
  });

  it('renders empty state when no gifs', () => {
    render(<GifGrid gifs={[]} ads={[]} />);
    expect(screen.getByTestId('gif-grid-empty')).toBeInTheDocument();
  });

  it('passes ads and index to AdSlot', () => {
    const gifs = Array.from({ length: 12 }, (_, i) => makeGif(i));
    render(<GifGrid gifs={gifs} ads={mockAds} />);
    expect(screen.getByTestId('mock-ad-slot-11')).toBeInTheDocument();
  });

  it('calls onGifClick when a gif card is clicked', () => {
    const handleClick = vi.fn();
    const gifs = [makeGif(1)];
    render(<GifGrid gifs={gifs} ads={[]} onGifClick={handleClick} />);
    expect(screen.getByTestId('mock-gif-card-gif-1')).toBeInTheDocument();
  });

  it('renders share buttons for each gif card', () => {
    const gifs = [makeGif(1)];
    render(<GifGrid gifs={gifs} ads={[]} />);

    expect(screen.getByLabelText('Copy link for GIF 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Copy GIF URL for GIF 1')).toBeInTheDocument();
  });

  it('copies the GIF detail path', async () => {
    vi.mocked(copyToClipboard).mockResolvedValue(true);
    const gifs = [makeGif(1)];
    render(<GifGrid gifs={gifs} ads={[]} />);

    fireEvent.click(screen.getByLabelText('Copy link for GIF 1'));

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith('/gif/gif-1');
    });
  });

  it('shows temporary copied feedback after a successful copy', async () => {
    vi.useFakeTimers();
    vi.mocked(copyToClipboard).mockResolvedValue(true);
    const gifs = [makeGif(1)];
    render(<GifGrid gifs={gifs} ads={[]} />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Copy GIF URL for GIF 1'));
    });

    expect(screen.getByText('Copied!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
  });
});
