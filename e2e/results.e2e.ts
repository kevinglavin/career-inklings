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
  // Item 5: the copied text is INK-A aligned — interest code + occupation evidence,
  // with no like/curious counts and no "career card" terminology.
  test('Copy Counselor Summary confirms in the UI and is INK-A aligned', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await startQuick(page);
    await swipeAll(page, 'ArrowRight');
    await page.getByRole('button', { name: /Copy Counselor Summary/ }).click();
    await expect(page.getByRole('button', { name: 'Summary copied' })).toBeVisible();

    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain('Your Interest Code');
    expect(clip).toContain('Evidence');
    // No like/curious counts, no "career card" terminology.
    expect(clip).not.toMatch(/you liked/i);
    expect(clip).not.toMatch(/\d+\s+(likes|curious)/i);
    expect(clip).not.toMatch(/career cards?/i);
  });
});

test.describe('mode select (item 2 + 3)', () => {
  // Item 3: the Card Deck control is a single compact chip under the subtitle that
  // expands only on tap and collapses on outside click.
  test('Card Deck chip expands on tap and collapses on outside click', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Start Exploring/ }).click();

    const chip = page.getByRole('button', { name: /Card Deck/ });
    await expect(chip).toBeVisible();
    await expect(chip).toHaveAttribute('aria-expanded', 'false');

    // The chip sits above (before) the Quick Mode button in the layout.
    const chipBox = await chip.boundingBox();
    const quickBox = await page.getByRole('button', { name: /Quick Mode/ }).boundingBox();
    expect(chipBox!.y).toBeLessThan(quickBox!.y);

    // Options are hidden until tapped.
    await expect(page.getByRole('button', { name: 'Classic' })).toHaveCount(0);
    await chip.click();
    await expect(chip).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('button', { name: 'Classic' })).toBeVisible();

    // Outside click collapses it.
    await page.getByRole('heading', { name: /Discover What Draws You In/ }).click();
    await expect(chip).toHaveAttribute('aria-expanded', 'false');
  });
});
