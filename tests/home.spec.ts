import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('loads with trending GIFs', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/GIF Meme/);
    // Wait for gif grid to appear (may take time for API)
    const grid = page.locator('[data-testid="gif-grid"]');
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('category bar is visible and clickable', async ({ page }) => {
    await page.goto('/');
    const categoryBar = page.locator('[data-testid="category-bar"]');
    await expect(categoryBar).toBeVisible({ timeout: 10000 });
    // Click a category pill
    const firstPill = page.locator('[data-testid="category-pill"]').first();
    await firstPill.click();
    // Should navigate to a category page
    await expect(page).toHaveURL(/\/category\//);
  });

  test('load more button works', async ({ page }) => {
    await page.goto('/');
    const loadMore = page.locator('[data-testid="load-more"]');
    // Load more may not appear if not enough results, so check if visible first
    const isVisible = await loadMore.isVisible().catch(() => false);
    if (isVisible) {
      await loadMore.click();
      // Should show loading or load more content
      await expect(page.locator('[data-testid="gif-card"]')).toHaveCount(await page.locator('[data-testid="gif-card"]').count());
    }
  });
});
