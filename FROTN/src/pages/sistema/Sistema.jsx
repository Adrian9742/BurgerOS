import { useState, useEffect, useRef } from "react"
import { Volume2, VolumeX, HardDrive, RefreshCw, CheckCircle, AlertCircle, Trash2, TriangleAlert, Clock } from "lucide-react"
import { TEMPO_ALERTA_MINUTOS } from "../../utils/constants.js"
import { useToast } from "../../context/ToastContext.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import { pedidosService } from "../../services/pedidosService.js"

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
  const { usuario } = useAuth()
  const [somAtivado, setSomAtivado] = useState(localStorage.getItem("burgeros_som") !== "false")
  const [alertaMin, setAlertaMin] = useState(
    Number(localStorage.getItem("burgeros_alerta_min") || TEMPO_ALERTA_MINUTOS)
  )
  const [alertaTemp, setAlertaTemp] = useState("")
  const [editandoAlerta, setEditandoAlerta] = useState(false)
  const [backups, setBackups] = useState([])
  const [fazendoBackup, setFazendoBackup] = useState(false)
  const [resetando, setResetando] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const alertaRef = useRef(null)
  const temElectron = typeof window.burgeros !== "undefined"
  const isProprietario = usuario?.cargo === "Proprietário"

  useEffect(() => {
    if (temElectron) carregarBackups()
  }, [temElectron])

  const carregarBackups = async () => {
    try {
      const lista = await window.burgeros.backup.listar()
      setBackups(lista)
    } catch {}
  }

  const abrirEditAlerta = () => {
    setAlertaTemp(String(alertaMin))
    setEditandoAlerta(true)
    setTimeout(() => alertaRef.current?.select(), 50)
  }

  const salvarAlerta = () => {
    const v = Number(alertaTemp)
    if (v >= 1 && v <= 120) {
      setAlertaMin(v)
      localStorage.setItem("burgeros_alerta_min", String(v))
      mostrar(`Alerta configurado para ${v} minutos`, "sucesso")
    }
    setEditandoAlerta(false)
  }

  const onKeyAlerta = (e) => {
    if (e.key === "Enter") salvarAlerta()
    if (e.key === "Escape") setEditandoAlerta(false)
  }

  const toggleSom = () => {
    const novo = !somAtivado
    setSomAtivado(novo)
    localStorage.setItem("burgeros_som", String(novo))
    mostrar(novo ? "Alertas sonoros ativados" : "Alertas sonoros desativados", "sucesso")
  }

  const handleResetar = async () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    setResetando(true)
    setConfirmReset(false)
    try {
      const resultado = await pedidosService.resetarDia()
      mostrar(`Reset concluído: ${resultado.pedidos_removidos} pedidos e ${resultado.lancamentos_removidos} lançamentos removidos`, "sucesso")
    } catch (e) {
      if (e?.response?.status === 403) {
        mostrar("Apenas Proprietário pode resetar o sistema", "erro")
      } else {
        mostrar("Erro ao resetar o sistema", "erro")
      }
    } finally {
      setResetando(false)
    }
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

      {/* Tempo de alerta */}
      <div className="rounded-xl border border-borda bg-card p-6">
        <h2 className="mb-1 text-base font-bold text-texto">Tempo de Alerta de Pedido</h2>
        <p className="mb-5 text-sm text-texto-suave">
          Pedidos na fila ficam em vermelho após este tempo sem avançar de status.
        </p>
        <div className="flex items-center gap-4">
          <Clock className="h-5 w-5 text-texto-fraco" />
          {editandoAlerta ? (
            <div className="flex items-center gap-2">
              <input
                ref={alertaRef}
                type="number"
                min="1"
                max="120"
                value={alertaTemp}
                onChange={(e) => setAlertaTemp(e.target.value)}
                onKeyDown={onKeyAlerta}
                onBlur={salvarAlerta}
                className="w-20 rounded-lg border border-laranja bg-fundo px-3 py-2 text-sm font-bold text-texto focus:outline-none"
              />
              <span className="text-sm text-texto-suave">minutos</span>
            </div>
          ) : (
            <button
              onClick={abrirEditAlerta}
              className="flex items-center gap-3 rounded-xl border border-borda bg-fundo px-5 py-3 text-sm transition-colors hover:border-laranja/40"
            >
              <span className="text-2xl font-black text-laranja">{alertaMin}</span>
              <span className="text-texto-suave">minutos — clique para alterar</span>
            </button>
          )}
        </div>
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

      {/* Resetar Dia */}
      {isProprietario && (
        <div className="rounded-xl border border-status-cancelado/30 bg-status-cancelado/5 p-6">
          <div className="mb-4 flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-status-cancelado" />
            <div>
              <h2 className="mb-1 text-base font-bold text-texto">Resetar Sistema (Modo Teste)</h2>
              <p className="text-sm text-texto-suave">
                Apaga <strong className="text-texto">todos os pedidos</strong>, lançamentos financeiros e zera o histórico de clientes.
                Use apenas para testes. <strong className="text-status-cancelado">Ação irreversível.</strong>
              </p>
            </div>
          </div>
          {confirmReset ? (
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-status-cancelado">Tem certeza absoluta? Isso apaga tudo.</p>
              <button
                onClick={handleResetar}
                disabled={resetando}
                className="rounded-lg bg-status-cancelado px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {resetando ? "Resetando..." : "Sim, apagar tudo"}
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="rounded-lg border border-borda px-4 py-2 text-sm text-texto-suave hover:text-texto"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={handleResetar}
              className="flex items-center gap-2 rounded-lg border border-status-cancelado/40 px-4 py-2 text-sm font-semibold text-status-cancelado transition-colors hover:bg-status-cancelado/10"
            >
              <Trash2 className="h-4 w-4" />
              Resetar sistema
            </button>
          )}
        </div>
      )}

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
