import { createContext, useContext, useState, useCallback } from "react"
import { CheckCircle2, XCircle, X } from "lucide-react"

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast deve ser usado dentro de ToastProvider")
  return ctx
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remover = useCallback((id) => {
    setToasts((atual) => atual.filter((t) => t.id !== id))
  }, [])

  const mostrar = useCallback(
    (mensagem, tipo = "sucesso") => {
      const id = Date.now() + Math.random()
      setToasts((atual) => [...atual, { id, mensagem, tipo }])
      setTimeout(() => remover(id), 3500)
    },
    [remover],
  )

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-slide-in flex min-w-[300px] items-center gap-3 rounded-lg border border-borda bg-card px-4 py-3 shadow-2xl"
          >
            {t.tipo === "sucesso" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-status-pronto" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0 text-status-cancelado" />
            )}
            <span className="flex-1 text-sm text-texto">{t.mensagem}</span>
            <button onClick={() => remover(t.id)} className="text-texto-fraco transition-colors hover:text-texto">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
