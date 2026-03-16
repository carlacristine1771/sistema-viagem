/* ══════════════════════════════════════
   VIAGEM FÁCIL — State Management
   ══════════════════════════════════════ */

const App = {
  viajantes: [],   // Array of traveler objects
  pagamentos: {},  // id -> { pago: Number, hist: Array }
  assentos:  {},   // seatNum -> viajantId
  quartos:   {},   // roomNum -> [viajanteId, ...]
  hotelCfg:  { n: 12, cap: 4 },
  selAssento: null,
  selQuarto:  null,
  pgFilter:   'todos',
  currentPage:'cadastro',

  // ── Getters ─────────────────────────
  getViajante(id)   { return this.viajantes.find(v => v.id === id); },
  getPagamento(id)  { return this.pagamentos[id] || { pago: 0, hist: [] }; },
  totalMeta()       { return this.viajantes.reduce((s,v) => s + v.valor, 0); },
  totalPago()       { return this.viajantes.reduce((s,v) => s + (this.getPagamento(v.id).pago), 0); },
  assentosOcupados(){ return Object.keys(this.assentos).length; },
  quartoOcupantes(n){ return (this.quartos[n] || []).length; },
  isQuartoFull(n)   { return this.quartoOcupantes(n) >= this.hotelCfg.cap; },
};
