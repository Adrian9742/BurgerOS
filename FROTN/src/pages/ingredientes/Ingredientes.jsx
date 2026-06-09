import { useState, useEffect, useCallback } from "react"
import { Plus, X, Pencil, Trash2, PackageMinus, PackagePlus, AlertTriangle } from "lucide-react"
import LoadingSpinner from "../../components/LoadingSpinner.jsx"
import { useToast } from "../../context/ToastContext.jsx"
import { ingredientesService } from "../../services/ingredientesService.js"

const UNIDADES = ["un", "g", "kg", "ml", "L", "cx", "pct"]

const FORM_VAZIO = { nome: "", unidade: "un", estoque: "", estoque_minimo: "" }

function statusEstoque(ing) {
  if (ing.estoque_minimo == null) return "normal"
  if (ing.estoque <= 0) return "zerado"
  if (ing.estoque <= ing.estoque_minimo) return "critico"
  if (ing.estoque <= ing.estoque_minimo * 2) return "atencao"
  return "normal"
}

function BadgeStatus({ ing }) {
  const s = statusEstoque(ing)
  const cfg = {
    zerado:  { label: "Zerado",   cls: "bg-status-cancelado/15 text-status-cancelado" },
    critico: { label: "Crítico",  cls: "bg-status-cancelado/15 text-status-cancelado" },
    atencao: { label: "Atenção",  cls: "bg-yellow-500/15 text-yellow-400" },
    normal:  { label: "OK",       cls: "bg-status-entregue/15 text-status-entregue" },
  }[s]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {s !== "normal" && <AlertTriangle className="mr-1 h-3 w-3" />}
      {cfg.label}
    </span>
  )
}

function ModalForm({ inicial, onSalvar, onFechar, titulo }) {
  const [form, setForm] = useState(inicial || FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) return
    setSalvando(true)
    await onSalvar({
      nome: form.nome.trim(),
      unidade: form.unidade,
      estoque: form.estoque === "" ? 0 : Number(form.estoque),
      estoque_minimo: form.estoque_minimo === "" ? null : Number(form.estoque_minimo),
    })
    setSalvando(false)
  }

  const input = (key, label, extra = {}) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-texto-suave">{label}</span>
      <input
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        className="w-full rounded-lg border border-borda bg-fundo px-3 py-2 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
        {...extra}
      />
    </label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onFechar}>
      <div className="w-full max-w-md rounded-2xl border border-borda bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-texto">{titulo}</h2>
          <button onClick={onFechar} className="text-texto-fraco hover:text-texto"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {input("nome", "Nome *", { required: true, placeholder: "Ex: Hambúrguer 160g" })}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-texto-suave">Unidade *</span>
            <select
              value={form.unidade}
              onChange={e => set("unidade", e.target.value)}
              className="w-full rounded-lg border border-borda bg-fundo px-3 py-2 text-sm text-texto focus:border-laranja focus:outline-none"
            >
              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            {input("estoque", "Estoque inicial", { type: "number", min: "0", step: "0.001", placeholder: "0" })}
            {input("estoque_minimo", "Alerta abaixo de", { type: "number", min: "0", step: "0.001", placeholder: "Opcional" })}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onFechar} className="flex-1 rounded-lg border border-borda py-2 text-sm font-medium text-texto-suave hover:bg-fundo">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="flex-1 rounded-lg bg-laranja py-2 text-sm font-bold text-fundo hover:bg-laranja-hover disabled:opacity-60">
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalAjuste({ ingrediente, onSalvar, onFechar }) {
  const [delta, setDelta] = useState("")
  const [salvando, setSalvando] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const val = parseFloat(delta)
    if (isNaN(val) || val === 0) return
    setSalvando(true)
    await onSalvar(val)
    setSalvando(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onFechar}>
      <div className="w-full max-w-sm rounded-2xl border border-borda bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-texto">Ajustar Estoque</h2>
          <button onClick={onFechar} className="text-texto-fraco hover:text-texto"><X className="h-5 w-5" /></button>
        </div>

        <div className="mb-4 rounded-lg border border-borda bg-fundo px-4 py-3">
          <p className="text-sm font-semibold text-texto">{ingrediente.nome}</p>
          <p className="text-xs text-texto-fraco">
            Estoque atual: <span className="font-bold text-laranja">{Number(ingrediente.estoque).toFixed(ingrediente.unidade === "un" ? 0 : 2)} {ingrediente.unidade}</span>
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-texto-suave">Quantidade (use positivo para entrada, negativo para saída)</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDelta(d => String(Math.abs(parseFloat(d) || 0) * -1))}
                className="flex items-center gap-1 rounded-lg border border-borda px-3 py-2 text-xs font-medium text-texto-suave hover:border-status-cancelado/50 hover:text-status-cancelado">
                <PackageMinus className="h-4 w-4" /> Saída
              </button>
              <input
                type="number"
                step="0.001"
                value={delta}
                onChange={e => setDelta(e.target.value)}
                placeholder="Ex: 10 ou -5"
                className="flex-1 rounded-lg border border-borda bg-fundo px-3 py-2 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
                autoFocus
              />
              <button type="button" onClick={() => setDelta(d => String(Math.abs(parseFloat(d) || 0)))}
                className="flex items-center gap-1 rounded-lg border border-borda px-3 py-2 text-xs font-medium text-texto-suave hover:border-status-entregue/50 hover:text-status-entregue">
                <PackagePlus className="h-4 w-4" /> Entrada
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onFechar} className="flex-1 rounded-lg border border-borda py-2 text-sm font-medium text-texto-suave hover:bg-fundo">
              Cancelar
            </button>
            <button type="submit" disabled={salvando || !delta || parseFloat(delta) === 0}
              className="flex-1 rounded-lg bg-laranja py-2 text-sm font-bold text-fundo hover:bg-laranja-hover disabled:opacity-60">
              {salvando ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Ingredientes() {
  const { mostrar } = useToast()
  const [ingredientes, setIngredientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modal, setModal] = useState(null)    // null | "novo" | objeto
  const [ajustando, setAjustando] = useState(null)

  const carregar = useCallback(async () => {
    try { setIngredientes(await ingredientesService.listar()) }
    catch { mostrar("Erro ao carregar ingredientes", "erro") }
    finally { setCarregando(false) }
  }, [mostrar])

  useEffect(() => { carregar() }, [carregar])

  const salvar = async (form) => {
    try {
      if (modal === "novo") {
        const novo = await ingredientesService.criar(form)
        setIngredientes(ing => [...ing, novo].sort((a, b) => a.nome.localeCompare(b.nome)))
        mostrar("Ingrediente adicionado", "sucesso")
      } else {
        const upd = await ingredientesService.atualizar(modal.id, form)
        setIngredientes(ing => ing.map(i => i.id === upd.id ? upd : i))
        mostrar("Ingrediente atualizado", "sucesso")
      }
      setModal(null)
    } catch {
      mostrar("Erro ao salvar ingrediente", "erro")
    }
  }

  const deletar = async (ing) => {
    if (!confirm(`Excluir "${ing.nome}"? Isso remove também a ficha técnica dos produtos.`)) return
    try {
      await ingredientesService.remover(ing.id)
      setIngredientes(list => list.filter(i => i.id !== ing.id))
      mostrar("Ingrediente removido", "sucesso")
    } catch {
      mostrar("Erro ao remover ingrediente", "erro")
    }
  }

  const confirmarAjuste = async (delta) => {
    try {
      const upd = await ingredientesService.ajustarEstoque(ajustando.id, delta)
      setIngredientes(list => list.map(i => i.id === upd.id ? upd : i))
      mostrar(`Estoque ajustado: ${delta > 0 ? "+" : ""}${delta} ${upd.unidade}`, "sucesso")
      setAjustando(null)
    } catch {
      mostrar("Erro ao ajustar estoque", "erro")
    }
  }

  const criticos = ingredientes.filter(i => statusEstoque(i) !== "normal")

  if (carregando) return <LoadingSpinner texto="Carregando ingredientes..." />

  return (
    <div className="space-y-5">
      {criticos.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
          <div>
            <p className="text-sm font-semibold text-texto">
              {criticos.length} ingrediente{criticos.length > 1 ? "s" : ""} com estoque baixo
            </p>
            <p className="text-xs text-texto-suave">
              {criticos.map(i => i.nome).join(", ")}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-texto-suave">{ingredientes.length} ingrediente{ingredientes.length !== 1 ? "s" : ""} cadastrado{ingredientes.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setModal("novo")}
          className="flex items-center gap-1.5 rounded-lg bg-laranja px-4 py-2.5 text-sm font-bold text-fundo hover:bg-laranja-hover"
        >
          <Plus className="h-4 w-4" /> Novo Ingrediente
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-borda bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borda text-left text-xs uppercase tracking-wide text-texto-fraco">
              <th className="px-5 py-3 font-semibold">Nome</th>
              <th className="px-5 py-3 font-semibold">Unidade</th>
              <th className="px-5 py-3 font-semibold">Estoque atual</th>
              <th className="px-5 py-3 font-semibold">Mínimo</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {ingredientes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-texto-fraco">
                  Nenhum ingrediente cadastrado
                </td>
              </tr>
            )}
            {ingredientes.map(ing => {
              const s = statusEstoque(ing)
              const dec = ["g", "kg", "ml", "L"].includes(ing.unidade) ? 2 : 0
              return (
                <tr key={ing.id} className={`border-b border-borda last:border-0 transition-colors hover:bg-card-hover ${s === "critico" || s === "zerado" ? "bg-status-cancelado/3" : ""}`}>
                  <td className="px-5 py-3.5 font-semibold text-texto">{ing.nome}</td>
                  <td className="px-5 py-3.5 text-texto-suave">{ing.unidade}</td>
                  <td className="px-5 py-3.5">
                    <span className={`font-bold ${s === "critico" || s === "zerado" ? "text-status-cancelado" : s === "atencao" ? "text-yellow-400" : "text-texto"}`}>
                      {Number(ing.estoque).toFixed(dec)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-texto-suave">
                    {ing.estoque_minimo != null ? Number(ing.estoque_minimo).toFixed(dec) : "—"}
                  </td>
                  <td className="px-5 py-3.5"><BadgeStatus ing={ing} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setAjustando(ing)}
                        className="rounded-lg p-2 text-texto-suave transition-colors hover:bg-fundo hover:text-laranja"
                        title="Ajustar estoque"
                      >
                        <PackagePlus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setModal(ing)}
                        className="rounded-lg p-2 text-texto-suave transition-colors hover:bg-fundo hover:text-laranja"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deletar(ing)}
                        className="rounded-lg p-2 text-texto-suave transition-colors hover:bg-fundo hover:text-status-cancelado"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <ModalForm
          titulo={modal === "novo" ? "Novo Ingrediente" : "Editar Ingrediente"}
          inicial={modal === "novo" ? null : { ...modal, estoque: String(modal.estoque), estoque_minimo: modal.estoque_minimo != null ? String(modal.estoque_minimo) : "" }}
          onSalvar={salvar}
          onFechar={() => setModal(null)}
        />
      )}

      {ajustando && (
        <ModalAjuste
          ingrediente={ajustando}
          onSalvar={confirmarAjuste}
          onFechar={() => setAjustando(null)}
        />
      )}
    </div>
  )
}
