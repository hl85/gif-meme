'use client';

interface CategoryBarProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryBar({ categories, selected, onSelect }: CategoryBarProps) {
  return (
    <div className="category-bar" data-testid="category-bar">
      {categories.map((cat) => (
        <button
          key={cat}
          className={`category-bar__pill ${selected === cat ? 'category-bar__pill--active' : ''}`}
          data-testid="category-pill"
          data-active={String(selected === cat)}
          onClick={() => onSelect(selected === cat ? null : cat)}
          type="button"
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
