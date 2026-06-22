import { chromium } from 'playwright';

const URL = 'http://localhost:4317/';
const OUT = '/tmp/cv-shots';

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas');
await page.waitForTimeout(1000);
const skip = page.getByRole('button', { name: 'Skip' });
if (await skip.count()) await skip.click();
await page.waitForTimeout(800);

// navigate a path: search -> a few neighbour hops
const input = page.getByPlaceholder('Search careers…');
await input.click();
await input.fill('welder');
await page.waitForTimeout(400);
await page.locator('.search-result').first().click();
await page.waitForTimeout(1200);
for (let i = 0; i < 3; i++) {
  const nb = page.locator('.neighbour').nth(0);
  if (await nb.count()) await nb.click();
  await page.waitForTimeout(1200);
}
// deselect + home to view the whole trail
await page.keyboard.press('Escape');
await page.keyboard.press('h');
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/07-trail.png` });
console.log('trail shot done. errors:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
