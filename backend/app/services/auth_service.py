from sqlalchemy.orm import Session
from app.models.usuario import Usuario
from app.utils.security import hash_senha, verificar_senha

_USUARIOS_DEMO = [
    {
        "nome": "Administrador",
        "email": "admin@burgerhouse.com.br",
        "usuario": "admin",
        "senha": "admin",
        "cargo": "Proprietário",
    },
    {
        "nome": "Operador Caixa",
        "email": "caixa@burgerhouse.com.br",
        "usuario": "caixa",
        "senha": "caixa",
        "cargo": "Caixa",
    },
    {
        "nome": "Garçom",
        "email": "garcom@burgerhouse.com.br",
        "usuario": "garcom",
        "senha": "garcom",
        "cargo": "Garçom",
    },
]


def autenticar(db: Session, usuario: str, senha: str) -> Usuario | None:
    user = (
        db.query(Usuario)
        .filter(Usuario.usuario == usuario, Usuario.ativo == True)
        .first()
    )
    if not user or not verificar_senha(senha, user.senha_hash):
        return None
    return user


def get_usuario_por_id(db: Session, usuario_id: int) -> Usuario | None:
    return (
        db.query(Usuario)
        .filter(Usuario.id == usuario_id, Usuario.ativo == True)
        .first()
    )


def seed_usuarios(db: Session) -> None:
    for dados in _USUARIOS_DEMO:
        existe = db.query(Usuario).filter(Usuario.usuario == dados["usuario"]).first()
        if not existe:
            user = Usuario(
                nome=dados["nome"],
                email=dados["email"],
                usuario=dados["usuario"],
                senha_hash=hash_senha(dados["senha"]),
                cargo=dados["cargo"],
            )
            db.add(user)
    db.commit()
