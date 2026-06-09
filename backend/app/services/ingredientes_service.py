from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.ingrediente import Ingrediente, FichaTecnica
from app.schemas.ingrediente import IngredienteCreate, IngredienteUpdate, FichaTecnicaItem

_INGREDIENTES_DEMO = [
    {"nome": "Pão brioche", "unidade": "un", "estoque": 50, "estoque_minimo": 10},
    {"nome": "Hambúrguer 160g", "unidade": "un", "estoque": 40, "estoque_minimo": 8},
    {"nome": "Queijo cheddar", "unidade": "un", "estoque": 60, "estoque_minimo": 10},
    {"nome": "Alface", "unidade": "g", "estoque": 500, "estoque_minimo": 100},
    {"nome": "Tomate", "unidade": "g", "estoque": 400, "estoque_minimo": 80},
    {"nome": "Bacon", "unidade": "g", "estoque": 300, "estoque_minimo": 60},
    {"nome": "Batata", "unidade": "g", "estoque": 2000, "estoque_minimo": 400},
    {"nome": "Óleo", "unidade": "ml", "estoque": 3000, "estoque_minimo": 500},
    {"nome": "Sal", "unidade": "g", "estoque": 500, "estoque_minimo": 50},
]


def listar(db: Session) -> list[Ingrediente]:
    return db.query(Ingrediente).order_by(Ingrediente.nome).all()


def listar_estoque_baixo(db: Session) -> list[Ingrediente]:
    return (
        db.query(Ingrediente)
        .filter(
            Ingrediente.estoque_minimo.isnot(None),
            Ingrediente.estoque <= Ingrediente.estoque_minimo,
        )
        .order_by(Ingrediente.estoque)
        .all()
    )


def buscar(db: Session, ingrediente_id: int) -> Ingrediente:
    ing = db.query(Ingrediente).filter(Ingrediente.id == ingrediente_id).first()
    if not ing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingrediente não encontrado")
    return ing


def criar(db: Session, dados: IngredienteCreate) -> Ingrediente:
    ing = Ingrediente(**dados.model_dump())
    db.add(ing)
    db.commit()
    db.refresh(ing)
    return ing


def atualizar(db: Session, ingrediente_id: int, dados: IngredienteUpdate) -> Ingrediente:
    ing = buscar(db, ingrediente_id)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(ing, campo, valor)
    db.commit()
    db.refresh(ing)
    return ing


def remover(db: Session, ingrediente_id: int) -> None:
    ing = buscar(db, ingrediente_id)
    db.delete(ing)
    db.commit()


def ajustar_estoque(db: Session, ingrediente_id: int, delta: float) -> Ingrediente:
    db.query(Ingrediente).filter(Ingrediente.id == ingrediente_id).update(
        {"estoque": Ingrediente.estoque + delta},
        synchronize_session=False,
    )
    db.commit()
    return buscar(db, ingrediente_id)


def get_ficha(db: Session, produto_id: int) -> list[dict]:
    fichas = (
        db.query(FichaTecnica)
        .filter(FichaTecnica.produto_id == produto_id)
        .all()
    )
    return [
        {
            "ingrediente_id": f.ingrediente_id,
            "nome": f.ingrediente.nome,
            "unidade": f.ingrediente.unidade,
            "quantidade": float(f.quantidade),
        }
        for f in fichas
    ]


def salvar_ficha(db: Session, produto_id: int, itens: list[FichaTecnicaItem]) -> list[dict]:
    db.query(FichaTecnica).filter(FichaTecnica.produto_id == produto_id).delete(synchronize_session=False)
    for item in itens:
        db.add(FichaTecnica(
            produto_id=produto_id,
            ingrediente_id=item.ingrediente_id,
            quantidade=item.quantidade,
        ))
    db.commit()
    return get_ficha(db, produto_id)


def listar_produtos_criticos(db: Session) -> list[int]:
    fichas = (
        db.query(FichaTecnica.produto_id)
        .join(Ingrediente, Ingrediente.id == FichaTecnica.ingrediente_id)
        .filter(
            (Ingrediente.estoque <= 0) |
            (
                (Ingrediente.estoque_minimo.isnot(None)) &
                (Ingrediente.estoque <= Ingrediente.estoque_minimo)
            )
        )
        .distinct()
        .all()
    )
    return [f.produto_id for f in fichas]


def seed_ingredientes(db: Session) -> None:
    if db.query(Ingrediente).count() > 0:
        return
    for dados in _INGREDIENTES_DEMO:
        db.add(Ingrediente(**dados))
    db.commit()
