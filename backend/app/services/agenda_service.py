from datetime import date, time
from sqlalchemy.orm import Session
from app.models.agenda import Agenda


def listar(db: Session, data_inicio: date | None = None, data_fim: date | None = None) -> list[Agenda]:
    q = db.query(Agenda)
    if data_inicio:
        q = q.filter(Agenda.data >= data_inicio)
    if data_fim:
        q = q.filter(Agenda.data <= data_fim)
    return q.order_by(Agenda.data, Agenda.hora).all()


def criar(db: Session, titulo: str, data: date, hora: time, detalhe: str | None, tipo: str) -> Agenda:
    item = Agenda(titulo=titulo, data=data, hora=hora, detalhe=detalhe, tipo=tipo)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def atualizar(db: Session, item_id: int, **campos) -> Agenda | None:
    item = db.query(Agenda).filter(Agenda.id == item_id).first()
    if not item:
        return None
    for k, v in campos.items():
        if v is not None:
            setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


def deletar(db: Session, item_id: int) -> bool:
    item = db.query(Agenda).filter(Agenda.id == item_id).first()
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True
