// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { GifCard } from '../GifCard';
import type { KlipyGif } from '@/lib/klipy/types';

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

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<GifCard gif={mockGif} onClick={handleClick} />);
    fireEvent.click(screen.getByTestId('gif-card'));
    expect(handleClick).toHaveBeenCalledWith(mockGif);
  });

  it('does not throw if onClick is not provided', () => {
    render(<GifCard gif={mockGif} />);
    expect(() => fireEvent.click(screen.getByTestId('gif-card'))).not.toThrow();
  });

  it('applies custom className', () => {
    render(<GifCard gif={mockGif} className="my-custom-class" />);
    const card = screen.getByTestId('gif-card');
    expect(card.className).toContain('my-custom-class');
  });
});
