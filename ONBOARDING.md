# FlameOS — Guia Completo do Sistema

## O que é o FlameOS

Sistema desktop de gestão para hamburgueria, construído pelo Adrian. Electron no frontend + FastAPI no backend. Roda localmente no PC do restaurante. Rebrand de "BurgerOS" para "FlameOS" — todo o código e localStorage usam o prefixo `flameos_`.

**Localização:** `c:\ESTUDO2\Dash_Hambuguer`
**Frontend:** `FROTN/` — React 18 + Vite + TailwindCSS 4 + Electron 33
**Backend:** `backend/` — FastAPI + PostgreSQL + SQLAlchemy 2 + Alembic + JWT

---

## Stack completa

| Camada | Tecnologia |
|--------|-----------|
| Desktop shell | Electron 33 |
| UI | React 18 + Vite + TailwindCSS 4 |
| Roteamento | React Router v6 — **HashRouter** (obrigatório para file://) |
| Ícones | Lucide React |
| Gráficos | Recharts |
| HTTP client | Axios |
| API | FastAPI + uvicorn |
| ORM | SQLAlchemy 2 |
| Migrations | Alembic |
| Auth | JWT (python-jose) + passlib bcrypt |
| DB driver | psycopg[binary] (psycopg3) |
| Banco | PostgreSQL 15+ |
| Distribuição | PyInstaller (backend) + electron-builder (frontend) |

---

## Arquitetura de distribuição

O `.exe` final (~99 MB) é **completamente portátil** e inclui:
- Electron runtime com o frontend React bundlado
- Backend Python **embutido** via PyInstaller (`resources/backend/run.exe`)

O Electron (`electron/main.cjs`) na inicialização:
1. Detecta `resources/backend/run.exe` e o spawna como processo filho
2. Aguarda `GET http://127.0.0.1:8000/api/health` responder
3. Só então abre a janela

O backend usa `Base.metadata.create_all()` no lifespan do FastAPI — cria todas as tabelas automaticamente no primeiro start. Seeds automáticos de usuário admin, produtos exemplo e ingredientes.

**PC destino precisa apenas:** PostgreSQL instalado + banco `hamburgueria` criado.

---

## Módulos da aplicação

| Módulo | Rota | Descrição |
|--------|------|-----------|
| **Dashboard** | `/` | Métricas do dia, faturamento por hora (Recharts), top produtos, alertas de estoque baixo, lembretes |
| **Cardápio** | `/cardapio` | CRUD de produtos: nome, categoria, preço, variações, componentes, estoque |
| **Novo Pedido** | `/pedidos/novo` | Criação de pedido: cliente/mesa/balcão, carrinho com obs por item, desconto percentual/fixo, delivery com taxa e endereço |
| **Fila de Pedidos** | `/pedidos` | Kanban: Aguardando → Preparo → Pronto → Entregue. Delivery passa por "A caminho". Modal de pagamento ao entregar. Reabrir pedido. Imprimir comanda/notinha |
| **Cozinha KDS** | `/cozinha` | Espelho da fila para a cozinha. Polling a cada 10s. Exibe itens com obs por item em destaque |
| **Clientes** | `/clientes` | CRUD completo. Badge ⭐ VIP automático (≥ R$100 gasto). Obs. permanente auto-preenche novos pedidos. Histórico de pedidos na sidebar |
| **Mesas** | `/mesas` | Grid de mesas com status e pedidos ativos. Número de mesas configurável |
| **Ingredientes** | `/ingredientes` | CRUD de ingredientes com estoque e estoque mínimo. Ficha técnica por produto (vincula ingredientes) |
| **Financeiro** | `/caixa` | Lançamentos manuais (entrada/saída). Resumo por período. Export CSV de lançamentos e de pedidos |
| **Agenda** | `/agenda` | Agenda de compromissos do restaurante |
| **Sistema** | `/sistema` | Tempo de alerta de pedido atrasado. Som de notificação. Reset de dia. Backups manuais |

---

## Fluxo principal de pedido

```
NovoPedido → selecionar cliente ou mesa → adicionar produtos ao carrinho
  → (opcional) obs por item, desconto, endereço delivery
  → confirmar → pedido entra como "aguardando"

FilaPedidos:
  aguardando → "Iniciar preparo"
  preparo    → "Marcar pronto"
  pronto     → "Entregar" (abre modal de pagamento: dinheiro/cartão/pix/fiado)
               delivery: pronto → "Saiu p/ entrega" (a_caminho) → "Entregar"
  entregue   → vai para aba "Concluídos" (filtrável por data)

Ações extras:
  - Botão "Comanda": imprime comanda sem preço para a cozinha (popup de impressão)
  - Botão "Notinha": imprime recibo com preços para o cliente
  - Botão "Reabrir": devolve pedido pronto/a_caminho para preparo
  - Botão "Cancelar": cancela pedido
```

---

## Schemas principais do backend

### ItemResumoResponse — resposta de itens do pedido
```python
class ItemResumoResponse(BaseModel):
    nome: str
    quantidade: int
    valor_unit: float      # essencial para notinha calcular subtotal
    observacao: Optional[str] = None
```

### PedidoResponse — resposta completa de pedido
```python
class PedidoResponse(BaseModel):
    id: int
    cliente: Optional[str]
    mesa: Optional[str]
    tipo: str              # "mesa" | "balcao" | "delivery"
    itens: list[ItemResumoResponse]
    total: float
    total_final: float     # após desconto e taxa
    status: str
    forma_pagamento: Optional[str]
    observacao: Optional[str]
    desconto: Optional[float]
    desconto_tipo: Optional[str]   # "percentual" | "fixo"
    endereco_entrega: Optional[str]
    taxa_entrega: float
    abertoEm: int          # timestamp em ms
```

---

## Decisões técnicas críticas

| Decisão | Motivo |
|---------|--------|
| **HashRouter** (não BrowserRouter) | Electron usa `file://` — sem servidor HTTP, deep links 404 |
| `$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"` | Obrigatório antes de todo build no Windows sem certificado de signing |
| `Base.metadata.create_all()` no lifespan | Cria tabelas novas sem precisar rodar Alembic; Alembic só para ALTER em tabelas existentes |
| Rota `/produtos-criticos` ANTES de `/ficha/{produto_id}` | FastAPI rota estática deve vir antes da paramétrica — senão captura "produtos-criticos" como ID |
| PyInstaller `--onedir` | Startup muito mais rápido que `--onefile` (que extrai tudo a cada execução) |
| `sys.stdout = open(os.devnull)` no run.py | PyInstaller `--noconsole` seta stdout/stderr como None; uvicorn quebra com AttributeError |
| `from app.main import app` em vez de `"app.main:app"` | PyInstaller não resolve imports dinâmicos por string; import direto é detectado estaticamente |
| `_load_dotenv()` manual no run.py | PyInstaller coloca dados em `_MEIPASS/_internal/`; pydantic-settings não encontra `.env` no CWD padrão |
| `itemResumoResponse.valor_unit` | Notinha imprimia R$ NaN porque `item.subtotal` não existia no schema — adicionado `valor_unit` |
| Backdrop click nos modais | Todos os `fixed inset-0` precisam de `onClick={onFechar}` + `stopPropagation()` no card interno |

---

## Build do executável

```powershell
# 1. Backend (PyInstaller) — precisa estar na pasta backend/ com Python disponível
cd c:\ESTUDO2\Dash_Hambuguer\backend
python -m PyInstaller build_backend.spec --clean -y
# Gera: backend/dist/run/ (~68 MB)

# 2. Frontend + Electron
cd c:\ESTUDO2\Dash_Hambuguer\FROTN
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
npm run build
npx electron-builder --win portable
# Gera: FROTN/dist-electron/FlameOS 1.0.0.exe (~99 MB)
```

---

## localStorage keys

Todas usam prefixo `flameos_`:

| Chave | Onde | Uso |
|-------|------|-----|
| `flameos_token` | authService.js + api.js | JWT de autenticação |
| `flameos_alerta_min` | Sistema.jsx + FilaPedidos + Cozinha | Minutos para pedido "atrasado" |
| `flameos_som` | Sistema.jsx + PedidosContext | Som de alerta de novo pedido |
| `flameos_total_mesas` | Mesas.jsx | Número de mesas do restaurante |
| `flameos_lembretes` | Dashboard.jsx | Lembretes da tela principal |
| `flameos_pedidos_ativos` | main.cjs | Contador para aviso ao fechar |

---

## Alembic migrations existentes

| Revision | Descrição |
|----------|-----------|
| `f5a6b7c8d9e0` | Cria tabelas ingredientes e ficha_tecnicas |
| `g6h7i8j9k0l1` | Adiciona `observacao_padrao` na tabela `clientes` |

---

## Configuração do banco no PC destino

Credenciais padrão bundladas no `.env`:
```
DATABASE_URL=postgresql+psycopg://postgres:real8800@localhost:5432/hamburgueria
SECRET_KEY=burgeros-dev-secret-key-mude-em-producao-32chars
```

Para override sem rebuild: criar `.env` ao lado do `FlameOS.exe` após extração do portátil.

---

## Primeiro login

- **Usuário:** `admin`
- **Senha:** `admin123`
- **Cargo:** Proprietário (acesso total)

O seed é criado automaticamente na primeira inicialização do backend se não existir nenhum usuário.
