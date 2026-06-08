from pydantic import BaseModel, field_validator


class MetaUpdate(BaseModel):
    valor: float

    @field_validator("valor")
    @classmethod
    def positivo(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Meta deve ser maior que zero")
        return round(v, 2)


class MetaResponse(BaseModel):
    chave: str
    valor: float
    descricao: str | None = None
