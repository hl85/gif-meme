import { test, expect, type Page } from '@playwright/test';

test.describe('Production QA Tests', () => {
  test('Test 1: CategoryBar shows 9 colored pills', async ({ page }: { page: Page }) => {
    await page.goto('https://gifmeme.org');
    // Wait for category bar to load
    await page.waitForSelector('[data-testid="category-bar"]', { timeout: 10000 });
    const categoryPills = page.locator('[data-testid="category-pill"]');
    await categoryPills.first().waitFor();
    const count = await categoryPills.count();
    console.log(`Found ${count} category pills`);
    expect(count).toBe(9);
  });

  test('Test 2: Click on a GIF card, should navigate to /gif/[id]', async ({ page }: { page: Page }) => {
    await page.goto('https://gifmeme.org');
    await page.waitForSelector('[data-testid="gif-card"]', { timeout: 10000 });
    const gifCard = page.locator('[data-testid="gif-card"]').first();
    await gifCard.waitFor();
    await gifCard.click();
    await page.waitForURL(/\/gif\/\d+/, { timeout: 10000 });
    const url = page.url();
    console.log(`Navigated to ${url}`);
    expect(url).toMatch(/\/gif\/\d+$/);
  });

  test('Test 3: Click Sign In, verify LoginDialog shows Logo', async ({ page }: { page: Page }) => {
    await page.goto('https://gifmeme.org');
    // Click Sign In
    const signInBtn = page.getByRole('button', { name: /sign in/i });
    await signInBtn.waitFor({ timeout: 10000 });
    await signInBtn.click();
    // Wait for dialog
    await page.waitForSelector('[data-testid="login-dialog"]', { timeout: 10000 });
    const logo = page.locator('[data-testid="login-logo"]');
    await expect(logo).toBeVisible();
  });
});
