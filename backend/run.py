"""
Entry-point para PyInstaller.
Gerado com: pyinstaller build_backend.spec
"""
import sys
import os

# ── paths ────────────────────────────────────────────────────────────────────
if getattr(sys, "frozen", False):
    # Diretório do executável (dist/run/)
    exe_dir = os.path.dirname(sys.executable)
    # Diretório dos dados bundlados (dist/run/_internal/)
    meipass = sys._MEIPASS
else:
    exe_dir = os.path.dirname(os.path.abspath(__file__))
    meipass = exe_dir

# Adiciona os dois diretórios ao path para que o Python encontre os módulos
sys.path.insert(0, meipass)
sys.path.insert(0, exe_dir)
os.chdir(meipass)

# ── stdout/stderr (PyInstaller --noconsole define como None) ─────────────────
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")

# ── carrega .env manualmente antes de qualquer import da app ─────────────────
# pydantic-settings procura .env no CWD; aqui garantimos que as vars são
# carregadas independente de onde o CWD esteja.
def _load_dotenv(path):
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as fh:
        for raw in fh:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val

# Procura .env primeiro ao lado do .exe (editável pelo usuário),
# depois dentro do bundle.
_load_dotenv(os.path.join(exe_dir, ".env"))
_load_dotenv(os.path.join(meipass, ".env"))

# ── inicia o servidor ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    from app.main import app as fastapi_app
    import uvicorn
    uvicorn.run(
        fastapi_app,
        host="127.0.0.1",
        port=8000,
        log_level="error",
        access_log=False,
    )
