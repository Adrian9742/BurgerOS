import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { pedidosService } from "../services/pedidosService.js"
import { getToken } from "../services/authService.js"

const PedidosContext = createContext(null)

export function usePedidos() {
  const ctx = useContext(PedidosContext)
  if (!ctx) throw new Error("usePedidos deve ser usado dentro de PedidosProvider")
  return ctx
}

export function PedidosProvider({ children }) {
  const [pedidos, setPedidos] = useState([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!getToken()) {
      setCarregando(false)
      return
    }
    try {
      const data = await pedidosService.listar()
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
    return novo
  }

  const mudarStatus = async (id, novoStatus) => {
    const atualizado = await pedidosService.mudarStatus(id, novoStatus)
    setPedidos((atual) => atual.map((p) => (p.id === id ? atualizado : p)))
  }

  return (
    <PedidosContext.Provider value={{ pedidos, carregando, adicionarPedido, mudarStatus }}>
      {children}
    </PedidosContext.Provider>
  )
}
