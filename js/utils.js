/* ══════════════════════════════════════
   VIAGEM FÁCIL — Utility Functions
   ══════════════════════════════════════ */

// ── Formatters ──────────────────────────
function pad(n)       { return n < 10 ? '0'+n : String(n); }
function fmtBRL(n)    { return 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }
function fmtBRLShort(n) { return 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 0 }); }
function today()      { return new Date().toLocaleDateString('pt-BR'); }
function nowTime()    { return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
function initials(name) { return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join(''); }

// ── Privacy masks ────────────────────────
function maskCPFDisplay(cpf) {
  if (!cpf) return '—';
  // 123.456.789-00 → 123.***.***-00
  return cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/, '$1.***.***-$4');
}
function maskTelDisplay(tel) {
  if (!tel) return '—';
  // (61) 99999-1111 → (61) 9****-1111
  return tel.replace(/(\(\d{2}\)) (\d)(\d{3,4})-(\d{4})/, '$1 $2****-$4');
}

// ── Input masks ──────────────────────────
function maskCPF(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
  el.value = v;
}
function maskTel(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 6)      v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  el.value = v;
}

// ── Avatar colors ────────────────────────
const AV_COLORS = ['av-blue', 'av-teal', 'av-orange', 'av-green', 'av-purple', 'av-pink'];
function avatarColor(name) { return AV_COLORS[name.charCodeAt(0) % AV_COLORS.length]; }

// ── DOM helpers ──────────────────────────
function $(id) { return document.getElementById(id); }
function setText(id, val) { const el = $(id); if (el) el.textContent = val; }
function setHTML(id, html) { const el = $(id); if (el) el.innerHTML = html; }

// ── Toast ────────────────────────────────
let _toastTimer;
function showToast(icon, title, msg = '', color = '#0057FF') {
  const el    = $('toast');
  const bar   = $('toast-progress');
  $('toast-icon').textContent  = icon;
  $('toast-title').textContent = title;
  $('toast-msg').textContent   = msg;
  bar.style.background = color;
  bar.style.animation  = 'none';
  void bar.offsetWidth;
  bar.style.animation  = 'tprog 3s linear forwards';
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3400);
}
function hideToast() { $('toast').classList.remove('show'); }

// ── Modal helpers ────────────────────────
function openModal(id) { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }

// Close modal when clicking overlay
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});
