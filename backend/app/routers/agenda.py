from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.usuario import Usuario
from app.schemas.agenda import AgendaCreate, AgendaUpdate, AgendaResponse
from app.services import agenda_service

router = APIRouter(prefix="/api/agenda", tags=["agenda"])


@router.get("", response_model=list[AgendaResponse])
def listar(
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return agenda_service.listar(db, data_inicio, data_fim)


@router.post("", response_model=AgendaResponse, status_code=201)
def criar(
    dados: AgendaCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return agenda_service.criar(db, **dados.model_dump())


@router.put("/{item_id}", response_model=AgendaResponse)
def atualizar(
    item_id: int,
    dados: AgendaUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    item = agenda_service.atualizar(db, item_id, **dados.model_dump(exclude_none=True))
    if not item:
        raise HTTPException(status_code=404, detail="Compromisso não encontrado")
    return item


@router.delete("/{item_id}", status_code=204)
def deletar(
    item_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    if not agenda_service.deletar(db, item_id):
        raise HTTPException(status_code=404, detail="Compromisso não encontrado")
