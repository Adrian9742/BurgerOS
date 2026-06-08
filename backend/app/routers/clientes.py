from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user, requer_cargo
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse, HistoricoItem
from app.services import clientes_service
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/clientes", tags=["clientes"])

_ADMIN = requer_cargo("Proprietário")


@router.get("", response_model=list[ClienteResponse])
def listar(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return clientes_service.listar(db)


@router.post("", response_model=ClienteResponse, status_code=201)
def criar(
    dados: ClienteCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return clientes_service.criar(db, dados)


@router.put("/{cliente_id}", response_model=ClienteResponse)
def atualizar(
    cliente_id: int,
    dados: ClienteUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return clientes_service.atualizar(db, cliente_id, dados)


@router.delete("/{cliente_id}", status_code=204)
def deletar(
    cliente_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(_ADMIN),
):
    clientes_service.deletar(db, cliente_id)


@router.get("/{cliente_id}/historico", response_model=list[HistoricoItem])
def historico(
    cliente_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return clientes_service.historico(db, cliente_id)
