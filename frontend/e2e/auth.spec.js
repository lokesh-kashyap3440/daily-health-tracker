import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders with new design', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('HealthTracker');
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/ })).toBeVisible();
  });

  test('register page renders with new design', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1')).toContainText('HealthTracker');
    await expect(page.locator('text=Start your wellness journey')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Account/ })).toBeVisible();
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'e2e@test.com');
    await page.fill('input[type="password"]', 'Test1234!');
    await page.getByRole('button', { name: /Sign In/ }).click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('login with invalid credentials stays on login page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.getByRole('button', { name: /Sign In/ }).click();
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });

  test('register with existing email shows toast error', async ({ page }) => {
    await page.goto('/register');
    // Input component doesn't set type=text explicitly — use broader selector
    await page.locator('input:not([type="email"]):not([type="password"])').first().fill('Test');
    await page.locator('input[type="email"]').fill('e2e@test.com');
    await page.locator('input[type="password"]').fill('Test1234!');
    await page.getByRole('button', { name: /Create Account/ }).click();
    // Error toast should appear (react-hot-toast uses role="status")
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 8000 });
  });
});
