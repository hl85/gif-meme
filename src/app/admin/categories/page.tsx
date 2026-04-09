'use client';

import { CSSProperties, FormEvent, useEffect, useMemo, useState } from 'react';

type MaybeBoolean = boolean | number | null | undefined;

interface CategoryItem {
  id: string;
  slug: string;
  label: string;
  searchQuery: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  sortOrder: number;
  isActive: number;
}

interface CardItem {
  id: string;
  categorySlug: string;
  position: number;
  imageUrl: string;
  imageName: string | null;
  linkUrl: string | null;
  isActive: number;
}

interface CategoryFormState {
  slug: string;
  label: string;
  searchQuery: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  sortOrder: string;
  isActive: boolean;
}

interface CardFormState {
  position: string;
  imageUrl: string;
  imageName: string;
  linkUrl: string;
  isActive: boolean;
}

type CategoryFormMode = 'idle' | 'create' | 'edit';
type CardFormMode = 'idle' | 'create' | 'edit';

const fieldStyle: CSSProperties = {
  display: 'grid',
  gap: '6px',
};

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
};

const inputStyle: CSSProperties = {
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  padding: '8px 10px',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8125rem',
};

function toBool(value: MaybeBoolean): boolean {
  return value === true || value === 1;
}

function buildErrorMessage(statusText: string, data: unknown): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const error = (data as { error?: unknown }).error;
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
  }

  return statusText || 'Request failed';
}

async function requestJson(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  let data: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new Error(buildErrorMessage(response.statusText, data));
  }

  return data;
}

function getDefaultCategoryForm(): CategoryFormState {
  return {
    slug: '',
    label: '',
    searchQuery: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    sortOrder: '0',
    isActive: true,
  };
}

function getDefaultCardForm(nextPosition = 0): CardFormState {
  return {
    position: String(nextPosition),
    imageUrl: '',
    imageName: '',
    linkUrl: '',
    isActive: true,
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);

  const [categoryFormMode, setCategoryFormMode] = useState<CategoryFormMode>('idle');
  const [cardFormMode, setCardFormMode] = useState<CardFormMode>('idle');
  const [editingCategorySlug, setEditingCategorySlug] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(getDefaultCategoryForm);
  const [cardForm, setCardForm] = useState<CardFormState>(getDefaultCardForm);

  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [submittingCard, setSubmittingCard] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.slug === selectedCategorySlug) ?? null,
    [categories, selectedCategorySlug]
  );

  const loadCategories = async (preferredSlug?: string | null) => {
    setLoadingCategories(true);

    try {
      const data = (await requestJson('/api/admin/categories')) as { items?: CategoryItem[] };
      const items = Array.isArray(data.items) ? data.items : [];
      setCategories(items);

      const target = preferredSlug ?? selectedCategorySlug;
      let nextSlug = target;
      if (!nextSlug || !items.some((item) => item.slug === nextSlug)) {
        nextSlug = items[0]?.slug ?? null;
      }
      setSelectedCategorySlug(nextSlug);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load categories';
      alert(message);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadCards = async (slug: string) => {
    setLoadingCards(true);

    try {
      const data = (await requestJson(
        `/api/admin/categories/${encodeURIComponent(slug)}/cards`
      )) as { items?: CardItem[] };
      setCards(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load cards';
      alert(message);
      setCards([]);
    } finally {
      setLoadingCards(false);
    }
  };

  useEffect(() => {
    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedCategorySlug) {
      setCards([]);
      return;
    }

    void loadCards(selectedCategorySlug);
  }, [selectedCategorySlug]);

  const openCreateCategory = () => {
    setCategoryFormMode('create');
    setEditingCategorySlug(null);
    setCategoryForm(getDefaultCategoryForm());
  };

  const openEditCategory = (category: CategoryItem) => {
    setCategoryFormMode('edit');
    setEditingCategorySlug(category.slug);
    setCategoryForm({
      slug: category.slug,
      label: category.label,
      searchQuery: category.searchQuery ?? '',
      seoTitle: category.seoTitle ?? '',
      seoDescription: category.seoDescription ?? '',
      seoKeywords: category.seoKeywords ?? '',
      sortOrder: String(category.sortOrder),
      isActive: toBool(category.isActive),
    });
  };

  const closeCategoryForm = () => {
    setCategoryFormMode('idle');
    setEditingCategorySlug(null);
    setCategoryForm(getDefaultCategoryForm());
  };

  const openCreateCard = () => {
    if (!selectedCategorySlug) {
      alert('Please select a category first.');
      return;
    }

    const nextPosition = cards.length > 0 ? Math.max(...cards.map((item) => item.position)) + 1 : 0;
    setCardFormMode('create');
    setEditingCardId(null);
    setCardForm(getDefaultCardForm(nextPosition));
  };

  const openEditCard = (card: CardItem) => {
    setCardFormMode('edit');
    setEditingCardId(card.id);
    setCardForm({
      position: String(card.position),
      imageUrl: card.imageUrl,
      imageName: card.imageName ?? '',
      linkUrl: card.linkUrl ?? '',
      isActive: toBool(card.isActive),
    });
  };

  const closeCardForm = () => {
    setCardFormMode('idle');
    setEditingCardId(null);
    setCardForm(getDefaultCardForm());
  };

  const handleSubmitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingCategory(true);

    const sortOrderNumber = Number.parseInt(categoryForm.sortOrder, 10);

    const payload = {
      slug: categoryForm.slug.trim(),
      label: categoryForm.label.trim(),
      searchQuery: categoryForm.searchQuery.trim() || null,
      seoTitle: categoryForm.seoTitle.trim() || null,
      seoDescription: categoryForm.seoDescription.trim() || null,
      seoKeywords: categoryForm.seoKeywords.trim() || null,
      sortOrder: Number.isFinite(sortOrderNumber) ? sortOrderNumber : 0,
      isActive: categoryForm.isActive,
    };

    try {
      if (categoryFormMode === 'create') {
        await requestJson('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Category created successfully.');
      } else if (categoryFormMode === 'edit' && editingCategorySlug) {
        await requestJson(`/api/admin/categories/${encodeURIComponent(editingCategorySlug)}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('Category updated successfully.');
      }

      closeCategoryForm();
      await loadCategories(payload.slug);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save category';
      alert(message);
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (category: CategoryItem) => {
    if (!confirm(`Delete category "${category.label}" (${category.slug})?`)) {
      return;
    }

    try {
      await requestJson(`/api/admin/categories/${encodeURIComponent(category.slug)}`, {
        method: 'DELETE',
      });
      alert('Category deleted successfully.');

      if (selectedCategorySlug === category.slug) {
        setCards([]);
      }

      await loadCategories(selectedCategorySlug === category.slug ? null : selectedCategorySlug);
      if (editingCategorySlug === category.slug) {
        closeCategoryForm();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete category';
      alert(message);
    }
  };

  const handleSubmitCard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCategorySlug) {
      alert('Please select a category first.');
      return;
    }

    setSubmittingCard(true);

    const positionNumber = Number.parseInt(cardForm.position, 10);
    const payload = {
      position: Number.isFinite(positionNumber) ? positionNumber : 0,
      imageUrl: cardForm.imageUrl.trim(),
      imageName: cardForm.imageName.trim() || null,
      linkUrl: cardForm.linkUrl.trim() || null,
      isActive: cardForm.isActive,
    };

    try {
      if (cardFormMode === 'create') {
        await requestJson(`/api/admin/categories/${encodeURIComponent(selectedCategorySlug)}/cards`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Card created successfully.');
      } else if (cardFormMode === 'edit' && editingCardId) {
        await requestJson(
          `/api/admin/categories/${encodeURIComponent(selectedCategorySlug)}/cards/${encodeURIComponent(editingCardId)}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );
        alert('Card updated successfully.');
      }

      closeCardForm();
      await loadCards(selectedCategorySlug);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save card';
      alert(message);
    } finally {
      setSubmittingCard(false);
    }
  };

  const handleDeleteCard = async (card: CardItem) => {
    if (!selectedCategorySlug) {
      return;
    }

    if (!confirm(`Delete card at position ${card.position}?`)) {
      return;
    }

    try {
      await requestJson(
        `/api/admin/categories/${encodeURIComponent(selectedCategorySlug)}/cards/${encodeURIComponent(card.id)}`,
        { method: 'DELETE' }
      );
      alert('Card deleted successfully.');
      await loadCards(selectedCategorySlug);

      if (editingCardId === card.id) {
        closeCardForm();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete card';
      alert(message);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__top">
        <h1 className="admin-page__title">Categories Management</h1>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1fr) minmax(420px, 1.5fr)',
          gap: 'var(--space-8)',
          alignItems: 'start',
        }}
      >
        <section className="admin-section">
          <div className="admin-page__top">
            <h2 className="admin-section__title">Categories</h2>
            <button type="button" className="admin-range-nav__btn" onClick={openCreateCategory}>
              Add Category
            </button>
          </div>

          {loadingCategories ? (
            <p className="admin-section__empty">Loading categories…</p>
          ) : categories.length === 0 ? (
            <p className="admin-section__empty">No categories yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Slug</th>
                  <th className="admin-table__num">Sort</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((item) => {
                  const selected = item.slug === selectedCategorySlug;

                  return (
                    <tr
                      key={item.slug}
                      onClick={() => setSelectedCategorySlug(item.slug)}
                      style={{
                        cursor: 'pointer',
                        background: selected
                          ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                          : undefined,
                      }}
                    >
                      <td>{item.label}</td>
                      <td>{item.slug}</td>
                      <td className="admin-table__num">{item.sortOrder}</td>
                      <td>
                        <span className={`badge badge-filled`} style={{ '--status-bg': toBool(item.isActive) ? '#dcfce7' : '#fef2f2', '--status-text': toBool(item.isActive) ? '#16a34a' : '#dc2626' } as CSSProperties}>
                          {toBool(item.isActive) ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="admin-range-nav__btn"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditCategory(item);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-range-nav__btn"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDeleteCategory(item);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {categoryFormMode !== 'idle' && (
            <form className="admin-stat-card" onSubmit={handleSubmitCategory}>
              <h3 className="admin-section__title" style={{ marginBottom: '4px' }}>
                {categoryFormMode === 'create' ? 'Add Category' : 'Edit Category'}
              </h3>

              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="category-slug">
                  Slug
                </label>
                <input
                  id="category-slug"
                  required
                  value={categoryForm.slug}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, slug: event.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="category-label">
                  Label
                </label>
                <input
                  id="category-label"
                  required
                  value={categoryForm.label}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, label: event.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="category-search-query">
                  Search Query
                </label>
                <input
                  id="category-search-query"
                  value={categoryForm.searchQuery}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, searchQuery: event.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="category-seo-title">
                  SEO Title
                </label>
                <input
                  id="category-seo-title"
                  value={categoryForm.seoTitle}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, seoTitle: event.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="category-seo-description">
                  SEO Description
                </label>
                <textarea
                  id="category-seo-description"
                  value={categoryForm.seoDescription}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, seoDescription: event.target.value }))
                  }
                  style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="category-seo-keywords">
                  SEO Keywords
                </label>
                <input
                  id="category-seo-keywords"
                  value={categoryForm.seoKeywords}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, seoKeywords: event.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="category-sort-order">
                  Sort Order
                </label>
                <input
                  id="category-sort-order"
                  type="number"
                  value={categoryForm.sortOrder}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
                  style={inputStyle}
                />
              </div>

              <label style={{ ...labelStyle, display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={categoryForm.isActive}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
                isActive
              </label>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="admin-range-nav__btn" disabled={submittingCategory}>
                  {submittingCategory ? 'Saving...' : 'Save Category'}
                </button>
                <button type="button" className="admin-range-nav__btn" onClick={closeCategoryForm}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="admin-section">
          <div className="admin-page__top">
            <h2 className="admin-section__title">
              Cards {selectedCategory ? `(${selectedCategory.label})` : ''}
            </h2>
            <button
              type="button"
              className="admin-range-nav__btn"
              onClick={openCreateCard}
              disabled={!selectedCategorySlug}
            >
              Add Card
            </button>
          </div>

          {!selectedCategorySlug ? (
            <p className="admin-section__empty">Select a category from the left panel to manage cards.</p>
          ) : loadingCards ? (
            <p className="admin-section__empty">Loading cards…</p>
          ) : cards.length === 0 ? (
            <p className="admin-section__empty">No cards in this category.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-table__num">Position</th>
                  <th>Image Name</th>
                  <th>Thumbnail</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={card.id}>
                    <td className="admin-table__num">{card.position}</td>
                    <td>{card.imageName || '(unnamed)'}</td>
                    <td>
                      <a href={card.imageUrl} target="_blank" rel="noreferrer" title={card.imageUrl}>
                        <img
                          src={card.imageUrl}
                          alt={card.imageName || 'category card'}
                          style={{
                            width: '64px',
                            height: '64px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-default)',
                          }}
                        />
                      </a>
                    </td>
                    <td>
                      <span className={`badge badge-filled`} style={{ '--status-bg': toBool(card.isActive) ? '#dcfce7' : '#fef2f2', '--status-text': toBool(card.isActive) ? '#16a34a' : '#dc2626' } as CSSProperties}>
                        {toBool(card.isActive) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="admin-range-nav__btn" onClick={() => openEditCard(card)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-range-nav__btn"
                          onClick={() => void handleDeleteCard(card)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {cardFormMode !== 'idle' && (
            <form className="admin-stat-card" onSubmit={handleSubmitCard}>
              <h3 className="admin-section__title" style={{ marginBottom: '4px' }}>
                {cardFormMode === 'create' ? 'Add Card' : 'Edit Card'}
              </h3>

              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="card-position">
                  Position
                </label>
                <input
                  id="card-position"
                  type="number"
                  required
                  value={cardForm.position}
                  onChange={(event) => setCardForm((prev) => ({ ...prev, position: event.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="card-image-url">
                  Image URL
                </label>
                <input
                  id="card-image-url"
                  required
                  value={cardForm.imageUrl}
                  onChange={(event) => setCardForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="card-image-name">
                  Image Name
                </label>
                <input
                  id="card-image-name"
                  value={cardForm.imageName}
                  onChange={(event) => setCardForm((prev) => ({ ...prev, imageName: event.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="card-link-url">
                  Link URL
                </label>
                <input
                  id="card-link-url"
                  value={cardForm.linkUrl}
                  onChange={(event) => setCardForm((prev) => ({ ...prev, linkUrl: event.target.value }))}
                  style={inputStyle}
                />
              </div>

              <label style={{ ...labelStyle, display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={cardForm.isActive}
                  onChange={(event) => setCardForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
                isActive
              </label>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="admin-range-nav__btn" disabled={submittingCard}>
                  {submittingCard ? 'Saving...' : 'Save Card'}
                </button>
                <button type="button" className="admin-range-nav__btn" onClick={closeCardForm}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
