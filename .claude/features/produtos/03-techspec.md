# TechSpec — Produtos (Cardápio CRUD)

> RESEARCH e PRD cobertos pelo CONTEXTO_PROJETO.

---

## Arquitetura

```
Frontend
    └── Cardapio.jsx
         └── produtosService.js   → GET/POST/PUT/PATCH/DELETE /api/produtos
              └── api.js (axios + JWT automático)

Backend
    └── routers/produtos.py
         └── services/produtos_service.py
              └── models/produto.py (SQLAlchemy)
                   └── PostgreSQL (tabela produtos)
```

---

## Banco de dados

| Tabela    | Operação | Campos |
|-----------|----------|--------|
| `produtos` | CREATE  | `id`, `nome`, `descricao`, `categoria`, `valor`, `disponivel`, `criado_em` |

```sql
CREATE TABLE produtos (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    descricao   TEXT,
    categoria   VARCHAR(50) NOT NULL,
    valor       NUMERIC(10,2) NOT NULL,
    disponivel  BOOLEAN DEFAULT TRUE NOT NULL,
    criado_em   TIMESTAMP DEFAULT NOW()
);
```

---

## Contrato de API

| Método | Rota                             | Auth | Body              | Response         |
|--------|----------------------------------|------|-------------------|------------------|
| GET    | `/api/produtos`                  | Sim  | —                 | `ProdutoResponse[]` |
| POST   | `/api/produtos`                  | Sim  | `ProdutoCreate`   | `ProdutoResponse`   |
| PUT    | `/api/produtos/{id}`             | Sim  | `ProdutoUpdate`   | `ProdutoResponse`   |
| DELETE | `/api/produtos/{id}`             | Sim  | —                 | `{ ok: true }`      |
| PATCH  | `/api/produtos/{id}/disponivel`  | Sim  | —                 | `ProdutoResponse`   |

**Shape ProdutoResponse (contrato do frontend):**
```json
{
  "id": 1,
  "nome": "X-Burger Clássico",
  "descricao": "Pão brioche, hambúrguer 160g, queijo, alface e tomate",
  "categoria": "Hambúrgueres",
  "valor": 28.90,
  "disponivel": true
}
```

**Categorias válidas (enum):**
`"Hambúrgueres"` | `"Acompanhamentos"` | `"Bebidas s/ álcool"` | `"Bebidas c/ álcool"`

---

## Arquivos impactados

### Backend (todos a CRIAR exceto main.py)
```
backend/app/
├── models/produto.py            → CREATE
├── schemas/produto.py           → CREATE
├── services/produtos_service.py → CREATE (inclui seed de 14 produtos demo)
├── routers/produtos.py          → CREATE
└── main.py                      → MODIFY (incluir router + chamar seed)
```

### Frontend
```
FROTN/src/
├── utils/constants.js           → CREATE (CATEGORIAS, STATUS_PEDIDO, etc.)
├── services/produtosService.js  → CREATE
└── pages/cardapio/Cardapio.jsx  → MODIFY (substituir mock por service)
```

---

## Riscos técnicos
| Risco | Mitigação |
|-------|-----------|
| Exclusão de produto que está em pedido aberto | Soft delete via `disponivel=false` em vez de DELETE real (fase futura) — por ora DELETE direto com FK constraint avisando |
| `valor` como float → imprecisão decimal | Usar `NUMERIC(10,2)` no banco e `Decimal` no Python |
