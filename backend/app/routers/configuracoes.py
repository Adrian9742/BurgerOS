from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.usuario import Usuario
from app.schemas.configuracao import MetaUpdate, MetaResponse
from app.services import configuracoes_service

router = APIRouter(prefix="/api/configuracoes", tags=["configuracoes"])


@router.get("/meta", response_model=MetaResponse)
def get_meta(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    valor = configuracoes_service.get_valor(db, "meta_semanal")
    return MetaResponse(chave="meta_semanal", valor=float(valor), descricao="Meta de vendas semanal em R$")


@router.put("/meta", response_model=MetaResponse)
def set_meta(
    dados: MetaUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    if usuario.cargo != "Proprietário":
        raise HTTPException(status_code=403, detail="Apenas o Proprietário pode alterar a meta")
    row = configuracoes_service.set_valor(db, "meta_semanal", str(dados.valor))
    return MetaResponse(chave=row.chave, valor=float(row.valor), descricao=row.descricao)
