import { test, expect } from '@playwright/test';
import { startQuick, swipeAll } from './helpers';

test.describe('results coverage', () => {
  // INK-017: all three swipe actions have a keyboard equivalent.
  test('arrow keys drive dislike, unsure, and like', async ({ page }) => {
    await startQuick(page);
    await page.keyboard.press('ArrowRight'); // like
    await expect(page.getByText('1 of 24')).toBeVisible();
    await page.keyboard.press('ArrowLeft'); // dislike
    await expect(page.getByText('2 of 24')).toBeVisible();
    await page.keyboard.press('ArrowUp'); // unsure
    await expect(page.getByText('3 of 24')).toBeVisible();
  });

  // INK-002/003/009: a dislike-all run must show a friendly empty state and no
  // zero-likes framing anywhere.
  test('dislike-all shows a friendly empty state with no zero framing', async ({ page }) => {
    await startQuick(page);
    await swipeAll(page, 'ArrowLeft');
    await expect(page.getByText('Not enough signal yet')).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/0 likes/i);
    expect(body).not.toMatch(/0 curious/i);
    expect(body).not.toMatch(/---/);
    expect(body).not.toMatch(/0 raw score/i);
  });

  // Work order item 24 (coverage gap): Download Report.
  test('Download Report produces a PDF file', async ({ page }) => {
    await startQuick(page);
    await swipeAll(page, 'ArrowRight');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download Report/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/Inklings_Report_.*\.pdf/);
  });

  // Work order item 24 (coverage gap): Copy Counselor Summary.
  test('Copy Counselor Summary confirms in the UI', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await startQuick(page);
    await swipeAll(page, 'ArrowRight');
    await page.getByRole('button', { name: /Copy Counselor Summary/ }).click();
    await expect(page.getByRole('button', { name: 'Summary copied' })).toBeVisible();
  });
});
