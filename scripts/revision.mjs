// Revisión de diseño: capturas por sección (390/768/1024/1440, con y sin movimiento reducido),
// videos del scroll completo y altura de la página.
// Uso: node scripts/revision.mjs <carpeta> [url]
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const dir = process.argv[2] || 'revision/antes';
const url = process.argv[3] || 'http://localhost:5173/';
await fs.mkdir(`${dir}/videos`, { recursive: true });
const browser = await chromium.launch();
const alturas = {};

for (const reducido of [false, true]) {
  for (const [w, h] of [[390, 844], [768, 1024], [1024, 768], [1440, 900]]) {
    if (!reducido && (w === 768 || w === 1024)) {} // se capturan igual
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768, reducedMotion: reducido ? 'reduce' : 'no-preference' });
    const p = await ctx.newPage();
    await p.addInitScript(() => localStorage.setItem('eq-visto', '1'));
    await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += h / 2) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(80); }
    await p.waitForTimeout(500);
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
    const secciones = await p.evaluate(() => [...document.querySelectorAll('main section, footer')].map((e, i) => ({ id: e.id || e.className.split(' ')[0] || 's' + i, top: e.getBoundingClientRect().top + scrollY, alto: e.offsetHeight })));
    const sufijo = reducido ? '-reducido' : '';
    if (w === 390 || w === 1440) {
      for (const [i, s] of secciones.entries()) {
        await p.evaluate((y) => scrollTo(0, y), s.top); await p.waitForTimeout(700);
        await p.screenshot({ path: `${dir}/${w}${sufijo}-${String(i).padStart(2, '0')}-${s.id}.jpg`, quality: 70, type: 'jpeg' });
      }
    } else {
      await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(500);
      await p.screenshot({ path: `${dir}/${w}${sufijo}-completa.jpg`, quality: 55, type: 'jpeg', fullPage: true });
    }
    const desborde = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    alturas[`${w}${sufijo}`] = { pagina: await p.evaluate(() => document.documentElement.scrollHeight), desborde, secciones: Object.fromEntries(secciones.map((s) => [s.id, s.alto])) };
    await ctx.close();
  }
}

// Videos del scroll completo
if (!process.env.SIN_VIDEO) {
for (const reducido of [false, true]) {
  for (const [n, w, h] of [['1440', 1440, 900], ['390', 390, 844]]) {
    const escala = w > 800 ? 0.75 : 1;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768, reducedMotion: reducido ? 'reduce' : 'no-preference', recordVideo: { dir: `${dir}/videos`, size: { width: Math.round(w * escala), height: Math.round(h * escala) } } });
    const p = await ctx.newPage();
    await p.addInitScript(() => localStorage.setItem('eq-visto', '1'));
    await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(2000);
    const total = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    for (let y = 0; y <= total; y += w > 800 ? 20 : 14) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(16); }
    await p.waitForTimeout(600);
    const v = p.video(); await ctx.close();
    await fs.rename(await v.path(), `${dir}/videos/scroll-${n}${reducido ? '-reducido' : ''}.webm`);
  }
}
}
await browser.close();
await fs.writeFile(`${dir}/alturas.json`, JSON.stringify(alturas, null, 2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(alturas).map(([k, v]) => [k, { pagina: v.pagina, desborde: v.desborde }]))));
console.log('secciones 1440:', JSON.stringify(alturas['1440'].secciones));
console.log('secciones 390:', JSON.stringify(alturas['390'].secciones));
