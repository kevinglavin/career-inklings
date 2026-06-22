import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.env.URL || 'http://localhost:4317/';
const OUT = '/tmp/cv-shots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: [
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--ignore-gpu-blocklist',
    '--no-sandbox',
  ],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('CONSOLE ' + m.text());
});
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas', { timeout: 10000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/01-onboarding.png` });

// Skip onboarding → overview
const skip = page.getByRole('button', { name: 'Skip' });
if (await skip.count()) await skip.click();
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/02-overview.png` });

// Search "nurse"
const input = page.getByPlaceholder('Search careers…');
await input.click();
await input.fill('nurse');
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/03-search-nurse.png` });

// capture the result titles
const resultTitles = await page.$$eval('.search-result .title', (els) => els.map((e) => e.textContent));

// click first result → selection + camera ease + detail panel
const first = page.locator('.search-result').first();
if (await first.count()) await first.click();
await page.waitForTimeout(1400);
await page.screenshot({ path: `${OUT}/04-selected.png` });

// drag to pan
await page.mouse.move(720, 450);
await page.mouse.down();
await page.mouse.move(500, 360, { steps: 12 });
await page.mouse.move(360, 300, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/05-after-pan.png` });

// zoom via wheel at a point
await page.mouse.move(720, 450);
for (let i = 0; i < 8; i++) {
  await page.mouse.wheel(0, -120);
  await page.waitForTimeout(40);
}
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/06-zoomed.png` });

console.log('SEARCH RESULTS for "nurse":', JSON.stringify(resultTitles));
console.log('CONSOLE ERRORS:', errors.length ? '\n' + errors.join('\n') : 'none');
await browser.close();
