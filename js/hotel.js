/* ══════════════════════════════════════
   VIAGEM FÁCIL — Screen 3: Hotel (rich rooms)
   ══════════════════════════════════════ */

const ROOM_TYPES = {
  standard:  { label:'Standard',  icon:'🛏',     camas:1, banheiro:'Compartilhado',          ar:false, tv:false, cor:'#6B7280' },
  duplo:     { label:'Duplo',     icon:'🛏🛏',   camas:2, banheiro:'Privativo',               ar:true,  tv:true,  cor:'#3B7BFF' },
  triplo:    { label:'Triplo',    icon:'🛏🛏🛏', camas:3, banheiro:'Privativo',               ar:true,  tv:true,  cor:'#00B37E' },
  suite:     { label:'Suíte',     icon:'👑',     camas:2, banheiro:'Privativo c/ banheira',   ar:true,  tv:true,  cor:'#F6A623' },
  familia:   { label:'Família',   icon:'👨‍👩‍👧',   camas:4, banheiro:'Privativo',               ar:true,  tv:true,  cor:'#FF6B2B' },
  economico: { label:'Econômico', icon:'🏠',     camas:1, banheiro:'Compartilhado',          ar:false, tv:false, cor:'#9CA3AF' },
};

if (!App.roomTypes) App.roomTypes = {};
if (!App.roomNotes) App.roomNotes = {};
if (!App.hotelCfg.tiposPadrao) App.hotelCfg.tiposPadrao = 'duplo';

function getRoomType(num) { return App.roomTypes[num] || App.hotelCfg.tiposPadrao || 'duplo'; }
function getRoomCap(num)  { return (ROOM_TYPES[getRoomType(num)] || ROOM_TYPES.duplo).camas; }
App.isQuartoFull = function(n) { return this.quartoOcupantes(n) >= getRoomCap(n); };

// ── Render hotel screen ────────────────────
function renderHotel() {
  const map = $('rooms-map');
  if (!map) return;
  map.innerHTML = '';

  // Build legend
  const legend = $('hotel-legend');
  if (legend) {
    const usedTypes = new Set();
    for (let i=1; i<=App.hotelCfg.n; i++) usedTypes.add(getRoomType(i));
    // Always show free/taken legend + type badges
    legend.innerHTML =
      `<div class="hotel-legend-item"><div style="width:10px;height:10px;border-radius:2px;background:#E5E7EB;border:1px solid #D1D5DB"></div>Livre</div>` +
      `<div class="hotel-legend-item"><div style="width:10px;height:10px;border-radius:2px;background:#BFDBFE"></div>Selecionado</div>` +
      `<div class="hotel-legend-item"><div style="width:10px;height:10px;border-radius:2px;background:#FEE2E2"></div>Lotado</div>` +
      [...usedTypes].map(k => {
        const t = ROOM_TYPES[k]||ROOM_TYPES.duplo;
        return `<div class="hotel-legend-item"><span style="width:10px;height:10px;border-radius:2px;background:${t.cor};display:inline-block"></span>${t.icon} ${t.label}</div>`;
      }).join('');
  }

  let cheios=0, hospedes=0;
  for (let i=1; i<=App.hotelCfg.n; i++) {
    const tipo    = getRoomType(i);
    const tipoObj = ROOM_TYPES[tipo] || ROOM_TYPES.duplo;
    const cap     = getRoomCap(i);
    const occ     = App.quartoOcupantes(i);
    const full    = occ >= cap;
    hospedes += occ;
    if (full) cheios++;

    const pips = Array.from({length:cap}, (_,j) =>
      `<div class="bed-pip ${j<occ?'occ':'free'}"></div>`
    ).join('');

    const amenities = [
      `<span class="room-amenity">${tipoObj.banheiro === 'Compartilhado' ? '🚿 Compart.' : '🚿 Privativo'}</span>`,
      tipoObj.ar ? `<span class="room-amenity">❄️ A/C</span>` : '',
      tipoObj.tv ? `<span class="room-amenity">📺 TV</span>`  : '',
    ].filter(Boolean).join('');

    const card = document.createElement('div');
    card.className = 'room-card' + (full?' full':'') + (App.selQuarto===i?' selected':'');
    card.innerHTML = `
      ${full?'<div class="room-full-tag">LOTADO</div>':''}
      <div class="room-card-top">
        <div class="room-number">${pad(i)}</div>
        <div class="room-tipo-badge" style="background:${tipoObj.cor}22;color:${tipoObj.cor}">${tipoObj.icon} ${tipoObj.label}</div>
      </div>
      <div class="room-beds">${pips}</div>
      <div class="room-amenities">${amenities}</div>
      <div class="room-occ" style="color:${full?'var(--red)':occ?'var(--yellow)':'var(--green)'}">
        ${occ}/${cap} hóspede${occ!==1?'s':''}
      </div>
      ${App.roomNotes[i]?`<div class="room-note">📝 ${App.roomNotes[i]}</div>`:''}
    `;
    card.onclick = () => pickRoom(i);
    card.title   = `Quarto ${pad(i)} · ${tipoObj.label} · ${occ}/${cap} hóspedes`;
    map.appendChild(card);
  }

  setText('h-total',  App.hotelCfg.n);
  setText('h-disp',   App.hotelCfg.n - cheios);
  setText('h-cheios', cheios);
  setText('h-hospedes', hospedes);
  renderHotelLog();
}

function pickRoom(n) {
  App.selQuarto = n;
  const tipo = ROOM_TYPES[getRoomType(n)] || ROOM_TYPES.duplo;
  const cap  = getRoomCap(n);
  const occ  = App.quartoOcupantes(n);
  const inp  = $('input-quarto-sel');
  if (inp) inp.value = `Quarto ${pad(n)} · ${tipo.label} (${occ}/${cap})`;
  renderHotel();
  const panel = $('room-detail-panel');
  if (panel) renderRoomPanel(n, panel);
}

function renderRoomPanel(n, container) {
  const tipo    = getRoomType(n);
  const tipoObj = ROOM_TYPES[tipo] || ROOM_TYPES.duplo;
  const cap     = getRoomCap(n);
  const occ     = App.quartoOcupantes(n);
  const guests  = (App.quartos[n]||[]).map(id=>App.getViajante(id)).filter(Boolean);
  const pct     = cap ? Math.round(occ/cap*100) : 0;

  container.innerHTML = `
    <!-- Header -->
    <div style="padding:16px 16px 12px;border-bottom:1px solid var(--gray-100)">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:12px">
        <div>
          <div style="font-size:22px;font-weight:800;color:var(--gray-900);letter-spacing:-1px">Quarto ${pad(n)}</div>
          <div style="font-size:12px;color:var(--gray-500);margin-top:2px">${App.roomNotes[n]||'Sem observações'}</div>
        </div>
        <div style="background:${tipoObj.cor}18;color:${tipoObj.cor};font-size:12px;padding:5px 10px;border-radius:20px;font-weight:700;flex-shrink:0;text-align:center">
          ${tipoObj.icon}<br><span style="font-size:10px">${tipoObj.label}</span>
        </div>
      </div>
      <!-- Amenities grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div style="background:var(--gray-50);border-radius:8px;padding:7px 9px;font-size:11px">
          <div style="color:var(--gray-400);font-weight:600;text-transform:uppercase;letter-spacing:.04em;font-size:9px">Camas</div>
          <div style="font-weight:800;color:var(--gray-900);margin-top:2px">🛏 ${tipoObj.camas} cama${tipoObj.camas>1?'s':''}</div>
        </div>
        <div style="background:var(--gray-50);border-radius:8px;padding:7px 9px;font-size:11px">
          <div style="color:var(--gray-400);font-weight:600;text-transform:uppercase;letter-spacing:.04em;font-size:9px">Banheiro</div>
          <div style="font-weight:700;color:var(--gray-900);margin-top:2px">🚿 ${tipoObj.banheiro}</div>
        </div>
        <div style="background:${tipoObj.ar?'#EEF3FF':'var(--gray-50)'};border-radius:8px;padding:7px 9px;font-size:11px">
          <div style="color:var(--gray-400);font-weight:600;text-transform:uppercase;letter-spacing:.04em;font-size:9px">Ar-condicionado</div>
          <div style="font-weight:700;color:${tipoObj.ar?'var(--blue)':'var(--gray-400)'};margin-top:2px">${tipoObj.ar?'❄️ Incluso':'— Não incluso'}</div>
        </div>
        <div style="background:${tipoObj.tv?'#EEF3FF':'var(--gray-50)'};border-radius:8px;padding:7px 9px;font-size:11px">
          <div style="color:var(--gray-400);font-weight:600;text-transform:uppercase;letter-spacing:.04em;font-size:9px">Televisão</div>
          <div style="font-weight:700;color:${tipoObj.tv?'var(--blue)':'var(--gray-400)'};margin-top:2px">${tipoObj.tv?'📺 Inclusa':'— Não inclusa'}</div>
        </div>
      </div>
      <!-- Occupancy bar -->
      <div style="margin-top:12px">
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:600;color:var(--gray-600);margin-bottom:4px">
          <span>Ocupação</span>
          <span style="color:${occ>=cap?'var(--red)':occ?'var(--yellow)':'var(--green)'}">${occ}/${cap} hóspedes</span>
        </div>
        <div style="height:5px;background:var(--gray-200);border-radius:99px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${occ>=cap?'var(--red)':occ?'var(--yellow)':'var(--green)'};border-radius:99px;transition:width .4s ease"></div>
        </div>
      </div>
    </div>

    <!-- Alterar tipo -->
    <div style="padding:12px 16px;border-bottom:1px solid var(--gray-100)">
      <div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px">Tipo do quarto</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">
        ${Object.entries(ROOM_TYPES).map(([k,t])=>
          `<button class="pill${tipo===k?' active':''}" style="font-size:11px;padding:4px 9px;border-color:${tipo===k?t.cor:'transparent'};color:${tipo===k?t.cor:'var(--gray-600)'}" onclick="setRoomType(${n},'${k}')">${t.icon} ${t.label}</button>`
        ).join('')}
      </div>
      <div style="margin-top:10px">
        <input class="form-input" style="font-size:12px" type="text" placeholder="Observação: ex. andar térreo, vista jardim..." value="${App.roomNotes[n]||''}" oninput="App.roomNotes[${n}]=this.value">
      </div>
    </div>

    <!-- Hóspedes -->
    <div style="padding:12px 16px">
      <div style="font-size:10px;font-weight:700;color:var(--gray-400);text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px">Hóspedes (${occ}/${cap})</div>
      ${guests.length ? guests.map(v=>{
        const pg  = App.getPagamento(v.id);
        const pgs = pg.pago>=v.valor-0.01?'b-green':pg.pago>0?'b-yellow':'b-red';
        const pgl = pg.pago>=v.valor-0.01?'Pago':pg.pago>0?'Parcial':'Pendente';
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--gray-100)">
          <div class="av-wrap">
            <div class="av ${avatarColor(v.nome)}" style="width:28px;height:28px;font-size:10px">${initials(v.nome)}</div>
            <div>
              <div style="font-size:12px;font-weight:600;color:var(--gray-900)">${v.nome.split(' ')[0]} ${v.nome.split(' ').slice(-1)[0]}</div>
              <span class="badge ${pgs}" style="font-size:9px;padding:1px 6px">${pgl}</span>
            </div>
          </div>
          <button class="btn btn-danger btn-sm" style="font-size:10px;padding:3px 8px" onclick="liberarQuarto(${v.id})">✕ Liberar</button>
        </div>`;
      }).join('')
      : `<div style="text-align:center;padding:12px 0;color:var(--gray-400);font-size:12px">Quarto vazio — selecione acima para alocar</div>`}
    </div>`;
}

function setRoomType(num, tipo) {
  App.roomTypes[num] = tipo;
  renderHotel();
  const panel = $('room-detail-panel');
  if (panel && App.selQuarto === num) renderRoomPanel(num, panel);
  showToast('🏨','Tipo atualizado',`Quarto ${pad(num)} → ${ROOM_TYPES[tipo].label}`);
}

// ── Detail modal (read only, shown on list click) ──
function verQuartoDetalhe(n) {
  const tipo    = getRoomType(n);
  const tipoObj = ROOM_TYPES[tipo] || ROOM_TYPES.duplo;
  const cap     = getRoomCap(n);
  const occ     = App.quartoOcupantes(n);
  const guests  = (App.quartos[n]||[]).map(id=>App.getViajante(id)).filter(Boolean);

  $('qd-title').textContent    = `Quarto ${pad(n)} — ${tipoObj.label}`;
  $('qd-subtitle').textContent = `${tipoObj.icon}  ${occ}/${cap} hóspedes · ${tipoObj.banheiro}`;

  $('qd-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">
      <div class="detail-field"><div class="detail-label">Tipo</div><div class="detail-value">${tipoObj.icon} ${tipoObj.label}</div></div>
      <div class="detail-field"><div class="detail-label">Camas</div><div class="detail-value">${tipoObj.camas} cama${tipoObj.camas>1?'s':''}</div></div>
      <div class="detail-field"><div class="detail-label">Banheiro</div><div class="detail-value" style="font-size:13px">${tipoObj.banheiro}</div></div>
      <div class="detail-field"><div class="detail-label">Ar-condicionado</div><div class="detail-value">${tipoObj.ar?'✅ Sim':'❌ Não'}</div></div>
      <div class="detail-field"><div class="detail-label">Televisão</div><div class="detail-value">${tipoObj.tv?'✅ Sim':'❌ Não'}</div></div>
      <div class="detail-field"><div class="detail-label">Ocupação</div>
        <div class="detail-value" style="color:${occ>=cap?'var(--red)':occ?'var(--yellow)':'var(--green)'}">${occ}/${cap}</div>
      </div>
      ${App.roomNotes[n]?`<div class="detail-field" style="grid-column:span 2"><div class="detail-label">Observação</div><div class="detail-value">${App.roomNotes[n]}</div></div>`:''}
    </div>
    <div style="border-top:1px solid var(--gray-100);padding-top:14px">
      <div style="font-size:12px;font-weight:700;color:var(--gray-600);margin-bottom:10px">HÓSPEDES</div>
      ${guests.length ? guests.map(v=>{
        const pg = App.getPagamento(v.id);
        const pct= v.valor?Math.round(pg.pago/v.valor*100):0;
        const bc = pg.pago>=v.valor-0.01?'b-green':pg.pago>0?'b-yellow':'b-red';
        const lb = pg.pago>=v.valor-0.01?'Pago':pg.pago>0?'Parcial':'Pendente';
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--gray-100)">
          <div class="av-wrap">
            <div class="av ${avatarColor(v.nome)}">${initials(v.nome)}</div>
            <div><div class="td-name">${v.nome}</div><div class="td-sub">${maskTelDisplay(v.tel)}</div></div>
          </div>
          <div style="text-align:right">
            <span class="badge ${bc}">${lb}</span>
            <div style="font-size:11px;color:var(--gray-500);margin-top:2px">${pct}% pago</div>
          </div>
        </div>`;
      }).join('')
      : `<div style="text-align:center;padding:16px;color:var(--gray-400);font-size:13px">Quarto sem hóspedes</div>`}
    </div>`;

  openModal('modal-quarto-detalhe');
}

// ── Allocate ──────────────────────────────
function alocarQuarto() {
  const id = Number($('sel-viajante-hotel').value);
  if (!id)            return showToast('⚠️','Selecione um viajante','','#F6A623');
  if (!App.selQuarto) return showToast('⚠️','Selecione um quarto','Clique em um quarto no mapa.','#F6A623');

  const v = App.getViajante(id);
  if (!v) return;
  if (v.quarto)              return showToast('❌','Já alocado',v.nome+' já está no quarto '+pad(v.quarto)+'.','#E53E3E');
  if (App.isQuartoFull(App.selQuarto)) return showToast('❌','Quarto lotado','Selecione outro quarto.','#E53E3E');

  v.quarto = App.selQuarto;
  if (!App.quartos[App.selQuarto]) App.quartos[App.selQuarto]=[];
  App.quartos[App.selQuarto].push(id);

  const q = App.selQuarto;
  App.selQuarto=null;
  $('input-quarto-sel').value='';
  $('sel-viajante-hotel').value='';

  renderHotel();
  renderCadastro();
  const panel=$('room-detail-panel');
  if(panel) renderRoomPanel(q, panel);
  showToast('🛏','Hóspede alocado!',v.nome+' → Quarto '+pad(v.quarto),'#00B37E');
}

function liberarQuarto(id) {
  const v = App.getViajante(id);
  if (!v||!v.quarto) return;
  const num = v.quarto;
  App.quartos[v.quarto]=(App.quartos[v.quarto]||[]).filter(i=>i!==id);
  v.quarto=null;
  closeModal('modal-quarto-detalhe');
  renderHotel();
  renderCadastro();
  showToast('🏨','Quarto liberado',v.nome+' · Quarto '+pad(num)+' com vaga.','#F6A623');
}

// ── Hotel log ─────────────────────────────
function renderHotelLog() {
  const list = App.viajantes.filter(v=>v.quarto);
  setText('hotel-aloc-count',list.length+' hóspede'+(list.length!==1?'s':'')+' alocado'+(list.length!==1?'s':''));
  const el = $('hotel-aloc-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML=`<div class="empty-state" style="padding:24px"><div class="empty-icon" style="font-size:28px">🏨</div><div class="empty-title" style="font-size:13px">Nenhuma alocação ainda</div></div>`;
    return;
  }
  const byRoom={};
  list.sort((a,b)=>a.quarto-b.quarto).forEach(v=>{ if(!byRoom[v.quarto]) byRoom[v.quarto]=[]; byRoom[v.quarto].push(v); });
  el.innerHTML=Object.entries(byRoom).map(([room,guests])=>{
    const tipoObj=ROOM_TYPES[getRoomType(Number(room))]||ROOM_TYPES.duplo;
    return `<div style="margin-bottom:8px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:var(--gray-50);border-radius:8px;margin-bottom:4px;cursor:pointer" onclick="verQuartoDetalhe(${room})">
        <div style="font-size:12px;font-weight:700;color:var(--gray-700)">
          🏨 Quarto ${pad(Number(room))} <span style="color:${tipoObj.cor};font-size:11px">${tipoObj.icon} ${tipoObj.label}</span>
        </div>
        <span style="font-size:10px;color:var(--gray-400)">${guests.length}/${getRoomCap(Number(room))} hósp.</span>
      </div>
      ${guests.map(v=>`
        <div class="res-item" style="margin-bottom:4px">
          <div class="av-wrap">
            <div class="av ${avatarColor(v.nome)}" style="width:28px;height:28px;font-size:10px">${initials(v.nome)}</div>
            <div><div class="res-name" style="font-size:12px">${v.nome}</div></div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="liberarQuarto(${v.id})">✕</button>
        </div>`).join('')}
    </div>`;
  }).join('');
}

// ── Config ────────────────────────────────
function openHotelCfg() {
  const grid=$('cfg-tipos-grid');
  if (grid) {
    const current=App.hotelCfg.tiposPadrao||'duplo';
    grid.innerHTML=Object.entries(ROOM_TYPES).map(([k,t])=>`
      <div class="tipo-btn${k===current?' active':''}" data-tipo="${k}"
        style="border:1.5px solid ${k===current?t.cor:'var(--gray-200)'};border-radius:10px;padding:10px 12px;cursor:pointer;background:${k===current?t.cor+'18':'white'};transition:all .15s;text-align:center"
        onclick="selectTipoBtn(this,'${k}','${t.cor}')">
        <div style="font-size:20px">${t.icon}</div>
        <div style="font-size:12px;font-weight:700;color:var(--gray-800);margin-top:3px">${t.label}</div>
        <div style="font-size:10px;color:var(--gray-500)">${t.camas} cama${t.camas>1?'s':''}</div>
        <div style="font-size:10px;color:var(--gray-400)">${t.banheiro.split(' ')[0]}</div>
      </div>`).join('');
  }
  openModal('modal-hotel-cfg');
}
function selectTipoBtn(el,tipo,cor) {
  document.querySelectorAll('#cfg-tipos-grid .tipo-btn').forEach(b=>{
    b.classList.remove('active'); b.style.borderColor='var(--gray-200)'; b.style.background='white';
  });
  el.classList.add('active'); el.style.borderColor=cor; el.style.background=cor+'18';
}
function cfgHotel() {
  const n  =parseInt($('cfg-nq').value)||12;
  const cap=parseInt($('cfg-cap').value)||4;
  const sel=document.querySelector('#cfg-tipos-grid .tipo-btn.active');
  App.hotelCfg.n=Math.max(1,Math.min(100,n));
  App.hotelCfg.cap=Math.max(1,Math.min(12,cap));
  App.hotelCfg.tiposPadrao=sel?sel.dataset.tipo:'duplo';
  closeModal('modal-hotel-cfg');
  renderHotel();
  showToast('⚙️','Configuração salva',App.hotelCfg.n+' quartos · padrão: '+ROOM_TYPES[App.hotelCfg.tiposPadrao].label);
}
