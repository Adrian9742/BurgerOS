from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse

_CLIENTES_DEMO = [
    {"nome": "Marina Costa", "telefone": "(11) 98765-4321"},
    {"nome": "Carlos Eduardo", "telefone": "(11) 91234-5678"},
    {"nome": "Fernanda Lima", "telefone": "(21) 99876-5432"},
    {"nome": "João Pedro", "telefone": "(11) 97654-3210"},
    {"nome": "Beatriz Souza", "telefone": "(11) 95555-1234"},
    {"nome": "Rafael Oliveira", "telefone": "(21) 98888-7777"},
]


def listar(db: Session) -> list[ClienteResponse]:
    clientes = db.query(Cliente).order_by(Cliente.nome).all()
    return [ClienteResponse.from_orm_cliente(c) for c in clientes]


def buscar(db: Session, cliente_id: int) -> Cliente:
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")
    return cliente


def criar(db: Session, dados: ClienteCreate) -> ClienteResponse:
    cliente = Cliente(**dados.model_dump(exclude_none=True))
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return ClienteResponse.from_orm_cliente(cliente)


def atualizar(db: Session, cliente_id: int, dados: ClienteUpdate) -> ClienteResponse:
    cliente = buscar(db, cliente_id)
    for k, v in dados.model_dump(exclude_none=True).items():
        setattr(cliente, k, v)
    db.commit()
    db.refresh(cliente)
    return ClienteResponse.from_orm_cliente(cliente)


def deletar(db: Session, cliente_id: int) -> None:
    cliente = buscar(db, cliente_id)
    db.delete(cliente)
    db.commit()


def historico(db: Session, cliente_id: int) -> list:
    from app.models.pedido import Pedido, ItemPedido  # import local evita circular
    buscar(db, cliente_id)
    pedidos = (
        db.query(Pedido)
        .filter(Pedido.cliente_id == cliente_id, Pedido.status == "entregue")
        .order_by(Pedido.criado_em.desc())
        .limit(20)
        .all()
    )
    result = []
    for pedido in pedidos:
        itens_str = ", ".join(
            f"{item.quantidade}x {item.produto.nome}"
            for item in pedido.itens
            if item.produto
        )
        total = sum(float(item.valor_unit) * item.quantidade for item in pedido.itens)
        result.append({
            "id": pedido.id,
            "status": pedido.status,
            "itens": itens_str or "–",
            "total": round(total, 2),
            "data": pedido.criado_em.date().isoformat(),
        })
    return result


def seed_clientes(db: Session) -> None:
    total = db.query(Cliente).count()
    if total > 0:
        return
    for dados in _CLIENTES_DEMO:
        db.add(Cliente(**dados))
    db.commit()
