export function Campo({ rotulo, ...props }) {
  return (
    <label className="block">
      {rotulo && <span className="mb-1.5 block text-sm font-medium text-texto-suave">{rotulo}</span>}
      <input
        className="w-full rounded-lg border border-borda bg-fundo px-3 py-2.5 text-sm text-texto placeholder:text-texto-fraco transition-colors focus:border-laranja focus:outline-none"
        {...props}
      />
    </label>
  )
}

export function AreaTexto({ rotulo, ...props }) {
  return (
    <label className="block">
      {rotulo && <span className="mb-1.5 block text-sm font-medium text-texto-suave">{rotulo}</span>}
      <textarea
        className="w-full resize-none rounded-lg border border-borda bg-fundo px-3 py-2.5 text-sm text-texto placeholder:text-texto-fraco transition-colors focus:border-laranja focus:outline-none"
        {...props}
      />
    </label>
  )
}

export function Selecao({ rotulo, children, ...props }) {
  return (
    <label className="block">
      {rotulo && <span className="mb-1.5 block text-sm font-medium text-texto-suave">{rotulo}</span>}
      <select
        className="w-full rounded-lg border border-borda bg-fundo px-3 py-2.5 text-sm text-texto transition-colors focus:border-laranja focus:outline-none"
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

export function Botao({ children, variante = "primario", className = "", ...props }) {
  const variantes = {
    primario: "bg-laranja text-fundo hover:bg-laranja-hover",
    secundario: "border border-borda bg-fundo text-texto hover:bg-card-hover",
    perigo: "bg-status-cancelado text-texto hover:bg-status-cancelado/85",
  }
  return (
    <button
      className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantes[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Toggle({ ativo, aoMudar }) {
  return (
    <button
      type="button"
      onClick={() => aoMudar?.(!ativo)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        ativo ? "bg-laranja" : "bg-borda"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-texto transition-transform ${
          ativo ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )
}
