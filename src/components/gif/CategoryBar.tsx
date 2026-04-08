'use client';

import Link from 'next/link';

interface CategoryBarProps {
  categories: string[];
  selected: string | null;
  onSelect?: (category: string | null) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}

export function CategoryBar({ categories, selected, onSelect }: CategoryBarProps) {
  return (
    <div className="category-bar" data-testid="category-bar">
      {categories.map((cat) => {
        const isActive = selected === cat;
        const slug = slugify(cat);
        
        if (onSelect) {
          return (
            <button
              key={cat}
              className={`category-bar__pill ${isActive ? 'category-bar__pill--active' : ''}`}
              data-testid="category-pill"
              data-active={String(isActive)}
              onClick={() => onSelect(isActive ? null : cat)}
              type="button"
            >
              {cat}
            </button>
          );
        }

        return (
          <Link
            key={cat}
            href={`/category/${slug}`}
            className={`category-bar__pill ${isActive ? 'category-bar__pill--active' : ''}`}
            data-testid="category-pill"
            data-active={String(isActive)}
          >
            {cat}
          </Link>
        );
      })}
    </div>
  );
}
