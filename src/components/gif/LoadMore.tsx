'use client';

interface LoadMoreProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function LoadMore({ onLoadMore, hasMore, isLoading }: LoadMoreProps) {
  if (!hasMore) {
    return null;
  }

  return (
    <div className="load-more" data-testid="load-more">
      <button
        className="load-more__btn"
        onClick={onLoadMore}
        disabled={isLoading}
        type="button"
      >
        {isLoading ? (
          <span data-testid="load-more-loading">Loading...</span>
        ) : (
          'Load More'
        )}
      </button>
    </div>
  );
}
