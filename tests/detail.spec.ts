import { test, expect } from '@playwright/test';

test.describe('Detail Page', () => {
  test('navigating from home to detail shows GIF', async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('[data-testid="gif-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();
    await expect(page).toHaveURL(/\/gif\//);
    const media = page.locator('img, video').first();
    await expect(media).toBeVisible({ timeout: 10000 });
  });

  test('detail page loads directly by URL', async ({ page }) => {
    await page.goto('/gif/test-id');
    await expect(page).toHaveTitle(/GIF Meme/);
  });
});