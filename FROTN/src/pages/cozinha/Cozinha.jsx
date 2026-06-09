import { useEffect, useState } from "react"
import { Clock, AlertTriangle, ChefHat, CheckCircle2, RefreshCw } from "lucide-react"
import { usePedidos } from "../../context/PedidosContext.jsx"
import { formatarCronometro, minutosDesde } from "../../utils/format.js"
import { TEMPO_ALERTA_MINUTOS as _ALERTA_DEFAULT } from "../../utils/constants.js"

const COLUNAS = [
  { chave: "aguardando", titulo: "Aguardando",  cor: "border-status-aguardando/60 bg-status-aguardando/5 text-status-aguardando" },
  { chave: "preparo",    titulo: "Em Preparo",  cor: "border-status-preparo/60 bg-status-preparo/5 text-status-preparo" },
  { chave: "pronto",     titulo: "Pronto ✓",    cor: "border-status-pronto/60 bg-status-pronto/5 text-status-pronto" },
]

function CardKDS({ pedido, onAvancar }) {
  const [, setTick] = useState(0)
  const [atualizando, setAtualizando] = useState(false)
  const tempoAlerta = Number(localStorage.getItem("flameos_alerta_min") || _ALERTA_DEFAULT)
  const minutos = minutosDesde(pedido.abertoEm)
  const atrasado = minutos >= tempoAlerta

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const proximo = pedido.status === "aguardando" ? "preparo" : pedido.status === "preparo" ? "pronto" : null
  const rotulo = pedido.status === "aguardando" ? "Iniciar Preparo" : pedido.status === "preparo" ? "Marcar Pronto" : null

  const handleAvancar = async () => {
    if (atualizando) return
    setAtualizando(true)
    try { await onAvancar(pedido.id, proximo) }
    finally { setAtualizando(false) }
  }

  return (
    <div className={`rounded-xl border-2 p-5 transition-all ${atrasado ? "border-status-cancelado/70 bg-status-cancelado/5" : "border-borda bg-card"}`}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <span className="text-2xl font-black text-laranja">#{pedido.id}</span>
          {pedido.mesa && (
            <span className="ml-2 rounded-full bg-fundo px-2 py-0.5 text-sm font-semibold text-texto-suave">
              {pedido.tipo === "delivery" ? "🛵 Delivery" : pedido.tipo === "balcao" ? "🏪 Balcão" : pedido.mesa}
            </span>
          )}
          {pedido.cliente && (
            <p className="mt-0.5 text-sm font-medium text-texto-suave">{pedido.cliente}</p>
          )}
        </div>
        <span className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-bold ${atrasado ? "bg-status-cancelado/15 text-status-cancelado" : "bg-fundo text-texto-suave"}`}>
          {atrasado && <AlertTriangle className="h-4 w-4" />}
          <Clock className="h-4 w-4" />
          {formatarCronometro(pedido.abertoEm)}
        </span>
      </div>

      <ul className="mb-4 space-y-2">
        {pedido.itens.map((item, i) => (
          <li key={i} className="rounded-lg bg-fundo px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-laranja/15 text-sm font-black text-laranja">
                {item.quantidade}
              </span>
              <span className="text-base font-semibold text-texto">{item.nome}</span>
            </div>
            {item.observacao && (
              <div className="mt-1.5 rounded border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-sm font-medium text-yellow-300">
                ↳ {item.observacao}
              </div>
            )}
          </li>
        ))}
      </ul>

      {pedido.observacao && (
        <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-sm text-yellow-300">
          📝 {pedido.observacao}
        </div>
      )}

      {proximo && (
        <button
          onClick={handleAvancar}
          disabled={atualizando}
          className="w-full rounded-xl bg-laranja py-3 text-base font-bold text-fundo transition-colors hover:bg-laranja-hover disabled:opacity-50"
        >
          {atualizando ? "..." : rotulo}
        </button>
      )}
    </div>
  )
}

export default function Cozinha() {
  const { pedidos, mudarStatus } = usePedidos()
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const handleAvancar = async (id, status) => {
    await mudarStatus(id, status)
  }

  const total = pedidos.filter(p => ["aguardando", "preparo", "pronto"].includes(p.status)).length

  return (
    <div className="min-h-screen bg-fundo">
      <div className="mb-6 flex items-center justify-between rounded-xl border border-borda bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-laranja/15 text-laranja">
            <ChefHat className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-black text-texto">Tela da Cozinha</p>
            <p className="text-sm text-texto-suave">{total} pedido{total !== 1 ? "s" : ""} em andamento</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-texto-fraco">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "3s" }} />
          Atualização automática
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {COLUNAS.map(col => {
          const lista = pedidos.filter(p => p.status === col.chave)
          return (
            <div key={col.chave}>
              <div className={`mb-4 flex items-center justify-between rounded-lg border px-4 py-2.5 ${col.cor}`}>
                <h2 className="text-sm font-bold">{col.titulo}</h2>
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/10 px-2 text-xs font-black">
                  {lista.length}
                </span>
              </div>
              <div className="space-y-4">
                {lista.map(p => (
                  <CardKDS key={p.id} pedido={p} onAvancar={handleAvancar} />
                ))}
                {lista.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-borda py-16 text-texto-fraco">
                    <CheckCircle2 className="mb-2 h-8 w-8 opacity-30" />
                    <p className="text-sm">Nenhum pedido</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
