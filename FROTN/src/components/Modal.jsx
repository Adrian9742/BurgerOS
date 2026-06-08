import { useEffect } from "react"
import { X } from "lucide-react"

export default function Modal({ aberto, aoFechar, titulo, children, largura = "max-w-lg" }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") aoFechar?.()
    }
    if (aberto) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [aberto, aoFechar])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="animate-fade-in absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={aoFechar} />
      <div className={`animate-scale-in relative w-full ${largura} rounded-xl border border-borda bg-card shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-borda px-6 py-4">
          <h2 className="text-lg font-bold text-texto">{titulo}</h2>
          <button
            onClick={aoFechar}
            className="rounded-lg p-1 text-texto-fraco transition-colors hover:bg-card-hover hover:text-texto"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
