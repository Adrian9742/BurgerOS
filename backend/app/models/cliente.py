from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    telefone = Column(String(20), nullable=True)
    cep = Column(String(9), nullable=True)
    rua = Column(String(200), nullable=True)
    numero = Column(String(20), nullable=True)
    complemento = Column(String(100), nullable=True)
    bairro = Column(String(100), nullable=True)
    cidade = Column(String(100), nullable=True)
    estado = Column(String(2), nullable=True)
    total_gasto = Column(Numeric(10, 2), default=0, nullable=False)
    ultimo_pedido = Column(Date, nullable=True)
    observacao_padrao = Column(String(500), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
