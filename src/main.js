import './styles/main.css';

import { iniciarMenu } from './js/menu.js';
import { iniciarFilas } from './js/filas.js';
import { iniciarFab, iniciarCabecera, iniciarInicioFijo } from './js/chrome.js';
import { iniciarMovimiento } from './js/movimiento.js';

const anio = document.querySelector('[data-anio]');
if (anio) anio.textContent = String(new Date().getFullYear());

iniciarMenu();
iniciarFilas();
iniciarFab();
iniciarCabecera();
iniciarInicioFijo();

// Movimiento (el 3D se carga aparte, recién cuando hace falta).
// Si algo falla, el contenido ya está completo y visible.
iniciarMovimiento().catch((e) => {
  console.error(e);
  document.documentElement.classList.remove('con-precarga');
});
