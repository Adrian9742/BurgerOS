from sqlalchemy import Column, Integer, String, Date, Time
from app.database import Base


class Agenda(Base):
    __tablename__ = "agenda"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(200), nullable=False)
    data = Column(Date, nullable=False)
    hora = Column(Time, nullable=False)
    detalhe = Column(String(500), nullable=True)
    tipo = Column(String(50), nullable=False, default="operacao")
