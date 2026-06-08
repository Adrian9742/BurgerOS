const { app, BrowserWindow, dialog } = require("electron")
const path = require("path")
const { spawn } = require("child_process")
const http = require("http")
const fs = require("fs")

const isDev = !app.isPackaged
let backendProcess = null

// ── encontra o executável Python disponível no sistema ──────────────────────
function encontrarPython() {
  const candidatos = [
    "python",
    "python3",
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Python", "Python314", "python.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Python", "Python313", "python.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Python", "Python312", "python.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Python", "Python311", "python.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Python", "Python310", "python.exe"),
    "C:\\Python314\\python.exe",
    "C:\\Python313\\python.exe",
    "C:\\Python312\\python.exe",
  ]
  for (const candidato of candidatos) {
    try {
      const { execSync } = require("child_process")
      execSync(`"${candidato}" --version`, { stdio: "ignore" })
      return candidato
    } catch {}
  }
  return null
}

// ── aguarda o backend responder antes de abrir a janela ─────────────────────
function aguardarBackend(tentativas = 40, intervalo = 500) {
  return new Promise((resolve, reject) => {
    const tentar = () => {
      http.get("http://localhost:8000/api/health", (res) => {
        if (res.statusCode === 200) resolve()
        else agendar()
      }).on("error", () => agendar())
    }
    const agendar = () => {
      if (--tentativas <= 0) reject(new Error("Backend não respondeu em tempo"))
      else setTimeout(tentar, intervalo)
    }
    tentar()
  })
}

// ── inicia o backend (somente em produção) ──────────────────────────────────
async function iniciarBackend() {
  if (isDev) return

  const python = encontrarPython()
  if (!python) {
    dialog.showErrorBox(
      "BurgerOS — Python não encontrado",
      "Python 3.10 ou superior precisa estar instalado.\n\nBaixe em: https://python.org/downloads",
    )
    app.quit()
    return
  }

  const backendDir = path.join(process.resourcesPath, "backend")
  const logPath = path.join(app.getPath("userData"), "backend.log")
  const logFd = fs.openSync(logPath, "a")

  backendProcess = spawn(
    python,
    ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--no-access-log"],
    {
      cwd: backendDir,
      detached: false,
      windowsHide: true,
      stdio: ["ignore", logFd, logFd],
      env: { ...process.env, PYTHONPATH: backendDir },
    },
  )

  backendProcess.on("close", () => {
    try { fs.closeSync(logFd) } catch {}
  })

  backendProcess.on("error", (err) => {
    dialog.showErrorBox("BurgerOS — Erro no servidor", `Falha ao iniciar backend:\n${err.message}`)
  })

  await aguardarBackend()
}

// ── cria a janela principal ──────────────────────────────────────────────────
function criarJanela() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    backgroundColor: "#0f0f0f",
    title: "BurgerOS",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL("http://localhost:5173")
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"))
    win.setMenuBarVisibility(false)
  }
}

// ── ciclo de vida do app ─────────────────────────────────────────────────────
app.whenReady().then(async () => {
  try {
    await iniciarBackend()
    criarJanela()
  } catch (err) {
    dialog.showErrorBox("BurgerOS — Falha na inicialização", err.message)
    app.quit()
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) criarJanela()
  })
})

app.on("window-all-closed", () => {
  if (backendProcess) {
    backendProcess.kill()
    backendProcess = null
  }
  if (process.platform !== "darwin") app.quit()
})
