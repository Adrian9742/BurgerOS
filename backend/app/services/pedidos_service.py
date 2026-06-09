from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.pedido import Pedido, ItemPedido
from app.models.produto import Produto
from app.models.cliente import Cliente
from app.models.lancamento import Lancamento
from app.schemas.pedido import PedidoCreate, PedidoResponse, PedidoDetalhadoResponse, ItemDetalhadoResponse, ItemResumoResponse

_STATUS_VALIDOS = {"aguardando", "preparo", "pronto", "a_caminho", "entregue", "cancelado"}


def _calcular_total_final(total_itens: float, desconto, desconto_tipo, taxa_entrega) -> float:
    total = total_itens
    if desconto and desconto_tipo == "percentual":
        total -= total * (float(desconto) / 100)
    elif desconto and desconto_tipo == "fixo":
        total -= float(desconto)
    total += float(taxa_entrega or 0)
    return round(max(total, 0), 2)


def _to_response(pedido: Pedido) -> PedidoResponse:
    itens_list = []
    total = 0.0
    for item in pedido.itens:
        nome = item.produto.nome if item.produto else "Produto removido"
        itens_list.append(ItemResumoResponse(
            nome=nome,
            quantidade=item.quantidade,
            valor_unit=float(item.valor_unit),
            observacao=item.observacao,
        ))
        total += float(item.valor_unit) * item.quantidade

    total = round(total, 2)
    total_final = _calcular_total_final(total, pedido.desconto, pedido.desconto_tipo, pedido.taxa_entrega)
    cliente_nome = pedido.cliente.nome if pedido.cliente else None
    abertoEm = int(pedido.criado_em.timestamp() * 1000)

    return PedidoResponse(
        id=pedido.id,
        cliente=cliente_nome,
        mesa=pedido.mesa,
        tipo=pedido.tipo or "mesa",
        itens=itens_list,
        total=total,
        total_final=total_final,
        status=pedido.status,
        forma_pagamento=pedido.forma_pagamento,
        observacao=pedido.observacao,
        desconto=float(pedido.desconto) if pedido.desconto is not None else None,
        desconto_tipo=pedido.desconto_tipo,
        endereco_entrega=pedido.endereco_entrega,
        taxa_entrega=float(pedido.taxa_entrega or 0),
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
    total = round(total, 2)
    total_final = _calcular_total_final(total, pedido.desconto, pedido.desconto_tipo, pedido.taxa_entrega)
    return PedidoDetalhadoResponse(
        id=pedido.id,
        cliente=pedido.cliente.nome if pedido.cliente else None,
        mesa=pedido.mesa,
        tipo=pedido.tipo or "mesa",
        itens=itens_det,
        total=total,
        total_final=total_final,
        status=pedido.status,
        forma_pagamento=pedido.forma_pagamento,
        observacao=pedido.observacao,
        desconto=float(pedido.desconto) if pedido.desconto is not None else None,
        desconto_tipo=pedido.desconto_tipo,
        endereco_entrega=pedido.endereco_entrega,
        taxa_entrega=float(pedido.taxa_entrega or 0),
        abertoEm=int(pedido.criado_em.timestamp() * 1000),
    )


def listar(db: Session) -> list[PedidoResponse]:
    pedidos = (
        db.query(Pedido)
        .filter(Pedido.status.not_in(["entregue", "cancelado"]))
        .order_by(Pedido.criado_em.desc())
        .limit(100)
        .all()
    )
    return [_to_response(p) for p in pedidos]


def listar_concluidos(
    db: Session,
    data_inicio: date | None = None,
    data_fim: date | None = None,
) -> list[PedidoResponse]:
    from sqlalchemy import func as sqlfunc
    q = db.query(Pedido).filter(Pedido.status.in_(["entregue", "cancelado"]))
    if data_inicio:
        q = q.filter(sqlfunc.date(Pedido.criado_em) >= data_inicio)
    if data_fim:
        q = q.filter(sqlfunc.date(Pedido.criado_em) <= data_fim)
    pedidos = q.order_by(Pedido.criado_em.desc()).limit(200).all()
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
        tipo=dados.tipo,
        observacao=dados.observacao,
        desconto=dados.desconto,
        desconto_tipo=dados.desconto_tipo,
        endereco_entrega=dados.endereco_entrega,
        taxa_entrega=dados.taxa_entrega,
        status="aguardando",
        usuario_id=usuario_id,
    )
    db.add(pedido)
    db.flush()

    for item_dado in dados.itens:
        produto = db.query(Produto).filter(Produto.id == item_dado.produto_id).first()
        if not produto:
            continue
        if produto.estoque is not None:
            produto.estoque -= item_dado.quantidade
        # combo: reduz estoque de cada componente
        if produto.componentes:
            for comp in produto.componentes:
                comp_prod = db.query(Produto).filter(Produto.id == comp.get("produto_id")).first()
                if comp_prod and comp_prod.estoque is not None:
                    comp_prod.estoque -= item_dado.quantidade * int(comp.get("quantidade", 1))
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


def _baixar_ingredientes(db: Session, pedido: Pedido) -> None:
    from app.models.ingrediente import FichaTecnica, Ingrediente

    # Mapeia produto_id → total de unidades a descontar
    consumo: dict[int, float] = {}
    for item in pedido.itens:
        if not item.produto_id:
            continue
        produto = db.query(Produto).filter(Produto.id == item.produto_id).first()
        if not produto:
            continue
        if produto.componentes:
            # Combo: desconta pelas fichas de cada componente
            for comp in produto.componentes:
                cid = comp.get("produto_id")
                cqtd = float(comp.get("quantidade", 1))
                consumo[cid] = consumo.get(cid, 0) + cqtd * item.quantidade
        else:
            consumo[item.produto_id] = consumo.get(item.produto_id, 0) + item.quantidade

    if not consumo:
        return

    fichas = db.query(FichaTecnica).filter(FichaTecnica.produto_id.in_(consumo.keys())).all()
    for ficha in fichas:
        qtd = consumo.get(ficha.produto_id, 0)
        if qtd > 0:
            db.query(Ingrediente).filter(Ingrediente.id == ficha.ingrediente_id).update(
                {"estoque": Ingrediente.estoque - ficha.quantidade * qtd},
                synchronize_session=False,
            )


def mudar_status(db: Session, pedido_id: int, novo_status: str, usuario_id: int, forma_pagamento: str | None = None) -> PedidoResponse:
    if novo_status not in _STATUS_VALIDOS:
        raise HTTPException(status_code=400, detail=f"Status inválido: {novo_status}")

    pedido = buscar(db, pedido_id)
    pedido.status = novo_status

    if novo_status == "entregue":
        if forma_pagamento:
            pedido.forma_pagamento = forma_pagamento

        total_itens = sum(float(item.valor_unit) * item.quantidade for item in pedido.itens)
        total = _calcular_total_final(total_itens, pedido.desconto, pedido.desconto_tipo, pedido.taxa_entrega)

        db.add(Lancamento(
            tipo="entrada",
            valor=total,
            descricao=f"Pedido #{pedido.id}",
            pedido_id=pedido.id,
            usuario_id=usuario_id,
        ))

        if pedido.cliente_id:
            db.query(Cliente).filter(Cliente.id == pedido.cliente_id).update(
                {"total_gasto": Cliente.total_gasto + total, "ultimo_pedido": date.today()},
                synchronize_session=False,
            )

        _baixar_ingredientes(db, pedido)

    db.commit()
    db.refresh(pedido)
    return _to_response(pedido)


def deletar(db: Session, pedido_id: int) -> None:
    pedido = buscar(db, pedido_id)
    db.query(Lancamento).filter(Lancamento.pedido_id == pedido_id).delete(synchronize_session=False)
    db.delete(pedido)
    db.commit()


def resetar_dia(db: Session) -> dict:
    count_lanc = db.query(Lancamento).delete(synchronize_session=False)
    db.query(ItemPedido).delete(synchronize_session=False)
    count_pedidos = db.query(Pedido).delete(synchronize_session=False)
    db.query(Cliente).update({"total_gasto": 0, "ultimo_pedido": None}, synchronize_session=False)
    db.commit()
    return {"pedidos_removidos": count_pedidos, "lancamentos_removidos": count_lanc}
