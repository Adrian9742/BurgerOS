# TechSpec — Auth (Autenticação JWT + Perfis de Acesso)

> RESEARCH e PRD cobertos pelo CONTEXTO_PROJETO. Esta spec detalha
> a implementação técnica do módulo de autenticação.

---

## Arquitetura

```
Frontend (React)
    └── Login.jsx
         └── authService.js          → POST /api/auth/login
              └── api.js (axios)     → interceptor JWT automático

Backend (FastAPI)
    └── routers/auth.py              → /api/auth/login, /api/auth/me
         └── services/auth_service.py
              └── utils/security.py  → bcrypt + jwt
                   └── models/usuario.py (SQLAlchemy)
                        └── PostgreSQL (tabela usuarios)
```

**Fluxo de login:**
1. Frontend envia `{ usuario, senha }` para `POST /api/auth/login`
2. Backend valida credenciais, retorna `{ access_token, token_type, usuario }`
3. Frontend salva token no `localStorage`
4. Toda requisição subsequente envia `Authorization: Bearer <token>`
5. Backend valida JWT via `Depends(get_current_user)` em cada rota protegida

---

## Banco de dados

| Tabela    | Operação | Campos                                                             |
|-----------|----------|--------------------------------------------------------------------|
| `usuarios` | CREATE   | `id`, `nome`, `email`, `usuario`, `senha_hash`, `cargo`, `ativo`, `criado_em` |

```sql
CREATE TABLE usuarios (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) UNIQUE,
    usuario     VARCHAR(50) UNIQUE NOT NULL,
    senha_hash  VARCHAR(255) NOT NULL,
    cargo       VARCHAR(20) NOT NULL,   -- 'Proprietário' | 'Caixa' | 'Garçom'
    ativo       BOOLEAN DEFAULT TRUE,
    criado_em   TIMESTAMP DEFAULT NOW()
);
```

**Seed obrigatório (3 usuários demo):**
| usuario  | senha  | cargo        |
|----------|--------|--------------|
| ricardo  | 123456 | Proprietário |
| caixa    | 123456 | Caixa        |
| garcom   | 123456 | Garçom       |

---

## Contrato de API

| Método | Rota             | Auth | Body                            | Response (200)                                          |
|--------|------------------|------|---------------------------------|---------------------------------------------------------|
| POST   | `/api/auth/login` | Não  | `{ usuario: str, senha: str }`  | `{ access_token, token_type: "bearer", usuario: {...} }` |
| GET    | `/api/auth/me`    | Sim  | —                               | `{ id, nome, email, usuario, cargo }`                    |
| POST   | `/api/auth/logout`| Sim  | —                               | `{ ok: true }` (invalida token no frontend)             |

**Shape do objeto `usuario` retornado no login (contrato do frontend):**
```json
{
  "id": 1,
  "nome": "Ricardo Mendes",
  "email": "ricardo@burgerhouse.com.br",
  "usuario": "ricardo",
  "cargo": "Proprietário"
}
```

**Erros esperados:**
| Código | Situação                  |
|--------|---------------------------|
| 401    | Credenciais inválidas      |
| 401    | Token ausente ou expirado  |
| 403    | Usuário inativo (`ativo=false`) |

**JWT config:**
- Algoritmo: HS256
- Expiração: 8 horas (turno de trabalho)
- Payload: `{ sub: usuario, cargo: cargo, exp: ... }`

---

## Arquivos impactados

### Backend (todos a CRIAR)
```
backend/
├── app/
│   ├── main.py                  → CREATE — app FastAPI, CORS, routers
│   ├── config.py                → CREATE — settings (SECRET_KEY, DB_URL, etc.)
│   ├── database.py              → CREATE — engine + SessionLocal + Base
│   ├── dependencies.py          → CREATE — get_db(), get_current_user()
│   ├── models/
│   │   └── usuario.py           → CREATE — model SQLAlchemy
│   ├── schemas/
│   │   └── usuario.py           → CREATE — UsuarioCreate, UsuarioResponse, TokenResponse
│   ├── routers/
│   │   └── auth.py              → CREATE — /login, /me, /logout
│   ├── services/
│   │   └── auth_service.py      → CREATE — autenticar(), get_usuario_por_id()
│   └── utils/
│       └── security.py          → CREATE — hash_senha(), verificar_senha(), criar_token(), decodificar_token()
├── alembic/                     → CREATE — init alembic
├── alembic.ini                  → CREATE
├── requirements.txt             → CREATE
└── .env                         → CREATE (não commitar)
```

### Frontend (a CRIAR/MODIFICAR)
```
frontend/src/
├── services/
│   ├── api.js                   → CREATE — instância axios + interceptor JWT
│   └── authService.js           → CREATE — login(), logout(), getMe()
└── context/
    └── AuthContext.jsx          → MODIFY — trocar mock por authService
```

---

## Riscos técnicos

| Risco | Mitigação |
|-------|-----------|
| PostgreSQL não instalado na máquina | Documentar instalação no README; verificar no start.bat |
| Token expirado enquanto app está aberto | Interceptor axios redireciona para /login automaticamente |
| CORS bloqueando requisição Electron | Configurar CORS no FastAPI para aceitar localhost:5173 e file:// |
| SECRET_KEY hardcoded | Sempre via .env, nunca no código |

---

## Status
- [x] TechSpec criado
- [ ] Taskbreak aprovado
- [ ] EXEC iniciado
