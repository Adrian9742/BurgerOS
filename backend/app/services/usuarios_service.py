from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.usuario import Usuario
from app.utils.security import verificar_senha, hash_senha


def atualizar_perfil(db: Session, usuario: Usuario, nome: str, email: str) -> Usuario:
    usuario.nome = nome
    usuario.email = email
    db.commit()
    db.refresh(usuario)
    return usuario


def alterar_senha(db: Session, usuario: Usuario, senha_atual: str, nova_senha: str) -> None:
    if not verificar_senha(senha_atual, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta",
        )
    usuario.senha_hash = hash_senha(nova_senha)
    db.commit()
