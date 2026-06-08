from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.pedido import Pedido, ItemPedido
from app.models.produto import Produto
from app.models.cliente import Cliente
from app.models.lancamento import Lancamento
from app.schemas.pedido import PedidoCreate, PedidoResponse, PedidoDetalhadoResponse, ItemDetalhadoResponse

_STATUS_VALIDOS = {"aguardando", "preparo", "pronto", "entregue", "cancelado"}


def _to_response(pedido: Pedido) -> PedidoResponse:
    itens_str = []
    total = 0.0
    for item in pedido.itens:
        nome = item.produto.nome if item.produto else "Produto removido"
        itens_str.append(f"{item.quantidade}x {nome}")
        total += float(item.valor_unit) * item.quantidade

    cliente_nome = pedido.cliente.nome if pedido.cliente else None
    abertoEm = int(pedido.criado_em.timestamp() * 1000)

    return PedidoResponse(
        id=pedido.id,
        cliente=cliente_nome,
        mesa=pedido.mesa,
        itens=itens_str,
        total=round(total, 2),
        status=pedido.status,
        abertoEm=abertoEm,
    )


def detalhar(db: Session, pedido_id: int) -> PedidoDetalhadoResponse:
    pedido = buscar(db, pedido_id)
    itens_det = []
    total = 0.0
    for item in pedido.itens:
        nome = item.produto.nome if item.produto else "Produto removido"
        vunit = float(item.valor_unit)
        sub = round(vunit * item.quantidade, 2)
        total += sub
        itens_det.append(ItemDetalhadoResponse(
            nome=nome,
            quantidade=item.quantidade,
            valor_unit=vunit,
            subtotal=sub,
            observacao=item.observacao,
        ))
    return PedidoDetalhadoResponse(
        id=pedido.id,
        cliente=pedido.cliente.nome if pedido.cliente else None,
        mesa=pedido.mesa,
        itens=itens_det,
        total=round(total, 2),
        status=pedido.status,
        abertoEm=int(pedido.criado_em.timestamp() * 1000),
    )


def listar(db: Session) -> list[PedidoResponse]:
    pedidos = (
        db.query(Pedido)
        .filter(Pedido.status != "cancelado")
        .order_by(Pedido.criado_em.desc())
        .limit(100)
        .all()
    )
    return [_to_response(p) for p in pedidos]


def buscar(db: Session, pedido_id: int) -> Pedido:
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido não encontrado")
    return pedido


def criar(db: Session, dados: PedidoCreate, usuario_id: int) -> PedidoResponse:
    if not dados.itens:
        raise HTTPException(status_code=400, detail="Pedido precisa ter ao menos um item")

    pedido = Pedido(
        cliente_id=dados.cliente_id,
        mesa=dados.mesa,
        status="aguardando",
        usuario_id=usuario_id,
    )
    db.add(pedido)
    db.flush()

    for item_dado in dados.itens:
        produto = db.query(Produto).filter(Produto.id == item_dado.produto_id).first()
        if not produto:
            continue
        db.add(ItemPedido(
            pedido_id=pedido.id,
            produto_id=produto.id,
            quantidade=item_dado.quantidade,
            valor_unit=produto.valor,
            observacao=item_dado.observacao,
        ))

    db.commit()
    db.refresh(pedido)
    return _to_response(pedido)


def mudar_status(db: Session, pedido_id: int, novo_status: str, usuario_id: int) -> PedidoResponse:
    if novo_status not in _STATUS_VALIDOS:
        raise HTTPException(status_code=400, detail=f"Status inválido: {novo_status}")

    pedido = buscar(db, pedido_id)
    pedido.status = novo_status

    if novo_status == "entregue":
        total = sum(float(item.valor_unit) * item.quantidade for item in pedido.itens)

        db.add(Lancamento(
            tipo="entrada",
            valor=total,
            descricao=f"Pedido #{pedido.id}",
            pedido_id=pedido.id,
            usuario_id=usuario_id,
        ))

        if pedido.cliente_id:
            cliente = db.query(Cliente).filter(Cliente.id == pedido.cliente_id).first()
            if cliente:
                cliente.total_gasto = float(cliente.total_gasto or 0) + total
                cliente.ultimo_pedido = date.today()

    db.commit()
    db.refresh(pedido)
    return _to_response(pedido)
