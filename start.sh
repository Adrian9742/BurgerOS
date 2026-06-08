#!/bin/bash
set -e

echo ""
echo "=========================================="
echo " BurgerOS — Iniciando sistema..."
echo "=========================================="
echo ""

echo "[1/3] Verificando PostgreSQL..."
if ! pg_isready -h localhost -p 5432 -q; then
    echo " ERRO: PostgreSQL não está rodando em localhost:5432"
    echo " Inicie o PostgreSQL e tente novamente."
    exit 1
fi
echo " PostgreSQL OK"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "[2/3] Subindo backend FastAPI..."
cd "$SCRIPT_DIR/backend"
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
echo " Backend PID: $BACKEND_PID"

echo " Aguardando backend iniciar..."
sleep 3

echo ""
echo "[3/3] Subindo frontend..."
cd "$SCRIPT_DIR/FROTN"
pnpm dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo " BurgerOS iniciado!"
echo " Backend : http://localhost:8000/docs"
echo " Frontend: http://localhost:5173"
echo "=========================================="
echo ""
echo " Pressione Ctrl+C para encerrar tudo."

wait
