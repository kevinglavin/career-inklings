import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = 'http://localhost:4317/';
const OUT = '/tmp/cv-shots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
});

async function run(name, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: width < 700, hasTouch: width < 700 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1200);
  const skip = page.getByRole('button', { name: 'Skip' });
  if (await skip.count()) await skip.click();
  await page.waitForTimeout(1200);

  // open a star via search
  if (width <= 680) {
    await page.getByRole('button', { name: 'Search careers' }).click();
    await page.waitForTimeout(300);
  }
  const input = page.getByPlaceholder('Search careers…');
  await input.click();
  await input.fill('engineer');
  await page.waitForTimeout(500);
  await page.locator('.search-result').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/resp-${name}.png` });

  // measure detail panel width fraction
  const frac = await page.evaluate(() => {
    const el = document.querySelector('.detail');
    if (!el) return null;
    return +(el.getBoundingClientRect().width / window.innerWidth).toFixed(3);
  });
  // are controls reachable (visible)?
  const controls = await page.locator('.controls').isVisible();
  console.log(`${name} (${width}x${height}): panelWidthFrac=${frac} controlsVisible=${controls} errors=${errors.length}`);
  if (errors.length) console.log('  ERR:', errors.join(' | '));
  await page.close();
}

await run('tablet', 768, 1024);
await run('phone', 390, 844);

// search precision re-check on desktop
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas');
await page.waitForTimeout(800);
const skip = page.getByRole('button', { name: 'Skip' });
if (await skip.count()) await skip.click();
const input = page.getByPlaceholder('Search careers…');
await input.click();
await input.fill('nurse');
await page.waitForTimeout(500);
const titles = await page.$$eval('.search-result .title', (els) => els.map((e) => e.textContent));
console.log('search "nurse":', JSON.stringify(titles));
await browser.close();
