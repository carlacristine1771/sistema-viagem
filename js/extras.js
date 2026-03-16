/* ══════════════════════════════════════
   VIAGEM FÁCIL — Extra Features
   ══════════════════════════════════════ */

// ── Export CSV ────────────────────────────
function exportarCSV() {
  if (!App.viajantes.length) return showToast('⚠️', 'Sem dados', 'Nenhum viajante para exportar.', '#F6A623');
  const header = ['Nome', 'CPF', 'Telefone', 'Status', 'Assento', 'Quarto', 'Valor Total', 'Valor Pago', 'Saldo'];
  const rows = App.viajantes.map(v => {
    const pg    = App.getPagamento(v.id);
    const saldo = Math.max(0, v.valor - pg.pago).toFixed(2);
    return [
      v.nome, v.cpf, v.tel, v.status,
      v.assento ? 'Assento ' + pad(v.assento) : '—',
      v.quarto  ? 'Quarto '  + pad(v.quarto)  : '—',
      v.valor.toFixed(2).replace('.', ','),
      pg.pago.toFixed(2).replace('.', ','),
      saldo.replace('.', ',')
    ].join(';');
  });
  const csv  = [header.join(';'), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'viajantes_' + today().replace(/\//g, '-') + '.csv';
  a.click(); URL.revokeObjectURL(url);
  showToast('📥', 'Exportado!', App.viajantes.length + ' viajantes exportados para CSV.', '#00B37E');
}

// ── Export payment report ─────────────────
function exportarRelatorioPag() {
  if (!App.viajantes.length) return showToast('⚠️', 'Sem dados', 'Nenhum viajante para exportar.', '#F6A623');
  const header = ['Viajante', 'Valor Total', 'Valor Pago', 'Saldo', 'Status Pagamento', 'Qtd Pagamentos'];
  const rows = App.viajantes.map(v => {
    const pg    = App.getPagamento(v.id);
    const saldo = Math.max(0, v.valor - pg.pago);
    let st;
    if (pg.pago >= v.valor - 0.01) st = 'Pago';
    else if (pg.pago > 0)           st = 'Parcial';
    else                            st = 'Pendente';
    return [
      v.nome,
      v.valor.toFixed(2).replace('.', ','),
      pg.pago.toFixed(2).replace('.', ','),
      saldo.toFixed(2).replace('.', ','),
      st,
      pg.hist.length
    ].join(';');
  });
  const totMeta = App.totalMeta();
  const totPago = App.totalPago();
  rows.push('');
  rows.push('TOTAL;' + totMeta.toFixed(2).replace('.', ',') + ';' + totPago.toFixed(2).replace('.', ',') + ';' + Math.max(0, totMeta-totPago).toFixed(2).replace('.', ',') + ';;');
  const csv  = [header.join(';'), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'relatorio_pagamentos_' + today().replace(/\//g, '-') + '.csv';
  a.click(); URL.revokeObjectURL(url);
  showToast('📥', 'Relatório exportado!', 'Arquivo CSV baixado com sucesso.', '#00B37E');
}

// ── Bus occupancy progress text ────────────
// Extend updBusStats to also update pct label
const _origUpdBusStats = window.updBusStats;
if (typeof updBusStats !== 'undefined') {
  const orig = updBusStats;
  window.updBusStats = function() {
    orig();
    const el = $('b-pct-label');
    if (el) el.textContent = App.assentosOcupados() + ' / 44';
  };
}
