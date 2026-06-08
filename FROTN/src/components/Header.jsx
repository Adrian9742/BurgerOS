import { useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import { useAuth } from "../context/AuthContext.jsx"

function iniciais(nome = "") {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

export default function Header({ titulo, subtitulo }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const sair = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-borda bg-card px-8 py-4">
      <div>
        <h1 className="text-xl font-bold text-texto">{titulo}</h1>
        {subtitulo && <p className="mt-0.5 text-sm text-texto-suave">{subtitulo}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 rounded-lg border border-borda bg-fundo px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-laranja text-sm font-bold text-fundo">
            {iniciais(usuario?.nome)}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-texto">{usuario?.nome}</p>
            <p className="text-xs text-laranja">{usuario?.cargo}</p>
          </div>
        </div>
        <button
          onClick={sair}
          className="flex items-center gap-2 rounded-lg border border-borda bg-fundo px-3 py-2.5 text-sm font-medium text-texto-suave transition-colors hover:border-status-cancelado/40 hover:text-status-cancelado"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </header>
  )
}
