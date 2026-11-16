// Genera todas las imágenes del sitio a partir de las fotos de src/assets/img/.
// Para cambiar una foto: reemplazá el archivo en src/assets/img/ (mismo nombre)
// y corré `npm run imagenes` (también corre solo antes de `npm run build`).
//
// Qué hace con cada foto:
//  - Tratamiento de color común (sombras cálidas, saturación contenida, grano estático sutil)
//  - AVIF + WebP + JPG en 3 anchos
//  - Recorte vertical 4:5 para celular en las principales
//  - Color dominante -> src/styles/colores-fotos.css (fondo mientras carga)
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = path.resolve('src/assets/img');
const OUT = path.resolve('public/img');

// extract: recorte en píxeles de la foto original (opcional)
// ratio: proporción final [ancho, alto] (opcional, si no se respeta la original)
// movil: genera también una versión 4:5; focoX = 0..1 dónde centrar el recorte
const FOTOS = [
  { src: 'inicio-campo-amanecer.jpg', name: 'inicio', ratio: [16, 9], anchos: [800, 1280, 1920], movil: { focoX: 0.42 } },
  { src: 'dos-mundos-campo.jpg', name: 'mundo-campo', anchos: [640, 960, 1440], movil: { focoX: 0.5 } },
  { src: 'dos-mundos-obra.jpg', name: 'mundo-obra', anchos: [640, 960, 1440], movil: { focoX: 0.62 } },
  { src: 'campo-manga.jpg', name: 'manga', anchos: [640, 960, 1440], movil: { focoX: 0.45 } },
  { src: 'campo-taller.jpg', name: 'taller', anchos: [640, 960, 1440], movil: { focoX: 0.6 } },
  { src: 'campo-postes.jpg', name: 'postes', anchos: [640, 960, 1440], movil: { focoX: 0.55 } },
  // Empresa: nunca más grande que su resolución real (sinAgrandar). Sin `movil`: en celular va apaisada
  // (el recorte 4:5 la arruinaría); el encuadre se resuelve con object-position en main.css (bloque EMPRESA).
  { src: 'empresa-deposito.jpg', name: 'deposito', anchos: [640, 960, 1376], sinAgrandar: true }, // original 1376 × 768
  // Construcción: foto de cada fila (data-foto="mat-xxx" en su <li class="fila">). El JS usa la versión de 480 en WebP:
  // sigue al cursor en escritorio y aparece dentro del panel abierto en pantallas táctiles.
  { src: 'empresa-cemento.jpg', name: 'mat-cementos', ratio: [4, 5], anchos: [320, 480, 640] }, // original 896 × 1200
  // Hierros y Mampostería: Unsplash (licencia libre para uso comercial). Pisos: foto provista. Las tres miden 480 × 600.
  { src: 'construccion-hierros.webp', name: 'mat-hierros', ratio: [4, 5], anchos: [320, 480], sinAgrandar: true },
  { src: 'construccion-mamposteria.webp', name: 'mat-mamposteria', ratio: [4, 5], anchos: [320, 480], sinAgrandar: true },
  { src: 'construccion-pisos.png', name: 'mat-pisos', ratio: [4, 5], anchos: [320, 480], sinAgrandar: true },
];

// Tratamiento común para que fotos de distinto origen (amanecer dorado, mediodía saturado) combinen:
//  1. se normaliza la luminancia media de cada foto a un mismo valor
//  2. saturación contenida y sombras cálidas (mismo ajuste para todas)
//  3. negros apenas levantados (acabado mate) + grano estático (en exportar)
const LUMINANCIA = 0.40;
async function tratar(img) {
  const buf = await img.toBuffer();
  const { channels } = await sharp(buf).greyscale().stats();
  const media = channels[0].mean / 255;
  const ganancia = Math.min(1.3, Math.max(0.78, LUMINANCIA / media));
  return sharp(buf)
    .linear(ganancia, 0)
    .modulate({ saturation: 0.6 })
    .recomb([
      [1.06, 0.04, 0.0],
      [0.02, 1.0, 0.0],
      [0.0, 0.05, 0.84],
    ])
    .linear(0.94, 9) // mate: negros a ~9/255
    .sharpen({ sigma: 0.6 });
}

async function grano(w, h) {
  // Ruido gaussiano estático (misma semilla visual en todas) superpuesto con baja opacidad
  const ruido = await sharp({
    create: { width: w, height: h, channels: 3, background: '#808080', noise: { type: 'gaussian', mean: 128, sigma: 26 } },
  })
    .greyscale()
    .png()
    .toBuffer();
  return sharp(ruido).ensureAlpha(0.09).png().toBuffer();
}

async function exportar(buffer, w, h, base) {
  const g = await grano(w, h);
  const conGrano = await sharp(buffer).composite([{ input: g, blend: 'overlay' }]).toBuffer();
  const img = sharp(conGrano);
  await Promise.all([
    img.clone().avif({ quality: 52, effort: 5 }).toFile(`${base}.avif`),
    img.clone().webp({ quality: 74 }).toFile(`${base}.webp`),
    img.clone().jpeg({ quality: 78, progressive: true, mozjpeg: true }).toFile(`${base}.jpg`),
  ]);
}

const hex = ({ r, g, b }) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

await fs.rm(OUT, { recursive: true, force: true }); // se regenera todo: no quedan imágenes viejas
await fs.mkdir(OUT, { recursive: true });
const colores = [];
const manifiesto = {};

for (const f of FOTOS) {
  let base = sharp(path.join(SRC, f.src));
  if (f.extract) base = base.extract(f.extract);
  const fuente = await (await tratar(base)).toBuffer();
  const meta = await sharp(fuente).metadata();
  const [rw, rh] = f.ratio ?? [meta.width, meta.height];
  // Color promedio (más confiable que el histograma para el fondo de carga)
  const px = await sharp(fuente).resize(1, 1, { fit: 'fill' }).raw().toBuffer();
  colores.push(`[data-ph="${f.name}"]{--ph:${hex({ r: px[0], g: px[1], b: px[2] })}}`);
  manifiesto[f.name] = { ratio: [rw, rh], anchos: f.anchos, movil: !!f.movil };

  for (const w of f.anchos) {
    const h = Math.round((w * rh) / rw);
    const buf = await sharp(fuente).resize(w, h, { fit: 'cover', kernel: 'lanczos3', withoutEnlargement: !!f.sinAgrandar }).sharpen({ sigma: 0.8 }).toBuffer();
    const real = await sharp(buf).metadata();
    await exportar(buf, real.width, real.height, path.join(OUT, `${f.name}-${w}`));
  }

  if (f.movil) {
    // Recorte 4:5 centrado en focoX
    const cw = Math.round((meta.height * 4) / 5);
    const left = Math.max(0, Math.min(meta.width - cw, Math.round(meta.width * f.movil.focoX - cw / 2)));
    const recorte = await sharp(fuente).extract({ left, top: 0, width: cw, height: meta.height }).toBuffer();
    for (const w of [480, 720, 960]) {
      const h = Math.round((w * 5) / 4);
      const buf = await sharp(recorte).resize(w, h, { fit: 'cover', kernel: 'lanczos3' }).sharpen({ sigma: 0.8 }).toBuffer();
      await exportar(buf, w, h, path.join(OUT, `${f.name}-m-${w}`));
    }
  }
  console.log('ok', f.name);
}

// Imagen para compartir (Open Graph) 1200x630
const og = await (await tratar(sharp(path.join(SRC, 'inicio-campo-amanecer.jpg')))).resize(1200, 630, { fit: 'cover', kernel: 'lanczos3' }).jpeg({ quality: 80 }).toBuffer();
await fs.writeFile(path.resolve('public/og-el-quebracho.jpg'), og);

// Ícono: recorte del árbol del logo
await sharp(path.join(SRC, 'logo.jpg')).extract({ left: 50, top: 168, width: 120, height: 160 }).resize(180, 180, { fit: 'contain', background: '#F3F0EA' }).png().toFile(path.resolve('public/apple-touch-icon.png'));
await sharp(path.join(SRC, 'logo.jpg')).extract({ left: 50, top: 168, width: 120, height: 160 }).resize(48, 48, { fit: 'contain', background: '#F3F0EA' }).png().toFile(path.resolve('public/favicon.png'));

await fs.writeFile(path.resolve('src/img-manifiesto.json'), JSON.stringify(manifiesto, null, 2));
await fs.writeFile(path.resolve('src/styles/colores-fotos.css'), '/* Generado por scripts/imagenes.mjs: color dominante de cada foto */\n' + colores.join('\n') + '\n');
console.log('listo');
