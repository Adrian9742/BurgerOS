; ── BurgerOS — Script NSIS customizado ───────────────────────────────────────
; Verificação e instalação automática do Python 3.12
; Nota: $$ em NSIS = $ literal no arquivo gerado (necessário para variáveis PowerShell)

!macro customInstall
  ; ── 1. Verificar se Python já está instalado ─────────────────────────────
  DetailPrint "Verificando Python..."
  nsExec::ExecToStack 'python --version'
  Pop $0  ; código de retorno (0 = encontrado)
  Pop $1  ; texto de saída

  ${If} $0 != 0
    ; Python não encontrado — perguntar ao usuário
    MessageBox MB_YESNO|MB_ICONQUESTION \
      "O BurgerOS precisa do Python 3.12 para funcionar.$\n$\nDeseja baixar e instalar automaticamente?$\n(~26 MB — necessário conexão com a internet)" \
      IDYES burgeros_download_python IDNO burgeros_skip_python

    burgeros_download_python:
      ; Escreve script PowerShell em arquivo temporário
      ; $$ em NSIS = $ literal (para variáveis PowerShell)
      FileOpen $9 "$TEMP\burgeros_getpython.ps1" w
      FileWrite $9 "try {"
      FileWrite $9 "$$ProgressPreference = 'SilentlyContinue';"
      FileWrite $9 "Invoke-WebRequest 'https://www.python.org/ftp/python/3.12.7/python-3.12.7-amd64.exe' -OutFile '$$env:TEMP\python_setup.exe';"
      FileWrite $9 "exit 0 } catch { exit 1 }"
      FileClose $9

      DetailPrint "Baixando Python 3.12 (~26 MB)..."
      nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -NonInteractive -File "$TEMP\burgeros_getpython.ps1"'
      Pop $2
      Delete "$TEMP\burgeros_getpython.ps1"

      ${If} $2 == 0
        DetailPrint "Instalando Python 3.12 (modo silencioso)..."
        nsExec::ExecToLog '"$TEMP\python_setup.exe" /quiet InstallAllUsers=0 PrependPath=1 Include_launcher=0'
        Pop $2
        Delete "$TEMP\python_setup.exe"

        ${If} $2 == 0
          DetailPrint "Python 3.12 instalado com sucesso!"
        ${Else}
          MessageBox MB_OK|MB_ICONEXCLAMATION \
            "Falha ao instalar Python.$\nInstale manualmente em: python.org/downloads$\nDepois reinstale o BurgerOS."
          Goto burgeros_python_done
        ${EndIf}
      ${Else}
        MessageBox MB_OK|MB_ICONEXCLAMATION \
          "Falha ao baixar Python.$\nVerifique a conexão e tente novamente,$\nou instale manualmente em: python.org/downloads"
        Goto burgeros_python_done
      ${EndIf}
      Goto burgeros_install_deps

    burgeros_skip_python:
      MessageBox MB_OK|MB_ICONINFORMATION \
        "Python não será instalado.$\nO BurgerOS não funcionará sem o Python.$\nInstale em: python.org/downloads e reinstale o BurgerOS."
      Goto burgeros_python_done
  ${EndIf}

  burgeros_install_deps:
  ; ── 2. Instalar dependências Python via pip ───────────────────────────────
  DetailPrint "Instalando dependências Python (pode levar 1-2 min na primeira vez)..."

  nsExec::ExecToLog 'python -m pip install -r "$INSTDIR\resources\backend\requirements.txt" --quiet --no-warn-script-location'
  Pop $2

  ${If} $2 != 0
    ; Tenta pelo caminho padrão de instalação de usuário
    nsExec::ExecToLog '"$LOCALAPPDATA\Programs\Python\Python312\python.exe" -m pip install -r "$INSTDIR\resources\backend\requirements.txt" --quiet'
    Pop $2
  ${EndIf}

  ${If} $2 == 0
    DetailPrint "Dependências instaladas com sucesso!"
  ${Else}
    MessageBox MB_OK|MB_ICONEXCLAMATION \
      "Falha ao instalar dependências Python.$\nO BurgerOS tentará instalá-las na primeira execução automaticamente."
  ${EndIf}

  burgeros_python_done:
!macroend
