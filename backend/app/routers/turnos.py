from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.schemas.turno import AbrirTurnoRequest, FecharTurnoRequest, TurnoResponse
from app.services import turnos_service
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/turnos", tags=["turnos"])


@router.get("/atual", response_model=TurnoResponse | None)
def turno_atual(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return turnos_service.turno_atual(db)


@router.get("", response_model=list[TurnoResponse])
def listar(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return turnos_service.listar(db)


@router.post("", response_model=TurnoResponse, status_code=201)
def abrir(
    dados: AbrirTurnoRequest,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_current_user),
):
    return turnos_service.abrir(db, usuario_atual.id, dados.observacao)


@router.patch("/{turno_id}/fechar", response_model=TurnoResponse)
def fechar(
    turno_id: int,
    dados: FecharTurnoRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return turnos_service.fechar(db, turno_id, dados.observacao)
