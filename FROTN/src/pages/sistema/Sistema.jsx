import { useState, useEffect } from "react"
import { Volume2, VolumeX, HardDrive, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "../../context/ToastContext.jsx"

function formatarTamanho(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatarData(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function Sistema() {
  const { mostrar } = useToast()
  const [somAtivado, setSomAtivado] = useState(localStorage.getItem("burgeros_som") !== "false")
  const [backups, setBackups] = useState([])
  const [fazendoBackup, setFazendoBackup] = useState(false)
  const temElectron = typeof window.burgeros !== "undefined"

  useEffect(() => {
    if (temElectron) carregarBackups()
  }, [temElectron])

  const carregarBackups = async () => {
    try {
      const lista = await window.burgeros.backup.listar()
      setBackups(lista)
    } catch {}
  }

  const toggleSom = () => {
    const novo = !somAtivado
    setSomAtivado(novo)
    localStorage.setItem("burgeros_som", String(novo))
    mostrar(novo ? "Alertas sonoros ativados" : "Alertas sonoros desativados", "sucesso")
  }

  const fazerBackup = async () => {
    if (!temElectron) {
      mostrar("Backup disponível apenas no app desktop", "erro")
      return
    }
    setFazendoBackup(true)
    try {
      await window.burgeros.backup.executar()
      await new Promise((r) => setTimeout(r, 2000))
      await carregarBackups()
      mostrar("Backup realizado com sucesso!", "sucesso")
    } catch {
      mostrar("Erro ao realizar backup", "erro")
    } finally {
      setFazendoBackup(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Som */}
      <div className="rounded-xl border border-borda bg-card p-6">
        <h2 className="mb-1 text-base font-bold text-texto">Alertas Sonoros</h2>
        <p className="mb-5 text-sm text-texto-suave">
          Toca um bipe quando um novo pedido chega na fila.
        </p>
        <button
          onClick={toggleSom}
          className={`flex items-center gap-3 rounded-xl border px-5 py-3 text-sm font-semibold transition-colors ${
            somAtivado
              ? "border-laranja/40 bg-laranja/10 text-laranja hover:bg-laranja/20"
              : "border-borda bg-fundo text-texto-suave hover:border-laranja/30 hover:text-texto"
          }`}
        >
          {somAtivado ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          {somAtivado ? "Som ativado — clique para desativar" : "Som desativado — clique para ativar"}
        </button>
      </div>

      {/* Backup */}
      <div className="rounded-xl border border-borda bg-card p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="mb-1 text-base font-bold text-texto">Backup do Banco de Dados</h2>
            <p className="text-sm text-texto-suave">
              Backups automáticos diários salvos em <code className="rounded bg-fundo px-1.5 py-0.5 text-xs text-laranja">AppData\BurgerOS\backups</code>.
              Mantém os últimos 30 arquivos.
            </p>
          </div>
          <button
            onClick={fazerBackup}
            disabled={fazendoBackup || !temElectron}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-laranja/10 px-4 py-2 text-sm font-semibold text-laranja transition-colors hover:bg-laranja hover:text-fundo disabled:opacity-50"
          >
            <HardDrive className="h-4 w-4" />
            {fazendoBackup ? "Salvando..." : "Backup agora"}
          </button>
        </div>

        {!temElectron && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-borda bg-fundo px-4 py-3 text-sm text-texto-suave">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Backup disponível apenas no app desktop instalado.
          </div>
        )}

        {backups.length > 0 ? (
          <div className="space-y-2">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-texto-fraco">
                Últimos backups ({backups.length})
              </p>
              <button
                onClick={carregarBackups}
                className="flex items-center gap-1 text-xs text-texto-fraco hover:text-texto"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizar
              </button>
            </div>
            {backups.slice(0, 10).map((b) => (
              <div key={b.nome} className="flex items-center justify-between rounded-lg border border-borda bg-fundo px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 shrink-0 text-status-entregue" />
                  <div>
                    <p className="text-xs font-medium text-texto">{formatarData(b.data)}</p>
                    <p className="text-xs text-texto-fraco">{b.nome}</p>
                  </div>
                </div>
                <span className="text-xs text-texto-fraco">{formatarTamanho(b.tamanho)}</span>
              </div>
            ))}
          </div>
        ) : temElectron ? (
          <p className="text-sm text-texto-fraco">Nenhum backup encontrado. Clique em "Backup agora" para criar o primeiro.</p>
        ) : null}
      </div>

      {/* Versão */}
      <div className="rounded-xl border border-borda bg-card p-6">
        <h2 className="mb-3 text-base font-bold text-texto">Sobre o Sistema</h2>
        <div className="space-y-1.5 text-sm text-texto-suave">
          <p><span className="font-medium text-texto">BurgerOS</span> — Sistema de Gestão para Hamburgueria</p>
          <p>Versão <span className="font-mono text-laranja">1.0.0</span></p>
          <p>Funcionamento 100% offline · Backend local FastAPI + PostgreSQL</p>
        </div>
      </div>
    </div>
  )
}
