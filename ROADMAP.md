# BurgerOS — Roadmap de Instalação e Uso

> Sistema de Gestão para Hamburgueria  
> Stack: React 18 + Vite + TailwindCSS + Electron (frontend) · FastAPI + PostgreSQL + SQLAlchemy (backend)

---

## 1. Pré-requisitos

### 1.1 PostgreSQL
1. Baixe o instalador em https://www.postgresql.org/download/windows/
2. Instale com as configurações padrão, porta `5432`
3. Durante a instalação defina a senha do usuário `postgres` como `real8800`
4. Ao final o serviço PostgreSQL inicia automaticamente com o Windows

Criar o banco de dados (execute no terminal ou no pgAdmin):
```sql
CREATE DATABASE hamburgueria;
```

### 1.2 Python 3.10 ou superior
1. Baixe em https://www.python.org/downloads/
2. Na instalação, marque **"Add Python to PATH"**
3. Verifique: `python --version`

### 1.3 Dependências do Backend
```powershell
cd "c:\ESTUDO2\Dash_Hambuguer\backend"
pip install -r requirements.txt
```

Pacotes principais:
- `fastapi`, `uvicorn[standard]`
- `sqlalchemy`, `alembic`
- `psycopg[binary]` (driver PostgreSQL)
- `python-jose[cryptography]` (JWT)
- `pydantic-settings`

### 1.4 Node.js 18+
Baixe em https://nodejs.org/ — necessário apenas para desenvolvimento ou rebuild.

---

## 2. Configuração Inicial

### 2.1 Variáveis de Ambiente
Crie o arquivo `backend/.env`:
```
DATABASE_URL=postgresql+psycopg://postgres:real8800@localhost:5432/hamburgueria
SECRET_KEY=burgeros_secret_key_troque_em_producao
```

### 2.2 Migrations do Banco de Dados
```powershell
cd "c:\ESTUDO2\Dash_Hambuguer\backend"
python -m alembic upgrade head
```

Este comando cria todas as tabelas automaticamente.

### 2.3 Iniciar o Backend (desenvolvimento)
```powershell
cd "c:\ESTUDO2\Dash_Hambuguer\backend"
uvicorn app.main:app --reload --port 8000
```

### 2.4 Iniciar o Frontend (desenvolvimento)
```powershell
cd "c:\ESTUDO2\Dash_Hambuguer\FROTN"
npm install
npm run electron:dev
```

---

## 3. Primeiro Acesso

Ao abrir o sistema pela primeira vez, os seguintes dados são criados automaticamente:

| Cargo       | Usuário    | Senha  |
|-------------|------------|--------|
| Proprietário | admin      | admin123 |
| Caixa       | caixa      | caixa123 |
| Garçom      | garcom     | garcom123 |

**Altere as senhas no menu Perfil após o primeiro login.**

---

## 4. Construir o Instalador Windows (.exe)

### 4.1 Preparar o ambiente de build

```powershell
# Na primeira vez, configurar variáveis necessárias:
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"

# Criar arquivos dummy para winCodeSign (necessário no Windows)
$winCodeSignDir = "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0\darwin\10.12\lib"
New-Item -ItemType Directory -Force -Path $winCodeSignDir
"" | Out-File -FilePath "$winCodeSignDir\libcrypto.dylib" -Encoding ascii
"" | Out-File -FilePath "$winCodeSignDir\libssl.dylib" -Encoding ascii
```

### 4.2 Gerar o instalador

```powershell
cd "c:\ESTUDO2\Dash_Hambuguer\FROTN"
npm run electron:build
```

O instalador `.exe` estará em `FROTN/dist-electron/`.

### 4.3 Instalar em outro PC

1. Copie o `.exe` para o computador destino
2. Execute o instalador
3. O NSIS verifica Python automaticamente e baixa Python 3.12 se necessário
4. Após instalação, o BurgerOS aparece no Menu Iniciar e na Área de Trabalho

**Requisito no PC destino:** PostgreSQL instalado e rodando com banco `hamburgueria` criado.

---

## 5. Funcionalidades do Sistema

### 5.1 Dashboard
- Resumo financeiro do dia (total entradas, pedidos entregues, ticket médio)
- Pedidos por status em tempo real
- Gráfico semanal de faturamento

### 5.2 Fila de Pedidos (Kanban)
- 4 colunas: Aguardando → Em Preparo → Pronto → Entregue
- Avanço de status com botão por coluna
- **Ao entregar:** modal de forma de pagamento (Dinheiro / Cartão / PIX / Fiado)
- Badge colorido com forma de pagamento no card entregue
- Cancelamento com confirmação
- Cronômetro por pedido + alerta visual (laranja) após 15 minutos
- **Alerta sonoro** quando novo pedido chega (configurável em Sistema)
- Impressão de notinha (abre janela de impressão do SO)

### 5.3 Novo Pedido
- Busca de cliente por nome
- Seleção de mesa (opcional)
- Catálogo de produtos com busca
- Observações por item
- Resumo do pedido antes de confirmar

### 5.4 Cardápio
- Cadastro / edição / ativação / desativação de produtos
- Categorias e preços
- Disponibilidade para garçom na hora de montar pedido

### 5.5 Financeiro (Caixa)
- Lançamentos de entrada e saída manuais
- Filtro por período (data início / data fim)
- Botão "Hoje" para retornar ao dia atual
- Total calculado do período selecionado
- Pedidos entregues criam lançamento automático
- Validação: valores negativos ou zero são bloqueados

### 5.6 Clientes
- Cadastro completo (nome, telefone, email, endereço)
- Histórico de total gasto e último pedido
- Edição e exclusão (com confirmação)

### 5.7 Agenda
- Compromissos e reservas com hora e descrição
- Filtro por data

### 5.8 Perfil
- Alteração de nome e senha do usuário logado

### 5.9 Sistema
- **Toggle de alerta sonoro** — ativa/desativa beep ao receber pedido
- **Backup manual** do banco de dados
- **Histórico de backups** com data, nome e tamanho
- Informações da versão do sistema

---

## 6. Backup e Segurança

### Backup Automático
- O Electron realiza `pg_dump` automaticamente a cada 24 horas
- Na inicialização verifica se o último backup tem mais de 24h e roda se necessário
- Arquivos salvos em: `%AppData%\BurgerOS\backups\`
- Mantém os últimos **30 backups** (automaticamente remove os mais antigos)

### Backup Manual
- Acesse **Sistema** → botão **"Backup agora"**

### Restaurar um Backup
```powershell
psql -U postgres -d hamburgueria -f "caminho\para\backup-YYYY-MM-DD_HH-MM.sql"
```

### Segurança
- Autenticação JWT (expira em 8 horas)
- RBAC: Proprietário > Caixa > Garçom
- Backend acessível apenas localmente (127.0.0.1:8000)
- Token armazenado em localStorage

---

## 7. RBAC — Permissões por Cargo

| Funcionalidade         | Garçom | Caixa | Proprietário |
|------------------------|--------|-------|--------------|
| Ver pedidos / criar    | ✅     | ✅    | ✅           |
| Alterar status pedido  | ✅     | ✅    | ✅           |
| Ver financeiro         | ❌     | ✅    | ✅           |
| Criar lançamento       | ❌     | ✅    | ✅           |
| Gerenciar cardápio     | ❌     | ❌    | ✅           |
| Gerenciar clientes     | ❌     | ✅    | ✅           |
| Gerenciar usuários     | ❌     | ❌    | ✅           |

---

## 8. Arquitetura Técnica

```
BurgerOS/
├── backend/                  # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── main.py           # Lifespan, CORS, routers
│   │   ├── config.py         # Configurações via .env
│   │   ├── database.py       # Engine SQLAlchemy
│   │   ├── dependencies.py   # get_db, get_current_user, requer_cargo
│   │   ├── models/           # Pedido, Produto, Cliente, Usuario, Lancamento...
│   │   ├── schemas/          # Pydantic schemas de entrada/saída
│   │   ├── routers/          # auth, pedidos, produtos, clientes, financeiro...
│   │   └── services/         # Lógica de negócio
│   └── alembic/              # Migrations do banco
│       └── versions/
├── FROTN/                    # Electron + Vite + React
│   ├── electron/
│   │   ├── main.cjs          # Main process: backend spawn, backup, IPC
│   │   └── preload.cjs       # Bridge segura main ↔ renderer (backup API)
│   └── src/
│       ├── context/          # AuthContext, PedidosContext (polling 10s), ToastContext
│       ├── pages/            # Dashboard, Pedidos, Cardápio, Financeiro, Clientes...
│       ├── services/         # api.js (axios), pedidosService, financeiroService...
│       ├── components/       # Layout, Sidebar, Header, LoadingSpinner
│       └── utils/            # format.js, notinha.js, constants.js
└── ROADMAP.md                # Este arquivo
```

### Comunicação Frontend ↔ Backend
- Axios com interceptor de request (injeta Bearer token)
- Interceptor de response: 401 → redireciona para `/#/login`
- HashRouter (obrigatório para Electron file:// protocol)
- CORS: permite `"null"` como origin (file:// envia `Origin: null`)

### Electron IPC (Renderer → Main)
| Canal                | Retorno                     |
|----------------------|-----------------------------|
| `backup:executar`    | `{ ok: true }`              |
| `backup:listar`      | `[{ nome, tamanho, data }]` |

---

## 9. Erros Conhecidos e Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| `Backend não respondeu em tempo` | uvicorn corrompido (`~vicorn` na pasta site-packages) | Remover pasta `~vicorn` e `~qlalchemy` do site-packages, reinstalar: `pip install -r requirements.txt` |
| Login pisca e fecha | CORS rejeitando `null` origin + redirect errado + polling sem token | Já corrigido: `"null"` em allow_origins, `window.location.replace('/#/login')`, check `getToken()` no PedidosContext |
| `Cannot create symbolic link` no build | winCodeSign tenta criar symlinks sem permissão | Criar arquivos dummy em `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0\darwin\10.12\lib\` |
| `WriteStream fd:null` no spawn | `fs.createWriteStream` ainda não abriu o fd | Usar `fs.openSync(path, "a")` que retorna fd numérico imediatamente |
| NSIS warning 6000 | `$` em strings NSIS interpretado como variável | Escapar como `$ProgressPreference` e adicionar `warningsAsErrors: false` |
| `allowDirChange` unknown property | Nome errado no electron-builder | Usar `allowToChangeInstallationDirectory` |

---

## 10. Roadmap de Funcionalidades Futuras

### Fase 2 (atual)
- [x] Formas de pagamento (Dinheiro / Cartão / PIX / Fiado)
- [x] Alertas sonoros em novos pedidos
- [x] Backup automático diário + manual
- [x] Página de Sistema (configurações)
- [ ] Fechamento de turno / caixa
- [ ] Relatório exportável (CSV / PDF)

### Fase 3
- [ ] Combos e variações de produto (tamanho, ponto da carne)
- [ ] Controle de estoque com alertas de baixo estoque
- [ ] Mapa visual de mesas

### Fase 4
- [ ] Programa de fidelidade (pontos por compra)
- [ ] QR Code na mesa para pedido pelo celular
- [ ] Integração com impressora térmica (ESC/POS)
- [ ] Relatório de desempenho por funcionário
