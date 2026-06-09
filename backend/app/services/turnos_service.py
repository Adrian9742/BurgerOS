from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.turno import Turno
from app.models.lancamento import Lancamento
from app.models.pedido import Pedido
from app.schemas.turno import TurnoResponse


def _to_response(t: Turno, total_entrada: float | None = None, total_saida: float | None = None, pedidos: int | None = None) -> TurnoResponse:
    return TurnoResponse(
        id=t.id,
        abertura=t.abertura,
        fechamento=t.fechamento,
        caixa_inicial=float(t.caixa_inicial or 0),
        total_entrada=total_entrada if total_entrada is not None else float(t.total_entrada),
        total_saida=total_saida if total_saida is not None else float(t.total_saida),
        pedidos_entregues=pedidos if pedidos is not None else t.pedidos_entregues,
        observacao=t.observacao,
        operador=t.usuario.nome if t.usuario else None,
        aberto=t.fechamento is None,
    )


def turno_atual(db: Session) -> TurnoResponse | None:
    t = db.query(Turno).filter(Turno.fechamento.is_(None)).order_by(Turno.abertura.desc()).first()
    if not t:
        return None
    # Totais ao vivo calculados a partir dos lançamentos desde a abertura
    lancamentos = db.query(Lancamento).filter(Lancamento.criado_em >= t.abertura).all()
    entrada = sum(float(l.valor) for l in lancamentos if l.tipo == "entrada")
    saida = sum(float(l.valor) for l in lancamentos if l.tipo == "saida")
    pedidos = db.query(Pedido).filter(
        Pedido.status == "entregue",
        Pedido.criado_em >= t.abertura,
    ).count()
    return _to_response(t, total_entrada=entrada, total_saida=saida, pedidos=pedidos)


def listar(db: Session, limite: int = 20) -> list[TurnoResponse]:
    turnos = db.query(Turno).order_by(Turno.abertura.desc()).limit(limite).all()
    return [_to_response(t) for t in turnos]


def abrir(db: Session, usuario_id: int, caixa_inicial: float = 0, observacao: str | None = None) -> TurnoResponse:
    aberto = db.query(Turno).filter(Turno.fechamento.is_(None)).first()
    if aberto:
        raise HTTPException(status_code=400, detail="Já existe um caixa aberto. Feche-o antes de abrir outro.")

    t = Turno(usuario_id=usuario_id, caixa_inicial=caixa_inicial, observacao=observacao)
    db.add(t)
    db.commit()
    db.refresh(t)
    return _to_response(t, total_entrada=0, total_saida=0, pedidos=0)


def fechar(db: Session, turno_id: int, observacao: str | None = None) -> TurnoResponse:
    t = db.query(Turno).filter(Turno.id == turno_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Turno não encontrado")
    if t.fechamento is not None:
        raise HTTPException(status_code=400, detail="Este caixa já foi fechado")

    lancamentos = db.query(Lancamento).filter(Lancamento.criado_em >= t.abertura).all()
    t.total_entrada = sum(float(l.valor) for l in lancamentos if l.tipo == "entrada")
    t.total_saida = sum(float(l.valor) for l in lancamentos if l.tipo == "saida")
    t.pedidos_entregues = db.query(Pedido).filter(
        Pedido.status == "entregue",
        Pedido.criado_em >= t.abertura,
    ).count()

    from sqlalchemy.sql import func as sqlfunc
    t.fechamento = sqlfunc.now()
    if observacao:
        t.observacao = observacao

    db.commit()
    db.refresh(t)
    return _to_response(t)
