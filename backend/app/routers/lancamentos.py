from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.dependencies import get_db, requer_cargo
from app.schemas.lancamento import LancamentoCreate, LancamentoResponse
from app.services import lancamentos_service
from app.models.usuario import Usuario
from app.models.pedido import Pedido, ItemPedido

router = APIRouter(prefix="/api/financeiro", tags=["financeiro"])

_CAIXA_OU_ADMIN = requer_cargo("Proprietário", "Caixa")


@router.get("/lancamentos", response_model=list[LancamentoResponse])
def listar(
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(_CAIXA_OU_ADMIN),
):
    return lancamentos_service.listar(db, data_inicio, data_fim)


@router.get("/pagamentos")
def breakdown_pagamentos(
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(_CAIXA_OU_ADMIN),
):
    hoje = date.today()
    inicio = data_inicio or hoje
    fim = data_fim or hoje

    resultados = (
        db.query(
            Pedido.forma_pagamento,
            func.count(Pedido.id).label("count"),
            func.sum(ItemPedido.quantidade * ItemPedido.valor_unit).label("total"),
        )
        .join(ItemPedido, ItemPedido.pedido_id == Pedido.id)
        .filter(
            Pedido.status == "entregue",
            Pedido.forma_pagamento.isnot(None),
            func.date(Pedido.criado_em) >= inicio,
            func.date(Pedido.criado_em) <= fim,
        )
        .group_by(Pedido.forma_pagamento)
        .all()
    )

    _labels = {"dinheiro": "Dinheiro", "cartao": "Cartão", "pix": "PIX", "fiado": "Fiado"}
    return [
        {
            "forma": r.forma_pagamento,
            "label": _labels.get(r.forma_pagamento, r.forma_pagamento),
            "pedidos": int(r.count),
            "total": round(float(r.total or 0), 2),
        }
        for r in resultados
    ]


@router.delete("/lancamentos/{lancamento_id}", status_code=204)
def deletar(
    lancamento_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(_CAIXA_OU_ADMIN),
):
    lancamentos_service.deletar(db, lancamento_id)


@router.post("/lancamentos", response_model=LancamentoResponse, status_code=201)
def criar(
    dados: LancamentoCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(_CAIXA_OU_ADMIN),
):
    return lancamentos_service.criar(db, dados, usuario_atual.id)
