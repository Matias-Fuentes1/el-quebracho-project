// Movimiento del sitio. Reglas:
//  - gsap.matchMedia(): escritorio / celular / movimiento reducido (se revierte solo al cambiar)
//  - solo transform y opacity
//  - entradas: 200 ms, ease-out, solo opacidad y translateY de 8 px como máximo, sin delay ni escalonado;
//    los títulos arrancan en opacidad 1 (solo se desplazan)
//  - duraciones: solo 150, 200 o 300 ms en toda la web (excepto la precarga y la foto que sigue al cursor)
//  - única excepción a la entrada estándar: el título de Empresa (#titulo-empresa), letras en 3D con SplitText
//  - sin pins en celular; con movimiento reducido GSAP no anima nada (ni entradas, ni parallax, ni riel horizontal)
//  - si algo falla, el contenido ya está visible (los estados iniciales los pone GSAP, no el CSS)
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

// Entrada estándar: 200 ms ease-out, 8 px como máximo
const ENTRADA = { duration: 0.2, ease: 'power2.out' };
const DESPLAZAMIENTO = 8;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;

const Q = {
  escritorio: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
  movil: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
  reducido: '(prefers-reduced-motion: reduce)',
  mouse: '(hover: hover) and (pointer: fine) and (min-width: 768px) and (prefers-reduced-motion: no-preference)',
};

export async function iniciarMovimiento() {
  refrescoAlCargar();
  terreno();
  const intro = await precarga();
  if (document.fonts.status !== 'loaded') await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 400))]);

  const mm = gsap.matchMedia();

  // ---------- Común a celular y escritorio (con movimiento)
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    introInicio(intro);
    parallaxInicio();
    fotosEnMarco();
    entradasTexto();
    progreso();
    return tituloEmpresa3D(); // al pasar a movimiento reducido, el título vuelve a ser texto entero
  });

  // ---------- Celular
  mm.add(Q.movil, () => {
    const off = carruselMovil();
    return off;
  });

  // ---------- Escritorio
  mm.add(Q.escritorio, () => {
    galeriaFijada();
  });

  // ---------- Mouse fino (escritorio)
  mm.add(Q.mouse, () => {
    const offs = [cursorVer(), magneticos(), fotoQueSigue()];
    return () => offs.forEach((f) => f && f());
  });

  // ---------- Movimiento reducido: GSAP no anima nada. El contenido ya está visible, el riel de El Campo
  // queda como scroll horizontal nativo y el cambio de terreno es instantáneo (en CSS, a lo sumo un fundido de 150 ms).

  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}

/* ================================================================ 1. Precarga */
function precarga() {
  if (!html.classList.contains('con-precarga')) return Promise.resolve(0);
  return new Promise((resolve) => {
    const textos = $$('.precarga__cortina span');
    const tl = gsap.timeline({
      onComplete: () => { html.classList.remove('con-precarga'); },
    });
    tl.from(textos, { opacity: 0, duration: 0.25, ease: 'power2.out' })
      .to('.precarga__cortina--arriba', { yPercent: -100, duration: 0.65, ease: 'power3.inOut' }, 0.3)
      .to('.precarga__cortina--abajo', { yPercent: 100, duration: 0.65, ease: 'power3.inOut' }, 0.3)
      .add(() => resolve(0), 0.3); // el inicio arranca mientras se abre la cortina (total ≈ 0,95 s)
  });
}

/* ================================================================ 2. Inicio: entrada del titular y los textos
   El titular arranca en opacidad 1 y solo sube 8 px; bajada, botones y datos además aparecen. Todo junto, sin delay. */
function introInicio() {
  gsap.from('.inicio__titulo', { y: DESPLAZAMIENTO, ...ENTRADA });
  gsap.from('.inicio__bajada, .inicio .acciones, .datos-caja', { y: DESPLAZAMIENTO, opacity: 0, ...ENTRADA });
}

/* ================================================================ 3 y 9. Salida del inicio
   El inicio queda fijo (sticky) y Dos mundos sube encima. Mientras tanto la foto se aleja
   (escala hacia atrás) y se oscurece, y el titular y los datos suben a distinta velocidad. */
function parallaxInicio() {
  const st = { trigger: '#dos-mundos', start: 'top bottom', end: 'top top', scrub: true };
  gsap.to('[data-inicio-foto]', { scale: 0.94, ease: 'none', scrollTrigger: st });
  gsap.to('[data-inicio-sombra]', { opacity: 0.85, ease: 'none', scrollTrigger: st });
  gsap.to('[data-inicio-texto]', { yPercent: -35, opacity: 0, ease: 'none', scrollTrigger: { ...st, end: 'top 30%' } });
  gsap.to('[data-inicio-datos]', { yPercent: -60, opacity: 0, ease: 'none', scrollTrigger: { ...st, end: 'top 30%' } });
}

/* ================================================================ 10. Cambio de terreno (capa fija)
   Solo las superficies sin fondo propio (Campo y Sucursales) muestran la capa. Las que limitan con una de ellas
   llevan data-solida (fondo propio): si no, al asomar la siguiente la capa cambia de color debajo de su texto.
   El color cambia apenas la sección asoma por abajo, cuando lo único visible a través de la capa
   es esa sección: el fundido dura 0,15 s, así nunca queda un color intermedio a la vista. */
function terreno() {
  const capa = $('.terreno');
  if (!capa) return;
  const colores = { tierra: '#1C1612', quebracho: '#7A2E1D', hormigon: '#D9D5CC', cal: '#F3F0EA' };
  const capas = {};
  for (const [k, c] of Object.entries(colores)) {
    const d = document.createElement('div');
    d.style.cssText = `position:absolute;inset:0;background:${c};opacity:${k === 'tierra' ? 1 : 0}`;
    capa.append(d);
    capas[k] = d;
  }
  html.classList.add('terreno-activo');
  const reducido = matchMedia(Q.reducido).matches;
  let actual = 'tierra';
  const ir = (k) => {
    if (k === actual) return;
    actual = k;
    for (const [n, el] of Object.entries(capas)) {
      if (reducido) gsap.set(el, { opacity: n === k ? 1 : 0, overwrite: true });
      else gsap.to(el, { opacity: n === k ? 1 : 0, duration: 0.15, ease: 'none', overwrite: true });
    }
  };
  const transparentes = $$('.superficie[data-terreno]:not([data-solida]):not(.inicio)');
  transparentes.forEach((sec, i) => {
    const anterior = i ? transparentes[i - 1].dataset.terreno : 'tierra';
    ScrollTrigger.create({
      trigger: sec,
      start: 'top bottom',
      onEnter: () => ir(sec.dataset.terreno),
      onLeaveBack: () => ir(anterior),
    });
  });
}

/* ================================================================ 11. Fotos: aparecen (opacidad) y se desplazan en su marco con el scroll */
function fotosEnMarco() {
  const marcos = $$('.marco-foto, .panel');
  marcos.forEach((m) => {
    const img = $('img', m);
    if (!img) return;
    gsap.set(img, { scale: 1.2 });
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('.marco-foto').forEach((m) => {
    gsap.from(m, { opacity: 0, ...ENTRADA, scrollTrigger: { trigger: m, start: 'top bottom', once: true } });
  });
}

/* ================================================================ 12. Entradas de texto
   Arrancan apenas el elemento asoma por abajo. Los títulos quedan en opacidad 1 y solo suben 8 px. */
function entradasTexto() {
  const fuera = (el) => el.closest('.inicio, [data-campo-riel], .campo__cierre') && matchMedia(Q.escritorio).matches;
  // #titulo-empresa tiene su propia entrada (letras en 3D): no se anima dos veces
  const els = $$('.titulo-seccion, .bajada, .fila, .sede, .obra__nota, .computo, .empresa__columnas, .empresa__pie, .contacto, .campo__cierre').filter((el) => !el.closest('.inicio') && !fuera(el) && el.id !== 'titulo-empresa');
  const esTitulo = (el) => el.matches('.titulo-seccion');
  gsap.set(els, { y: DESPLAZAMIENTO, opacity: (i, el) => (esTitulo(el) ? 1 : 0) });
  ScrollTrigger.batch(els, {
    start: 'top bottom',
    once: true,
    onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, ...ENTRADA, overwrite: true }),
  });
}

/* ================================================================ 12 b. Título de Empresa: letras en 3D
   Solo #titulo-empresa (no el inicio ni otros títulos). SplitText en palabras y letras: cada palabra es un
   inline-block sin cortes (white-space: nowrap, en main.css), así los saltos de línea son los mismos que sin el efecto.
   aria: 'auto' deja aria-label en el h2 y aria-hidden en palabras y letras. El h2 tiene perspective: 600px.
   Cada letra gira desde rotateX(-90deg) sobre su base: 300 ms, power3.out, 18 ms entre letras (≈ 0,8 s en total). */
function tituloEmpresa3D() {
  const h2 = $('#titulo-empresa');
  if (!h2) return;
  const split = SplitText.create(h2, { type: 'words,chars', tag: 'span', wordsClass: 'palabra', charsClass: 'letra', aria: 'auto' });
  const anim = gsap.from(split.chars, {
    rotateX: -90, yPercent: 40, opacity: 0, transformOrigin: '50% 100%',
    duration: 0.3, ease: 'power3.out', stagger: 0.018,
    scrollTrigger: { trigger: h2, start: 'top 80%', once: true },
  });
  return () => { anim.scrollTrigger?.kill(); anim.kill(); split.revert(); };
}

/* ================================================================ 6 y 7. Campo: galería fijada (escritorio) */
function galeriaFijada() {
  const fijo = $('[data-campo-fijo]');
  const riel = $('[data-campo-riel]');
  if (!fijo || !riel) return;
  html.classList.add('galeria-fijada');
  const distancia = () => Math.max(0, riel.scrollWidth - window.innerWidth);
  const mover = gsap.to(riel, {
    x: () => -distancia(),
    ease: 'none',
    scrollTrigger: { trigger: fijo, start: 'top top', end: () => '+=' + distancia(), pin: true, scrub: 0.3, invalidateOnRefresh: true, anticipatePin: 1, refreshPriority: 1 },
  });
  // Profundidad: cada foto gira levemente y se endereza al pasar por el centro
  $$('.lamina').forEach((lam) => {
    const marco = $('.lamina__marco', lam);
    if (!marco) return; // láminas tipográficas (sin foto): no tienen marco que girar
    gsap.fromTo(marco,
      { rotateY: -16, rotateX: 3, transformPerspective: 1100 },
      { keyframes: { '0%': { rotateY: -16, rotateX: 3 }, '42%': { rotateY: 0, rotateX: 0 }, '58%': { rotateY: 0, rotateX: 0 }, '100%': { rotateY: 14, rotateX: -2 }, easeEach: 'none' },
        ease: 'none', scrollTrigger: { trigger: lam, containerAnimation: mover, start: 'left right', end: 'right left', scrub: true } });
    const img = $('img', marco);
    gsap.set(img, { scale: 1.18 });
    gsap.fromTo(img, { xPercent: -7 }, { xPercent: 7, ease: 'none', scrollTrigger: { trigger: lam, containerAnimation: mover, start: 'left right', end: 'right left', scrub: true } });
  });
  // Textos del riel: entran apenas asoman por la derecha. El título (h3) queda en opacidad 1 y solo sube.
  $$('.lamina__texto').forEach((t) => {
    gsap.from(t.children, { y: DESPLAZAMIENTO, opacity: (i, el) => (el.matches('h3') ? 1 : 0), ...ENTRADA, scrollTrigger: { trigger: t, containerAnimation: mover, start: 'left right', once: true } });
  });
  // Teclado: si el foco cae en un elemento del riel, la página baja hasta mostrarlo
  const alFoco = (e) => {
    const st = mover.scrollTrigger;
    const item = e.target.closest('.lamina, .campo__cabeza');
    if (!st || !item) return;
    const x = gsap.utils.clamp(0, distancia(), item.offsetLeft + (item.closest('.galeria') ? item.closest('.galeria').offsetLeft : 0) - innerWidth * 0.1);
    window.scrollTo({ top: st.start + x, behavior: 'auto' });
  };
  riel.addEventListener('focusin', alFoco);
  return () => { riel.removeEventListener('focusin', alFoco); html.classList.remove('galeria-fijada'); };
}

/* ================================================================ 6 y 7. Campo: carrusel con scroll-snap (celular) */
function carruselMovil() {
  const gal = $('[data-galeria]');
  if (!gal) return;
  const marcos = $$('.lamina__marco', gal);
  const actualizar = () => {
    const c = gal.getBoundingClientRect().left + gal.clientWidth / 2;
    marcos.forEach((m) => {
      const r = m.getBoundingClientRect();
      const d = gsap.utils.clamp(-1, 1, (r.left + r.width / 2 - c) / r.width);
      gsap.set(m, { rotateY: d * -18, transformPerspective: 900 });
    });
  };
  let raf = 0;
  const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(actualizar); };
  gal.addEventListener('scroll', onScroll, { passive: true });
  actualizar();
  return () => { gal.removeEventListener('scroll', onScroll); gsap.set(marcos, { clearProps: 'transform' }); };
}

/* ================================================================ 13. Cursor "Ver" */
function cursorVer() {
  const c = $('[data-cursor-el]');
  if (!c) return;
  const x = gsap.quickTo(c, 'x', { duration: 0.3, ease: 'power3.out' });
  const y = gsap.quickTo(c, 'y', { duration: 0.3, ease: 'power3.out' });
  const mover = (e) => { x(e.clientX); y(e.clientY); };
  const entrar = () => gsap.to(c, { scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out' });
  const salir = () => gsap.to(c, { scale: 0, opacity: 0, duration: 0.2, ease: 'power3.out' });
  const zonas = $$('[data-cursor]');
  window.addEventListener('pointermove', mover);
  zonas.forEach((z) => { z.addEventListener('pointerenter', entrar); z.addEventListener('pointerleave', salir); });
  return () => {
    window.removeEventListener('pointermove', mover);
    zonas.forEach((z) => { z.removeEventListener('pointerenter', entrar); z.removeEventListener('pointerleave', salir); });
  };
}

/* ================================================================ 13. Botones magnéticos suaves */
function magneticos() {
  const offs = $$('.magnetico').map((b) => {
    const x = gsap.quickTo(b, 'x', { duration: 0.3, ease: 'power3.out' });
    const y = gsap.quickTo(b, 'y', { duration: 0.3, ease: 'power3.out' });
    const mover = (e) => {
      const r = b.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * 0.22);
      y((e.clientY - (r.top + r.height / 2)) * 0.3);
    };
    const salir = () => { x(0); y(0); };
    b.addEventListener('pointermove', mover);
    b.addEventListener('pointerleave', salir);
    return () => { b.removeEventListener('pointermove', mover); b.removeEventListener('pointerleave', salir); gsap.set(b, { x: 0, y: 0 }); };
  });
  return () => offs.forEach((f) => f());
}

/* ================================================================ 8. Construcción: foto que sigue al cursor con inercia */
function fotoQueSigue() {
  const f = $('[data-flotante]');
  const img = f && $('img', f);
  const filas = $$('.fila[data-foto]');
  if (!f || !img) return;
  // Precarga de las fotos de todas las filas: el primer hover ya no parpadea
  const fuente = (fila) => `/img/${fila.dataset.foto}-480.webp`;
  const precargadas = filas.map((fila) => { const i = new Image(); i.decoding = 'async'; i.src = fuente(fila); return i; });
  const x = gsap.quickTo(f, 'x', { duration: 0.7, ease: 'power3.out' });
  const y = gsap.quickTo(f, 'y', { duration: 0.7, ease: 'power3.out' });
  const rot = gsap.quickTo(f, 'rotation', { duration: 0.8, ease: 'power3.out' });
  let ultimoX = 0;
  gsap.set(f, { xPercent: -50, yPercent: -50, x: innerWidth / 2, y: innerHeight / 2 });
  const mover = (e) => { x(e.clientX + 40); y(e.clientY); rot(gsap.utils.clamp(-8, 8, (e.clientX - ultimoX) * 0.4)); ultimoX = e.clientX; };
  const handlers = filas.map((fila) => {
    const entrar = (e) => {
      img.src = fuente(fila);
      gsap.set(f, { x: e.clientX + 40, y: e.clientY });
      gsap.to(f, { opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
    };
    const salir = () => gsap.to(f, { opacity: 0, scale: 0.85, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
    fila.addEventListener('pointerenter', entrar);
    fila.addEventListener('pointerleave', salir);
    fila.addEventListener('pointermove', mover);
    return () => { fila.removeEventListener('pointerenter', entrar); fila.removeEventListener('pointerleave', salir); fila.removeEventListener('pointermove', mover); };
  });
  return () => { handlers.forEach((h) => h()); gsap.set(f, { opacity: 0 }); precargadas.length = 0; };
}

/* ================================================================ 14. Barra de progreso */
function progreso() {
  gsap.to('.progreso span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
}

/* ================================================================ Refrescar posiciones cuando cargan imágenes o cambia el layout */
// Si la página se está desplazando (p. ej. el scroll suave de un link del menú), el refresh espera a que se detenga:
// un refresh a mitad de camino corta el scroll suave y se llega a medio camino, con las entradas sin disparar.
function refrescoAlCargar() {
  let t, tQuieto, moviendo = false, pendiente = false;
  const ahora = () => { if (moviendo) pendiente = true; else ScrollTrigger.refresh(); };
  window.addEventListener('scroll', () => {
    moviendo = true;
    clearTimeout(tQuieto);
    tQuieto = setTimeout(() => { moviendo = false; if (pendiente) { pendiente = false; ScrollTrigger.refresh(); } }, 200);
  }, { passive: true });
  const refrescar = () => { clearTimeout(t); t = setTimeout(ahora, 150); };
  $$('img').forEach((img) => { if (!img.complete) img.addEventListener('load', refrescar, { once: true }); });
  window.addEventListener('eq:layout', () => setTimeout(refrescar, 300)); // espera la transición del acordeón (300 ms)
  window.addEventListener('load', refrescar);
}
