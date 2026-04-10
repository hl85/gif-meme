'use client';

import Link from 'next/link';

export interface CategoryItem {
  slug: string;
  label: string;
}

interface CategoryBarProps {
  categories: CategoryItem[];
  selected: string | null;
  onSelect?: (category: string | null) => void;
}

export function CategoryBar({ categories, selected, onSelect }: CategoryBarProps) {
  return (
    <div className="category-bar" data-testid="category-bar">
      <span className="category-bar__prefix">Categories</span>
      {categories.map((cat, index) => {
        const isActive = selected === cat.slug;
        const colorClass = `category-bar__pill--color-${index % 5}`;
        
        if (onSelect) {
          return (
            <button
              key={cat.slug}
              className={`category-bar__pill ${colorClass} ${isActive ? 'category-bar__pill--active' : ''}`}
              data-testid="category-pill"
              data-active={String(isActive)}
              onClick={() => onSelect(isActive ? null : cat.slug)}
              type="button"
            >
              {cat.label}
            </button>
          );
        }

        return (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className={`category-bar__pill ${colorClass} ${isActive ? 'category-bar__pill--active' : ''}`}
            data-testid="category-pill"
            data-active={String(isActive)}
          >
            {cat.label}
          </Link>
        );
      })}
    </div>
  );
}
