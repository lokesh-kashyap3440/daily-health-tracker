import { test, expect } from '@playwright/test';

async function login(page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'e2e@test.com');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.getByRole('button', { name: /Sign In/ }).click();
  // Wait for redirect — may hit rate limits if many logins, so generous timeout
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  // Small pause to avoid rate limiting between tests
  await page.waitForTimeout(500);
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('dashboard shows hero header', async ({ page }) => {
    // Hero now shows a time-based greeting and a wellness snapshot sub-text
    await expect(page.locator('text=wellness snapshot')).toBeVisible();
  });

  test('dashboard shows summary stat cards', async ({ page }) => {
    // Use exact text to avoid matching multiple elements
    await expect(page.getByText('Calories', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Water', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Workout', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Sleep', { exact: true }).first()).toBeVisible();
  });

  test('sidebar navigation links are visible', async ({ page }) => {
    // Sidebar links are in the aside element
    const sidebar = page.locator('aside');
    await expect(sidebar.getByText('Dashboard')).toBeVisible();
    await expect(sidebar.getByText('Daily Log')).toBeVisible();
    await expect(sidebar.getByText('Chatbot')).toBeVisible();
    await expect(sidebar.getByText('Metrics')).toBeVisible();
    await expect(sidebar.getByText('Profile')).toBeVisible();
  });

  test('navigating to daily log page works', async ({ page }) => {
    const sidebar = page.locator('aside');
    await sidebar.getByText('Daily Log').click();
    await page.waitForURL('**/daily-log', { timeout: 10000 });
    await expect(page).toHaveURL(/.*daily-log/);
  });

  test('navigating to metrics page works', async ({ page }) => {
    const sidebar = page.locator('aside');
    await sidebar.getByText('Metrics').click();
    await page.waitForURL('**/metrics', { timeout: 10000 });
    await expect(page).toHaveURL(/.*metrics/);
  });
});
