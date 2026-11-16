// Verificación de efectos con Playwright. Uso: node scripts/verificar.mjs [url]
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const url = process.argv[2] || 'http://localhost:5173/';
const dir = 'capturas/verificacion';
await fs.mkdir(dir, { recursive: true });
const browser = await chromium.launch();
const log = (...a) => console.log(...a);
const res = {};

// ---------- Escritorio
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  // 1. Precarga (primera visita)
  await page.goto(url);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${dir}/01-precarga-250ms.jpg`, quality: 60, type: 'jpeg' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${dir}/01-precarga-650ms.jpg`, quality: 60, type: 'jpeg' });
  await page.waitForTimeout(800);
  res.precargaTerminada = await page.evaluate(() => !document.documentElement.classList.contains('con-precarga'));
  await page.screenshot({ path: `${dir}/02-inicio.jpg`, quality: 60, type: 'jpeg' });
  // 3. Parallax: posiciones del inicio tras bajar
  await page.mouse.wheel(0, 450); await page.waitForTimeout(700);
  res.parallax = await page.evaluate(() => ({
    foto: getComputedStyle(document.querySelector('[data-inicio-foto]')).transform,
    texto: getComputedStyle(document.querySelector('[data-inicio-texto]')).transform,
    sombra: getComputedStyle(document.querySelector('[data-inicio-sombra]')).opacity,
  }));
  await page.screenshot({ path: `${dir}/03-parallax.jpg`, quality: 60, type: 'jpeg' });
  // 9. Salida del inicio: Dos mundos sube encima (capturas a mitad de camino)
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(400);
  for (const k of [0.35, 0.7, 1]) {
    await page.evaluate((k) => scrollTo(0, innerHeight * k), k); await page.waitForTimeout(700);
    await page.screenshot({ path: `${dir}/09-salida-inicio-${k}.jpg`, quality: 60, type: 'jpeg' });
  }
  // 5. Dos mundos: hover
  await page.evaluate(() => document.querySelector('[data-paneles]').scrollIntoView()); await page.waitForTimeout(600);
  await page.hover('#campo', { position: { x: 200, y: 300 } }); await page.waitForTimeout(1100);
  res.divCampo = await page.evaluate(() => getComputedStyle(document.querySelector('.paneles')).getPropertyValue('--div'));
  await page.screenshot({ path: `${dir}/05-paneles-hover-campo.jpg`, quality: 60, type: 'jpeg' });
  await page.mouse.move(1300, 400); await page.waitForTimeout(1100);
  res.divObra = await page.evaluate(() => getComputedStyle(document.querySelector('.paneles')).getPropertyValue('--div'));
  await page.screenshot({ path: `${dir}/05-paneles-hover-obra.jpg`, quality: 60, type: 'jpeg' });
  // 6. Galería fijada
  res.galeriaFijada = await page.evaluate(() => document.documentElement.classList.contains('galeria-fijada'));
  await page.evaluate(() => document.querySelector('#campo-seccion').scrollIntoView()); await page.waitForTimeout(500);
  const y0 = await page.evaluate(() => window.scrollY);
  for (const k of [0.25, 0.6]) {
    await page.evaluate(([y, k]) => window.scrollTo(0, y + innerHeight * 3 * k), [y0, k]); await page.waitForTimeout(1200);
    await page.screenshot({ path: `${dir}/06-galeria-${k}.jpg`, quality: 60, type: 'jpeg' });
  }
  // 8. Filas: foto que sigue al cursor
  await page.evaluate(() => document.querySelector('.filas').scrollIntoView({ block: 'center' })); await page.waitForTimeout(800);
  const fila = await page.$('.fila:nth-child(2) .fila__boton'); const bb = await fila.boundingBox();
  await page.mouse.move(bb.x + 300, bb.y + bb.height / 2); await page.waitForTimeout(150);
  await page.mouse.move(bb.x + 600, bb.y + bb.height / 2, { steps: 8 }); await page.waitForTimeout(900);
  res.flotante = await page.evaluate(() => getComputedStyle(document.querySelector('[data-flotante]')).opacity);
  await page.screenshot({ path: `${dir}/08-fila-hover.jpg`, quality: 60, type: 'jpeg' });
  // 13. botón con barrido
  const wa = await page.$('.computo .boton'); await wa.scrollIntoViewIfNeeded(); await wa.hover(); await page.waitForTimeout(700);
  await page.screenshot({ path: `${dir}/13-boton-hover.jpg`, quality: 60, type: 'jpeg', clip: await wa.boundingBox().then((b) => ({ x: b.x - 40, y: b.y - 40, width: b.width + 80, height: b.height + 80 })) });
  // 14. progreso
  res.progreso = await page.evaluate(() => getComputedStyle(document.querySelector('.progreso span')).transform);
  res.erroresEscritorio = errs;
  await ctx.close();
}

// ---------- Celular
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.addInitScript(() => localStorage.setItem('eq-visto', '1'));
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(1200);
  res.movilSinPins = await page.evaluate(() => [...document.querySelectorAll('.pin-spacer')].length);
  // 15. FAB
  await page.evaluate(() => window.scrollTo(0, 1200)); await page.waitForTimeout(200);
  await page.evaluate(() => window.scrollTo(0, 1600)); await page.waitForTimeout(500);
  res.fabOcultoAlBajar = await page.evaluate(() => document.querySelector('[data-fab]').classList.contains('es-oculto'));
  await page.evaluate(() => window.scrollTo(0, 1300)); await page.waitForTimeout(500);
  res.fabVisibleAlSubir = await page.evaluate(() => !document.querySelector('[data-fab]').classList.contains('es-oculto'));
  // 5. paneles sticky
  await page.evaluate(() => document.querySelector('[data-paneles]').scrollIntoView()); await page.evaluate(() => window.scrollBy(0, 500)); await page.waitForTimeout(600);
  await page.screenshot({ path: `${dir}/m05-paneles-sticky.jpg`, quality: 60, type: 'jpeg' });
  // 6. carrusel
  await page.evaluate(() => document.querySelector('[data-galeria]').scrollIntoView({ block: 'center' })); await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('[data-galeria]').scrollBy({ left: 200 })); await page.waitForTimeout(800);
  await page.screenshot({ path: `${dir}/m06-carrusel.jpg`, quality: 60, type: 'jpeg' });
  // 8. acordeón
  await page.evaluate(() => document.querySelector('.filas').scrollIntoView()); await page.waitForTimeout(300);
  await page.tap('.fila:nth-child(3) .fila__boton'); await page.waitForTimeout(900);
  res.acordeon = await page.evaluate(() => document.querySelector('.fila:nth-child(3) .fila__boton').getAttribute('aria-expanded'));
  await page.evaluate(() => document.querySelector('.fila:nth-child(3)').scrollIntoView()); await page.waitForTimeout(500);
  await page.screenshot({ path: `${dir}/m08-acordeon.jpg`, quality: 60, type: 'jpeg' });
  // menú
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
  await page.tap('[data-menu-abrir]'); await page.waitForTimeout(300);
  res.menuFoco = await page.evaluate(() => document.activeElement.hasAttribute('data-menu-cerrar'));
  await page.screenshot({ path: `${dir}/m-menu.jpg`, quality: 60, type: 'jpeg' });
  res.erroresMovil = errs;
  await ctx.close();
}

// ---------- Movimiento reducido
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(800);
  res.reducido = await page.evaluate(() => ({
    precarga: document.documentElement.classList.contains('con-precarga'),
    pins: document.querySelectorAll('.pin-spacer').length,
    galeriaFijada: document.documentElement.classList.contains('galeria-fijada'),
  }));
  await page.evaluate(() => scrollTo(0, innerHeight * 0.6)); await page.waitForTimeout(600);
  await page.screenshot({ path: `${dir}/r-salida-inicio.jpg`, quality: 60, type: 'jpeg' });
  await ctx.close();
}

// ---------- Sin JS
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(url.replace('5173', '4173'), { waitUntil: 'load' }).catch(() => {});
  res.sinJS = await page.evaluate(() => ({ h1: document.querySelector('h1')?.textContent, filasAbiertas: [...document.querySelectorAll('.fila__boton')].every((b) => b.getAttribute('aria-expanded') === 'true') })).catch((e) => 'no disponible: ' + e.message);
  await ctx.close();
}

await browser.close();
log(JSON.stringify(res, null, 2));
