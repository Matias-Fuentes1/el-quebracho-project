// Auditoría: viewports (sin scroll horizontal), teclado, áreas táctiles y videos de scroll.
// Uso: node scripts/auditoria.mjs [url]   (con `npm run preview` corriendo)
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const url = process.argv[2] || 'http://localhost:4173/';
await fs.mkdir('capturas/videos', { recursive: true });
const browser = await chromium.launch();
const out = {};

// Viewports
out.viewports = {};
for (const w of [360, 375, 390, 414, 768, 1024, 1280, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, isMobile: w < 768, hasTouch: w < 768 });
  const p = await ctx.newPage();
  await p.addInitScript(() => localStorage.setItem('eq-visto', '1'));
  await p.goto(url, { waitUntil: 'load' });
  const alto = await p.evaluate(() => document.documentElement.scrollHeight);
  let max = 0;
  for (let y = 0; y < alto; y += 700) {
    await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(60);
    max = Math.max(max, await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  }
  // Áreas táctiles < 48px (solo celular)
  let chicos = [];
  if (w < 768) {
    chicos = await p.evaluate(() => [...document.querySelectorAll('a[href], button')].filter((el) => {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (!r.width || cs.visibility === 'hidden' || el.closest('[hidden]')) return false;
      return r.height < 44 || r.width < 44;
    }).map((el) => `${el.textContent.trim().slice(0, 30)} (${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)})`));
  }
  out.viewports[w] = { desbordeHorizontal: max, tactilesChicos: chicos };
  await ctx.close();
}

// Teclado
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => localStorage.setItem('eq-visto', '1'));
  await p.goto(url, { waitUntil: 'load' });
  const orden = [];
  for (let i = 0; i < 14; i++) {
    await p.keyboard.press('Tab');
    orden.push(await p.evaluate(() => {
      const a = document.activeElement; const cs = getComputedStyle(a);
      return `${a.tagName.toLowerCase()} "${(a.getAttribute('aria-label') || a.textContent).trim().replace(/\s+/g, ' ').slice(0, 28)}" foco:${cs.outlineStyle !== 'none' ? cs.outlineColor : 'SIN CONTORNO'}`;
    }));
  }
  out.teclado = orden;
  // Acordeón con teclado
  await p.focus('#b-cementos'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  out.acordeonTeclado = await p.getAttribute('#b-cementos', 'aria-expanded');
  out.h1 = await p.evaluate(() => document.querySelectorAll('h1').length);
  out.imgSinAlt = await p.evaluate(() => [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length);
  out.imgsExternas = await p.evaluate(() => [...document.querySelectorAll('img, source')].map((i) => i.src || i.srcset).filter((s) => s && /^https?:/.test(s) && !s.includes(location.host)).length);
  await ctx.close();
}

// Videos de scroll
for (const [n, w, h] of [['escritorio', 1440, 900], ['celular', 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768, recordVideo: { dir: 'capturas/videos', size: { width: Math.round(w * (w > 800 ? 0.75 : 1)), height: Math.round(h * (w > 800 ? 0.75 : 1)) } } });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(1800);
  const alto = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const paso = w > 800 ? 18 : 14;
  for (let y = 0; y <= alto; y += paso) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(16); }
  await p.waitForTimeout(800);
  const v = p.video(); await ctx.close();
  await fs.rename(await v.path(), `capturas/videos/scroll-${n}.webm`);
}
await browser.close();
console.log(JSON.stringify(out, null, 2));
