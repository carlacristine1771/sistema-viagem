/* ══════════════════════════════════════
   VIAGEM FÁCIL — Navigation
   ══════════════════════════════════════ */

const PAGE_TITLES = {
  cadastro:   'Viajantes',
  onibus:     'Mapa de Assentos',
  hotel:      'Quartos do Hotel',
  pagamentos: 'Pagamentos',
};

function goTo(page) {
  App.currentPage = page;

  // toggle screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $('sc-' + page).classList.add('active');

  // toggle nav items
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  $('nav-' + page).classList.add('active');

  // topbar title
  setText('topbar-title', PAGE_TITLES[page]);

  // init screens on first visit
  if (page === 'onibus')     renderBus();
  if (page === 'hotel')      renderHotel();
  if (page === 'pagamentos') renderPagamentos();
}
