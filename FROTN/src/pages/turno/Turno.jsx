import { useState, useEffect, useCallback } from "react"
import { Clock, DollarSign, ShoppingBag, ArrowUpCircle, ArrowDownCircle, Lock, LockOpen, History } from "lucide-react"
import { turnosService } from "../../services/turnosService.js"
import { useToast } from "../../context/ToastContext.jsx"
import { formatarMoeda } from "../../utils/format.js"
import LoadingSpinner from "../../components/LoadingSpinner.jsx"

function formatarDuracao(abertura) {
  const diff = Date.now() - new Date(abertura).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

function formatarDT(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function Turno() {
  const { mostrar } = useToast()
  const [turnoAtual, setTurnoAtual] = useState(undefined)
  const [historico, setHistorico] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [obsAbrir, setObsAbrir] = useState("")
  const [obsFechar, setObsFechar] = useState("")
  const [, setTick] = useState(0)

  const carregar = useCallback(async () => {
    try {
      const [atual, hist] = await Promise.all([
        turnosService.atual(),
        turnosService.listar(),
      ])
      setTurnoAtual(atual)
      setHistorico(hist.filter((t) => t.fechamento !== null).slice(0, 10))
    } catch {
      mostrar("Erro ao carregar turnos", "erro")
    } finally {
      setCarregando(false)
    }
  }, [mostrar])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    if (!turnoAtual) return
    const id = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(id)
  }, [turnoAtual])

  const abrirCaixa = async (e) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const novo = await turnosService.abrir(obsAbrir || null)
      setTurnoAtual(novo)
      setObsAbrir("")
      mostrar("Caixa aberto!", "sucesso")
    } catch (err) {
      mostrar(err?.response?.data?.detail || "Erro ao abrir caixa", "erro")
    } finally {
      setSalvando(false)
    }
  }

  const fecharCaixa = async (e) => {
    e.preventDefault()
    if (!confirm("Fechar o caixa agora? Os totais serão calculados e registrados.")) return
    setSalvando(true)
    try {
      const fechado = await turnosService.fechar(turnoAtual.id, obsFechar || null)
      setTurnoAtual(null)
      setHistorico((h) => [fechado, ...h].slice(0, 10))
      setObsFechar("")
      mostrar("Caixa fechado!", "sucesso")
    } catch (err) {
      mostrar(err?.response?.data?.detail || "Erro ao fechar caixa", "erro")
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <LoadingSpinner texto="Carregando turno..." />

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* estado atual */}
      {turnoAtual ? (
        <div className="rounded-xl border border-status-entregue/40 bg-status-entregue/5 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-entregue/20 text-status-entregue">
                <LockOpen className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-bold text-texto">Caixa Aberto</p>
                <p className="text-xs text-texto-suave">
                  Aberto às {formatarDT(turnoAtual.abertura)} · {formatarDuracao(turnoAtual.abertura)} em operação
                </p>
              </div>
            </div>
            {turnoAtual.operador && (
              <span className="rounded-full border border-borda bg-fundo px-3 py-1 text-xs text-texto-suave">
                {turnoAtual.operador}
              </span>
            )}
          </div>

          <div className="mb-5 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-borda bg-card p-4 text-center">
              <ArrowUpCircle className="mx-auto mb-1 h-5 w-5 text-positivo" />
              <p className="text-lg font-black text-texto">{formatarMoeda(turnoAtual.total_entrada)}</p>
              <p className="text-xs text-texto-fraco">Entradas</p>
            </div>
            <div className="rounded-lg border border-borda bg-card p-4 text-center">
              <ArrowDownCircle className="mx-auto mb-1 h-5 w-5 text-negativo" />
              <p className="text-lg font-black text-texto">{formatarMoeda(turnoAtual.total_saida)}</p>
              <p className="text-xs text-texto-fraco">Saídas</p>
            </div>
            <div className="rounded-lg border border-borda bg-card p-4 text-center">
              <DollarSign className="mx-auto mb-1 h-5 w-5 text-laranja" />
              <p className="text-lg font-black text-laranja">{formatarMoeda(turnoAtual.saldo)}</p>
              <p className="text-xs text-texto-fraco">Saldo</p>
            </div>
          </div>

          <form onSubmit={fecharCaixa} className="flex items-center gap-3">
            <input
              value={obsFechar}
              onChange={(e) => setObsFechar(e.target.value)}
              placeholder="Observação opcional ao fechar..."
              className="flex-1 rounded-lg border border-borda bg-fundo px-4 py-2.5 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
            />
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 rounded-lg bg-status-cancelado/10 px-5 py-2.5 text-sm font-bold text-status-cancelado transition-colors hover:bg-status-cancelado hover:text-white disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              {salvando ? "Fechando..." : "Fechar Caixa"}
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-xl border border-borda bg-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-texto-fraco/10 text-texto-fraco">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-bold text-texto">Caixa Fechado</p>
              <p className="text-xs text-texto-suave">Abra o caixa para iniciar o turno do dia</p>
            </div>
          </div>
          <form onSubmit={abrirCaixa} className="flex items-center gap-3">
            <input
              value={obsAbrir}
              onChange={(e) => setObsAbrir(e.target.value)}
              placeholder="Observação opcional ao abrir..."
              className="flex-1 rounded-lg border border-borda bg-fundo px-4 py-2.5 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
            />
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 rounded-lg bg-status-entregue/10 px-5 py-2.5 text-sm font-bold text-status-entregue transition-colors hover:bg-status-entregue hover:text-white disabled:opacity-50"
            >
              <LockOpen className="h-4 w-4" />
              {salvando ? "Abrindo..." : "Abrir Caixa"}
            </button>
          </form>
        </div>
      )}

      {/* histórico */}
      {historico.length > 0 && (
        <div className="rounded-xl border border-borda bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-texto-fraco" />
            <h2 className="text-base font-bold text-texto">Histórico de Turnos</h2>
          </div>
          <div className="space-y-3">
            {historico.map((t) => (
              <div key={t.id} className="rounded-lg border border-borda bg-fundo p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-texto-suave">
                    {formatarDT(t.abertura)} → {formatarDT(t.fechamento)}
                  </p>
                  {t.operador && <span className="text-xs text-texto-fraco">{t.operador}</span>}
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1.5 text-sm">
                    <ArrowUpCircle className="h-4 w-4 text-positivo" />
                    <span className="font-bold text-texto">{formatarMoeda(t.total_entrada)}</span>
                    <span className="text-texto-fraco">entradas</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <ArrowDownCircle className="h-4 w-4 text-negativo" />
                    <span className="font-bold text-texto">{formatarMoeda(t.total_saida)}</span>
                    <span className="text-texto-fraco">saídas</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <ShoppingBag className="h-4 w-4 text-laranja" />
                    <span className="font-bold text-texto">{t.pedidos_entregues}</span>
                    <span className="text-texto-fraco">pedidos</span>
                  </div>
                  <div className="ml-auto text-sm font-black text-laranja">
                    {formatarMoeda(t.saldo)}
                  </div>
                </div>
                {t.observacao && (
                  <p className="mt-2 text-xs text-texto-fraco">"{t.observacao}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
