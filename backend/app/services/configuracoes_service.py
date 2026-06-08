from sqlalchemy.orm import Session
from app.models.configuracao import Configuracao

_DEFAULTS = {
    "meta_semanal": ("10500.00", "Meta de vendas semanal em R$"),
}


def seed_configuracoes(db: Session) -> None:
    for chave, (valor, descricao) in _DEFAULTS.items():
        if not db.query(Configuracao).filter(Configuracao.chave == chave).first():
            db.add(Configuracao(chave=chave, valor=valor, descricao=descricao))
    db.commit()


def get_valor(db: Session, chave: str) -> str | None:
    row = db.query(Configuracao).filter(Configuracao.chave == chave).first()
    return row.valor if row else _DEFAULTS.get(chave, (None,))[0]


def set_valor(db: Session, chave: str, valor: str) -> Configuracao:
    row = db.query(Configuracao).filter(Configuracao.chave == chave).first()
    if row:
        row.valor = valor
    else:
        descricao = _DEFAULTS.get(chave, ("", ""))[1]
        row = Configuracao(chave=chave, valor=valor, descricao=descricao)
        db.add(row)
    db.commit()
    db.refresh(row)
    return row
