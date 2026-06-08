import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Clock, User, MapPin, ChevronRight, AlertTriangle, Printer, XCircle } from "lucide-react"
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

function CardPedido({ pedido, proximo, onAvancar, onCancelar }) {
  const [atualizando, setAtualizando] = useState(false)
  const [imprimindo, setImprimindo] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const minutos = minutosDesde(pedido.abertoEm)
  const atrasado = minutos >= TEMPO_ALERTA_MINUTOS && pedido.status !== "entregue"

  const handleAvancar = async () => {
    if (atualizando) return
    setAtualizando(true)
    try {
      await onAvancar(pedido.id, proximo)
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

  const handleAvancar = async (id, status) => {
    try {
      await mudarStatus(id, status)
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
