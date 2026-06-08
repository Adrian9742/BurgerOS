from pydantic import BaseModel, computed_field
from typing import Optional
from datetime import datetime


class AbrirTurnoRequest(BaseModel):
    observacao: Optional[str] = None


class FecharTurnoRequest(BaseModel):
    observacao: Optional[str] = None


class TurnoResponse(BaseModel):
    id: int
    abertura: datetime
    fechamento: Optional[datetime] = None
    total_entrada: float
    total_saida: float
    pedidos_entregues: int
    observacao: Optional[str] = None
    operador: Optional[str] = None
    aberto: bool

    @computed_field
    @property
    def saldo(self) -> float:
        return round(self.total_entrada - self.total_saida, 2)

    model_config = {"from_attributes": True}
