/* ══════════════════════════════════════
   VIAGEM FÁCIL — Auth Guard & State Sync
   ══════════════════════════════════════ */

// ── AUTH GUARD ───────────────────────────
(function checkAuth() {
  const role = sessionStorage.getItem('vf_role');
  // If no session, redirect to login
  if (!role) {
    window.location.href = 'login.html';
    return;
  }
  // Traveler trying to access admin area
  if (role === 'viajante' && window.location.pathname.includes('index.html')) {
    window.location.href = 'viajante.html';
    return;
  }
})();

// ── SAVE APP STATE TO SESSION STORAGE ────
// Called after every mutation so viajante.html can read fresh data
function saveAppState() {
  try {
    const snapshot = {
      viajantes:  App.viajantes,
      pagamentos: App.pagamentos,
      assentos:   App.assentos,
      quartos:    App.quartos,
      hotelCfg:   App.hotelCfg,
    };
    sessionStorage.setItem('vf_app_data', JSON.stringify(snapshot));
  } catch(e) {
    // sessionStorage full or unavailable — silently ignore
  }
}

// ── LOGOUT ───────────────────────────────
function logout() {
  if (!confirm('Deseja sair do sistema?')) return;
  sessionStorage.clear();
  window.location.href = 'login.html';
}

// ── ADMIN USER DISPLAY ────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const user = sessionStorage.getItem('vf_user') || 'Admin';
  const el   = document.getElementById('topbar-user-name');
  if (el) el.textContent = user;
});

// ── Load pending registrations from login page ─────
// When travelers register via login.html, they're stored in localStorage.
// ADM app picks them up here on load and merges into App state.
function loadPendingRegistrations() {
  try {
    const raw = localStorage.getItem('vf_pending_reg');
    if (!raw) return;
    const pending = JSON.parse(raw);
    let newCount = 0;

    pending.forEach(acc => {
      // Skip if CPF already in system
      if (App.viajantes.find(v => v.cpf.replace(/\D/g,'') === acc.cpf.replace(/\D/g,''))) return;
      const id = acc.id || Date.now() + Math.random();
      App.viajantes.push({
        id, nome: acc.nome, cpf: acc.cpf, tel: acc.tel,
        valor: 0, gen: acc.gen || '', nasc: acc.nasc || '',
        email: acc.email || '', obs: acc.obs || '',
        status: 'Pendente', assento: null, quarto: null,
        createdAt: acc.createdAt || new Date().toLocaleDateString('pt-BR'),
        fromSelfReg: true, // flag: came from self-registration
      });
      App.pagamentos[id] = { pago: 0, hist: [] };
      newCount++;
    });

    if (newCount > 0) {
      // Clear the queue after importing
      localStorage.removeItem('vf_pending_reg');
      renderCadastro();
      updStats();
      syncSelects();
      saveAppState();
      // Show notification
      setTimeout(() => {
        showToast('🎉', newCount + ' novo' + (newCount > 1 ? 's' : '') + ' cadastro' + (newCount > 1 ? 's' : '') + '!',
          'Viajante' + (newCount > 1 ? 's' : '') + ' registrado' + (newCount > 1 ? 's' : '') + ' pelo portal — defina o valor da viagem.', '#00B37E');
      }, 1200);
    }
  } catch(e) {}
}

// Run after page loads
window.addEventListener('load', () => {
  setTimeout(loadPendingRegistrations, 800); // slight delay so App is fully init'd
});
