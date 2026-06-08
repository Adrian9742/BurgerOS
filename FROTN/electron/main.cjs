const { app, BrowserWindow, dialog, ipcMain } = require("electron")
const path = require("path")
const { spawn, execFile } = require("child_process")
const http = require("http")
const fs = require("fs")

const isDev = !app.isPackaged
let backendProcess = null
let backupInterval = null

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

// ── backup automático com pg_dump ───────────────────────────────────────────
function executarBackup() {
  const backupDir = path.join(app.getPath("userData"), "backups")
  fs.mkdirSync(backupDir, { recursive: true })

  const agora = new Date()
  const stamp = agora.toISOString().replace(/[T:]/g, "-").replace(/\..+/, "").replace(/-(\d{2}-\d{2})$/, "_$1")
  const arquivo = path.join(backupDir, `backup-${stamp}.sql`)

  execFile(
    "pg_dump",
    ["-U", "postgres", "-h", "localhost", "-p", "5432", "hamburgueria"],
    { env: { ...process.env, PGPASSWORD: "real8800" }, timeout: 30000 },
    (err, stdout) => {
      if (err) {
        const logPath = path.join(app.getPath("userData"), "backend.log")
        try { fs.appendFileSync(logPath, `[BACKUP ERRO] ${err.message}\n`) } catch {}
        return
      }

      fs.writeFileSync(arquivo, stdout, "utf8")

      // guarda timestamp do último backup bem-sucedido
      const metaPath = path.join(backupDir, "meta.json")
      fs.writeFileSync(metaPath, JSON.stringify({ ultimoBackup: agora.toISOString() }), "utf8")

      // mantém no máximo 30 backups
      const lista = fs.readdirSync(backupDir)
        .filter((f) => f.startsWith("backup-") && f.endsWith(".sql"))
        .sort()
      if (lista.length > 30) {
        lista.slice(0, lista.length - 30).forEach((f) => {
          try { fs.unlinkSync(path.join(backupDir, f)) } catch {}
        })
      }
    },
  )
}

function agendarBackups() {
  // verifica se precisa rodar agora (último backup > 24h ou nunca)
  const metaPath = path.join(app.getPath("userData"), "backups", "meta.json")
  let deveRodarAgora = true
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"))
    const ultimo = new Date(meta.ultimoBackup)
    deveRodarAgora = (Date.now() - ultimo.getTime()) > 24 * 60 * 60 * 1000
  } catch {}

  if (deveRodarAgora) {
    // pequeno delay para o backend estar totalmente pronto
    setTimeout(executarBackup, 5000)
  }

  // agendamento a cada 24h
  backupInterval = setInterval(executarBackup, 24 * 60 * 60 * 1000)
}

// ── handler IPC para backup manual (chamado pela página Configurações) ──────
ipcMain.handle("backup:executar", () => {
  executarBackup()
  return { ok: true }
})

ipcMain.handle("backup:listar", () => {
  const backupDir = path.join(app.getPath("userData"), "backups")
  try {
    const lista = fs.readdirSync(backupDir)
      .filter((f) => f.startsWith("backup-") && f.endsWith(".sql"))
      .sort()
      .reverse()
      .map((nome) => {
        const stat = fs.statSync(path.join(backupDir, nome))
        return { nome, tamanho: stat.size, data: stat.mtime.toISOString() }
      })
    return lista
  } catch {
    return []
  }
})

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
      preload: path.join(__dirname, "preload.cjs"),
    },
  })

  win.on("close", async (event) => {
    let count = 0
    try {
      count = await win.webContents.executeJavaScript(
        'parseInt(localStorage.getItem("burgeros_pedidos_ativos") || "0")'
      )
    } catch {}

    if (count > 0) {
      event.preventDefault()
      const { response } = await dialog.showMessageBox(win, {
        type: "warning",
        buttons: ["Fechar mesmo assim", "Cancelar"],
        defaultId: 1,
        cancelId: 1,
        title: "Pedidos ativos na fila",
        message: `Há ${count} pedido${count > 1 ? "s" : ""} em andamento!`,
        detail: "Fechar o BurgerOS agora vai interromper o atendimento. Tem certeza?",
      })
      if (response === 0) win.destroy()
    }
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
    agendarBackups()
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
  if (backupInterval) clearInterval(backupInterval)
  if (backendProcess) {
    backendProcess.kill()
    backendProcess = null
  }
  if (process.platform !== "darwin") app.quit()
})
