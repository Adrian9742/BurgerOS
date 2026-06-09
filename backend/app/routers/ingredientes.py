from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user, requer_cargo
from app.schemas.ingrediente import (
    IngredienteCreate, IngredienteUpdate, IngredienteResponse,
    FichaTecnicaItem, FichaTecnicaResponse, AjusteEstoqueRequest,
)
from app.services import ingredientes_service
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/ingredientes", tags=["ingredientes"])

_ADMIN = requer_cargo("Proprietário")


@router.get("", response_model=list[IngredienteResponse])
def listar(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return ingredientes_service.listar(db)


@router.get("/estoque-baixo", response_model=list[IngredienteResponse])
def estoque_baixo(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return ingredientes_service.listar_estoque_baixo(db)


@router.post("", response_model=IngredienteResponse, status_code=201)
def criar(dados: IngredienteCreate, db: Session = Depends(get_db), _: Usuario = Depends(_ADMIN)):
    return ingredientes_service.criar(db, dados)


@router.put("/{ingrediente_id}", response_model=IngredienteResponse)
def atualizar(ingrediente_id: int, dados: IngredienteUpdate, db: Session = Depends(get_db), _: Usuario = Depends(_ADMIN)):
    return ingredientes_service.atualizar(db, ingrediente_id, dados)


@router.delete("/{ingrediente_id}", status_code=204)
def remover(ingrediente_id: int, db: Session = Depends(get_db), _: Usuario = Depends(_ADMIN)):
    ingredientes_service.remover(db, ingrediente_id)


@router.patch("/{ingrediente_id}/estoque", response_model=IngredienteResponse)
def ajustar_estoque(
    ingrediente_id: int,
    body: AjusteEstoqueRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(_ADMIN),
):
    return ingredientes_service.ajustar_estoque(db, ingrediente_id, body.delta)


@router.get("/produtos-criticos", response_model=list[int])
def produtos_criticos(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return ingredientes_service.listar_produtos_criticos(db)


@router.get("/ficha/{produto_id}", response_model=list[FichaTecnicaResponse])
def get_ficha(produto_id: int, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return ingredientes_service.get_ficha(db, produto_id)


@router.put("/ficha/{produto_id}", response_model=list[FichaTecnicaResponse])
def salvar_ficha(
    produto_id: int,
    itens: list[FichaTecnicaItem],
    db: Session = Depends(get_db),
    _: Usuario = Depends(_ADMIN),
):
    return ingredientes_service.salvar_ficha(db, produto_id, itens)
