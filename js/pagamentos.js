/* ══════════════════════════════════════
   VIAGEM FÁCIL — Screen 4: Pagamentos
   ══════════════════════════════════════ */

// App.planos[id] = { parcelas: N, datas: ['dd/mm/yyyy', ...], valorParcela: X }
if (!App.planos) App.planos = {};

// ── onchange helper: show saldo when viajante changes ──
function onPgViajanteChange() {
  const id  = Number($('pg-viajante-sel').value);
  const bar = $('pg-saldo-bar');
  if (!bar) return;
  if (!id) { bar.style.display='none'; return; }
  const v  = App.getViajante(id);
  const pg = App.getPagamento(id);
  const saldo = Math.max(0, v.valor - pg.pago);
  const pct   = v.valor ? Math.round(pg.pago/v.valor*100) : 0;
  bar.style.display='block';
  setText('pg-saldo-nome',     v.nome);
  setText('pg-saldo-total',    fmtBRL(v.valor));
  setText('pg-saldo-pago',     fmtBRL(pg.pago));
  setText('pg-saldo-restante', fmtBRL(saldo));
  const fill=$('pg-saldo-fill');
  if(fill) fill.style.width=pct+'%';

  // Auto-fill remaining balance as suggestion
  const valInp=$('pg-valor');
  if(valInp && !valInp.value) valInp.value=saldo>0?saldo.toFixed(2):'';
}

// ── Register payment ──────────────────────
function registrarPagamento() {
  const id  = Number($('pg-viajante-sel').value);
  const val = parseFloat($('pg-valor').value);
  const met = $('pg-metodo').value;
  const obs = $('pg-obs').value.trim();
  const dt  = $('pg-data').value;
  const tipo= $('pg-tipo').value;

  if (!id)         return showToast('⚠️','Selecione um viajante','','#F6A623');
  if (!val||val<=0) return showToast('⚠️','Valor inválido','Informe um valor maior que zero.','#F6A623');

  const v  = App.getViajante(id);
  const pg = App.getPagamento(id);

  if (pg.pago+val > v.valor+0.01)
    return showToast('❌','Valor excedente','Ultrapassa o total da viagem ('+fmtBRL(v.valor)+').','#E53E3E');

  pg.pago += val;
  const obsCompleta = [tipo!=='outro'?tipoLabel(tipo):'', obs].filter(Boolean).join(' · ');
  pg.hist.push({
    val, met, obs: obsCompleta,
    tipo,
    data: dt ? new Date(dt+'T00:00:00').toLocaleDateString('pt-BR') : today(),
    hora: nowTime(),
    id: Date.now()
  });
  App.pagamentos[id] = pg;
  if (pg.pago >= v.valor-0.01) { pg.pago=v.valor; v.status='Confirmado'; }

  // Mark installment as paid in plano if exists
  if (App.planos[id]) markPlanoParcelaPaga(id, val);

  ['pg-valor','pg-obs','pg-data'].forEach(x=>{ const e=$(x); if(e) e.value=''; });
  $('pg-viajante-sel').value='';
  const bar=$('pg-saldo-bar'); if(bar) bar.style.display='none';
  closeModal('modal-pagamento');

  renderPagamentos();
  renderCadastro();
  updStats();
  showToast('💰','Pagamento registrado!',fmtBRL(val)+' para '+v.nome,'#00B37E');
}

function tipoLabel(tipo) {
  const map={unico:'Pagamento único',entrada:'Entrada',parcela:'Parcela',saldo:'Quitação do saldo',outro:''};
  return map[tipo]||'';
}

// ── Plan helpers ──────────────────────────
function renderPlanoResumo(id, plano, pg) {
  const pagas = Math.min(Math.floor(pg.pago / plano.valorParcela + 0.001), plano.parcelas);
  return `
    <div style="border:1.5px solid var(--blue-light);border-radius:10px;padding:12px 14px;margin-bottom:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-size:12px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.05em">📆 Plano de Parcelamento</div>
        <div style="font-size:11px;color:var(--gray-500)">${pagas}/${plano.parcelas} parcelas pagas</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">
        ${plano.datas.map((dt,i)=>{
          const paga = i < pagas;
          const prox = i === pagas;
          return `<div style="flex:1;min-width:70px;background:${paga?'var(--green-lt)':prox?'var(--yellow-lt)':'var(--gray-50)'};border:1px solid ${paga?'#bfeed8':prox?'#f6a62340':'var(--gray-200)'};border-radius:8px;padding:6px 8px;text-align:center">
            <div style="font-size:10px;font-weight:700;color:${paga?'var(--green)':prox?'#D97706':'var(--gray-400)'}">${i+1}ª ${paga?'✓':prox?'⚡ Próx.':''}</div>
            <div style="font-size:12px;font-weight:800;color:var(--gray-900)">${fmtBRL(plano.valorParcela).replace('R$ ','R$')}</div>
            <div style="font-size:10px;color:var(--gray-400)">${dt}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}
function markPlanoParcelaPaga(id, val) { /* tracking is via pg.pago */ }

// ── Estorno ───────────────────────────────
let _histEstornoId = null;
function estornarUltimo() {
  if (!_histEstornoId) return;
  const v  = App.getViajante(_histEstornoId);
  const pg = App.getPagamento(_histEstornoId);
  if (!pg.hist.length) return;
  if (!confirm('Estornar o último pagamento de ' + fmtBRL(pg.hist[pg.hist.length-1].val) + '?')) return;
  const ultimo = pg.hist.pop();
  pg.pago = Math.max(0, pg.pago - ultimo.val);
  App.pagamentos[_histEstornoId] = pg;
  if (pg.pago < v.valor-0.01) v.status = 'Pendente';
  closeModal('modal-historico');
  renderPagamentos();
  renderCadastro();
  updStats();
  showToast('↩️','Pagamento estornado',fmtBRL(ultimo.val)+' de '+v.nome,'#F6A623');
}

// ── View history modal ────────────────────
function verHistorico(id) {
  _histEstornoId = id;
  const v  = App.getViajante(id);
  const pg = App.getPagamento(id);
  const plano = App.planos[id];
  $('hist-modal-title').textContent = 'Pagamentos — '+v.nome;
  const saldo = Math.max(0, v.valor-pg.pago);
  const pct   = v.valor?Math.round(pg.pago/v.valor*100):0;
  const st    = pg.pago>=v.valor-0.01?'Pago':pg.pago>0?'Parcial':'Pendente';
  const bc    = pg.pago>=v.valor-0.01?'b-green':pg.pago>0?'b-yellow':'b-red';

  let html = `
    <div style="background:var(--gray-50);border-radius:10px;padding:12px 14px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div style="font-size:13px">
          <div style="font-weight:700;color:var(--gray-900)">${v.nome}</div>
          <div style="color:var(--gray-500);margin-top:2px">Total: ${fmtBRL(v.valor)}</div>
        </div>
        <div style="text-align:right">
          <span class="badge ${bc}">${st}</span>
          <div style="font-size:11px;color:var(--gray-500);margin-top:3px">${pct}% pago · saldo ${fmtBRL(saldo)}</div>
        </div>
      </div>
      <div style="margin-top:10px">
        <div style="height:6px;background:var(--gray-200);border-radius:99px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${pct>=100?'var(--green)':'var(--blue)'};border-radius:99px;transition:width .5s"></div>
        </div>
      </div>
    </div>`;

  if (plano) {
    html += renderPlanoResumo(id, plano, pg);
  }

  if (!pg.hist.length) {
    html += `<div class="empty-state" style="padding:24px"><div class="empty-icon">📋</div><div class="empty-title">Sem pagamentos registrados</div></div>`;
  } else {
    const rows = pg.hist.map((h,i) => `
      <div class="tl-row">
        <div class="tl-icon" style="background:var(--green-lt);font-size:12px;font-weight:700;color:var(--green)">${String(i+1).padStart(2,'0')}</div>
        <div class="tl-content">
          <div class="tl-name">${h.met}${h.obs?' <span style="color:var(--gray-400);font-weight:400">· '+h.obs+'</span>':''}</div>
          <div class="tl-meta">${h.data} às ${h.hora}</div>
        </div>
        <div class="tl-amount text-green">${fmtBRL(h.val)}</div>
      </div>`).join('');
    const total = pg.hist.reduce((s,h)=>s+h.val,0);
    html += rows + `
      <div class="divider" style="height:1px;background:var(--gray-200);margin:10px -4px"></div>
      <div class="flex justify-between items-center" style="padding:8px 0">
        <span class="text-bold">Total registrado</span>
        <span class="text-bold text-green" style="font-size:16px">${fmtBRL(total)}</span>
      </div>`;
  }

  $('hist-modal-body').innerHTML = html;
  const btnEst = $('hist-btn-estornar');
  if (btnEst) btnEst.style.display = pg.hist.length ? 'inline-flex' : 'none';
  openModal('modal-historico');
}

// ── Plano de parcelas ─────────────────────
let _planoViajanteId = null;

function syncPlanoSelect() {
  const sel = $('plano-viajante-sel');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecione um viajante...</option>' +
    App.viajantes.filter(v => {
      const pg = App.getPagamento(v.id);
      return pg.pago < v.valor - 0.01; // only those with balance
    }).map(v => {
      const pg    = App.getPagamento(v.id);
      const saldo = Math.max(0, v.valor - pg.pago);
      return `<option value="${v.id}">${v.nome} — saldo ${fmtBRL(saldo)}</option>`;
    }).join('');
  if (_planoViajanteId) sel.value = _planoViajanteId;
}

function onPlanoViajanteChange() {
  _planoViajanteId = Number($('plano-viajante-sel').value) || null;
  previewPlano();
}

function abrirPlano(id) {
  _planoViajanteId = id || null;
  syncPlanoSelect();
  openModal('modal-plano');
  previewPlano();
}

function previewPlano() {
  const id = _planoViajanteId;
  const infoBar = $('plano-info-bar');
  const preview = $('plano-preview');

  if (!id) {
    if (infoBar) infoBar.style.display = 'none';
    if (preview) preview.innerHTML = '';
    return;
  }

  const v    = App.getViajante(id);
  if (!v) return;
  const pg   = App.getPagamento(id);
  const saldo= Math.max(0, v.valor - pg.pago);
  const n    = parseInt($('plano-nparcelas').value)||2;
  const parcela = saldo/n;

  if (infoBar) {
    infoBar.style.display = 'block';
    infoBar.innerHTML = `
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div><strong style="color:var(--gray-900)">${v.nome}</strong></div>
        <div style="font-size:12px;display:flex;gap:14px">
          <span>Total: <strong>${fmtBRL(v.valor)}</strong></span>
          <span style="color:var(--green)">Pago: <strong>${fmtBRL(pg.pago)}</strong></span>
          <span style="color:var(--red)">Saldo: <strong>${fmtBRL(saldo)}</strong></span>
        </div>
      </div>
      <div style="margin-top:8px;font-size:13px">
        ${n}x de <strong style="color:var(--blue)">${fmtBRL(parcela)}</strong> cada
      </div>`;
  }

  const startVal = $('plano-data-inicio').value;
  const startDate = startVal ? new Date(startVal+'T00:00') : new Date();

  if (!preview) return;
  let rows='';
  for(let i=0;i<n;i++){
    const d = new Date(startDate);
    d.setMonth(d.getMonth()+i);
    const ds = d.toLocaleDateString('pt-BR');
    rows += `<div class="plano-parcela futuro">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:24px;height:24px;border-radius:50%;background:var(--blue-light);color:var(--blue);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center">${i+1}</div>
        <div style="font-size:13px;font-weight:600;color:var(--gray-900)">${i===0?'1ª parcela (entrada)':i===n-1?'Parcela final':'Parcela '+( i+1)}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:14px;font-weight:800;color:var(--blue)">${fmtBRL(parcela)}</div>
        <div style="font-size:11px;color:var(--gray-500)">Venc. ${ds}</div>
      </div>
    </div>`;
  }
  preview.innerHTML = rows;
}

function salvarPlano() {
  const id = _planoViajanteId || Number($('plano-viajante-sel').value);
  if (!id) return showToast('⚠️','Selecione um viajante','','#F6A623');
  const v  = App.getViajante(id);
  if (!v) return;
  const pg = App.getPagamento(id);
  const saldo = Math.max(0, v.valor - pg.pago);
  if (saldo <= 0) return showToast('⚠️','Viajante já quitado','Não há saldo devedor.','#F6A623');
  const n    = parseInt($('plano-nparcelas').value)||2;
  const parcela = saldo/n;
  const startVal = $('plano-data-inicio').value;
  const startDate = startVal?new Date(startVal+'T00:00'):new Date();

  const datas=[];
  for(let i=0;i<n;i++){
    const d=new Date(startDate);
    d.setMonth(d.getMonth()+i);
    datas.push(d.toLocaleDateString('pt-BR'));
  }
  App.planos[id]={parcelas:n, datas, valorParcela:parcela, saldoInicial:saldo, criadoEm:today()};
  _planoViajanteId = null;
  closeModal('modal-plano');
  renderPagamentos();
  showToast('📆','Plano criado!',n+'x de '+fmtBRL(parcela)+' para '+v.nome,'#00B37E');
}

// ── Quick pay ─────────────────────────────
function quickPay(id) {
  syncPgSelect();
  $('pg-viajante-sel').value = id;
  onPgViajanteChange();
  openModal('modal-pagamento');
}

function syncPgSelect() {
  $('pg-viajante-sel').innerHTML =
    '<option value="">Selecione um viajante...</option>' +
    App.viajantes.map(v=>{
      const pg=App.getPagamento(v.id);
      const saldo=Math.max(0,v.valor-pg.pago);
      return `<option value="${v.id}">${v.nome} — saldo ${fmtBRL(saldo)}</option>`;
    }).join('');
}

// ── Main render ───────────────────────────
function renderPagamentos() {
  updPgStats();
  renderPgTable();
  renderBarChart();
  renderTimeline();
  renderAlertasParcelas();
}

// ── Stats ─────────────────────────────────
function updPgStats() {
  let tot=0,meta=0,pagos=0,pend=0,parc=0;
  App.viajantes.forEach(v=>{
    meta+=v.valor;
    const pg=App.getPagamento(v.id);
    tot+=pg.pago;
    if(pg.pago>=v.valor-0.01) pagos++;
    else if(pg.pago>0)         parc++;
    else                        pend++;
  });
  const pct=meta?(tot/meta*100):0;
  setText('pg-arrecadado',   fmtBRLShort(tot));
  setText('pg-meta',         fmtBRLShort(meta));
  setText('pg-npagos',       pagos);
  setText('pg-npend',        pend);
  setText('pg-pct-badge',    pct.toFixed(0)+'% da meta');
  setText('pg-progress-pct', pct.toFixed(1)+'%');
  setText('pg-progress-sub', fmtBRL(tot)+' arrecadados de '+fmtBRL(meta));
  setText('pg-faltam',       fmtBRL(Math.max(0,meta-tot)));
  setText('pg-progress-msg', pagos+' viajante'+(pagos!==1?'s':'')+' com pagamento completo');
  const fill=$('pg-progress-fill');
  if(fill) fill.style.width=Math.min(100,pct)+'%';

  const circ=2*Math.PI*54, total=App.viajantes.length||1;
  const paidLen=circ*(pagos/total), partLen=circ*(parc/total);
  const dP=$('donut-pagos'), dPc=$('donut-parcial'), dPct=$('donut-pct');
  if(dP)  dP.setAttribute('stroke-dasharray', paidLen+' '+(circ-paidLen));
  if(dPc){ dPc.setAttribute('stroke-dasharray', partLen+' '+(circ-partLen)); dPc.setAttribute('stroke-dashoffset',-paidLen); }
  if(dPct) dPct.textContent=pct.toFixed(0)+'%';
  setText('dl-pagos',    pagos+' pago'+(pagos!==1?'s':''));
  setText('dl-parciais', parc+' parcial'+(parc!==1?'is':''));
  setText('dl-pendentes',pend+' pendente'+(pend!==1?'s':''));
}

// ── Payments table ────────────────────────
let pgFil='todos';
function setPgFilter(f,btn) {
  pgFil=f;
  document.querySelectorAll('.filter-pills .pill').forEach(p=>p.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderPgTable();
}
function filterPg() { renderPgTable(); }

function renderPgTable() {
  const q  = ($('search-pg').value||'').toLowerCase();
  const tb = $('tbody-pg');
  const list = App.viajantes.filter(v=>{
    if(q&&!v.nome.toLowerCase().includes(q)) return false;
    const pg=App.getPagamento(v.id);
    if(pgFil==='Pago'    &&pg.pago<v.valor-0.01) return false;
    if(pgFil==='Parcial' &&(pg.pago===0||pg.pago>=v.valor-0.01)) return false;
    if(pgFil==='Pendente'&&pg.pago>0) return false;
    return true;
  });

  if(!list.length){
    tb.innerHTML=`<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">💳</div><div class="empty-title">Nenhum resultado</div></div></td></tr>`;
    return;
  }

  tb.innerHTML=list.map(v=>{
    const pg    = App.getPagamento(v.id);
    const saldo = v.valor-pg.pago;
    const pct   = v.valor?Math.round(pg.pago/v.valor*100):0;
    const plano = App.planos[v.id];
    let st,bc;
    if(pg.pago>=v.valor-0.01){st='Pago';    bc='b-green';}
    else if(pg.pago>0)        {st='Parcial'; bc='b-yellow';}
    else                      {st='Pendente';bc='b-red';}
    const met=pg.hist.length?pg.hist[pg.hist.length-1].met:'—';

    // Parcelas info
    let parcelasCell = '—';
    if(plano){
      const pagas=Math.floor(pg.pago/plano.valorParcela);
      parcelasCell=`<span style="font-size:12px;font-weight:700;color:var(--blue)">${pagas}/${plano.parcelas}</span><div style="font-size:10px;color:var(--gray-500)">${fmtBRL(plano.valorParcela)}/parc.</div>`;
    } else if(pg.hist.length){
      parcelasCell=`<span style="font-size:11px;color:var(--gray-500)">${pg.hist.length} transação${pg.hist.length!==1?'ões':''}</span>`;
    }

    // Next installment alert
    let alertaVenc='';
    if(plano&&pct<100){
      const pagas=Math.floor(pg.pago/plano.valorParcela);
      if(pagas<plano.parcelas) alertaVenc=`<div style="font-size:10px;color:var(--orange);margin-top:2px">📅 Próx: ${plano.datas[pagas]||'—'}</div>`;
    }

    return `
      <tr>
        <td>
          <div class="av-wrap">
            <div class="av ${avatarColor(v.nome)}">${initials(v.nome)}</div>
            <div>
              <div class="td-name">${v.nome}</div>
              <div class="td-sub">${maskTelDisplay(v.tel)}</div>
              ${alertaVenc}
            </div>
          </div>
        </td>
        <td class="text-bold">${fmtBRL(v.valor)}</td>
        <td class="text-bold text-green">${fmtBRL(pg.pago)}</td>
        <td class="text-bold" style="color:${saldo>0.01?'var(--red)':'var(--green)'}">${fmtBRL(Math.max(0,saldo))}</td>
        <td>${parcelasCell}</td>
        <td>
          <div class="progress-wrap" style="width:70px">
            <div class="progress-fill" style="width:${pct}%;background:${pct>=100?'var(--green)':pct>0?'var(--blue)':'var(--gray-200)'}"></div>
          </div>
          <div class="text-xs text-muted" style="margin-top:3px">${pct}%</div>
        </td>
        <td><span class="badge ${bc}">${st}</span></td>
        <td style="text-align:right">
          <div class="flex gap-6 items-center" style="justify-content:flex-end">
            ${saldo>0.01?`<button class="btn btn-primary btn-sm" onclick="quickPay(${v.id})">💳 Pagar</button>`:`<span class="text-xs text-muted">✓ Quitado</span>`}
            ${!plano&&saldo>0.01?`<button class="btn btn-ghost btn-sm btn-icon" title="Criar plano de parcelas" onclick="abrirPlano(${v.id})">📆</button>`:''}
            <button class="btn btn-ghost btn-sm btn-icon" onclick="verHistorico(${v.id})" title="Ver histórico">📋</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ── Bar chart ──────────────────────────────
function renderBarChart() {
  const wrap=$('bar-chart-wrap');
  if(!wrap) return;
  const colors=['#0057FF','#3B7BFF','#00C4B4','#00B37E','#F6A623','#FF6B2B'];
  const data=[0,0,0,0,0,0];
  App.viajantes.forEach(v=>{
    (App.getPagamento(v.id).hist||[]).forEach(h=>{
      const parts=h.data?h.data.split('/'):null;
      const mIdx=parts?parseInt(parts[1],10)-1:0;
      if(mIdx>=0&&mIdx<6) data[mIdx]+=h.val;
    });
  });
  const max=Math.max(...data,1);
  wrap.innerHTML=data.map((v,i)=>{
    const h=Math.max(4,Math.round(v/max*130));
    return `<div class="bar-col">
      <div class="bar-fill" style="height:${h}px;background:${colors[i]}">
        ${v>0?`<span class="bar-tip">${fmtBRLShort(v)}</span>`:''}
      </div>
      <span class="bar-lbl">Mês ${i+1}</span>
    </div>`;
  }).join('');
}

// ── Timeline ──────────────────────────────
function renderTimeline() {
  const tl=$('pg-timeline');
  if(!tl) return;
  const items=[];
  App.viajantes.forEach(v=>
    (App.getPagamento(v.id).hist||[]).forEach(h=>items.push({nome:v.nome,...h}))
  );
  if(!items.length){
    tl.innerHTML=`<div class="empty-state" style="padding:20px"><div class="empty-icon" style="font-size:28px">📋</div><div class="empty-title" style="font-size:13px">Sem transações ainda</div></div>`;
    return;
  }
  tl.innerHTML=items.reverse().slice(0,8).map(h=>`
    <div class="tl-row">
      <div class="tl-icon" style="background:var(--green-lt)">💰</div>
      <div class="tl-content">
        <div class="tl-name">${h.nome} <span style="font-size:11px;color:var(--gray-400);font-weight:400">· ${h.met}</span></div>
        <div class="tl-meta">${h.data} às ${h.hora}${h.obs?' · '+h.obs:''}</div>
      </div>
      <div class="tl-amount text-green">${fmtBRL(h.val)}</div>
    </div>`).join('');
}

// ── Installment alerts panel ──────────────
function renderAlertasParcelas() {
  const body = $('alertas-parcelas-body');
  if (!body) return;

  const comPlano = App.viajantes.filter(v => App.planos[v.id]);
  if (!comPlano.length) {
    body.innerHTML = `<div class="empty-state" style="padding:20px">
      <div class="empty-icon" style="font-size:28px">📆</div>
      <div class="empty-title" style="font-size:13px">Nenhum plano de parcelamento ativo</div>
      <div class="empty-sub">Clique em 📆 na tabela para criar um plano para um viajante</div>
    </div>`;
    return;
  }

  const todayStr = today();
  let rows = '';

  comPlano.forEach(v => {
    const pg    = App.getPagamento(v.id);
    const plano = App.planos[v.id];
    const pagas = Math.min(Math.floor(pg.pago / plano.valorParcela + 0.001), plano.parcelas);
    const restantes = plano.parcelas - pagas;

    rows += `<div style="border:1px solid var(--gray-200);border-radius:12px;padding:14px 16px;margin-bottom:10px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
        <div class="av-wrap">
          <div class="av ${avatarColor(v.nome)}" style="width:30px;height:30px;font-size:11px">${initials(v.nome)}</div>
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--gray-900)">${v.nome}</div>
            <div style="font-size:11px;color:var(--gray-500)">${pagas}/${plano.parcelas} parcelas pagas · ${fmtBRL(plano.valorParcela)}/parcela</div>
          </div>
        </div>
        <div style="display:flex;gap:6px">
          ${pg.pago < v.valor - 0.01 ? `<button class="btn btn-primary btn-sm" onclick="quickPay(${v.id})">💳 Registrar</button>` : `<span class="badge b-green">✅ Quitado</span>`}
          <button class="btn btn-ghost btn-sm" onclick="verHistorico(${v.id})" title="Histórico">📋</button>
        </div>
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap">
        ${plano.datas.map((dt, i) => {
          const paga   = i < pagas;
          const isHoje = dt === todayStr;
          const atras  = !paga && i < pagas + (isHoje ? 0 : 1) && i < pagas;
          let bg='var(--gray-50)', cor='var(--gray-500)', label='', borda='var(--gray-200)';
          if (paga)   { bg='var(--green-lt)'; cor='var(--green)'; label='✓'; borda='#bfeed8'; }
          else if (isHoje){ bg='var(--yellow-lt)'; cor='#D97706'; label='⚡ Hoje'; borda='#f6a62345'; }
          else if (i < pagas + 1 && !paga && pg.pago < v.valor - 0.01){ bg='#FFF5F5'; cor='var(--red)'; label='⚠️ Pend.'; borda='#FED7D7'; }
          return `<div style="flex:1;min-width:72px;background:${bg};border:1px solid ${borda};border-radius:8px;padding:6px 8px;text-align:center">
            <div style="font-size:9px;font-weight:700;color:${cor};text-transform:uppercase">${i+1}ª ${label}</div>
            <div style="font-size:11px;font-weight:800;color:var(--gray-900);margin:2px 0">${fmtBRL(plano.valorParcela).replace('R$ ','R$')}</div>
            <div style="font-size:10px;color:var(--gray-400)">${dt}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  });

  body.innerHTML = rows;
}

// Patch renderPagamentos to include alerts
const _origRenderPg = window.renderPagamentos;
// Override after definition (called at bottom of file)
