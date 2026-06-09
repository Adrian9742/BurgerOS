import { useState, useEffect, useCallback } from "react"
import { DollarSign, ShoppingBag, ArrowUpCircle, ArrowDownCircle, Lock, LockOpen, History, TrendingUp } from "lucide-react"
import { turnosService } from "../../services/turnosService.js"
import { useToast } from "../../context/ToastContext.jsx"
import { formatarMoeda } from "../../utils/format.js"
import LoadingSpinner from "../../components/LoadingSpinner.jsx"

function formatarDT(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatarDuracao(abertura) {
  const diff = Date.now() - new Date(abertura).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

export default function Turno() {
  const { mostrar } = useToast()
  const [turnoAtual, setTurnoAtual] = useState(undefined)
  const [historico, setHistorico] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [caixaInicial, setCaixaInicial] = useState("")
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
      mostrar("Erro ao carregar turno", "erro")
    } finally {
      setCarregando(false)
    }
  }, [mostrar])

  useEffect(() => { carregar() }, [carregar])

  // Atualiza totais ao vivo a cada 30s enquanto caixa estiver aberto
  useEffect(() => {
    if (!turnoAtual) return
    const id = setInterval(async () => {
      try {
        const atualizado = await turnosService.atual()
        setTurnoAtual(atualizado)
      } catch {}
      setTick(t => t + 1)
    }, 30000)
    return () => clearInterval(id)
  }, [turnoAtual])

  const abrirCaixa = async (e) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const novo = await turnosService.abrir(
        caixaInicial === "" ? 0 : parseFloat(caixaInicial),
        obsAbrir || null,
      )
      setTurnoAtual(novo)
      setCaixaInicial("")
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
    if (!confirm("Fechar o caixa agora? Os totais serão registrados.")) return
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

      {/* ── Caixa aberto ── */}
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

          {/* Cards de totais */}
          <div className="mb-3 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-borda bg-card p-3 text-center">
              <DollarSign className="mx-auto mb-1 h-4 w-4 text-texto-fraco" />
              <p className="text-sm font-black text-texto">{formatarMoeda(turnoAtual.caixa_inicial)}</p>
              <p className="text-xs text-texto-fraco">Fundo troco</p>
            </div>
            <div className="rounded-lg border border-borda bg-card p-3 text-center">
              <ArrowUpCircle className="mx-auto mb-1 h-4 w-4 text-positivo" />
              <p className="text-sm font-black text-texto">{formatarMoeda(turnoAtual.total_entrada)}</p>
              <p className="text-xs text-texto-fraco">Entradas</p>
            </div>
            <div className="rounded-lg border border-borda bg-card p-3 text-center">
              <ArrowDownCircle className="mx-auto mb-1 h-4 w-4 text-negativo" />
              <p className="text-sm font-black text-texto">{formatarMoeda(turnoAtual.total_saida)}</p>
              <p className="text-xs text-texto-fraco">Saídas</p>
            </div>
          </div>

          {/* Saldo — número principal do dia */}
          <div className="mb-5 flex items-center justify-between rounded-xl border-2 border-laranja/30 bg-laranja/5 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">Saldo em caixa</p>
              <p className="text-xs text-texto-fraco">Fundo + Entradas − Saídas</p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-black ${turnoAtual.saldo >= 0 ? "text-laranja" : "text-status-cancelado"}`}>
                {formatarMoeda(turnoAtual.saldo)}
              </p>
              <p className="text-xs text-texto-fraco">{turnoAtual.pedidos_entregues} pedido{turnoAtual.pedidos_entregues !== 1 ? "s" : ""} entregue{turnoAtual.pedidos_entregues !== 1 ? "s" : ""}</p>
            </div>
          </div>

          <form onSubmit={fecharCaixa} className="flex items-center gap-3">
            <input
              value={obsFechar}
              onChange={(e) => setObsFechar(e.target.value)}
              placeholder="Observação ao fechar (opcional)"
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
        /* ── Caixa fechado ── */
        <div className="rounded-xl border border-borda bg-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-texto-fraco/10 text-texto-fraco">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-bold text-texto">Caixa Fechado</p>
              <p className="text-xs text-texto-suave">Informe o fundo de troco e abra o caixa para iniciar o dia</p>
            </div>
          </div>

          <form onSubmit={abrirCaixa} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-texto-suave">
                  Fundo de troco (R$) *
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={caixaInicial}
                  onChange={(e) => setCaixaInicial(e.target.value)}
                  placeholder="Ex: 200,00"
                  className="w-full rounded-lg border border-laranja/40 bg-fundo px-4 py-2.5 text-sm font-bold text-texto placeholder:font-normal placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
                  autoFocus
                />
                <p className="mt-1 text-xs text-texto-fraco">Dinheiro colocado no caixa para troco</p>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-texto-suave">Observação (opcional)</span>
                <input
                  value={obsAbrir}
                  onChange={(e) => setObsAbrir(e.target.value)}
                  placeholder="Ex: turno da manhã"
                  className="w-full rounded-lg border border-borda bg-fundo px-4 py-2.5 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={salvando}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-status-entregue/10 py-3 text-sm font-bold text-status-entregue transition-colors hover:bg-status-entregue hover:text-white disabled:opacity-50"
            >
              <LockOpen className="h-4 w-4" />
              {salvando ? "Abrindo..." : "Abrir Caixa"}
            </button>
          </form>
        </div>
      )}

      {/* ── Histórico de turnos ── */}
      {historico.length > 0 && (
        <div className="rounded-xl border border-borda bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-texto-fraco" />
            <h2 className="text-base font-bold text-texto">Histórico de Turnos</h2>
          </div>
          <div className="space-y-3">
            {historico.map((t) => (
              <div key={t.id} className="rounded-lg border border-borda bg-fundo p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold text-texto-suave">
                    {formatarDT(t.abertura)} → {formatarDT(t.fechamento)}
                  </p>
                  {t.operador && <span className="text-xs text-texto-fraco">{t.operador}</span>}
                </div>

                <div className="mb-2 grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-xs text-texto-fraco">Fundo</p>
                    <p className="text-sm font-bold text-texto">{formatarMoeda(t.caixa_inicial)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-texto-fraco">Entradas</p>
                    <p className="text-sm font-bold text-positivo">{formatarMoeda(t.total_entrada)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-texto-fraco">Saídas</p>
                    <p className="text-sm font-bold text-negativo">{formatarMoeda(t.total_saida)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-texto-fraco">Saldo final</p>
                    <p className={`text-sm font-black ${t.saldo >= 0 ? "text-laranja" : "text-status-cancelado"}`}>{formatarMoeda(t.saldo)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-borda pt-2">
                  <ShoppingBag className="h-3.5 w-3.5 text-texto-fraco" />
                  <span className="text-xs text-texto-suave">{t.pedidos_entregues} pedidos entregues</span>
                  {t.total_entrada > 0 && (
                    <>
                      <TrendingUp className="ml-2 h-3.5 w-3.5 text-texto-fraco" />
                      <span className="text-xs text-texto-suave">
                        Ticket médio: {formatarMoeda(t.pedidos_entregues > 0 ? t.total_entrada / t.pedidos_entregues : 0)}
                      </span>
                    </>
                  )}
                  {t.observacao && <span className="ml-auto text-xs italic text-texto-fraco">"{t.observacao}"</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
