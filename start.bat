@echo off
chcp 65001 > nul
echo.
echo  ==========================================
echo   FlameOS — Iniciando sistema...
echo  ==========================================
echo.

echo [1/3] Verificando PostgreSQL...
pg_isready -h localhost -p 5432 -q
if errorlevel 1 (
    echo  ERRO: PostgreSQL nao esta rodando em localhost:5432
    echo  Inicie o PostgreSQL e tente novamente.
    pause
    exit /b 1
)
echo  PostgreSQL OK

echo.
echo [2/3] Subindo backend FastAPI...
start "FlameOS - Backend" cmd /k "cd /d %~dp0backend && uvicorn app.main:app --reload --port 8000"

echo  Aguardando backend iniciar...
timeout /t 4 /nobreak > nul

echo.
echo [3/3] Subindo frontend...
start "FlameOS - Frontend" cmd /k "cd /d %~dp0FROTN && pnpm dev"

echo.
echo  ==========================================
echo   FlameOS iniciado!
echo   Backend : http://localhost:8000/docs
echo   Frontend: http://localhost:5173
echo  ==========================================
echo.
