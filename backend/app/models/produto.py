from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    descricao = Column(String, nullable=True)
    categoria = Column(String(50), nullable=False)
    valor = Column(Numeric(10, 2), nullable=False)
    disponivel = Column(Boolean, default=True, nullable=False)
    estoque = Column(Integer, nullable=True)
    estoque_minimo = Column(Integer, nullable=True)
    variacoes = Column(JSON, nullable=True)
    custo = Column(Numeric(10, 2), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
