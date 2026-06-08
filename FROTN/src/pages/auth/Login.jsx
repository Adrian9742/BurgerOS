import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Lock, User, Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext.jsx"
import { useToast } from "../../context/ToastContext.jsx"

export default function Login() {
  const [usuario, setUsuario] = useState("")
  const [senha, setSenha] = useState("")
  const [carregando, setCarregando] = useState(false)
  const { login } = useAuth()
  const { mostrar } = useToast()
  const navigate = useNavigate()

  const enviar = async (e) => {
    e.preventDefault()
    setCarregando(true)
    const res = await login(usuario, senha)
    setCarregando(false)
    if (res.ok) {
      mostrar("Bem-vindo de volta!", "sucesso")
      navigate("/")
    } else {
      mostrar(res.erro, "erro")
    }
  }

  return (
    <div className="textura-fundo flex min-h-screen items-center justify-center bg-fundo p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-laranja text-4xl font-black text-fundo shadow-lg shadow-laranja/20">
            B
          </div>
          <h1 className="text-2xl font-black tracking-tight text-texto">BurgerOS</h1>
          <p className="mt-1 text-sm text-texto-suave">Sistema de Gestão · Hamburgueria</p>
        </div>

        <form onSubmit={enviar} className="rounded-2xl border border-borda bg-card p-6 shadow-2xl">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-texto-suave">Usuário</span>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-fraco" />
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full rounded-lg border border-borda bg-fundo py-2.5 pl-10 pr-3 text-sm text-texto placeholder:text-texto-fraco transition-colors focus:border-laranja focus:outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-texto-suave">Senha</span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-fraco" />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full rounded-lg border border-borda bg-fundo py-2.5 pl-10 pr-3 text-sm text-texto placeholder:text-texto-fraco transition-colors focus:border-laranja focus:outline-none"
                />
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-laranja py-2.5 text-sm font-bold text-fundo transition-colors hover:bg-laranja-hover disabled:opacity-60"
          >
            {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          <div className="mt-6 rounded-lg border border-borda bg-fundo/50 p-3">
            <p className="text-center text-xs font-semibold text-texto-suave">Acesso rápido</p>
            <div className="mt-2 space-y-1">
              {[
                { usuario: "admin", senha: "admin", cargo: "Proprietário" },
                { usuario: "caixa", senha: "caixa", cargo: "Caixa" },
                { usuario: "garcom", senha: "garcom", cargo: "Garçom" },
              ].map((u) => (
                <button
                  key={u.usuario}
                  type="button"
                  onClick={() => { setUsuario(u.usuario); setSenha(u.senha) }}
                  className="w-full rounded-lg border border-borda bg-card px-3 py-1.5 text-left text-xs transition-colors hover:border-laranja/50"
                >
                  <span className="font-mono font-bold text-laranja">{u.usuario}</span>
                  <span className="ml-2 text-texto-fraco">/ {u.senha}</span>
                  <span className="float-right text-texto-fraco">{u.cargo}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
