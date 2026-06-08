from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user, requer_cargo
from app.schemas.pedido import PedidoCreate, PedidoResponse, PedidoDetalhadoResponse, MudarStatusRequest
from app.services import pedidos_service
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/pedidos", tags=["pedidos"])


@router.get("", response_model=list[PedidoResponse])
def listar(
    concluidos: bool = False,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    if concluidos:
        return pedidos_service.listar_concluidos(db)
    return pedidos_service.listar(db)


@router.post("", response_model=PedidoResponse, status_code=201)
def criar(
    dados: PedidoCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_current_user),
):
    return pedidos_service.criar(db, dados, usuario_atual.id)


@router.post("/resetar-dia", status_code=200)
def resetar_dia(
    db: Session = Depends(get_db),
    _: Usuario = Depends(requer_cargo("Proprietário")),
):
    return pedidos_service.resetar_dia(db)


@router.get("/{pedido_id}", response_model=PedidoDetalhadoResponse)
def detalhar(
    pedido_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return pedidos_service.detalhar(db, pedido_id)


@router.patch("/{pedido_id}/status", response_model=PedidoResponse)
def mudar_status(
    pedido_id: int,
    dados: MudarStatusRequest,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_current_user),
):
    return pedidos_service.mudar_status(db, pedido_id, dados.status, usuario_atual.id, dados.forma_pagamento)


@router.delete("/{pedido_id}", status_code=204)
def deletar(
    pedido_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(requer_cargo("Proprietário")),
):
    pedidos_service.deletar(db, pedido_id)
