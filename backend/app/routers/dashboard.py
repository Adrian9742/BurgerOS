from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, requer_cargo
from app.services import dashboard_service
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

_CAIXA_OU_ADMIN = requer_cargo("Proprietário", "Caixa")


@router.get("")
def metricas(db: Session = Depends(get_db), _: Usuario = Depends(_CAIXA_OU_ADMIN)):
    return dashboard_service.get_metricas(db)
