export default function LoadingSpinner({ texto = "Carregando..." }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 py-20">
      <div className="animate-spin-slow h-10 w-10 rounded-full border-4 border-borda border-t-laranja" />
      {texto && <p className="text-sm text-texto-suave">{texto}</p>}
    </div>
  )
}
