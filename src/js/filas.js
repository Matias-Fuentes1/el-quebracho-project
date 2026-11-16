// Filas de Construcción: acordeón accesible (aria-expanded). Sin JS quedan todas abiertas.
// Con mouse arranca abierta la primera; en pantallas táctiles (hover: none) arrancan todas cerradas.
const tactil = () => matchMedia('(hover: none)').matches;

export function iniciarFilas() {
  const botones = [...document.querySelectorAll('.fila__boton')];
  botones.forEach((b, i) => {
    b.setAttribute('aria-expanded', i === 0 && !tactil() ? 'true' : 'false');
    b.addEventListener('click', () => {
      const abierto = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', String(!abierto));
      window.dispatchEvent(new Event('eq:layout'));
    });
  });
  cargarFotosAntes();
}

// Las fotos de los paneles (<foto>, solo visibles en táctil) son lazy y viven dentro de filas cerradas
// (alto 0 + overflow hidden), así que el navegador no las pediría hasta abrir cada fila. En táctil se piden
// cuando la lista se acerca a la pantalla: al abrir la fila la foto ya está y el fundido no muestra el fondo vacío.
function cargarFotosAntes() {
  const lista = document.querySelector('[data-filas]');
  if (!lista || !tactil() || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entradas) => {
    if (!entradas.some((e) => e.isIntersecting)) return;
    lista.querySelectorAll('.fila__foto img').forEach((img) => { img.loading = 'eager'; });
    io.disconnect();
  }, { rootMargin: '600px 0px' });
  io.observe(lista);
}
