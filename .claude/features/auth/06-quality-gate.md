# Quality Gate — Auth

## Checklist

### Banco
- [ ] Migration roda sem erros: `alembic upgrade head`
- [ ] Migration reverte sem erros: `alembic downgrade -1`
- [x] Nenhuma alteração manual no banco

### Backend
- [x] `POST /api/auth/login` retorna `{ access_token, token_type, usuario }`
- [x] `GET /api/auth/me` protegido por JWT via `Depends(get_current_user)`
- [x] Login com senha errada retorna 401
- [x] Rota protegida sem token retorna 401
- [x] Seed dos 3 usuários demo roda no startup
- [x] Nenhum `print()` de debug no código

### Frontend
- [x] `AuthContext` restaura sessão via `getMe()` ao carregar o app
- [x] Token salvo no localStorage com chave `burgeros_token`
- [x] Interceptor axios injeta `Authorization: Bearer` automaticamente
- [x] Interceptor axios redireciona para `/login` no 401
- [x] `logout()` remove token e zera estado do usuário
- [ ] Testado com os 3 cargos (Proprietário, Caixa, Garçom)

### Geral
- [x] `.env` não comitado — apenas `.env.example`
- [x] `SECRET_KEY` vem do `.env`, nunca hardcoded
