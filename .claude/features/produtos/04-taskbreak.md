# Taskbreak — Produtos (Cardápio CRUD)

## Backend

### 5.1 Model
- [x] Criar `backend/app/models/produto.py`

### 5.2 Migration
- [ ] Gerar migration: `alembic revision --autogenerate -m "create_produtos"`
- [ ] Revisar migration gerada
- [ ] Rodar: `alembic upgrade head`

### 5.3 Schemas
- [x] Criar `backend/app/schemas/produto.py`:
  - `CategoriaEnum` (Hambúrgueres, Acompanhamentos, Bebidas s/ álcool, Bebidas c/ álcool)
  - `ProdutoCreate`
  - `ProdutoUpdate`
  - `ProdutoResponse`

### 5.4 Service
- [x] Criar `backend/app/services/produtos_service.py`:
  - `listar(db)` → lista todos
  - `buscar(db, id)` → produto ou 404
  - `criar(db, dados)` → novo produto
  - `atualizar(db, id, dados)` → produto atualizado
  - `remover(db, id)` → deleta
  - `alternar_disponivel(db, id)` → toggle
  - `seed_produtos(db)` → 14 produtos demo

### 5.5 Router
- [x] Criar `backend/app/routers/produtos.py`
- [x] Atualizar `backend/app/main.py` (router + seed)

### 5.6 Teste de API
- [ ] GET /api/produtos → lista 14 produtos do seed
- [ ] POST /api/produtos → cria produto
- [ ] PUT /api/produtos/{id} → atualiza
- [ ] DELETE /api/produtos/{id} → remove
- [ ] PATCH /api/produtos/{id}/disponivel → toggle
- [ ] Sem token → 401

## Frontend

### 5.7 Services + Constants
- [x] Criar `FROTN/src/utils/constants.js`
- [x] Criar `FROTN/src/services/produtosService.js`

### 5.7 Cardápio
- [x] Modificar `Cardapio.jsx`:
  - Remover import do mock
  - Carregar produtos via API no mount
  - `salvar` → cria ou atualiza via API
  - `remover` → deleta via API
  - `alternarDisponivel` → PATCH via API

### 5.9 Integration
- [ ] Testar CRUD completo com banco rodando
- [ ] Verificar que produtos do seed aparecem ao abrir a tela

## Estimativa
Tempo estimado: 2 horas

## Status
- [x] TechSpec aprovado
- [x] EXEC iniciado
- [ ] API testada
- [ ] Frontend integrado
- [ ] Quality Gate
