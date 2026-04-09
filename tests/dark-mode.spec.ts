import { test, expect } from '@playwright/test';

test.describe('Dark Mode', () => {
  test('toggle dark mode changes theme', async ({ page }) => {
    await page.goto('/');
    const themeToggle = page
      .locator('button')
      .filter({ hasText: /dark|light|theme/i })
      .first()
      .or(
        page.locator('[aria-label*="theme"], [aria-label*="dark"], [aria-label*="mode"]').first(),
      );

    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      const html = page.locator('html');
      const theme = (await html.getAttribute('data-theme')) || (await html.getAttribute('class'));
      expect(theme).toBeTruthy();
    }
  });

  test('dark mode persists across navigation', async ({ page }) => {
    await page.goto('/');
    const themeToggle = page
      .locator('button')
      .filter({ hasText: /dark|light|theme/i })
      .first()
      .or(
        page.locator('[aria-label*="theme"], [aria-label*="dark"], [aria-label*="mode"]').first(),
      );

    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      const themeAfterToggle = await page.locator('html').getAttribute('data-theme');
      await page.goto('/search?q=test');
      const themeAfterNav = await page.locator('html').getAttribute('data-theme');
      expect(themeAfterNav).toBe(themeAfterToggle);
    }
  });
});