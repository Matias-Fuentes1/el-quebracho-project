// Cabecera (sólida después del inicio, se esconde al bajar) y botón flotante de WhatsApp en celular.
function alScroll(fn) {
  let ultimo = window.scrollY;
  let pendiente = false;
  window.addEventListener('scroll', () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      fn(y, y - ultimo);
      ultimo = y;
      pendiente = false;
    });
  }, { passive: true });
}

export function iniciarFab() {
  const fab = document.querySelector('[data-fab]');
  if (!fab) return;
  alScroll((y, delta) => {
    if (y < 200) return fab.classList.remove('es-oculto');
    if (delta > 4) fab.classList.add('es-oculto');
    else if (delta < -4) fab.classList.remove('es-oculto');
  });
}

export function iniciarCabecera() {
  const cab = document.querySelector('[data-cabecera]');
  if (!cab) return;
  const umbral = () => window.innerHeight * 0.6;
  alScroll((y, delta) => {
    cab.classList.toggle('es-solida', y > umbral());
    if (y < umbral()) return cab.classList.remove('es-oculta');
    if (delta > 6) cab.classList.add('es-oculta');
    else if (delta < -6) cab.classList.remove('es-oculta');
  });
  // Si algo dentro de la cabecera recibe foco, se muestra
  cab.addEventListener('focusin', () => cab.classList.remove('es-oculta'));
}

// El inicio queda fijo (sticky) para que Dos mundos suba encima. Si es más alto que la pantalla
// (celulares bajos), se fija recién cuando se ve su borde inferior: así ningún dato queda tapado.
export function iniciarInicioFijo() {
  const inicio = document.querySelector('.inicio');
  if (!inicio) return;
  const ajustar = () => { inicio.style.top = Math.min(0, window.innerHeight - inicio.offsetHeight) + 'px'; };
  new ResizeObserver(ajustar).observe(inicio);
  window.addEventListener('resize', ajustar);
  ajustar();
}
