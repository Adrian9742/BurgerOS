from pydantic import BaseModel
from typing import Optional


class UsuarioLogin(BaseModel):
    usuario: str
    senha: str


class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: Optional[str] = None
    usuario: str
    cargo: str

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioResponse
