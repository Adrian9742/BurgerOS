from pydantic import BaseModel
from typing import Optional
from datetime import date


class EnderecoMixin(BaseModel):
    cep: Optional[str] = None
    rua: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None


class ClienteCreate(EnderecoMixin):
    nome: str
    telefone: Optional[str] = None
    observacao_padrao: Optional[str] = None


class ClienteUpdate(EnderecoMixin):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    observacao_padrao: Optional[str] = None


class ClienteResponse(EnderecoMixin):
    id: int
    nome: str
    telefone: Optional[str] = None
    totalGasto: float = 0
    ultimoPedido: Optional[str] = None
    observacao_padrao: Optional[str] = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_cliente(cls, obj):
        return cls(
            id=obj.id,
            nome=obj.nome,
            telefone=obj.telefone,
            cep=obj.cep,
            rua=obj.rua,
            numero=obj.numero,
            complemento=obj.complemento,
            bairro=obj.bairro,
            cidade=obj.cidade,
            estado=obj.estado,
            totalGasto=float(obj.total_gasto or 0),
            ultimoPedido=obj.ultimo_pedido.isoformat() if obj.ultimo_pedido else None,
            observacao_padrao=obj.observacao_padrao,
        )


class HistoricoItem(BaseModel):
    id: int
    status: str
    itens: str
    total: float
    data: str
