import { test, expect, Page } from '@playwright/test';

// INK-004: the "Swipe to Explore" preview card caption must render fully inside
// the card (no bottom clipping) at every language and width, including a narrow
// mobile viewport where the longer Spanish caption may wrap.

async function assertCaptionInsideCard(page: Page) {
  const card = page.getByTestId('preview-card');
  const caption = page.getByTestId('preview-caption');
  await expect(card).toBeVisible();
  await expect(caption).toBeVisible();

  const cardBox = await card.boundingBox();
  const capBox = await caption.boundingBox();
  expect(cardBox).not.toBeNull();
  expect(capBox).not.toBeNull();
  if (!cardBox || !capBox) return;

  // Allow a 1px tolerance for sub-pixel rounding / border widths.
  const t = 1;
  expect(capBox.x).toBeGreaterThanOrEqual(cardBox.x - t);
  expect(capBox.y).toBeGreaterThanOrEqual(cardBox.y - t);
  expect(capBox.x + capBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + t);
  // The bug: the caption's bottom edge spilled past the card's bottom edge.
  expect(capBox.y + capBox.height).toBeLessThanOrEqual(cardBox.y + cardBox.height + t);
}

const widths = [
  { label: 'narrow mobile', size: { width: 320, height: 568 } },
  { label: 'standard mobile', size: { width: 390, height: 844 } },
  { label: 'short landscape', size: { width: 480, height: 400 } },
];

for (const lang of ['en', 'es'] as const) {
  for (const { label, size } of widths) {
    test(`preview caption fits inside the card (${lang}, ${label})`, async ({ page }) => {
      await page.addInitScript((l) => localStorage.setItem('cc_lang', l), lang);
      await page.setViewportSize(size);
      await page.goto('/');
      await assertCaptionInsideCard(page);
    });
  }
}
