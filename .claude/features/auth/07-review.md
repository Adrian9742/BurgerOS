# Review — Auth

## Padrões de código

### Backend
- [x] Lógica de negócio no `auth_service.py`, não no router
- [x] Schemas separados: `UsuarioLogin` (entrada), `UsuarioResponse` (saída), `TokenResponse`
- [x] Dependências injetadas via `Depends()` — `get_db`, `get_current_user`
- [x] Senhas hasheadas com bcrypt via `passlib` — nunca em texto puro
- [x] JWT validado em `dependencies.py` via `OAuth2PasswordBearer`
- [x] `datetime.now(timezone.utc)` usado (não `utcnow()` deprecated)

### Frontend
- [x] Chamadas HTTP centralizadas em `services/authService.js`
- [x] `AuthContext` não faz chamadas HTTP diretas — delega ao service
- [x] Token gerenciado por funções isoladas (`getToken`, `setToken`, `removeToken`)

## Inconsistências encontradas
- Nenhuma
