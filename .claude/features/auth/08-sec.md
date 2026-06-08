# SEC — Auth

## Checklist de segurança

### Auth
- [x] `/api/auth/me` exige token válido via `Depends(get_current_user)`
- [x] Token não exposto em URL — enviado apenas no header `Authorization`
- [x] JWT expira em 8h (turno de trabalho)
- [x] Payload do JWT contém apenas `sub` (id) e `cargo` — sem dados sensíveis

### Banco
- [x] Queries usam SQLAlchemy ORM — sem SQL cru com f-string
- [x] Senhas armazenadas como bcrypt hash — nunca em texto puro

### Dados
- [x] Input validado com Pydantic (`UsuarioLogin`) antes de chegar no banco
- [x] Erro de login retorna mensagem genérica ("Usuário ou senha inválidos") — não revela qual campo está errado

### Offline / Local
- [x] `.env` fora do repositório
- [x] PostgreSQL escuta apenas `localhost` por padrão

## Vulnerabilidades encontradas
| Severidade | Descrição | Decisão |
|------------|-----------|---------|
| Baixa | `SECRET_KEY` no `.env` local é fraca (dev) | Aceitável em dev — documentado no `.env.example` para trocar em produção |
