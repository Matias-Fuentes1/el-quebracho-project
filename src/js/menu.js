// Menú de celular: diálogo con foco atrapado, Escape para cerrar y foco devuelto al botón.
export function iniciarMenu() {
  const menu = document.getElementById('menu-movil');
  const abrir = document.querySelector('[data-menu-abrir]');
  const cerrar = menu?.querySelector('[data-menu-cerrar]');
  if (!menu || !abrir || !cerrar) return;

  const enfocables = () => [...menu.querySelectorAll('a[href], button:not([disabled])')];

  function abrirMenu() {
    menu.hidden = false;
    abrir.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    document.querySelector('main')?.setAttribute('inert', '');
    cerrar.focus();
  }
  function cerrarMenu(devolverFoco = true) {
    menu.hidden = true;
    abrir.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    document.querySelector('main')?.removeAttribute('inert');
    if (devolverFoco) abrir.focus();
  }

  abrir.addEventListener('click', abrirMenu);
  cerrar.addEventListener('click', () => cerrarMenu());
  menu.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', () => cerrarMenu(false)));
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return cerrarMenu();
    if (e.key !== 'Tab') return;
    const f = enfocables();
    const primero = f[0];
    const ultimo = f[f.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  });
  matchMedia('(min-width: 768px)').addEventListener('change', (e) => { if (e.matches && !menu.hidden) cerrarMenu(false); });
}
