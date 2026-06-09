from pydantic import BaseModel, field_validator
from typing import Optional


class ItemPedidoCreate(BaseModel):
    produto_id: int
    quantidade: int = 1
    observacao: Optional[str] = None


class PedidoCreate(BaseModel):
    cliente_id: Optional[int] = None
    mesa: Optional[str] = None
    tipo: str = "mesa"
    observacao: Optional[str] = None
    desconto: Optional[float] = None
    desconto_tipo: Optional[str] = None
    endereco_entrega: Optional[str] = None
    taxa_entrega: float = 0.0
    itens: list[ItemPedidoCreate]

    @field_validator("desconto")
    @classmethod
    def validar_desconto(cls, v):
        if v is not None and v < 0:
            raise ValueError("Desconto não pode ser negativo")
        return v

    @field_validator("desconto_tipo")
    @classmethod
    def validar_desconto_tipo(cls, v):
        if v is not None and v not in ("percentual", "fixo"):
            raise ValueError("desconto_tipo deve ser 'percentual' ou 'fixo'")
        return v


class MudarStatusRequest(BaseModel):
    status: str
    forma_pagamento: Optional[str] = None


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
    tipo: str = "mesa"
    itens: list[ItemDetalhadoResponse]
    total: float
    total_final: float
    status: str
    forma_pagamento: Optional[str] = None
    observacao: Optional[str] = None
    desconto: Optional[float] = None
    desconto_tipo: Optional[str] = None
    endereco_entrega: Optional[str] = None
    taxa_entrega: float = 0.0
    abertoEm: int


class PedidoResponse(BaseModel):
    id: int
    cliente: Optional[str] = None
    mesa: Optional[str] = None
    tipo: str = "mesa"
    itens: list[str]
    total: float
    total_final: float
    status: str
    forma_pagamento: Optional[str] = None
    observacao: Optional[str] = None
    desconto: Optional[float] = None
    desconto_tipo: Optional[str] = None
    endereco_entrega: Optional[str] = None
    taxa_entrega: float = 0.0
    abertoEm: int
