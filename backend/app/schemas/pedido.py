from pydantic import BaseModel
from typing import Optional


class ItemPedidoCreate(BaseModel):
    produto_id: int
    quantidade: int = 1
    observacao: Optional[str] = None


class PedidoCreate(BaseModel):
    cliente_id: Optional[int] = None
    mesa: Optional[str] = None
    itens: list[ItemPedidoCreate]


class MudarStatusRequest(BaseModel):
    status: str


class ItemDetalhadoResponse(BaseModel):
    nome: str
    quantidade: int
    valor_unit: float
    subtotal: float
    observacao: Optional[str] = None


class PedidoDetalhadoResponse(BaseModel):
    id: int
    cliente: Optional[str] = None
    mesa: Optional[str] = None
    itens: list[ItemDetalhadoResponse]
    total: float
    status: str
    abertoEm: int


class PedidoResponse(BaseModel):
    id: int
    cliente: Optional[str] = None
    mesa: Optional[str] = None
    itens: list[str]
    total: float
    status: str
    abertoEm: int
