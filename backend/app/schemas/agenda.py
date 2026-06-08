from datetime import date, time
from pydantic import BaseModel
from typing import Optional


class AgendaCreate(BaseModel):
    titulo: str
    data: date
    hora: time
    detalhe: Optional[str] = None
    tipo: str = "operacao"


class AgendaUpdate(BaseModel):
    titulo: Optional[str] = None
    data: Optional[date] = None
    hora: Optional[time] = None
    detalhe: Optional[str] = None
    tipo: Optional[str] = None


class AgendaResponse(BaseModel):
    id: int
    titulo: str
    data: date
    hora: time
    detalhe: Optional[str] = None
    tipo: str

    model_config = {"from_attributes": True}
