from datetime import date, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.lancamento import Lancamento
from app.models.pedido import Pedido
from app.services.configuracoes_service import get_valor

_DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]


def get_metricas(db: Session) -> dict:
    _META_SEMANAL = float(get_valor(db, "meta_semanal") or 10500.0)
    _META_DIARIA = round(_META_SEMANAL / 7, 2)
    hoje = date.today()
    inicio_semana = hoje - timedelta(days=6)
    dias = [hoje - timedelta(days=i) for i in range(6, -1, -1)]

    vendas_por_data = dict(
        db.query(
            func.date(Lancamento.criado_em).label("data"),
            func.sum(Lancamento.valor).label("total"),
        )
        .filter(
            func.date(Lancamento.criado_em) >= inicio_semana,
            Lancamento.tipo == "entrada",
        )
        .group_by(func.date(Lancamento.criado_em))
        .all()
    )

    vendas_semana = []
    total_vendas = 0.0
    for dia in dias:
        vendas_dia = float(vendas_por_data.get(dia, 0) or 0)
        total_vendas += vendas_dia
        vendas_semana.append({
            "dia": _DIAS_SEMANA[dia.weekday()],
            "vendas": round(vendas_dia, 2),
            "meta": _META_DIARIA,
        })

    pedidos_semana = db.query(func.count(Pedido.id)).filter(
        Pedido.status == "entregue",
        func.date(Pedido.criado_em) >= inicio_semana,
    ).scalar() or 0

    pedidos_hoje = db.query(func.count(Pedido.id)).filter(
        Pedido.status == "entregue",
        func.date(Pedido.criado_em) == hoje,
    ).scalar() or 0

    ticket_medio = total_vendas / pedidos_semana if pedidos_semana > 0 else 0
    meta_atingida = round((total_vendas / _META_SEMANAL) * 100) if _META_SEMANAL > 0 else 0

    return {
        "vendasSemana": vendas_semana,
        "totalVendas": round(total_vendas, 2),
        "pedidosConcluidos": pedidos_semana,
        "pedidosHoje": pedidos_hoje,
        "ticketMedio": round(ticket_medio, 2),
        "metaAtingida": meta_atingida,
        "totalMeta": _META_SEMANAL,
    }
