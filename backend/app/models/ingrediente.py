from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Ingrediente(Base):
    __tablename__ = "ingredientes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    unidade = Column(String(10), nullable=False)
    estoque = Column(Numeric(10, 3), default=0, nullable=False)
    estoque_minimo = Column(Numeric(10, 3), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    fichas = relationship("FichaTecnica", back_populates="ingrediente", cascade="all, delete-orphan")


class FichaTecnica(Base):
    __tablename__ = "ficha_tecnica"

    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id", ondelete="CASCADE"), nullable=False)
    ingrediente_id = Column(Integer, ForeignKey("ingredientes.id", ondelete="CASCADE"), nullable=False)
    quantidade = Column(Numeric(10, 3), nullable=False)

    ingrediente = relationship("Ingrediente", back_populates="fichas")

    __table_args__ = (UniqueConstraint("produto_id", "ingrediente_id"),)
