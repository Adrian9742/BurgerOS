from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.routers import auth, produtos, clientes, pedidos, lancamentos, dashboard, usuarios, configuracoes, agenda
from app.services.auth_service import seed_usuarios
from app.services.produtos_service import seed_produtos
from app.services.clientes_service import seed_clientes
from app.services.configuracoes_service import seed_configuracoes


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_usuarios(db)
        seed_produtos(db)
        seed_clientes(db)
        seed_configuracoes(db)
    finally:
        db.close()
    yield


app = FastAPI(title="BurgerOS API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "file://", "null"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(produtos.router)
app.include_router(clientes.router)
app.include_router(pedidos.router)
app.include_router(lancamentos.router)
app.include_router(dashboard.router)
app.include_router(usuarios.router)
app.include_router(configuracoes.router)
app.include_router(agenda.router)


@app.get("/api/health")
def health():
    return {"ok": True}
