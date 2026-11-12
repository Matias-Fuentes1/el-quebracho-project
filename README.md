# El Quebracho — sitio web

Vite + Tailwind CSS v4 + GSAP (ScrollTrigger, SplitText).

## Correrlo

```bash
npm install
npm run dev
```

Abre en http://localhost:5173

## Construirlo para Netlify

```bash
npm run build
```

Genera la carpeta `dist/`, lista para arrastrar a Netlify (Sites → Add new site → Deploy manually).
`npm run build` regenera primero todas las imágenes (tarda menos de un minuto).

## Reemplazar una foto

1. Poné la foto nueva en `src/assets/img/` **con el mismo nombre** que la que reemplaza
   (por ejemplo `campo-manga.jpg`). Ideal: 2400 px de ancho o más.
2. Corré `npm run imagenes` (o directamente `npm run build`).

El script (`scripts/imagenes.mjs`) aplica el mismo tratamiento de color a todas, genera AVIF, WebP y JPG en
3 anchos, el recorte vertical 4:5 para celular y el color de fondo que se ve mientras carga.
Si el recorte del celular no queda bien centrado, ajustá `focoX` (0 = izquierda, 1 = derecha) de esa foto en el script.

Ninguna foto se repite en la página. Las filas de Construcción y dos láminas de El Campo no tienen foto
hasta que lleguen las reales (ver `FOTOS-PENDIENTES.md`, que explica cómo activarlas).

Fotos que faltan: ver `FOTOS-PENDIENTES.md`.

## Scripts de control

- `node scripts/capturas.mjs http://localhost:5173/ capturas/x --secciones`: capturas por sección en 390 y 1440 px
- `node scripts/verificar.mjs`: comprueba los efectos (precarga, salida del inicio, paneles, galería, filas, botón flotante, modo reducido)
- `node scripts/revision.mjs revision/x`: capturas por sección en 390/768/1024/1440, con y sin movimiento reducido, videos del scroll y altura de la página

## Contenido a validar

Los textos comerciales dudosos están marcados en `index.html` con `<!-- VALIDAR: ... -->`.
