# ViagemFácil — Sistema de Gestão de Excursões

## Como usar

1. Abra **`login.html`** no navegador — esta é a página de entrada.

---

## Acessos de Demonstração

### 🛡️ Administrador
- **Usuário:** `admin`
- **Senha:** `admin123`
- **Acesso:** Painel completo (viajantes, ônibus, hotel, pagamentos)

### 🎒 Viajantes de Exemplo
Todos usam a senha: **`viagem123`**

| Nome | CPF |
|---|---|
| Maria Santos | 123.456.789-00 |
| João Oliveira | 234.567.890-11 |
| Ana Lima | 345.678.901-22 |
| Pedro Souza | 456.789.012-33 |
| Carla Mendes | 567.890.123-44 |
| Lucas Ferreira | 678.901.234-55 |

---

## Estrutura de Arquivos

```
viagem-facil/
├── login.html        ← Entrada do sistema (ABRIR AQUI)
├── index.html        ← Painel do Administrador
├── viajante.html     ← Portal do Viajante
├── css/
│   ├── variables.css
│   ├── layout.css
│   ├── components.css
│   └── screens.css
└── js/
    ├── state.js      ← Estado global
    ├── utils.js      ← Utilitários
    ├── nav.js        ← Navegação
    ├── auth.js       ← Autenticação e guarda de rotas
    ├── cadastro.js   ← CRUD viajantes
    ├── onibus.js     ← Mapa de assentos
    ├── hotel.js      ← Alocação de quartos
    ├── pagamentos.js ← Controle financeiro
    ├── extras.js     ← Exportação CSV
    └── init.js       ← Inicialização
```

## Portais

- **ADM:** acesso completo a todos os cadastros, dados reais, CPF/tel completos
- **Viajante:** vê apenas seu assento, quarto, pagamentos e dados da viagem — sem acesso aos dados de outros
