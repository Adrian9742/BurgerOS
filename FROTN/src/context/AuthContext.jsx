import { createContext, useContext, useState, useEffect } from "react"
import { authService, getToken } from "../services/authService"

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider")
  return ctx
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function restaurarSessao() {
      if (!getToken()) {
        setCarregando(false)
        return
      }
      try {
        const user = await authService.getMe()
        setUsuario(user)
      } catch {
        // token inválido — interceptor do axios já remove do localStorage
      } finally {
        setCarregando(false)
      }
    }
    restaurarSessao()
  }, [])

  const login = async (nomeUsuario, senha) => {
    try {
      const user = await authService.login(nomeUsuario, senha)
      setUsuario(user)
      return { ok: true }
    } catch (err) {
      const erro = err.response?.data?.detail || "Erro ao fazer login"
      return { ok: false, erro }
    }
  }

  const logout = async () => {
    await authService.logout()
    setUsuario(null)
  }

  const atualizarPerfil = (dados) => {
    setUsuario((atual) => ({ ...atual, ...dados }))
  }

  if (carregando) return null

  return (
    <AuthContext.Provider value={{ usuario, login, logout, atualizarPerfil }}>
      {children}
    </AuthContext.Provider>
  )
}
