# Taskbreak — Auth (Autenticação JWT + Perfis de Acesso)

## Backend

### 5.1 Model
- [x] Criar `backend/app/models/usuario.py` (SQLAlchemy)

### 5.2 Fundação do projeto backend
- [x] Criar `backend/requirements.txt`
- [x] Criar `backend/.env` e `backend/.env.example`
- [x] Criar `backend/app/config.py` (Settings via pydantic-settings)
- [x] Criar `backend/app/database.py` (engine, SessionLocal, Base)
- [x] Criar `backend/app/dependencies.py` (get_db, get_current_user)
- [x] Criar `backend/app/main.py` (FastAPI app, CORS, routers)
- [x] Configurar `alembic.ini` e `alembic/env.py` para apontar ao banco
- [ ] Gerar migration: `alembic revision --autogenerate -m "create_usuarios"`
- [ ] Revisar migration gerada antes de rodar
- [ ] Rodar migration: `alembic upgrade head`

### 5.3 Schemas
- [x] Criar `backend/app/schemas/usuario.py`:
  - `UsuarioLogin` (entrada do login)
  - `UsuarioResponse` (retorno público — sem senha)
  - `TokenResponse` (access_token + usuario)

### 5.4 Service
- [x] Criar `backend/app/utils/security.py`:
  - `hash_senha(senha)` → bcrypt
  - `verificar_senha(senha, hash)` → bool
  - `criar_token(data)` → JWT string
  - `decodificar_token(token)` → payload dict
- [x] Criar `backend/app/services/auth_service.py`:
  - `autenticar(db, usuario, senha)` → Usuario | None
  - `get_usuario_por_id(db, id)` → Usuario | None
  - `seed_usuarios(db)` → cria os 3 usuários demo se não existirem

### 5.5 Router
- [x] Criar `backend/app/routers/auth.py`:
  - `POST /api/auth/login` → retorna token + usuario
  - `GET /api/auth/me` → retorna usuário atual (requer token)
  - `POST /api/auth/logout` → retorna `{ ok: true }`
- [x] Registrar router no `main.py`
- [x] Chamar `seed_usuarios` no startup do app

### 5.6 Teste de API
- [ ] Testar `POST /api/auth/login` com credenciais válidas
- [ ] Testar `POST /api/auth/login` com senha errada → espera 401
- [ ] Testar `GET /api/auth/me` com token válido
- [ ] Testar `GET /api/auth/me` sem token → espera 401
- [ ] Testar `GET /api/auth/me` com token expirado → espera 401
- [ ] Confirmar que o shape retornado bate com o contrato do frontend

## Frontend

### 5.7 Services
- [x] Criar `frontend/src/services/api.js`:
  - Instância axios com `baseURL: http://localhost:8000`
  - Interceptor de request: injeta `Authorization: Bearer <token>` se token existir
  - Interceptor de response: redireciona para `/login` se 401
- [x] Criar `frontend/src/services/authService.js`:
  - `login(usuario, senha)` → POST /api/auth/login
  - `logout()` → remove token do localStorage
  - `getMe()` → GET /api/auth/me
  - `getToken()` / `setToken()` / `removeToken()` → helpers localStorage

### 5.7 Context
- [x] Modificar `frontend/src/context/AuthContext.jsx`:
  - Substituir mock por `authService.login()`
  - Ao iniciar app, chamar `authService.getMe()` para restaurar sessão
  - `logout()` chama `authService.logout()` e redireciona para `/login`

### 5.9 Integration
- [ ] Testar login com cada um dos 3 usuários demo
- [ ] Testar que a sessão persiste após F5 (token no localStorage)
- [ ] Testar logout e redirecionamento para /login
- [ ] Testar que rota protegida redireciona sem token

## Estimativa
Tempo estimado: 3–4 horas

## Status
- [x] TechSpec aprovado
- [ ] EXEC iniciado
- [ ] API testada
- [ ] Frontend integrado
- [ ] Quality Gate
- [ ] Review
- [ ] SEC
