from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.dependencies import get_db, requer_cargo
from app.schemas.lancamento import LancamentoCreate, LancamentoResponse
from app.services import lancamentos_service
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/financeiro", tags=["financeiro"])

_CAIXA_OU_ADMIN = requer_cargo("Proprietário", "Caixa")


@router.get("/lancamentos", response_model=list[LancamentoResponse])
def listar(
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(_CAIXA_OU_ADMIN),
):
    return lancamentos_service.listar(db, data_inicio, data_fim)


@router.post("/lancamentos", response_model=LancamentoResponse, status_code=201)
def criar(
    dados: LancamentoCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(_CAIXA_OU_ADMIN),
):
    return lancamentos_service.criar(db, dados, usuario_atual.id)
