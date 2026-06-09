from pydantic import BaseModel, field_validator
from typing import Optional


class IngredienteCreate(BaseModel):
    nome: str
    unidade: str
    estoque: float = 0
    estoque_minimo: Optional[float] = None

    @field_validator("estoque")
    @classmethod
    def estoque_nao_negativo(cls, v):
        if v < 0:
            raise ValueError("Estoque não pode ser negativo")
        return v


class IngredienteUpdate(BaseModel):
    nome: Optional[str] = None
    unidade: Optional[str] = None
    estoque: Optional[float] = None
    estoque_minimo: Optional[float] = None


class AjusteEstoqueRequest(BaseModel):
    delta: float


class IngredienteResponse(BaseModel):
    id: int
    nome: str
    unidade: str
    estoque: float
    estoque_minimo: Optional[float] = None

    model_config = {"from_attributes": True}


class FichaTecnicaItem(BaseModel):
    ingrediente_id: int
    quantidade: float

    @field_validator("quantidade")
    @classmethod
    def quantidade_positiva(cls, v):
        if v <= 0:
            raise ValueError("Quantidade deve ser positiva")
        return v


class FichaTecnicaResponse(BaseModel):
    ingrediente_id: int
    nome: str
    unidade: str
    quantidade: float
