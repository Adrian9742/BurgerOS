import { useState, useEffect } from "react"
import { NavLink } from "react-router-dom"
import { LayoutDashboard, ClipboardList, UtensilsCrossed, Wallet, Users, Calendar, User } from "lucide-react"

const itens = [
  { rota: "/", rotulo: "Dashboard", icone: LayoutDashboard, fim: true },
  { rota: "/pedidos", rotulo: "Pedidos", icone: ClipboardList },
  { rota: "/cardapio", rotulo: "Cardápio", icone: UtensilsCrossed },
  { rota: "/financeiro", rotulo: "Financeiro", icone: Wallet },
  { rota: "/clientes", rotulo: "Clientes", icone: Users },
  { rota: "/agenda", rotulo: "Agenda", icone: Calendar },
  { rota: "/perfil", rotulo: "Perfil", icone: User },
]

function RelogioAoVivo() {
  const [agora, setAgora] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const data = agora.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
  const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

  return (
    <div className="border-b border-borda px-6 py-3 text-center">
      <p className="text-xs font-semibold text-texto-suave capitalize">{data}</p>
      <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-laranja">{hora}</p>
    </div>
  )
}

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-borda bg-card">
      <div className="flex items-center gap-3 border-b border-borda px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-laranja text-lg font-bold text-fundo">
          B
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-texto">BurgerOS</p>
          <p className="text-xs text-texto-fraco">Gestão Hamburgueria</p>
        </div>
      </div>

      <RelogioAoVivo />

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {itens.map(({ rota, rotulo, icone: Icone, fim }) => (
          <NavLink
            key={rota}
            to={rota}
            end={fim}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-laranja/10 text-laranja"
                  : "text-texto-suave hover:bg-card-hover hover:text-texto"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 h-6 w-1 rounded-r-full bg-laranja" />}
                <Icone className="h-5 w-5" />
                <span>{rotulo}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-borda px-6 py-4">
        <p className="text-xs text-texto-fraco">Versão 1.0.0 · Offline</p>
      </div>
    </aside>
  )
}
