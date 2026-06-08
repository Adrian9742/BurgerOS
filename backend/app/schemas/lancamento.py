from pydantic import BaseModel, field_validator
from decimal import Decimal


class LancamentoCreate(BaseModel):
    tipo: str        # "entrada" | "saida"
    valor: Decimal
    descricao: str

    @field_validator("tipo")
    @classmethod
    def tipo_valido(cls, v):
        if v not in {"entrada", "saida"}:
            raise ValueError("Tipo deve ser 'entrada' ou 'saida'")
        return v

    @field_validator("valor")
    @classmethod
    def valor_positivo(cls, v):
        if v <= 0:
            raise ValueError("Valor deve ser positivo")
        return v


class LancamentoResponse(BaseModel):
    id: int
    hora: str
    descricao: str
    tipo: str
    valor: float
