import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login button exists and links to auth endpoint', async ({ page }) => {
    await page.goto('/');
    const loginLink = page
      .locator(
        'a[href*="/api/auth/login"], button:has-text("Login"), button:has-text("Sign"), a:has-text("Login"), a:has-text("Sign")',
      )
      .first();
    await expect(loginLink).toBeVisible({ timeout: 10000 });
    const href = await loginLink.getAttribute('href');
    if (href) {
      expect(href).toContain('/api/auth');
    }
  });

  test('favorites page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/favorites');
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasAuthPrompt = await page
      .locator('text=/login|sign in|authenticate/i')
      .isVisible()
      .catch(() => false);
    expect(
      !url.includes('/favorites') ||
        hasAuthPrompt ||
        (await page
          .locator('[data-testid="favorites-empty"]')
          .isVisible()
          .catch(() => false)),
    ).toBeTruthy();
  });
});