from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    mesa = Column(String(20), nullable=True)
    status = Column(String(20), default="aguardando", nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    itens = relationship("ItemPedido", back_populates="pedido", lazy="selectin", cascade="all, delete-orphan")
    cliente = relationship("Cliente", lazy="selectin")


class ItemPedido(Base):
    __tablename__ = "itens_pedido"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=True)
    quantidade = Column(Integer, default=1, nullable=False)
    valor_unit = Column(Numeric(10, 2), nullable=False)
    observacao = Column(String, nullable=True)

    pedido = relationship("Pedido", back_populates="itens")
    produto = relationship("Produto", lazy="selectin")
