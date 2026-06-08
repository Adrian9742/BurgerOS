from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.schemas.usuario import UsuarioResponse
from app.services import usuarios_service
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/usuarios", tags=["usuarios"])


class AtualizarPerfilRequest(BaseModel):
    nome: str
    email: Optional[str] = None


class AlterarSenhaRequest(BaseModel):
    senha_atual: str
    nova_senha: str


@router.put("/me", response_model=UsuarioResponse)
def atualizar_perfil(
    dados: AtualizarPerfilRequest,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_current_user),
):
    atualizado = usuarios_service.atualizar_perfil(db, usuario_atual, dados.nome, dados.email)
    return atualizado


@router.patch("/me/senha")
def alterar_senha(
    dados: AlterarSenhaRequest,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_current_user),
):
    usuarios_service.alterar_senha(db, usuario_atual, dados.senha_atual, dados.nova_senha)
    return {"ok": True}
