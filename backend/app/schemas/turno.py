from pydantic import BaseModel, computed_field
from typing import Optional
from datetime import datetime


class AbrirTurnoRequest(BaseModel):
    caixa_inicial: float = 0
    observacao: Optional[str] = None


class FecharTurnoRequest(BaseModel):
    observacao: Optional[str] = None


class TurnoResponse(BaseModel):
    id: int
    abertura: datetime
    fechamento: Optional[datetime] = None
    caixa_inicial: float = 0
    total_entrada: float
    total_saida: float
    pedidos_entregues: int
    observacao: Optional[str] = None
    operador: Optional[str] = None
    aberto: bool

    @computed_field
    @property
    def saldo(self) -> float:
        return round(self.caixa_inicial + self.total_entrada - self.total_saida, 2)

    model_config = {"from_attributes": True}
