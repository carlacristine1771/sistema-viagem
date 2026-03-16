/* ══════════════════════════════════════
   VIAGEM FÁCIL — Screen 2: Ônibus
   ══════════════════════════════════════ */

function renderBus() {
  const grid = $('seat-map');
  if (!grid) return;
  grid.innerHTML = '';

  // Row 0: driver cell + 4 gaps
  const drv = document.createElement('div');
  drv.className = 'seat driver';
  drv.innerHTML = '🚌';
  grid.appendChild(drv);
  for (let i = 0; i < 4; i++) {
    const g = document.createElement('div');
    g.className = 'seat gap';
    grid.appendChild(g);
  }

  // Seats 1-44: 4 per row with aisle after col 2
  for (let i = 1; i <= 44; i++) {
    if ((i - 1) % 4 === 2) {
      const g = document.createElement('div');
      g.className = 'seat gap';
      grid.appendChild(g);
    }
    const takenBy = App.assentos[i];
    let cls = takenBy ? 'taken' : (App.selAssento === i ? 'selected' : 'free');
    const d = document.createElement('div');
    d.className = 'seat ' + cls;
    d.innerHTML = `<span class="sn">${pad(i)}</span>`;
    if (takenBy) {
      const vv = App.getViajante(takenBy);
      d.title = vv ? '✈ ' + vv.nome : 'Ocupado';
    } else {
      d.onclick = () => pickSeat(i);
    }
    grid.appendChild(d);
  }

  updBusStats();
  renderBusLog();
}

function pickSeat(n) {
  App.selAssento = n;
  const inp = $('input-assento-sel');
  if (inp) inp.value = 'Assento ' + pad(n);
  const badge = $('seat-sel-badge');
  if (badge) { badge.className = 'badge b-blue'; badge.textContent = 'Assento ' + pad(n) + ' selecionado'; }
  renderBus();
}

function confirmarAssento() {
  const id = Number($('sel-viajante-bus').value);
  if (!id) return showToast('⚠️', 'Selecione um viajante', 'Escolha o viajante na lista.', '#F6A623');
  if (!App.selAssento) return showToast('⚠️', 'Selecione um assento', 'Clique em um assento no mapa.', '#F6A623');

  const v = App.getViajante(id);
  if (!v) return;
  if (v.assento) return showToast('❌', 'Já possui assento', v.nome + ' já está no assento ' + pad(v.assento) + '.', '#E53E3E');
  if (App.assentos[App.selAssento]) return showToast('❌', 'Assento ocupado', 'Escolha outro assento no mapa.', '#E53E3E');

  v.assento = App.selAssento;
  App.assentos[App.selAssento] = id;

  App.selAssento = null;
  $('input-assento-sel').value = '';
  $('sel-viajante-bus').value  = '';
  const badge = $('seat-sel-badge');
  if (badge) { badge.className = 'badge b-gray'; badge.textContent = 'Nenhum assento selecionado'; }

  renderBus();
  renderCadastro();
  updStats();
  showToast('🪑', 'Assento reservado!', v.nome + ' → Assento ' + pad(v.assento), '#00B37E');
}

function liberarAssento(id) {
  const v = App.getViajante(id);
  if (!v || !v.assento) return;
  const numAnt = v.assento;
  delete App.assentos[v.assento];
  v.assento = null;
  renderBus();
  renderCadastro();
  updStats();
  showToast('🪑', 'Assento liberado', v.nome + ' · Assento ' + pad(numAnt) + ' disponível novamente.', '#F6A623');
}

function updBusStats() {
  const occ = App.assentosOcupados();
  setText('b-livres',    44 - occ);
  setText('b-ocupados',  occ);
  setText('b-pct',       Math.round(occ / 44 * 100) + '%');
  // progress bar
  const fill = $('b-progress-fill');
  if (fill) fill.style.width = Math.round(occ / 44 * 100) + '%';
}

function renderBusLog() {
  const list = App.viajantes.filter(v => v.assento);
  setText('bus-res-count', list.length + ' assento' + (list.length !== 1 ? 's' : '') + ' reservado' + (list.length !== 1 ? 's' : ''));
  const el = $('bus-reservas-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div class="empty-state" style="padding:24px"><div class="empty-icon" style="font-size:28px">🪑</div><div class="empty-title" style="font-size:13px">Nenhuma reserva ainda</div></div>`;
    return;
  }
  el.innerHTML = list
    .sort((a, b) => a.assento - b.assento)
    .map(v => `
      <div class="res-item">
        <div class="av-wrap">
          <div class="av ${avatarColor(v.nome)}" style="width:30px;height:30px;font-size:11px">${initials(v.nome)}</div>
          <div>
            <div class="res-name">${v.nome}</div>
            <div class="res-sub">Assento ${pad(v.assento)}</div>
          </div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="liberarAssento(${v.id})">Liberar</button>
      </div>`).join('');
}
