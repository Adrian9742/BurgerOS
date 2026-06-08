from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user, requer_cargo
from app.schemas.produto import ProdutoCreate, ProdutoUpdate, ProdutoResponse
from app.services import produtos_service
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/produtos", tags=["produtos"])

_ADMIN = requer_cargo("Proprietário")


@router.get("", response_model=list[ProdutoResponse])
def listar(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return produtos_service.listar(db)


@router.get("/estoque-baixo", response_model=list[ProdutoResponse])
def estoque_baixo(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return produtos_service.listar_estoque_baixo(db)


@router.post("", response_model=ProdutoResponse, status_code=201)
def criar(dados: ProdutoCreate, db: Session = Depends(get_db), _: Usuario = Depends(_ADMIN)):
    return produtos_service.criar(db, dados)


@router.put("/{produto_id}", response_model=ProdutoResponse)
def atualizar(produto_id: int, dados: ProdutoUpdate, db: Session = Depends(get_db), _: Usuario = Depends(_ADMIN)):
    return produtos_service.atualizar(db, produto_id, dados)


@router.delete("/{produto_id}")
def remover(produto_id: int, db: Session = Depends(get_db), _: Usuario = Depends(_ADMIN)):
    produtos_service.remover(db, produto_id)
    return {"ok": True}


@router.patch("/{produto_id}/disponivel", response_model=ProdutoResponse)
def alternar_disponivel(produto_id: int, db: Session = Depends(get_db), _: Usuario = Depends(_ADMIN)):
    return produtos_service.alternar_disponivel(db, produto_id)
