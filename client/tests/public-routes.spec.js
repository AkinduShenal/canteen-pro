import { expect, test } from '@playwright/test';

test.describe('Public pages', () => {
  test('home page loads with key hero actions', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /eat fast\. order smart\./i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse Menu' })).toBeVisible();
  });

  test('login page can be opened from navbar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
  });

  test('register page form is visible', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: 'Join Us' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter your full name')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByPlaceholder('Create a password (min 6 chars)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });
});
