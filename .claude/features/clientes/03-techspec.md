# TechSpec — Clientes

## Contrato de API

| Método | Rota                          | Auth | Body             | Response             |
|--------|-------------------------------|------|------------------|----------------------|
| GET    | `/api/clientes`               | Sim  | —                | `ClienteResponse[]`  |
| POST   | `/api/clientes`               | Sim  | `ClienteCreate`  | `ClienteResponse`    |
| GET    | `/api/clientes/{id}/historico`| Sim  | —                | `HistoricoItem[]`    |

**ClienteResponse:**
```json
{ "id": 1, "nome": "Marina Costa", "telefone": "(11) 98765-4321", "totalGasto": 487.30, "ultimoPedido": "2026-06-07" }
```

**HistoricoItem** (retorno simplificado de pedidos do cliente):
```json
{ "id": 1051, "status": "entregue", "itens": "1x Smash Triplo, 1x Batata Frita", "total": 87.70, "data": "2026-06-07" }
```
> Endpoint de histórico retorna `[]` agora — será populado quando o módulo Pedidos for integrado.
