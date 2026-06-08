from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.schemas.usuario import UsuarioLogin, TokenResponse, UsuarioResponse
from app.services.auth_service import autenticar
from app.utils.security import criar_token
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(dados: UsuarioLogin, db: Session = Depends(get_db)):
    usuario = autenticar(db, dados.usuario, dados.senha)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos",
        )
    token = criar_token({"sub": str(usuario.id), "cargo": usuario.cargo})
    return TokenResponse(
        access_token=token,
        usuario=UsuarioResponse.model_validate(usuario),
    )


@router.get("/me", response_model=UsuarioResponse)
def me(usuario_atual: Usuario = Depends(get_current_user)):
    return usuario_atual


@router.post("/logout")
def logout():
    return {"ok": True}
