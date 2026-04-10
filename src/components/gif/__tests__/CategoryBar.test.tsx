// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CategoryBar, CategoryItem } from '../CategoryBar';

afterEach(() => {
  cleanup();
});

describe('CategoryBar', () => {
  const categories: CategoryItem[] = [
    { slug: 'reactions', label: 'Reactions' },
    { slug: 'animals', label: 'Animals' },
    { slug: 'sports', label: 'Sports' },
    { slug: 'movies', label: 'Movies' },
    { slug: 'gaming', label: 'Gaming' },
  ];

  it('renders with data-testid', () => {
    render(<CategoryBar categories={categories} selected={null} onSelect={() => {}} />);
    expect(screen.getByTestId('category-bar')).toBeInTheDocument();
  });

  it('renders all category pills', () => {
    render(<CategoryBar categories={categories} selected={null} onSelect={() => {}} />);
    for (const cat of categories) {
      expect(screen.getByText(cat.label)).toBeInTheDocument();
    }
  });

  it('marks the selected category as active', () => {
    render(<CategoryBar categories={categories} selected="animals" onSelect={() => {}} />);
    const pill = screen.getByText('Animals').closest('[data-testid="category-pill"]');
    expect(pill).toHaveAttribute('data-active', 'true');
  });

  it('marks non-selected categories as inactive', () => {
    render(<CategoryBar categories={categories} selected="animals" onSelect={() => {}} />);
    const pill = screen.getByText('Reactions').closest('[data-testid="category-pill"]');
    expect(pill).toHaveAttribute('data-active', 'false');
  });

  it('calls onSelect with category slug when clicked', () => {
    const handleSelect = vi.fn();
    render(<CategoryBar categories={categories} selected={null} onSelect={handleSelect} />);
    fireEvent.click(screen.getByText('Sports'));
    expect(handleSelect).toHaveBeenCalledWith('sports');
  });

  it('calls onSelect with null when clicking the already-selected category', () => {
    const handleSelect = vi.fn();
    render(<CategoryBar categories={categories} selected="animals" onSelect={handleSelect} />);
    fireEvent.click(screen.getByText('Animals'));
    expect(handleSelect).toHaveBeenCalledWith(null);
  });

  it('renders nothing when categories is empty', () => {
    render(<CategoryBar categories={[]} selected={null} onSelect={() => {}} />);
    expect(screen.queryByTestId('category-bar')).not.toBeInTheDocument();
  });
});
