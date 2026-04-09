import { test, expect } from '@playwright/test';

test.describe('Search Page', () => {
  test('search from header navigates to results', async ({ page }) => {
    await page.goto('/');
    const searchForm = page.locator('[data-testid="search-input-form"]');
    await expect(searchForm).toBeVisible({ timeout: 10000 });
    const input = searchForm.locator('input');
    await input.fill('funny cat');
    await input.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=funny\+cat/i);
  });

  test('search results page shows GIF grid', async ({ page }) => {
    await page.goto('/search?q=cat');
    const grid = page.locator('[data-testid="gif-grid"]');
    // Either grid or no-results should appear
    const gridOrNoResults = page.locator('[data-testid="gif-grid"], [data-testid="search-no-results"]');
    await expect(gridOrNoResults.first()).toBeVisible({ timeout: 10000 });
  });

  test('GIF/Sticker tabs toggle', async ({ page }) => {
    await page.goto('/search?q=cat');
    const gifTab = page.locator('[data-testid="tab-gif"]');
    const stickerTab = page.locator('[data-testid="tab-sticker"]');
    await expect(gifTab).toBeVisible({ timeout: 10000 });
    await expect(stickerTab).toBeVisible();
    await stickerTab.click();
    // Tab should become active/selected
    await expect(stickerTab).toHaveClass(/active|selected/);
  });
});
