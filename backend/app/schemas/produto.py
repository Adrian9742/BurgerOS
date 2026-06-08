from pydantic import BaseModel, field_validator
from typing import Optional, Any
from enum import Enum
from decimal import Decimal


class CategoriaEnum(str, Enum):
    hamburgueres = "Hambúrgueres"
    acompanhamentos = "Acompanhamentos"
    bebidas_sem_alcool = "Bebidas s/ álcool"
    bebidas_com_alcool = "Bebidas c/ álcool"


class ProdutoCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None
    categoria: CategoriaEnum
    valor: Decimal
    disponivel: bool = True
    estoque: Optional[int] = None
    estoque_minimo: Optional[int] = None
    variacoes: Optional[list[dict[str, Any]]] = None
    componentes: Optional[list[dict[str, Any]]] = None
    custo: Optional[Decimal] = None

    @field_validator("valor")
    @classmethod
    def valor_positivo(cls, v):
        if v <= 0:
            raise ValueError("Valor deve ser positivo")
        return v


class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    categoria: Optional[CategoriaEnum] = None
    valor: Optional[Decimal] = None
    disponivel: Optional[bool] = None
    estoque: Optional[int] = None
    estoque_minimo: Optional[int] = None
    variacoes: Optional[list[dict[str, Any]]] = None
    componentes: Optional[list[dict[str, Any]]] = None
    custo: Optional[Decimal] = None


class ProdutoResponse(BaseModel):
    id: int
    nome: str
    descricao: Optional[str] = None
    categoria: str
    valor: float
    disponivel: bool
    estoque: Optional[int] = None
    estoque_minimo: Optional[int] = None
    variacoes: Optional[list[dict[str, Any]]] = None
    componentes: Optional[list[dict[str, Any]]] = None
    custo: Optional[float] = None

    model_config = {"from_attributes": True}
