@echo off
chcp 65001 > nul
echo.
echo  ==========================================
echo   FlameOS — Build do instalador .exe
echo  ==========================================
echo.

set "ROOT=%~dp0"
set "FROTN=%ROOT%FROTN"
set "BACKEND=%ROOT%backend"
set "WINCOSIGN_CACHE=%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0"
set "SEVENZIP=%FROTN%\node_modules\.pnpm\7zip-bin@5.2.0\node_modules\7zip-bin\win\x64\7za.exe"

echo [1/5] Verificando dependencias do backend...
cd /d "%BACKEND%"
python -m pip install -r requirements.txt -q
if errorlevel 1 (
    echo  ERRO: Falha ao instalar dependencias Python
    pause & exit /b 1
)
echo  Backend OK

echo.
echo [2/5] Executando migracoes do banco...
python -m alembic upgrade head
if errorlevel 1 (
    echo  AVISO: Migrations falharam. Verifique se o PostgreSQL esta rodando.
)

echo.
echo [3/5] Instalando dependencias do frontend...
cd /d "%FROTN%"
pnpm install --silent
echo  OK

echo.
echo [4/5] Corrigindo cache winCodeSign (symlinks no Windows)...
if not exist "%WINCOSIGN_CACHE%" (
    mkdir "%WINCOSIGN_CACHE%" 2>nul
    REM Se ainda nao existir um .7z no cache, o electron-builder vai baixar e falhar
    REM Execute este script como Administrador ou habilite o Modo Desenvolvedor do Windows
    REM para que o 7-Zip consiga criar symlinks.
    echo  AVISO: Cache winCodeSign nao encontrado.
    echo  Se o build falhar com erro de symlink:
    echo    Solucao 1: Habilite o Modo Desenvolvedor (Configuracoes > Para desenvolvedor)
    echo    Solucao 2: Execute este script como Administrador
    echo.
) else (
    echo  Cache winCodeSign OK
    REM Garante que os arquivos dummy existam
    if not exist "%WINCOSIGN_CACHE%\darwin\10.12\lib" mkdir "%WINCOSIGN_CACHE%\darwin\10.12\lib" 2>nul
    if not exist "%WINCOSIGN_CACHE%\darwin\10.12\lib\libcrypto.dylib" type nul > "%WINCOSIGN_CACHE%\darwin\10.12\lib\libcrypto.dylib"
    if not exist "%WINCOSIGN_CACHE%\darwin\10.12\lib\libssl.dylib" type nul > "%WINCOSIGN_CACHE%\darwin\10.12\lib\libssl.dylib"
)

echo.
echo [5/5] Gerando instalador...
set CSC_IDENTITY_AUTO_DISCOVERY=false
pnpm electron:build
if errorlevel 1 (
    echo.
    echo  ERRO: Falha no build.
    echo  Se o erro for sobre symlinks, veja o aviso no passo 4.
    pause & exit /b 1
)

echo.
echo  ==========================================
echo   Instalador: FROTN\dist-electron\FlameOS Setup 1.0.0.exe
echo  ==========================================
echo.
pause
