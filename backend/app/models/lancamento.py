from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Lancamento(Base):
    __tablename__ = "lancamentos"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(10), nullable=False)          # "entrada" | "saida"
    valor = Column(Numeric(10, 2), nullable=False)
    descricao = Column(String, nullable=False)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
