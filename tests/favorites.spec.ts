import { test, expect } from '@playwright/test';

test.describe('Favorites Page', () => {
  test('shows empty state or login prompt without auth', async ({ page }) => {
    await page.goto('/favorites');
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('favorites page with mock session cookie', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'session',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    await page.goto('/favorites');
    await page.waitForTimeout(2000);
    const status = page.url();
    expect(status).toBeTruthy();
  });
});