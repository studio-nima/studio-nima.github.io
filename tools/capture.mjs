/*
 * Genera las capturas de un sitio para el portafolio.
 *   npm i -D playwright && npx playwright install chromium   (una sola vez)
 *   node tools/capture.mjs <repo> [<repo>…]
 * Produce img/sites/<repo>-desktop.jpg, -full.jpg y -mobile.jpg
 * (nombre en minúsculas) → usar ese nombre en el campo `shots` de js/sites.js.
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const USER = 'studio-nima';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'img', 'sites');
const repos = process.argv.slice(2);
if (!repos.length) { console.error('Uso: node tools/capture.mjs <repo> [<repo>…]'); process.exit(1); }

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});

async function open(url, viewport, dpr) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: dpr });
  await page.goto(url, { waitUntil: 'networkidle' });
  // recorrer la página para disparar las animaciones de aparición
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);
  return page;
}

for (const repo of repos) {
  const url = `https://${USER}.github.io/${repo}/`;
  const name = repo.toLowerCase();
  const shots = [
    ['desktop', { width: 1440, height: 900 }, 1.5, false, 82],
    ['full', { width: 1280, height: 800 }, 1, true, 72],
    ['mobile', { width: 390, height: 844 }, 2, false, 82],
  ];
  for (const [tag, viewport, dpr, fullPage, quality] of shots) {
    const page = await open(url, viewport, dpr);
    await page.screenshot({ path: path.join(OUT, `${name}-${tag}.jpg`), type: 'jpeg', quality, fullPage });
    await page.close();
  }
  console.log(`✓ ${repo} → img/sites/${name}-{desktop,full,mobile}.jpg`);
}
await browser.close();
