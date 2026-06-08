import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus, Clock, User, MapPin, ChevronRight, AlertTriangle,
  Printer, XCircle, CreditCard, Banknote, QrCode, HandCoins,
  CheckCircle2, Trash2, RefreshCw, CalendarDays,
} from "lucide-react"
import { usePedidos } from "../../context/PedidosContext.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import { useToast } from "../../context/ToastContext.jsx"
import { formatarMoeda, formatarCronometro, minutosDesde } from "../../utils/format.js"
import { TEMPO_ALERTA_MINUTOS as _ALERTA_DEFAULT } from "../../utils/constants.js"
import { pedidosService } from "../../services/pedidosService.js"
import { imprimirNotinha } from "../../utils/notinha.js"
import LoadingSpinner from "../../components/LoadingSpinner.jsx"

const colunasAtivas = [
  { chave: "aguardando", titulo: "Aguardando", cor: "text-status-aguardando", proximo: "preparo" },
  { chave: "preparo", titulo: "Em preparo", cor: "text-status-preparo", proximo: "pronto" },
  { chave: "pronto", titulo: "Pronto", cor: "text-status-pronto", proximo: "entregue" },
]

const rotuloProximo = {
  preparo: "Iniciar preparo",
  pronto: "Marcar pronto",
  entregue: "Entregar",
}

const formasPagamento = [
  { valor: "dinheiro", label: "Dinheiro", icon: Banknote },
  { valor: "cartao", label: "Cartão", icon: CreditCard },
  { valor: "pix", label: "PIX", icon: QrCode },
  { valor: "fiado", label: "Fiado", icon: HandCoins },
]

const labelFormaPagamento = { dinheiro: "Dinheiro", cartao: "Cartão", pix: "PIX", fiado: "Fiado" }

// ── Modal de pagamento ───────────────────────────────────────────────────────
function ModalPagamento({ pedido, onConfirmar, onFechar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-borda bg-card p-6 shadow-2xl">
        <h2 className="mb-1 text-lg font-bold text-texto">Forma de pagamento</h2>
        <p className="mb-5 text-sm text-texto-suave">
          Pedido #{pedido.id} — {formatarMoeda(pedido.total)}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {formasPagamento.map(({ valor, label, icon: Icon }) => (
            <button
              key={valor}
              onClick={() => onConfirmar(valor)}
              className="flex flex-col items-center gap-2 rounded-xl border border-borda bg-fundo p-4 transition-colors hover:border-laranja hover:bg-laranja/5"
            >
              <Icon className="h-6 w-6 text-laranja" />
              <span className="text-sm font-semibold text-texto">{label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onFechar}
          className="mt-4 w-full rounded-xl border border-borda py-2.5 text-sm text-texto-suave transition-colors hover:text-texto"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Card na fila ativa ───────────────────────────────────────────────────────
function CardAtivo({ pedido, proximo, onAvancar, onCancelar }) {
  const [atualizando, setAtualizando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [modalPagamento, setModalPagamento] = useState(false)
  const tempoAlerta = Number(localStorage.getItem("burgeros_alerta_min") || _ALERTA_DEFAULT)
  const minutos = minutosDesde(pedido.abertoEm)
  const atrasado = minutos >= tempoAlerta

  const handleAvancar = async () => {
    if (atualizando) return
    if (proximo === "entregue") { setModalPagamento(true); return }
    setAtualizando(true)
    try { await onAvancar(pedido.id, proximo) }
    finally { setAtualizando(false) }
  }

  const handleConfirmarPagamento = async (forma) => {
    setModalPagamento(false)
    setAtualizando(true)
    try { await onAvancar(pedido.id, "entregue", forma) }
    finally { setAtualizando(false) }
  }

  const handleCancelar = async () => {
    if (!confirm(`Cancelar pedido #${pedido.id}? Esta ação não pode ser desfeita.`)) return
    setCancelando(true)
    try { await onCancelar(pedido.id) }
    finally { setCancelando(false) }
  }

  return (
    <>
      {modalPagamento && (
        <ModalPagamento pedido={pedido} onConfirmar={handleConfirmarPagamento} onFechar={() => setModalPagamento(false)} />
      )}
      <div className={`rounded-xl border bg-card p-4 transition-colors ${atrasado ? "border-status-cancelado/60 bg-status-cancelado/5" : "border-borda"}`}>
        <div className="flex items-start justify-between">
          <span className="text-sm font-bold text-laranja">#{pedido.id}</span>
          <span className={`flex items-center gap-1 text-xs font-medium ${atrasado ? "text-status-cancelado" : "text-texto-suave"}`}>
            {atrasado ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            {formatarCronometro(pedido.abertoEm)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-texto">
          {pedido.cliente ? (
            <><User className="h-3.5 w-3.5 text-texto-fraco" />{pedido.cliente}</>
          ) : (
            <><MapPin className="h-3.5 w-3.5 text-texto-fraco" />{pedido.mesa}</>
          )}
        </div>
        <ul className="mt-2 space-y-0.5">
          {pedido.itens.map((item, i) => <li key={i} className="text-xs text-texto-suave">{item}</li>)}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-borda pt-3">
          <span className="text-sm font-bold text-texto">{formatarMoeda(pedido.total)}</span>
          <div className="flex items-center gap-1.5">
            <button onClick={handleCancelar} disabled={cancelando} className="flex items-center gap-1 rounded-lg border border-borda px-2 py-1.5 text-xs text-texto-fraco transition-colors hover:border-status-cancelado/50 hover:text-status-cancelado disabled:opacity-50">
              <XCircle className="h-3.5 w-3.5" />
              {cancelando ? "..." : "Cancelar"}
            </button>
            {proximo && (
              <button onClick={handleAvancar} disabled={atualizando} className="flex items-center gap-1 rounded-lg bg-laranja/10 px-2.5 py-1.5 text-xs font-semibold text-laranja transition-colors hover:bg-laranja hover:text-fundo disabled:opacity-50">
                {atualizando ? "..." : rotuloProximo[proximo]}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Card concluído ───────────────────────────────────────────────────────────
function CardConcluido({ pedido, podeDeletar, onDeletar }) {
  const [imprimindo, setImprimindo] = useState(false)
  const [deletando, setDeletando] = useState(false)
  const entregue = pedido.status === "entregue"

  const handleImprimir = async () => {
    setImprimindo(true)
    try { const det = await pedidosService.buscar(pedido.id); await imprimirNotinha(det) }
    finally { setImprimindo(false) }
  }

  const handleDeletar = async () => {
    if (!confirm(`Excluir pedido #${pedido.id} permanentemente?`)) return
    setDeletando(true)
    try { await onDeletar(pedido.id) }
    finally { setDeletando(false) }
  }

  return (
    <div className={`rounded-xl border bg-card p-4 ${entregue ? "border-borda" : "border-status-cancelado/20"}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-laranja">#{pedido.id}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${entregue ? "bg-status-entregue/10 text-status-entregue" : "bg-status-cancelado/10 text-status-cancelado"}`}>
            {entregue ? "Entregue" : "Cancelado"}
          </span>
        </div>
        <span className="text-xs text-texto-fraco">
          {new Date(pedido.abertoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-texto">
        {pedido.cliente ? (
          <><User className="h-3.5 w-3.5 text-texto-fraco" />{pedido.cliente}</>
        ) : (
          <><MapPin className="h-3.5 w-3.5 text-texto-fraco" />{pedido.mesa || "—"}</>
        )}
      </div>

      <ul className="mt-1.5 space-y-0.5">
        {pedido.itens.map((item, i) => <li key={i} className="text-xs text-texto-suave">{item}</li>)}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-borda pt-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-texto">{formatarMoeda(pedido.total)}</span>
          {entregue && pedido.forma_pagamento && (
            <span className="rounded-full bg-status-entregue/10 px-2 py-0.5 text-xs text-status-entregue">
              {labelFormaPagamento[pedido.forma_pagamento] ?? pedido.forma_pagamento}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {entregue && (
            <button onClick={handleImprimir} disabled={imprimindo} className="flex items-center gap-1 rounded-lg border border-borda px-2 py-1.5 text-xs text-texto-fraco transition-colors hover:border-laranja/50 hover:text-laranja disabled:opacity-50">
              <Printer className="h-3.5 w-3.5" />
              {imprimindo ? "..." : "Notinha"}
            </button>
          )}
          {podeDeletar && (
            <button onClick={handleDeletar} disabled={deletando} className="flex items-center gap-1 rounded-lg border border-borda px-2 py-1.5 text-xs text-texto-fraco transition-colors hover:border-status-cancelado/50 hover:text-status-cancelado disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" />
              {deletando ? "..." : "Excluir"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function FilaPedidos() {
  const { pedidos, carregando, mudarStatus, deletarPedido } = usePedidos()
  const { usuario } = useAuth()
  const { mostrar } = useToast()
  const navigate = useNavigate()
  const [, setTick] = useState(0)
  const [aba, setAba] = useState("fila")
  const [concluidos, setConcluidos] = useState([])
  const [carregandoConcluidos, setCarregandoConcluidos] = useState(false)
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().slice(0, 10))
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const carregarConcluidos = useCallback(async (inicio, fim) => {
    setCarregandoConcluidos(true)
    try {
      const data = await pedidosService.listarConcluidos({ data_inicio: inicio, data_fim: fim })
      setConcluidos(data)
    } catch {
      mostrar("Erro ao carregar pedidos concluídos", "erro")
    } finally {
      setCarregandoConcluidos(false)
    }
  }, [mostrar])

  useEffect(() => {
    if (aba === "concluidos") carregarConcluidos(dataInicio, dataFim)
  }, [aba, dataInicio, dataFim, carregarConcluidos])

  const handleAvancar = async (id, status, formaPagamento = null) => {
    try {
      await mudarStatus(id, status, formaPagamento)
      if (status === "entregue") mostrar("Pedido entregue!", "sucesso")
    } catch {
      mostrar("Erro ao atualizar pedido", "erro")
    }
  }

  const handleCancelar = async (id) => {
    try {
      await mudarStatus(id, "cancelado")
      mostrar("Pedido cancelado", "sucesso")
    } catch {
      mostrar("Erro ao cancelar pedido", "erro")
    }
  }

  const handleDeletar = async (id) => {
    try {
      await deletarPedido(id)
      setConcluidos((atual) => atual.filter((p) => p.id !== id))
      mostrar("Pedido excluído", "sucesso")
    } catch {
      mostrar("Erro ao excluir pedido", "erro")
    }
  }

  const podeDeletar = usuario?.cargo === "Proprietário"
  const totalAtivos = pedidos.length
  const totalConcluidos = concluidos.length

  if (carregando) return <LoadingSpinner texto="Carregando pedidos..." />

  return (
    <div className="relative">
      {/* abas */}
      <div className="mb-5 flex items-center gap-1 rounded-xl border border-borda bg-card p-1 w-fit">
        <button
          onClick={() => setAba("fila")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${aba === "fila" ? "bg-laranja/10 text-laranja" : "text-texto-suave hover:text-texto"}`}
        >
          Fila Ativa
          {totalAtivos > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-laranja/20 px-1.5 text-xs text-laranja">
              {totalAtivos}
            </span>
          )}
        </button>
        <button
          onClick={() => setAba("concluidos")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${aba === "concluidos" ? "bg-laranja/10 text-laranja" : "text-texto-suave hover:text-texto"}`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Concluídos
          {aba === "concluidos" && totalConcluidos > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-laranja/20 px-1.5 text-xs text-laranja">
              {totalConcluidos}
            </span>
          )}
        </button>
      </div>

      {/* aba fila ativa — 3 colunas */}
      {aba === "fila" && (
        <div className="grid grid-cols-3 gap-5">
          {colunasAtivas.map((coluna) => {
            const lista = pedidos.filter((p) => p.status === coluna.chave)
            return (
              <div key={coluna.chave} className="flex flex-col">
                <div className="mb-3 flex items-center justify-between rounded-lg border border-borda bg-card px-3 py-2.5">
                  <h2 className={`text-sm font-bold ${coluna.cor}`}>{coluna.titulo}</h2>
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-fundo px-2 text-xs font-bold text-texto-suave">
                    {lista.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {lista.map((p) => (
                    <CardAtivo key={p.id} pedido={p} proximo={coluna.proximo} onAvancar={handleAvancar} onCancelar={handleCancelar} />
                  ))}
                  {lista.length === 0 && (
                    <div className="rounded-xl border border-dashed border-borda py-8 text-center text-xs text-texto-fraco">
                      Nenhum pedido
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* aba concluídos — grid */}
      {aba === "concluidos" && (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <CalendarDays className="h-4 w-4 text-texto-fraco" />
            <input
              type="date"
              value={dataInicio}
              max={dataFim}
              onChange={(e) => setDataInicio(e.target.value)}
              className="rounded-lg border border-borda bg-card px-3 py-1.5 text-sm text-texto focus:border-laranja focus:outline-none"
            />
            <span className="text-sm text-texto-fraco">até</span>
            <input
              type="date"
              value={dataFim}
              min={dataInicio}
              onChange={(e) => setDataFim(e.target.value)}
              className="rounded-lg border border-borda bg-card px-3 py-1.5 text-sm text-texto focus:border-laranja focus:outline-none"
            />
            <button
              onClick={() => {
                const hoje = new Date().toISOString().slice(0, 10)
                setDataInicio(hoje)
                setDataFim(hoje)
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                dataInicio === new Date().toISOString().slice(0, 10) && dataFim === new Date().toISOString().slice(0, 10)
                  ? "border-laranja bg-laranja/10 text-laranja"
                  : "border-borda text-texto-suave hover:border-laranja/40 hover:text-texto"
              }`}
            >
              Hoje
            </button>
            <span className="ml-auto text-sm text-texto-suave">
              {concluidos.length} pedido{concluidos.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => carregarConcluidos(dataInicio, dataFim)}
              disabled={carregandoConcluidos}
              className="flex items-center gap-1.5 rounded-lg border border-borda px-3 py-1.5 text-xs text-texto-suave transition-colors hover:text-texto disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${carregandoConcluidos ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
          {carregandoConcluidos ? (
            <LoadingSpinner texto="Carregando..." />
          ) : concluidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-texto-fraco">
              <CheckCircle2 className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">Nenhum pedido concluído ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {concluidos.map((p) => (
                <CardConcluido key={p.id} pedido={p} podeDeletar={podeDeletar} onDeletar={handleDeletar} />
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => navigate("/pedidos/novo")}
        className="fixed bottom-8 right-8 z-40 flex items-center gap-2 rounded-full bg-laranja px-5 py-3.5 text-sm font-bold text-fundo shadow-2xl shadow-laranja/30 transition-colors hover:bg-laranja-hover"
      >
        <Plus className="h-5 w-5" />
        Novo Pedido
      </button>
    </div>
  )
}
