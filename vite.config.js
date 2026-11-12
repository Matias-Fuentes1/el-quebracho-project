import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';

// Convierte <foto nombre="inicio" alt="..." sizes="100vw" clase="..." prioridad /> en un
// <picture> completo (AVIF + WebP + JPG, 3 anchos, recorte 4:5 en celular) usando
// src/img-manifiesto.json, que genera `npm run imagenes`.
function fotos() {
  const leer = () => JSON.parse(fs.readFileSync('src/img-manifiesto.json', 'utf8'));
  const attrs = (s) => Object.fromEntries([...s.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map((m) => [m[1], m[2] ?? true]));
  const set = (n, anchos, ext) => anchos.map((w) => `/img/${n}-${w}.${ext} ${w}w`).join(', ');

  return {
    name: 'fotos',
    transformIndexHtml(html) {
      const man = leer();
      return html.replace(/<foto\s([^>]*?)\/>/g, (_, a) => {
        const o = attrs(a);
        const m = man[o.nombre];
        if (!m) throw new Error('Foto desconocida: ' + o.nombre);
        const sizes = o.sizes || '100vw';
        const [rw, rh] = m.ratio;
        const w = m.anchos[m.anchos.length - 1];
        const h = Math.round((w * rh) / rw);
        const mid = m.anchos[1];
        const movil = m.movil && !o['sin-movil'];
        const mAnchos = [480, 720, 960];
        const fuentesMovil = movil
          ? `<source media="(max-width: 767px)" type="image/avif" sizes="${o['sizes-movil'] || '100vw'}" srcset="${set(o.nombre + '-m', mAnchos, 'avif')}">` +
            `<source media="(max-width: 767px)" type="image/webp" sizes="${o['sizes-movil'] || '100vw'}" srcset="${set(o.nombre + '-m', mAnchos, 'webp')}">`
          : '';
        const carga = o.prioridad ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
        return (
          `<picture class="foto ${o.clase || ''}" data-ph="${o.nombre}">` +
          fuentesMovil +
          `<source type="image/avif" sizes="${sizes}" srcset="${set(o.nombre, m.anchos, 'avif')}">` +
          `<source type="image/webp" sizes="${sizes}" srcset="${set(o.nombre, m.anchos, 'webp')}">` +
          `<img src="/img/${o.nombre}-${mid}.jpg" srcset="${set(o.nombre, m.anchos, 'jpg')}" sizes="${sizes}" width="${w}" height="${h}" alt="${o.alt ?? ''}" ${carga} decoding="async">` +
          `</picture>`
        );
      });
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), fotos()],
  build: { target: 'es2020', assetsInlineLimit: 0 },
});
