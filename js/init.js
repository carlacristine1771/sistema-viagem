/* ══════════════════════════════════════
   VIAGEM FÁCIL — App Initialization
   ══════════════════════════════════════ */

(function initApp() {
  const samples = [
    { nome:'Maria Santos',    cpf:'123.456.789-00', tel:'(61) 99901-1111', valor:380, gen:'Feminino',  nasc:'1980-03-15', email:'maria@email.com' },
    { nome:'João Oliveira',   cpf:'234.567.890-11', tel:'(61) 99902-2222', valor:380, gen:'Masculino', nasc:'1975-07-22', email:'joao@email.com' },
    { nome:'Ana Lima',        cpf:'345.678.901-22', tel:'(61) 99903-3333', valor:420, gen:'Feminino',  nasc:'1992-11-08', email:'ana@email.com' },
    { nome:'Pedro Souza',     cpf:'456.789.012-33', tel:'(61) 99904-4444', valor:380, gen:'Masculino', nasc:'1988-05-30', email:'pedro@email.com' },
    { nome:'Carla Mendes',    cpf:'567.890.123-44', tel:'(61) 99905-5555', valor:380, gen:'Feminino',  nasc:'1995-02-18', email:'carla@email.com' },
    { nome:'Lucas Ferreira',  cpf:'678.901.234-55', tel:'(61) 99906-6666', valor:350, gen:'Masculino', nasc:'2000-09-12', email:'lucas@email.com' },
  ];

  samples.forEach((d, i) => {
    const id = 1000 + i;
    App.viajantes.push({ id, ...d, obs: '', status: 'Pendente', assento: null, quarto: null, createdAt: today() });
    App.pagamentos[id] = { pago: 0, hist: [] };
  });

  // Pre-load some payments
  App.pagamentos[1000].pago = 380;
  App.pagamentos[1000].hist.push({ val: 380, met: '📱 PIX',       obs: 'Pagamento integral', data: '10/01/2025', hora: '09:15' });
  App.viajantes[0].status = 'Confirmado';

  App.pagamentos[1001].pago = 200;
  App.pagamentos[1001].hist.push({ val: 200, met: '💵 Dinheiro',  obs: '1ª parcela',         data: '09/02/2025', hora: '14:30' });

  App.pagamentos[1002].pago = 420;
  App.pagamentos[1002].hist.push({ val: 200, met: '💳 Cartão',    obs: '1ª parcela',         data: '15/02/2025', hora: '10:00' });
  App.pagamentos[1002].hist.push({ val: 220, met: '📱 PIX',       obs: 'Saldo restante',     data: '05/03/2025', hora: '16:45' });
  App.viajantes[2].status = 'Confirmado';

  App.pagamentos[1004].pago = 100;
  App.pagamentos[1004].hist.push({ val: 100, met: '🏦 Transferência', obs: 'Entrada',        data: '20/03/2025', hora: '11:00' });

  // Render initial screen
  renderCadastro();
  updStats();
  syncSelects();
  renderBus();
  renderHotel();
})();

// ── Save initial state so viajante.html can read it ──────────────
// (saveAppState is defined in auth.js which loads after init.js)
window.addEventListener('load', () => {
  if (typeof saveAppState === 'function') saveAppState();
});

// ── Patch mutation functions to auto-save state ───────────────────
(function patchForSave() {
  const fns = ['adicionarViajante','confirmarV','removerViajante',
                'confirmarAssento','liberarAssento',
                'alocarQuarto','liberarQuarto','cfgHotel',
                'registrarPagamento'];
  fns.forEach(name => {
    const orig = window[name];
    if (typeof orig === 'function') {
      window[name] = function(...args) {
        const result = orig.apply(this, args);
        if (typeof saveAppState === 'function') saveAppState();
        return result;
      };
    }
  });
})();
