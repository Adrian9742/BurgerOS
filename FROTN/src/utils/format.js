export function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0)
}

export function formatarData(iso) {
  if (!iso) return "—"
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

// Retorna minutos decorridos desde um timestamp
export function minutosDesde(timestamp) {
  return Math.floor((Date.now() - timestamp) / 60000)
}

export function formatarCronometro(timestamp) {
  const totalSeg = Math.floor((Date.now() - timestamp) / 1000)
  const min = Math.floor(totalSeg / 60)
  const seg = totalSeg % 60
  return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`
}
