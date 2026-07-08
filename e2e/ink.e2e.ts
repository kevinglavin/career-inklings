import { test, expect } from '@playwright/test';

// Mock the Netlify function so tests never hit the real API. The reply varies by
// the user's message so we can exercise the decline cases too.
async function mockInk(page: import('@playwright/test').Page) {
  await page.route('**/.netlify/functions/ink-chat', async route => {
    const payload = route.request().postDataJSON();
    const last = String(payload.messages[payload.messages.length - 1].content).toLowerCase();
    let text = 'The six interest types are Realistic, Investigative, Artistic, Social, Enterprising, and Conventional.';
    if (last.includes('address') || last.includes('phone')) {
      text = "I can't collect personal information — everything here is anonymous.";
    } else if (last.includes('homework') || last.includes('essay')) {
      text = "I stick to career exploration, so I can't help with homework, but I can explain the interest types.";
    } else if (last.includes('sad') || last.includes('anxious')) {
      text = 'For feelings like that, it is best to talk with a trusted adult or a counselor.';
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text }) });
  });
}

test.describe('Ink guide', () => {
  test.beforeEach(async ({ page }) => {
    await mockInk(page);
    await page.goto('/');
  });

  test('opens, sends, receives, and closes', async ({ page }) => {
    await page.getByRole('button', { name: 'Open Ink, your career guide' }).click();
    const panel = page.getByRole('dialog', { name: 'Ink' });
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/Hi, I'm Ink/)).toBeVisible();

    await page.getByPlaceholder(/Ask about/).fill('Explain the six interest types');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(panel.getByText('Explain the six interest types')).toBeVisible();
    await expect(panel.getByText(/six interest types are Realistic/)).toBeVisible();

    await page.getByRole('button', { name: 'Close Ink' }).click();
    await expect(panel).toBeHidden();
  });

  test('closes on Escape', async ({ page }) => {
    await page.getByRole('button', { name: 'Open Ink, your career guide' }).click();
    await expect(page.getByRole('dialog', { name: 'Ink' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Ink' })).toBeHidden();
  });

  test('New chat clears the conversation', async ({ page }) => {
    await page.getByRole('button', { name: 'Open Ink, your career guide' }).click();
    const panel = page.getByRole('dialog', { name: 'Ink' });
    await page.getByPlaceholder(/Ask about/).fill('Explain the six interest types');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(panel.getByText(/six interest types are Realistic/)).toBeVisible();
    await page.getByRole('button', { name: 'New chat' }).click();
    await expect(panel.getByText('Explain the six interest types')).toBeHidden();
  });

  for (const { label, prompt, expected } of [
    { label: 'personal information', prompt: 'what is your home address', expected: /anonymous/ },
    { label: 'homework', prompt: 'write my history homework essay', expected: /career exploration/ },
    { label: 'medical', prompt: 'I feel really sad and anxious', expected: /trusted adult or a counselor/ },
  ]) {
    test(`surfaces the decline reply for ${label}`, async ({ page }) => {
      await page.getByRole('button', { name: 'Open Ink, your career guide' }).click();
      const panel = page.getByRole('dialog', { name: 'Ink' });
      await page.getByPlaceholder(/Ask about/).fill(prompt);
      await page.getByRole('button', { name: 'Send' }).click();
      await expect(panel.getByText(expected)).toBeVisible();
    });
  }
});
