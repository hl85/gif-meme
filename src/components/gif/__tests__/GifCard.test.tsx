// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CARRIED_GIF_DATA_KEY } from '@/lib/client/carry-gif-data';
import { GifCard } from '../GifCard';
import type { KlipyGif } from '@/lib/klipy/types';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockGif: KlipyGif = {
  id: 'gif-1',
  title: 'Funny Cat',
  url: 'https://example.com/cat.gif',
  preview_url: 'https://example.com/cat-preview.gif',
  width: 400,
  height: 300,
  source: 'giphy',
};

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  window.sessionStorage.clear();
});

describe('GifCard', () => {
  it('renders the GIF image with preview url', () => {
    render(<GifCard gif={mockGif} />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockGif.preview_url);
  });

  it('renders alt text from gif title', () => {
    render(<GifCard gif={mockGif} />);
    const img = screen.getByAltText(mockGif.title);
    expect(img).toBeInTheDocument();
  });

  it('has a data-testid attribute', () => {
    render(<GifCard gif={mockGif} />);
    expect(screen.getByTestId('gif-card')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<GifCard gif={mockGif} className="my-custom-class" />);
    const card = screen.getByTestId('gif-card');
    expect(card.className).toContain('my-custom-class');
  });

  it('stores gif data in sessionStorage before navigation', () => {
    render(<GifCard gif={mockGif} />);

    fireEvent.click(screen.getByTestId('gif-card'));

    expect(window.sessionStorage.getItem(CARRIED_GIF_DATA_KEY)).toBe(JSON.stringify(mockGif));
  });
});
