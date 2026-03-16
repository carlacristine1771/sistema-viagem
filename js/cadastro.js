/* ══════════════════════════════════════
   VIAGEM FÁCIL — Screen 1: Cadastro
   ══════════════════════════════════════ */

// ── Add traveler ─────────────────────────
function adicionarViajante() {
  const nome  = $('f-nome').value.trim();
  const cpf   = $('f-cpf').value.trim();
  const tel   = $('f-tel').value.trim();
  const valor = parseFloat($('f-valor').value) || 0;
  const nasc  = $('f-nasc').value;
  const gen   = $('f-gen').value;
  const obs   = $('f-obs').value.trim();
  const email = $('f-email').value.trim();

  if (!nome)      return showToast('⚠️', 'Campo obrigatório', 'Informe o nome completo.', '#F6A623');
  if (cpf.length < 14) return showToast('⚠️', 'CPF inválido', 'Formato esperado: 000.000.000-00', '#F6A623');
  if (tel.length < 14) return showToast('⚠️', 'Telefone inválido', 'Formato esperado: (00) 00000-0000', '#F6A623');
  if (valor <= 0)  return showToast('⚠️', 'Valor inválido', 'Informe o valor da viagem (maior que zero).', '#F6A623');
  if (App.viajantes.find(v => v.cpf === cpf))
    return showToast('❌', 'CPF já cadastrado', 'Este CPF já está registrado no sistema.', '#E53E3E');

  const id = Date.now() + Math.random();
  App.viajantes.push({ id, nome, cpf, tel, valor, nasc, gen, obs, email, status: 'Pendente', assento: null, quarto: null, createdAt: today() });
  App.pagamentos[id] = { pago: 0, hist: [] };

  closeModal('modal-novo');
  limparFormCadastro();
  renderCadastro();
  updStats();
  syncSelects();
  showToast('✅', 'Viajante cadastrado!', nome + ' foi adicionado com sucesso.', '#00B37E');
}

function limparFormCadastro() {
  ['f-nome','f-cpf','f-tel','f-valor','f-nasc','f-obs','f-email'].forEach(id => {
    const el = $(id); if (el) el.value = '';
  });
  $('f-gen').value = '';
}

// ── Confirm traveler ─────────────────────
function confirmarV(id) {
  const v = App.getViajante(id);
  if (!v) return;
  v.status = 'Confirmado';
  renderCadastro();
  updStats();
  showToast('✅', 'Confirmado!', v.nome + ' está confirmado na viagem.', '#00B37E');
}

// ── Remove traveler ──────────────────────
function removerV(id) {
  const v = App.getViajante(id);
  if (!v) return;
  if (!confirm('Remover ' + v.nome + ' permanentemente? Esta ação não pode ser desfeita.')) return;
  // Free up seat and room
  if (v.assento) delete App.assentos[v.assento];
  if (v.quarto)  App.quartos[v.quarto] = (App.quartos[v.quarto] || []).filter(i => i !== id);
  App.viajantes  = App.viajantes.filter(x => x.id !== id);
  delete App.pagamentos[id];
  renderCadastro();
  updStats();
  syncSelects();
  showToast('🗑️', 'Removido', v.nome + ' foi removido do sistema.', '#E53E3E');
}

// ── Render table ─────────────────────────
function renderCadastro(list) {
  if (!list) list = [...App.viajantes];
  const tb = $('tbody-cad');
  setText('cad-count-label', list.length + ' viajante' + (list.length !== 1 ? 's' : '') + ' cadastrado' + (list.length !== 1 ? 's' : ''));

  if (!list.length) {
    tb.innerHTML = `
      <tr><td colspan="8">
        <div class="empty-state">
          <div class="empty-icon">👤</div>
          <div class="empty-title">Nenhum viajante encontrado</div>
          <div class="empty-sub">Tente ajustar os filtros ou adicione um novo viajante</div>
        </div>
      </td></tr>`;
    return;
  }

  tb.innerHTML = list.map(v => {
    const pg     = App.getPagamento(v.id);
    const pct    = v.valor ? Math.round(pg.pago / v.valor * 100) : 0;
    const pgCls  = pct >= 100 ? 'b-green' : pct > 0 ? 'b-yellow' : 'b-gray';
    const stCls  = v.status === 'Confirmado' ? 'b-green' : 'b-yellow';
    return `
      <tr>
        <td>
          <div class="av-wrap">
            <div class="av ${avatarColor(v.nome)}">${initials(v.nome)}</div>
            <div>
              <div class="td-name">${v.nome}${v.fromSelfReg ? ' <span style="background:#EEF3FF;color:#3B7BFF;font-size:10px;font-weight:700;padding:1px 7px;border-radius:20px;vertical-align:middle">✨ Auto-cadastro</span>' : ''}</div>
              <div class="td-sub">${v.email || (v.gen || '—')}${v.nasc ? ' · ' + new Date(v.nasc + 'T00:00:00').toLocaleDateString('pt-BR') : ''}${v.fromSelfReg && !v.valor ? ' · <span style="color:#F59E0B;font-weight:600">⚠️ Definir valor</span>' : ''}</div>
            </div>
          </div>
        </td>
        <td><span class="td-masked" title="Dado protegido">${maskCPFDisplay(v.cpf)}</span></td>
        <td><span class="td-masked" title="Dado protegido">${maskTelDisplay(v.tel)}</span></td>
        <td>${v.assento ? `<span class="badge b-blue">Assento ${pad(v.assento)}</span>` : `<span class="badge b-gray">Não alocado</span>`}</td>
        <td>${v.quarto  ? `<span class="badge b-teal">Quarto ${pad(v.quarto)}</span>` : `<span class="badge b-gray">Não alocado</span>`}</td>
        <td>
          <div style="min-width:100px">
            <div class="flex items-center gap-6 mb-12" style="margin-bottom:5px">
              <span class="badge ${pgCls}">${pct}%</span>
              <span class="text-xs text-muted">${fmtBRL(pg.pago)}</span>
            </div>
            <div class="progress-wrap" style="height:5px">
              <div class="progress-fill" style="width:${pct}%;background:${pct>=100?'var(--green)':pct>0?'var(--yellow)':'var(--gray-200)'}"></div>
            </div>
          </div>
        </td>
        <td><span class="badge ${stCls}">${v.status}</span></td>
        <td style="text-align:right">
          <div class="flex gap-6 items-center" style="justify-content:flex-end">
            ${v.status !== 'Confirmado' ? `<button class="btn btn-success btn-sm" onclick="confirmarV(${v.id})">✓ Confirmar</button>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="quickPay(${v.id})" title="Registrar pagamento">💳 Pagar</button>
            <button class="btn btn-danger btn-sm btn-icon" onclick="removerV(${v.id})" title="Remover viajante">🗑</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ── Filters ──────────────────────────────
function filterCad() {
  const q  = $('search-cad').value.toLowerCase();
  const st = $('filter-status').value;
  renderCadastro(App.viajantes.filter(v =>
    (v.nome.toLowerCase().includes(q)) &&
    (!st || v.status === st)
  ));
}

function globalSearch() {
  const q = $('global-search').value.toLowerCase();
  if (!q) { renderCadastro(); return; }
  goTo('cadastro');
  renderCadastro(App.viajantes.filter(v => v.nome.toLowerCase().includes(q)));
}

// ── Stats ─────────────────────────────────
function updStats() {
  const total = App.viajantes.length;
  const conf  = App.viajantes.filter(v => v.status === 'Confirmado').length;
  const pend  = App.viajantes.filter(v => v.status === 'Pendente').length;
  const occ   = App.assentosOcupados();
  const confPct = total ? Math.round(conf / total * 100) : 0;
  const vagas = 44 - occ;

  setText('st-total', total);
  setText('st-conf',  conf);
  setText('st-pend',  pend);
  setText('st-vagas', vagas);
  setText('st-vagas-badge',  vagas + ' vagas livres');
  setText('st-conf-badge',   confPct + '% confirmados');
  setText('badge-cadastro',  total);

  // Sidebar trip info
  const totPago = App.totalPago();
  const totMeta = App.totalMeta();
  const pgPct   = totMeta ? Math.round(totPago / totMeta * 100) : 0;
  setText('trip-conf', conf);
  setText('trip-pago-pct', pgPct + '%');
}

// ── Sync selects ──────────────────────────
function syncSelects() {
  const opts = '<option value="">Selecione um viajante...</option>' +
    App.viajantes.map(v => `<option value="${v.id}">${v.nome}</option>`).join('');
  ['sel-viajante-bus', 'sel-viajante-hotel'].forEach(id => {
    const el = $(id); if (el) el.innerHTML = opts;
  });
}
