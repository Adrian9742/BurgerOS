# -*- mode: python ; coding: utf-8 -*-
# Gerar o executável do backend FlameOS sem precisar de Python no PC destino.
# Uso: pyinstaller build_backend.spec  (dentro da pasta backend/ com venv ativo)

block_cipher = None

a = Analysis(
    ["run.py"],
    pathex=["."],
    binaries=[],
    datas=[
        (".env", "."),
        ("alembic.ini", "."),
        ("alembic", "alembic"),
    ],
    hiddenimports=[
        # modelos SQLAlchemy (PyInstaller não detecta imports dinâmicos)
        "app.models.usuario",
        "app.models.pedido",
        "app.models.produto",
        "app.models.cliente",
        "app.models.ingrediente",
        "app.models.lancamento",
        "app.models.agenda",
        "app.models.turno",
        # psycopg3 usa muitos módulos internos
        "psycopg",
        "psycopg.adapt",
        "psycopg._adapt",
        "psycopg._binary",
        "psycopg.types",
        "psycopg.types.numeric",
        "psycopg.types.text",
        "psycopg.types.datetime",
        "psycopg._dns",
        # auth
        "passlib.handlers.bcrypt",
        "passlib.handlers.sha2_crypt",
        "jose.backends",
        "jose.backends.cryptography_backend",
        # uvicorn internals
        "uvicorn.logging",
        "uvicorn.loops",
        "uvicorn.loops.auto",
        "uvicorn.loops.asyncio",
        "uvicorn.protocols",
        "uvicorn.protocols.http",
        "uvicorn.protocols.http.auto",
        "uvicorn.protocols.http.h11_impl",
        "uvicorn.protocols.websockets",
        "uvicorn.protocols.websockets.auto",
        "uvicorn.lifespan",
        "uvicorn.lifespan.on",
        "uvicorn.lifespan.off",
        # email-validator (usado pelo pydantic)
        "email_validator",
        # multipart
        "multipart",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        "tkinter",
        "matplotlib",
        "numpy",
        "PIL",
        "cv2",
        "test",
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="run",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,          # sem janela de console
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="run",
)
