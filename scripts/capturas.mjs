// Uso: node scripts/capturas.mjs [url] [carpeta] [--reducido] [--secciones] [--anchos=375,390,1440]
// Saca capturas de página completa en 390 y 1440 px (o los anchos de --anchos) y por sección con --secciones.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith('http')) || 'http://localhost:5173/';
const dir = args.find((a) => !a.startsWith('http') && !a.startsWith('--')) || 'capturas';
const reducido = args.includes('--reducido');
const secciones = args.includes('--secciones');
const anchos = (args.find((a) => a.startsWith('--anchos='))?.slice(9) || '390,1440').split(',').map(Number);
await fs.mkdir(dir, { recursive: true });

const browser = await chromium.launch();
for (const [nombre, width, height] of anchos.map((w) => [String(w), w, w < 768 ? 844 : 900])) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: reducido ? 'reduce' : 'no-preference',
    isMobile: width < 768,
    hasTouch: width < 768,
  });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
  await page.addInitScript(() => localStorage.setItem('eq-visto', '1'));
  await page.goto(url, { waitUntil: 'networkidle' });
  // Recorre la página para disparar animaciones y carga diferida
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < alto; y += height / 2) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(800);
  if (secciones) {
    const ids = await page.$$eval('main > section, main > .marquesina, footer', (els) => els.map((e, i) => e.id || e.className.split(' ')[0] || 's' + i));
    const tops = await page.$$eval('main > section, main > .marquesina, footer', (els) => els.map((e) => e.getBoundingClientRect().top + window.scrollY));
    for (let i = 0; i < ids.length; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), tops[i]);
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${dir}/${nombre}-${String(i).padStart(2, '0')}-${ids[i]}.jpg`, quality: 70, type: 'jpeg' });
    }
  } else {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${dir}/${nombre}-completa.jpg`, fullPage: true, quality: 65, type: 'jpeg' });
  }
  const sw = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  console.log(nombre, 'scrollWidth/innerWidth', sw.join('/'), errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores');
  await ctx.close();
}
await browser.close();
