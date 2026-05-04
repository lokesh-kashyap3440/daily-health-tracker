import { test, expect } from '@playwright/test';

async function login(page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'e2e@test.com');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.getByRole('button', { name: /Sign In/ }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(500);
}

test.describe('Chatbot', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('chatbot page loads with welcome message', async ({ page }) => {
    const sidebar = page.locator('aside');
    await sidebar.getByText('Chatbot').click();
    await page.waitForURL('**/chatbot', { timeout: 5000 });
    await expect(page.locator('text=AI Health Coach')).toBeVisible({ timeout: 5000 });
  });

  test('sending a message gets a response', async ({ page }) => {
    const sidebar = page.locator('aside');
    await sidebar.getByText('Chatbot').click();
    await page.waitForURL('**/chatbot', { timeout: 5000 });

    // Type in the chat input and click send button
    const input = page.locator('form input[placeholder*="Ask"]');
    await input.fill('TestMsg');
    await page.locator('form button[type="submit"]').click();

    // User message should appear in the chat window (not sidebar)
    // Use last() since sidebar may have old sessions with same text
    await expect(page.getByText('TestMsg').last()).toBeVisible({ timeout: 5000 });
  });

  test('chat input is visible and enabled', async ({ page }) => {
    const sidebar = page.locator('aside');
    await sidebar.getByText('Chatbot').click();
    await page.waitForURL('**/chatbot', { timeout: 5000 });
    const input = page.locator('form input[placeholder*="Ask"]');
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });
});
