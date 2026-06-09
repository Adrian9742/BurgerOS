from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Turno(Base):
    __tablename__ = "turnos"

    id = Column(Integer, primary_key=True, index=True)
    abertura = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fechamento = Column(DateTime(timezone=True), nullable=True)
    caixa_inicial = Column(Numeric(10, 2), default=0, nullable=True)
    total_entrada = Column(Numeric(10, 2), default=0, nullable=False)
    total_saida = Column(Numeric(10, 2), default=0, nullable=False)
    pedidos_entregues = Column(Integer, default=0, nullable=False)
    observacao = Column(String, nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    usuario = relationship("Usuario", lazy="selectin")
