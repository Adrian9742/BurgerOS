import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { pedidosService } from "../services/pedidosService.js"
import { getToken } from "../services/authService.js"

const PedidosContext = createContext(null)

export function usePedidos() {
  const ctx = useContext(PedidosContext)
  if (!ctx) throw new Error("usePedidos deve ser usado dentro de PedidosProvider")
  return ctx
}

function tocarAlerta() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = "sine"
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {}
}

export function PedidosProvider({ children }) {
  const [pedidos, setPedidos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const idsConhecidos = useRef(null)

  const carregar = useCallback(async () => {
    if (!getToken()) {
      setCarregando(false)
      return
    }
    try {
      const data = await pedidosService.listar()

      if (idsConhecidos.current !== null) {
        const novos = data.filter((p) => !idsConhecidos.current.has(p.id))
        if (novos.length > 0) {
          const somAtivado = localStorage.getItem("burgeros_som") !== "false"
          if (somAtivado) tocarAlerta()
        }
      }
      idsConhecidos.current = new Set(data.map((p) => p.id))

      setPedidos(data)
    } catch {
      // falha silenciosa nos refreshes periódicos
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
    const intervalo = setInterval(carregar, 10000)
    return () => clearInterval(intervalo)
  }, [carregar])

  const adicionarPedido = async (dados) => {
    const novo = await pedidosService.criar(dados)
    setPedidos((atual) => [novo, ...atual])
    if (idsConhecidos.current) idsConhecidos.current.add(novo.id)
    return novo
  }

  const mudarStatus = async (id, novoStatus, formaPagamento = null) => {
    const atualizado = await pedidosService.mudarStatus(id, novoStatus, formaPagamento)
    setPedidos((atual) => atual.map((p) => (p.id === id ? atualizado : p)))
  }

  return (
    <PedidosContext.Provider value={{ pedidos, carregando, adicionarPedido, mudarStatus }}>
      {children}
    </PedidosContext.Provider>
  )
}
