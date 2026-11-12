# Fotos reales a pedir

Hoy el sitio usa 7 fotos y **ninguna se repite**. Seis son de muestra (generadas con IA) y la del depósito
es real pero chica (512 px de ancho). Todas reciben el mismo tratamiento de color en `scripts/imagenes.mjs`
(luminancia igualada, saturación contenida, sombras cálidas, negros mate y grano estático): no hace falta editarlas.

**Para todas:** original sin filtros, JPG de máxima calidad, horizonte derecho, luz natural (ideal: primera o
última hora del día, para que combinen entre sí).

## Fotos que reemplazan a las actuales

| Lugar en la página | Archivo a reemplazar (`src/assets/img/`) | Qué tiene que mostrar | Recorte | Mínimo |
|---|---|---|---|---|
| Inicio, a pantalla completa | `inicio-campo-amanecer.jpg` | Campo con corral o manga propia, cielo con luz baja | Horizontal 16:9 con aire abajo a la izquierda para el título; también se usa recortada a 4:5 en celular | 2400 × 1350 px |
| Dos mundos, panel El Campo | `dos-mundos-campo.jpg` | Hacienda trabajando en una instalación hecha por El Quebracho | Horizontal; el motivo en el tercio izquierdo (el panel muestra el 62 % izquierdo) | 2400 × 1350 px |
| Dos mundos, panel Construcción | `dos-mundos-obra.jpg` | Obra en Olavarría con materiales de la casa (hierro, ladrillo) | Horizontal; el motivo en el tercio derecho | 2400 × 1350 px |
| El Campo, galería: mangas de manejo | `campo-manga.jpg` | Manga terminada, de frente | 4:3 horizontal y 4:5 vertical | 2000 × 1500 px |
| El Campo, galería: soldadura | `campo-taller.jpg` | Taller propio con soldadura, manos trabajando | 4:3 y 4:5 | 2000 × 1500 px |
| El Campo, galería: quebracho colorado | `campo-postes.jpg` | Pila de postes en el depósito | 4:3 y 4:5 | 2000 × 1500 px |
| Empresa | `empresa-deposito.jpg` | **La foto real del depósito con el arco de "El Quebracho"**, en su resolución original | Horizontal | **2400 px de ancho**. Hoy se muestra a 512 px como máximo para no pixelarla; con la nueva se puede agrandar (subir `anchos` en el script) |

## Lugares que hoy no tienen foto (para no repetir)

| Lugar | Qué foto falta | Recorte | Mínimo |
|---|---|---|---|
| El Campo, lámina "Mangas de Hacienda y Cepos" | Detalle de cepo, puerta de inspección o andén | 4:3 y 4:5 | 2000 × 1500 px |
| El Campo, lámina "Volteadores de Terneros" | Volteador terminado o en uso | 4:3 y 4:5 | 2000 × 1500 px |
| Construcción, fila Hierros (foto que sigue al cursor) | Barras y mallas apiladas | Vertical 4:5 | 1200 × 1500 px |
| Construcción, fila Cementos | Bolsas de cemento / cal estibadas | Vertical 4:5 | 1200 × 1500 px |
| Construcción, fila Mampostería | Pallets de ladrillos | Vertical 4:5 | 1200 × 1500 px |
| Construcción, fila Pisos y exteriores | Losetas atérmicas y bordes ballena | Vertical 4:5 | 1200 × 1500 px |

Cuando lleguen: agregarlas en `scripts/imagenes.mjs` (hay un ejemplo comentado) y, para las filas de
Construcción, poner `data-foto="mat-hierros"` (etc.) en el `<li class="fila">` correspondiente.

## Otros pedidos

- **Logo en SVG** (vectorial). Hoy la cabecera usa un ícono redibujado y el nombre en texto.
- Frente y mostrador de cada sucursal (Circunvalación y Pellegrini), horizontales, 2000 px: para usar a futuro en Sucursales.
