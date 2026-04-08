// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LoadMore } from '../LoadMore';

afterEach(() => {
  cleanup();
});

describe('LoadMore', () => {
  it('renders a button', () => {
    render(<LoadMore onLoadMore={() => {}} hasMore={true} isLoading={false} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onLoadMore when button clicked', () => {
    const handleLoadMore = vi.fn();
    render(<LoadMore onLoadMore={handleLoadMore} hasMore={true} isLoading={false} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleLoadMore).toHaveBeenCalledOnce();
  });

  it('shows loading state text when isLoading is true', () => {
    render(<LoadMore onLoadMore={() => {}} hasMore={true} isLoading={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('load-more-loading')).toBeInTheDocument();
  });

  it('disables button when isLoading is true', () => {
    render(<LoadMore onLoadMore={() => {}} hasMore={true} isLoading={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not render when hasMore is false', () => {
    const { container } = render(<LoadMore onLoadMore={() => {}} hasMore={false} isLoading={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('has data-testid attribute', () => {
    render(<LoadMore onLoadMore={() => {}} hasMore={true} isLoading={false} />);
    expect(screen.getByTestId('load-more')).toBeInTheDocument();
  });
});
