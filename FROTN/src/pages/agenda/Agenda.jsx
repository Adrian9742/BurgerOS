import { useState, useEffect } from "react"
import { Calendar, Clock, Users, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react"
import { formatarData } from "../../utils/format.js"
import agendaService from "../../services/agendaService.js"
import { useToast } from "../../context/ToastContext.jsx"
import LoadingSpinner from "../../components/LoadingSpinner.jsx"

const TIPOS = [
  { valor: "reserva", label: "Reserva" },
  { valor: "operacao", label: "Operação" },
]

const COR_TIPO = {
  reserva: "bg-status-entregue/15 text-status-entregue",
  operacao: "bg-status-preparo/15 text-status-preparo",
}

const FORM_VAZIO = { titulo: "", data: "", hora: "", detalhe: "", tipo: "operacao" }

function ModalCompromisso({ item, onSalvar, onFechar }) {
  const [form, setForm] = useState(item ? {
    titulo: item.titulo,
    data: item.data,
    hora: item.hora.slice(0, 5),
    detalhe: item.detalhe || "",
    tipo: item.tipo,
  } : { ...FORM_VAZIO, data: new Date().toISOString().slice(0, 10) })
  const [salvando, setSalvando] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const salvar = async (e) => {
    e.preventDefault()
    if (!form.titulo.trim() || !form.data || !form.hora) return
    setSalvando(true)
    await onSalvar({ ...form, hora: form.hora + ":00" })
    setSalvando(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onFechar}>
      <div className="w-full max-w-md rounded-2xl border border-borda bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-texto">{item ? "Editar compromisso" : "Novo compromisso"}</h2>
          <button onClick={onFechar} className="text-texto-fraco hover:text-texto">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={salvar} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-texto-suave">Título</span>
            <input
              required
              value={form.titulo}
              onChange={(e) => set("titulo", e.target.value)}
              placeholder="Ex: Reserva aniversário"
              className="w-full rounded-lg border border-borda bg-fundo px-3 py-2 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-texto-suave">Data</span>
              <input
                required
                type="date"
                value={form.data}
                onChange={(e) => set("data", e.target.value)}
                className="w-full rounded-lg border border-borda bg-fundo px-3 py-2 text-sm text-texto focus:border-laranja focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-texto-suave">Hora</span>
              <input
                required
                type="time"
                value={form.hora}
                onChange={(e) => set("hora", e.target.value)}
                className="w-full rounded-lg border border-borda bg-fundo px-3 py-2 text-sm text-texto focus:border-laranja focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-texto-suave">Tipo</span>
            <select
              value={form.tipo}
              onChange={(e) => set("tipo", e.target.value)}
              className="w-full rounded-lg border border-borda bg-fundo px-3 py-2 text-sm text-texto focus:border-laranja focus:outline-none"
            >
              {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-texto-suave">
              Detalhe <span className="text-texto-fraco">(opcional)</span>
            </span>
            <input
              value={form.detalhe}
              onChange={(e) => set("detalhe", e.target.value)}
              placeholder="Mesa, pessoas, fornecedor..."
              className="w-full rounded-lg border border-borda bg-fundo px-3 py-2 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
            />
          </label>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 rounded-lg border border-borda py-2 text-sm font-medium text-texto-suave transition-colors hover:bg-fundo"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-laranja py-2 text-sm font-bold text-fundo transition-colors hover:bg-laranja-hover disabled:opacity-60"
            >
              {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
              {item ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Agenda() {
  const { mostrar } = useToast()
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modal, setModal] = useState(null)

  const carregar = () =>
    agendaService.listar()
      .then(setItens)
      .catch(() => mostrar("Erro ao carregar agenda", "erro"))
      .finally(() => setCarregando(false))

  useEffect(() => { carregar() }, [])

  const salvar = async (form) => {
    try {
      if (modal === "novo") {
        await agendaService.criar(form)
        mostrar("Compromisso adicionado", "sucesso")
      } else {
        await agendaService.atualizar(modal.id, form)
        mostrar("Compromisso atualizado", "sucesso")
      }
      setModal(null)
      carregar()
    } catch {
      mostrar("Erro ao salvar compromisso", "erro")
    }
  }

  const deletar = async (id) => {
    if (!confirm("Remover este compromisso?")) return
    try {
      await agendaService.deletar(id)
      mostrar("Compromisso removido", "sucesso")
      setItens((prev) => prev.filter((x) => x.id !== id))
    } catch {
      mostrar("Erro ao remover", "erro")
    }
  }

  if (carregando) return <LoadingSpinner texto="Carregando agenda..." />

  const porData = itens.reduce((acc, c) => {
    ;(acc[c.data] = acc[c.data] || []).push(c)
    return acc
  }, {})

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setModal("novo")}
          className="flex items-center gap-2 rounded-lg bg-laranja px-4 py-2 text-sm font-bold text-fundo transition-colors hover:bg-laranja-hover"
        >
          <Plus className="h-4 w-4" />
          Novo compromisso
        </button>
      </div>

      {itens.length === 0 && (
        <div className="rounded-xl border border-borda bg-card py-16 text-center">
          <Calendar className="mx-auto mb-3 h-8 w-8 text-texto-fraco" />
          <p className="text-sm font-medium text-texto-suave">Nenhum compromisso agendado</p>
          <p className="mt-1 text-xs text-texto-fraco">Clique em "Novo compromisso" para adicionar</p>
        </div>
      )}

      {Object.entries(porData).map(([data, lista]) => (
        <div key={data}>
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-laranja" />
            <h2 className="text-sm font-bold text-texto">{formatarData(data)}</h2>
            <span className="text-xs text-texto-fraco">· {lista.length} compromisso(s)</span>
          </div>
          <div className="space-y-3">
            {lista.map((c) => (
              <div
                key={c.id}
                className="group flex items-center gap-4 rounded-xl border border-borda bg-card p-4 transition-colors hover:border-borda/70"
              >
                <div className="flex w-16 flex-col items-center justify-center rounded-lg bg-fundo py-2">
                  <Clock className="mb-1 h-4 w-4 text-texto-fraco" />
                  <span className="text-sm font-bold text-texto">{c.hora.slice(0, 5)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-texto">{c.titulo}</p>
                  {c.detalhe && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-texto-suave">
                      {c.tipo === "reserva" && <Users className="h-3 w-3" />}
                      {c.detalhe}
                    </p>
                  )}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${COR_TIPO[c.tipo] || COR_TIPO.operacao}`}>
                  {TIPOS.find((t) => t.valor === c.tipo)?.label || c.tipo}
                </span>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => setModal(c)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-borda text-texto-fraco hover:border-laranja/50 hover:text-laranja"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deletar(c.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-borda text-texto-fraco hover:border-status-cancelado/50 hover:text-status-cancelado"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {modal && (
        <ModalCompromisso
          item={modal === "novo" ? null : modal}
          onSalvar={salvar}
          onFechar={() => setModal(null)}
        />
      )}
    </div>
  )
}
