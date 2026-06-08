import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Clock, User, MapPin, ChevronRight, AlertTriangle, Printer, XCircle, CreditCard, Banknote, QrCode, HandCoins } from "lucide-react"
import { usePedidos } from "../../context/PedidosContext.jsx"
import { useToast } from "../../context/ToastContext.jsx"
import { formatarMoeda, formatarCronometro, minutosDesde } from "../../utils/format.js"
import { TEMPO_ALERTA_MINUTOS } from "../../utils/constants.js"
import { pedidosService } from "../../services/pedidosService.js"
import { imprimirNotinha } from "../../utils/notinha.js"
import LoadingSpinner from "../../components/LoadingSpinner.jsx"

const colunas = [
  { chave: "aguardando", titulo: "Aguardando", cor: "text-status-aguardando", proximo: "preparo" },
  { chave: "preparo", titulo: "Em preparo", cor: "text-status-preparo", proximo: "pronto" },
  { chave: "pronto", titulo: "Pronto", cor: "text-status-pronto", proximo: "entregue" },
  { chave: "entregue", titulo: "Entregue", cor: "text-status-entregue", proximo: null },
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

const labelFormaPagamento = {
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  pix: "PIX",
  fiado: "Fiado",
}

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

function CardPedido({ pedido, proximo, onAvancar, onCancelar }) {
  const [atualizando, setAtualizando] = useState(false)
  const [imprimindo, setImprimindo] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [modalPagamento, setModalPagamento] = useState(false)
  const minutos = minutosDesde(pedido.abertoEm)
  const atrasado = minutos >= TEMPO_ALERTA_MINUTOS && pedido.status !== "entregue"

  const handleAvancar = async () => {
    if (atualizando) return
    if (proximo === "entregue") {
      setModalPagamento(true)
      return
    }
    setAtualizando(true)
    try {
      await onAvancar(pedido.id, proximo)
    } finally {
      setAtualizando(false)
    }
  }

  const handleConfirmarPagamento = async (forma) => {
    setModalPagamento(false)
    setAtualizando(true)
    try {
      await onAvancar(pedido.id, "entregue", forma)
    } finally {
      setAtualizando(false)
    }
  }

  const handleCancelar = async () => {
    if (!confirm(`Cancelar pedido #${pedido.id}? Esta ação não pode ser desfeita.`)) return
    setCancelando(true)
    try {
      await onCancelar(pedido.id)
    } finally {
      setCancelando(false)
    }
  }

  const handleImprimir = async () => {
    setImprimindo(true)
    try {
      const detalhes = await pedidosService.buscar(pedido.id)
      await imprimirNotinha(detalhes)
    } finally {
      setImprimindo(false)
    }
  }

  return (
    <>
      {modalPagamento && (
        <ModalPagamento
          pedido={pedido}
          onConfirmar={handleConfirmarPagamento}
          onFechar={() => setModalPagamento(false)}
        />
      )}
      <div
        className={`rounded-xl border bg-card p-4 transition-colors ${
          atrasado ? "border-status-cancelado/60 bg-status-cancelado/5" : "border-borda"
        }`}
      >
        <div className="flex items-start justify-between">
          <span className="text-sm font-bold text-laranja">#{pedido.id}</span>
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              atrasado ? "text-status-cancelado" : "text-texto-suave"
            }`}
          >
            {atrasado ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            {formatarCronometro(pedido.abertoEm)}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-texto">
          {pedido.cliente ? (
            <>
              <User className="h-3.5 w-3.5 text-texto-fraco" />
              {pedido.cliente}
            </>
          ) : (
            <>
              <MapPin className="h-3.5 w-3.5 text-texto-fraco" />
              {pedido.mesa}
            </>
          )}
        </div>

        <ul className="mt-2 space-y-0.5">
          {pedido.itens.map((item, i) => (
            <li key={i} className="text-xs text-texto-suave">
              {item}
            </li>
          ))}
        </ul>

        {pedido.status === "entregue" && pedido.forma_pagamento && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-status-entregue/10 px-2.5 py-0.5 text-xs font-medium text-status-entregue">
              {labelFormaPagamento[pedido.forma_pagamento] ?? pedido.forma_pagamento}
            </span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-borda pt-3">
          <span className="text-sm font-bold text-texto">{formatarMoeda(pedido.total)}</span>
          <div className="flex items-center gap-1.5">
            {pedido.status === "entregue" && (
              <button
                onClick={handleImprimir}
                disabled={imprimindo}
                title="Imprimir notinha"
                className="flex items-center gap-1 rounded-lg border border-borda px-2 py-1.5 text-xs text-texto-fraco transition-colors hover:border-laranja/50 hover:text-laranja disabled:opacity-50"
              >
                <Printer className="h-3.5 w-3.5" />
                {imprimindo ? "..." : "Notinha"}
              </button>
            )}
            {pedido.status !== "entregue" && (
              <button
                onClick={handleCancelar}
                disabled={cancelando}
                title="Cancelar pedido"
                className="flex items-center gap-1 rounded-lg border border-borda px-2 py-1.5 text-xs text-texto-fraco transition-colors hover:border-status-cancelado/50 hover:text-status-cancelado disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                {cancelando ? "..." : "Cancelar"}
              </button>
            )}
            {proximo && (
              <button
                onClick={handleAvancar}
                disabled={atualizando}
                className="flex items-center gap-1 rounded-lg bg-laranja/10 px-2.5 py-1.5 text-xs font-semibold text-laranja transition-colors hover:bg-laranja hover:text-fundo disabled:opacity-50"
              >
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

export default function FilaPedidos() {
  const { pedidos, carregando, mudarStatus } = usePedidos()
  const { mostrar } = useToast()
  const navigate = useNavigate()
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const handleAvancar = async (id, status, formaPagamento = null) => {
    try {
      await mudarStatus(id, status, formaPagamento)
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

  if (carregando) return <LoadingSpinner texto="Carregando pedidos..." />

  return (
    <div className="relative">
      <div className="grid grid-cols-4 gap-5">
        {colunas.map((coluna) => {
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
                  <CardPedido key={p.id} pedido={p} proximo={coluna.proximo} onAvancar={handleAvancar} onCancelar={handleCancelar} />
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
