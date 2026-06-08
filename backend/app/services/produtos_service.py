from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.produto import Produto
from app.schemas.produto import ProdutoCreate, ProdutoUpdate

_PRODUTOS_DEMO = [
    {"nome": "X-Burger Clássico", "descricao": "Pão brioche, hambúrguer 160g, queijo, alface e tomate", "categoria": "Hambúrgueres", "valor": 28.90},
    {"nome": "X-Bacon Duplo", "descricao": "Duplo smash, bacon crocante, cheddar e molho especial", "categoria": "Hambúrgueres", "valor": 38.90},
    {"nome": "X-Salada", "descricao": "Hambúrguer 160g, alface, tomate, cebola e maionese", "categoria": "Hambúrgueres", "valor": 24.90},
    {"nome": "Smash Triplo", "descricao": "Três smash burgers, queijo americano e pickles", "categoria": "Hambúrgueres", "valor": 45.90},
    {"nome": "Veggie Burger", "descricao": "Blend de grão-de-bico, queijo e legumes grelhados", "categoria": "Hambúrgueres", "valor": 32.90},
    {"nome": "Batata Frita", "descricao": "Porção 200g, crocante e temperada", "categoria": "Acompanhamentos", "valor": 14.90},
    {"nome": "Onion Rings", "descricao": "Anéis de cebola empanados, porção 150g", "categoria": "Acompanhamentos", "valor": 16.90},
    {"nome": "Nuggets", "descricao": "8 unidades de frango crocante", "categoria": "Acompanhamentos", "valor": 18.90},
    {"nome": "Coca-Cola", "descricao": "Lata 350ml gelada", "categoria": "Bebidas s/ álcool", "valor": 7.00},
    {"nome": "Guaraná", "descricao": "Lata 350ml gelada", "categoria": "Bebidas s/ álcool", "valor": 6.00},
    {"nome": "Suco Natural", "descricao": "Laranja ou limão, 400ml", "categoria": "Bebidas s/ álcool", "valor": 12.00},
    {"nome": "Heineken", "descricao": "Long neck 330ml gelada", "categoria": "Bebidas c/ álcool", "valor": 14.00},
    {"nome": "Chopp IPA", "descricao": "300ml artesanal gelado", "categoria": "Bebidas c/ álcool", "valor": 18.00},
    {"nome": "Caipirinha", "descricao": "Limão, cachaça e açúcar", "categoria": "Bebidas c/ álcool", "valor": 22.00},
]


def listar(db: Session) -> list[Produto]:
    return db.query(Produto).order_by(Produto.categoria, Produto.nome).all()


def buscar(db: Session, produto_id: int) -> Produto:
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    return produto


def criar(db: Session, dados: ProdutoCreate) -> Produto:
    produto = Produto(**dados.model_dump())
    db.add(produto)
    db.commit()
    db.refresh(produto)
    return produto


def atualizar(db: Session, produto_id: int, dados: ProdutoUpdate) -> Produto:
    produto = buscar(db, produto_id)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(produto, campo, valor)
    db.commit()
    db.refresh(produto)
    return produto


def remover(db: Session, produto_id: int) -> None:
    produto = buscar(db, produto_id)
    db.delete(produto)
    db.commit()


def alternar_disponivel(db: Session, produto_id: int) -> Produto:
    produto = buscar(db, produto_id)
    produto.disponivel = not produto.disponivel
    db.commit()
    db.refresh(produto)
    return produto


def seed_produtos(db: Session) -> None:
    total = db.query(Produto).count()
    if total > 0:
        return
    for dados in _PRODUTOS_DEMO:
        db.add(Produto(**dados))
    db.commit()
