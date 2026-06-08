from datetime import date
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.lancamento import Lancamento
from app.schemas.lancamento import LancamentoCreate, LancamentoResponse


def _to_response(lancamento: Lancamento) -> LancamentoResponse:
    return LancamentoResponse(
        id=lancamento.id,
        data=lancamento.criado_em.strftime("%Y-%m-%d"),
        hora=lancamento.criado_em.strftime("%H:%M"),
        descricao=lancamento.descricao,
        tipo=lancamento.tipo,
        valor=float(lancamento.valor),
    )


def listar(db: Session, data_inicio: date | None = None, data_fim: date | None = None) -> list[LancamentoResponse]:
    hoje = date.today()
    inicio = data_inicio or hoje
    fim = data_fim or hoje
    lancamentos = (
        db.query(Lancamento)
        .filter(func.date(Lancamento.criado_em) >= inicio)
        .filter(func.date(Lancamento.criado_em) <= fim)
        .order_by(Lancamento.criado_em.desc())
        .all()
    )
    return [_to_response(l) for l in lancamentos]


def deletar(db: Session, lancamento_id: int) -> None:
    lancamento = db.query(Lancamento).filter(Lancamento.id == lancamento_id).first()
    if not lancamento:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lançamento não encontrado")
    db.delete(lancamento)
    db.commit()


def criar(db: Session, dados: LancamentoCreate, usuario_id: int) -> LancamentoResponse:
    lancamento = Lancamento(
        tipo=dados.tipo,
        valor=dados.valor,
        descricao=dados.descricao,
        usuario_id=usuario_id,
    )
    db.add(lancamento)
    db.commit()
    db.refresh(lancamento)
    return _to_response(lancamento)
