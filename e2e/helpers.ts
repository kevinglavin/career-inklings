import { Page, expect } from '@playwright/test';

// Drive the app from the landing screen into Quick Mode (24 cards).
export async function startQuick(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Exploring' }).click();
  await page.getByRole('button', { name: /Quick Mode/ }).click();
  await expect(page.getByText('0 of 24')).toBeVisible();
}

// Swipe the whole quick deck with one key, then wait for the results screen.
export async function swipeAll(page: Page, key: 'ArrowRight' | 'ArrowLeft' | 'ArrowUp', count = 24) {
  for (let i = 1; i <= count; i++) {
    await page.keyboard.press(key);
    if (i < count) {
      // Assert between presses so React commits each swipe before the next key.
      await expect(page.getByText(`${i} of ${count}`)).toBeVisible();
    }
  }
  await expect(page.getByRole('heading', { name: 'Your Interest Code' })).toBeVisible({ timeout: 15_000 });
}
