import { useState, useMemo, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { MapPin, Plus, Settings, X, ClipboardList, RefreshCw } from "lucide-react"
import { usePedidos } from "../../context/PedidosContext.jsx"
import { formatarMoeda } from "../../utils/format.js"

const STATUS_LABEL = {
  aguardando: "Aguardando",
  preparo: "Em preparo",
  pronto: "Pronto!",
}

const STATUS_COR = {
  aguardando: "text-status-aguardando bg-status-aguardando/15",
  preparo: "text-status-preparo bg-status-preparo/15",
  pronto: "text-status-pronto bg-status-pronto/15",
}

function parseMesa(mesaStr) {
  if (!mesaStr) return null
  const num = mesaStr.replace(/\D/g, "")
  return num ? Number(num) : mesaStr
}

function cardMesaCor(pedidosMesa) {
  if (!pedidosMesa || pedidosMesa.length === 0) return "livre"
  const todosProtos = pedidosMesa.every((p) => p.status === "pronto")
  if (todosProtos) return "pronto"
  return "ocupado"
}

function PopoverMesa({ numMesa, pedidos, onFechar, onNovoPedido }) {
  const total = pedidos.reduce((s, p) => s + (p.total || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onFechar}>
      <div
        className="w-full max-w-sm rounded-2xl border border-borda bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-laranja/15 text-laranja font-bold">
              {numMesa}
            </div>
            <div>
              <p className="text-sm font-bold text-texto">Mesa {numMesa}</p>
              <p className="text-xs text-texto-fraco">{pedidos.length} pedido{pedidos.length > 1 ? "s" : ""} ativo{pedidos.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={onFechar} className="text-texto-fraco hover:text-texto">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mb-4 space-y-2">
          {pedidos.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg border border-borda bg-fundo px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-texto">Pedido #{p.id}</p>
                <p className="text-xs text-texto-fraco">{p.itens?.length || 0} itens</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COR[p.status] || ""}`}>
                {STATUS_LABEL[p.status] || p.status}
              </span>
            </li>
          ))}
        </ul>

        {total > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-borda bg-fundo px-3 py-2.5">
            <span className="text-sm text-texto-suave">Total acumulado</span>
            <span className="text-sm font-bold text-laranja">{formatarMoeda(total)}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onNovoPedido}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-laranja py-2.5 text-sm font-bold text-fundo hover:bg-laranja-hover"
          >
            <Plus className="h-4 w-4" />
            Novo pedido
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Mesas() {
  const navigate = useNavigate()
  const { pedidos } = usePedidos()
  const [totalMesas, setTotalMesas] = useState(() => Number(localStorage.getItem("burgeros_total_mesas") || "20"))
  const [editandoTotal, setEditandoTotal] = useState(false)
  const [totalTemp, setTotalTemp] = useState("")
  const [popover, setPopover] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editandoTotal) setTimeout(() => inputRef.current?.select(), 50)
  }, [editandoTotal])

  const pedidosPorMesa = useMemo(() => {
    const mapa = {}
    pedidos.forEach((p) => {
      if (!p.mesa) return
      const num = parseMesa(p.mesa)
      if (num == null) return
      if (!mapa[num]) mapa[num] = []
      mapa[num].push(p)
    })
    return mapa
  }, [pedidos])

  const mesasExtras = useMemo(() => {
    const keys = Object.keys(pedidosPorMesa)
      .map(Number)
      .filter((n) => !isNaN(n) && n > totalMesas)
    return keys.sort((a, b) => a - b)
  }, [pedidosPorMesa, totalMesas])

  const salvarTotal = () => {
    const v = Number(totalTemp)
    if (v >= 1 && v <= 200) {
      setTotalMesas(v)
      localStorage.setItem("burgeros_total_mesas", String(v))
    }
    setEditandoTotal(false)
  }

  const onKeyTotal = (e) => {
    if (e.key === "Enter") salvarTotal()
    if (e.key === "Escape") setEditandoTotal(false)
  }

  const abrirMesa = (num) => {
    const pedidosMesa = pedidosPorMesa[num] || []
    if (pedidosMesa.length > 0) {
      setPopover(num)
    } else {
      navigate("/pedidos/novo", { state: { mesa: num } })
    }
  }

  const todasMesas = [
    ...Array.from({ length: totalMesas }, (_, i) => i + 1),
    ...mesasExtras,
  ]

  const mesasOcupadas = Object.keys(pedidosPorMesa).length
  const mesasLivres = todasMesas.filter((n) => !pedidosPorMesa[n]).length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-borda bg-card px-3 py-2">
            <span className="h-3 w-3 rounded-full bg-texto-fraco/30" />
            <span className="text-sm text-texto-suave">{mesasLivres} livres</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-borda bg-card px-3 py-2">
            <span className="h-3 w-3 rounded-full bg-status-preparo" />
            <span className="text-sm text-texto-suave">{mesasOcupadas} ocupadas</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editandoTotal ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-texto-suave">Total de mesas:</span>
              <input
                ref={inputRef}
                type="number"
                min="1"
                max="200"
                value={totalTemp}
                onChange={(e) => setTotalTemp(e.target.value)}
                onKeyDown={onKeyTotal}
                onBlur={salvarTotal}
                className="w-20 rounded-lg border border-laranja bg-fundo px-2 py-1.5 text-sm font-bold text-texto focus:outline-none"
              />
            </div>
          ) : (
            <button
              onClick={() => { setTotalTemp(String(totalMesas)); setEditandoTotal(true) }}
              className="flex items-center gap-1.5 rounded-lg border border-borda bg-card px-3 py-2 text-sm text-texto-suave transition-colors hover:border-laranja/50 hover:text-texto"
            >
              <Settings className="h-4 w-4" />
              {totalMesas} mesas
            </button>
          )}
          <button
            onClick={() => navigate("/pedidos/novo")}
            className="flex items-center gap-2 rounded-lg bg-laranja px-4 py-2 text-sm font-bold text-fundo transition-colors hover:bg-laranja-hover"
          >
            <Plus className="h-4 w-4" />
            Novo pedido
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 xl:grid-cols-6 2xl:grid-cols-8">
        {todasMesas.map((num) => {
          const pedidosMesa = pedidosPorMesa[num] || []
          const cor = cardMesaCor(pedidosMesa)
          const isLivre = cor === "livre"
          const isProto = cor === "pronto"
          const isOcupado = cor === "ocupado"

          return (
            <button
              key={num}
              onClick={() => abrirMesa(num)}
              className={`relative flex flex-col items-center justify-center rounded-xl border p-4 transition-all ${
                isLivre
                  ? "border-borda bg-card text-texto-fraco hover:border-laranja/40 hover:bg-card-hover"
                  : isProto
                  ? "border-status-pronto/40 bg-status-pronto/10 text-status-pronto hover:bg-status-pronto/15"
                  : "border-status-preparo/40 bg-status-preparo/10 text-status-preparo hover:bg-status-preparo/15"
              }`}
            >
              <MapPin className={`mb-1.5 h-5 w-5 ${isLivre ? "text-texto-fraco/40" : ""}`} />
              <span className="text-lg font-black tabular-nums">{num}</span>
              <span className="mt-0.5 text-xs font-medium">
                {isLivre ? "Livre" : isProto ? "Pronto!" : `${pedidosMesa.length} pedido${pedidosMesa.length > 1 ? "s" : ""}`}
              </span>

              {!isLivre && (
                <span className={`absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  isProto ? "bg-status-pronto text-fundo" : "bg-status-preparo text-fundo"
                }`}>
                  {pedidosMesa.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {mesasOcupadas === 0 && (
        <div className="mt-12 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-texto-fraco/30" />
          <p className="text-sm text-texto-fraco">Nenhuma mesa com pedido ativo agora</p>
          <p className="text-xs text-texto-fraco/60 mt-1">Clique em qualquer mesa para criar um pedido</p>
        </div>
      )}

      {popover && (
        <PopoverMesa
          numMesa={popover}
          pedidos={pedidosPorMesa[popover] || []}
          onFechar={() => setPopover(null)}
          onNovoPedido={() => {
            setPopover(null)
            navigate("/pedidos/novo", { state: { mesa: popover } })
          }}
        />
      )}
    </div>
  )
}
