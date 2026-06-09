import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, Phone, X, Search, MapPin, Pencil, Loader2, Trash2, Star, StickyNote } from "lucide-react"
import Badge from "../../components/Badge.jsx"
import LoadingSpinner from "../../components/LoadingSpinner.jsx"
import { useToast } from "../../context/ToastContext.jsx"
import { formatarMoeda, formatarData } from "../../utils/format.js"
import { clientesService } from "../../services/clientesService.js"

const VIP_THRESHOLD = 100

const FORM_VAZIO = {
  nome: "", telefone: "", observacao_padrao: "",
  cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
}

async function buscarCep(cep) {
  const limpo = cep.replace(/\D/g, "")
  if (limpo.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`)
    const json = await res.json()
    if (json.erro) return null
    return { rua: json.logradouro, bairro: json.bairro, cidade: json.localidade, estado: json.uf }
  } catch { return null }
}

function FormCliente({ inicial, onSalvar, onFechar, titulo }) {
  const [form, setForm] = useState(inicial || FORM_VAZIO)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const onCepBlur = async () => {
    if (form.cep.replace(/\D/g, "").length !== 8) return
    setBuscandoCep(true)
    const dados = await buscarCep(form.cep)
    if (dados) setForm((f) => ({ ...f, ...dados }))
    setBuscandoCep(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) return
    setSalvando(true)
    await onSalvar(form)
    setSalvando(false)
  }

  const campo = (key, label, placeholder, extra = {}) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-texto-suave">{label}</span>
      <input
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-borda bg-fundo px-3 py-2 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
        {...extra}
      />
    </label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onFechar}>
      <div className="w-full max-w-lg rounded-2xl border border-borda bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-texto">{titulo}</h2>
          <button onClick={onFechar} className="text-texto-fraco hover:text-texto"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {campo("nome", "Nome *", "Nome completo", { required: true, className: "col-span-2 w-full rounded-lg border border-borda bg-fundo px-3 py-2 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none" })}
            {campo("telefone", "Telefone", "(11) 90000-0000")}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-texto-suave">
                CEP {buscandoCep && <span className="text-texto-fraco">(buscando...)</span>}
              </span>
              <input
                value={form.cep}
                onChange={(e) => set("cep", e.target.value)}
                onBlur={onCepBlur}
                placeholder="00000-000"
                maxLength={9}
                className="w-full rounded-lg border border-borda bg-fundo px-3 py-2 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-texto-suave">
              <StickyNote className="h-3.5 w-3.5 text-laranja" />
              Obs. permanente (aparece em todo novo pedido deste cliente)
            </span>
            <textarea
              value={form.observacao_padrao || ""}
              onChange={(e) => set("observacao_padrao", e.target.value)}
              rows={2}
              placeholder="Ex: alérgico a amendoim, mora no 3º andar sem elevador..."
              className="w-full resize-none rounded-lg border border-borda bg-fundo px-3 py-2 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
            />
          </label>

          {(form.rua || form.cep) && (
            <div className="space-y-3 rounded-xl border border-borda bg-fundo/50 p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-texto-suave">
                <MapPin className="h-3.5 w-3.5 text-laranja" /> Endereço
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">{campo("rua", "Rua", "Nome da rua")}</div>
                {campo("numero", "Número", "Ex: 123")}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {campo("complemento", "Complemento", "Apto, bloco...")}
                {campo("bairro", "Bairro", "Nome do bairro")}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">{campo("cidade", "Cidade", "Cidade")}</div>
                {campo("estado", "UF", "SP", { maxLength: 2 })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onFechar} className="flex-1 rounded-lg border border-borda py-2 text-sm font-medium text-texto-suave hover:bg-fundo">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-laranja py-2 text-sm font-bold text-fundo hover:bg-laranja-hover disabled:opacity-60">
              {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Clientes() {
  const { mostrar } = useToast()
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState("")
  const [selecionado, setSelecionado] = useState(null)
  const [historico, setHistorico] = useState([])
  const [modal, setModal] = useState(null) // null | "novo" | cliente-objeto

  const carregar = useCallback(async () => {
    try { setClientes(await clientesService.listar()) }
    catch { mostrar("Erro ao carregar clientes", "erro") }
    finally { setCarregando(false) }
  }, [mostrar])

  useEffect(() => { carregar() }, [carregar])

  const reqHistRef = useRef(0)
  const selecionarCliente = useCallback(async (cliente) => {
    setSelecionado(cliente)
    setHistorico([])
    const token = ++reqHistRef.current
    try {
      const h = await clientesService.historico(cliente.id)
      if (reqHistRef.current === token) setHistorico(h)
    } catch {
      if (reqHistRef.current === token) mostrar("Erro ao carregar histórico", "erro")
    }
  }, [mostrar])

  const filtrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone || "").includes(busca)
  )

  const handleDeletar = async (cliente) => {
    if (!confirm(`Excluir cliente "${cliente.nome}"? Esta ação não pode ser desfeita.`)) return
    try {
      await clientesService.deletar(cliente.id)
      setClientes((cs) => cs.filter((c) => c.id !== cliente.id))
      setSelecionado(null)
      mostrar("Cliente excluído", "sucesso")
    } catch {
      mostrar("Erro ao excluir cliente", "erro")
    }
  }

  const salvar = async (form) => {
    try {
      if (modal === "novo") {
        const novo = await clientesService.criar(form)
        setClientes((cs) => [...cs, novo].sort((a, b) => a.nome.localeCompare(b.nome)))
        mostrar("Cliente cadastrado", "sucesso")
      } else {
        const atualizado = await clientesService.atualizar(modal.id, form)
        setClientes((cs) => cs.map((c) => (c.id === atualizado.id ? atualizado : c)))
        if (selecionado?.id === atualizado.id) setSelecionado(atualizado)
        mostrar("Cliente atualizado", "sucesso")
      }
      setModal(null)
    } catch {
      mostrar("Erro ao salvar cliente", "erro")
    }
  }

  if (carregando) return <LoadingSpinner texto="Carregando clientes..." />

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-fraco" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full rounded-lg border border-borda bg-card py-2.5 pl-10 pr-3 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
            />
          </div>
          <button
            onClick={() => setModal("novo")}
            className="flex items-center gap-1.5 rounded-lg bg-laranja px-4 py-2.5 text-sm font-bold text-fundo hover:bg-laranja-hover"
          >
            <Plus className="h-4 w-4" /> Novo Cliente
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-borda bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borda text-left text-xs uppercase tracking-wide text-texto-fraco">
                <th className="px-5 py-3 font-semibold">Nome</th>
                <th className="px-5 py-3 font-semibold">Telefone</th>
                <th className="px-5 py-3 font-semibold">Cidade</th>
                <th className="px-5 py-3 font-semibold">Total gasto</th>
                <th className="px-5 py-3 font-semibold">Último pedido</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-texto-fraco">Nenhum cliente encontrado</td>
                </tr>
              )}
              {filtrados.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => selecionarCliente(c)}
                  className={`cursor-pointer border-b border-borda last:border-0 transition-colors hover:bg-card-hover ${selecionado?.id === c.id ? "bg-laranja/5" : ""}`}
                >
                  <td className="px-5 py-3.5 font-semibold text-texto">
                    <span className="flex items-center gap-1.5">
                      {c.nome}
                      {c.totalGasto >= VIP_THRESHOLD && (
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" title="Cliente VIP" />
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-texto-suave">{c.telefone || "—"}</td>
                  <td className="px-5 py-3.5 text-texto-suave">
                    {c.cidade ? `${c.cidade}${c.estado ? ` / ${c.estado}` : ""}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-texto">{formatarMoeda(c.totalGasto)}</td>
                  <td className="px-5 py-3.5 text-texto-suave">{formatarData(c.ultimoPedido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selecionado && (
        <div className="animate-slide-in w-80 shrink-0 rounded-xl border border-borda bg-card">
          <div className="flex items-start justify-between border-b border-borda px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-laranja text-sm font-bold text-fundo">
                {selecionado.nome.split(" ").slice(0, 2).map((p) => p[0]).join("")}
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-bold text-texto">
                  {selecionado.nome}
                  {selecionado.totalGasto >= VIP_THRESHOLD && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/15 px-1.5 py-0.5 text-xs font-semibold text-yellow-400">
                      <Star className="h-3 w-3 fill-yellow-400" /> VIP
                    </span>
                  )}
                </p>
                {selecionado.telefone && (
                  <p className="flex items-center gap-1 text-xs text-texto-suave">
                    <Phone className="h-3 w-3" /> {selecionado.telefone}
                  </p>
                )}
                {selecionado.cidade && (
                  <p className="flex items-center gap-1 text-xs text-texto-suave">
                    <MapPin className="h-3 w-3" />
                    {selecionado.rua ? `${selecionado.rua}${selecionado.numero ? ", " + selecionado.numero : ""} · ` : ""}
                    {selecionado.cidade}/{selecionado.estado}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setModal(selecionado)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-borda text-texto-fraco hover:border-laranja/50 hover:text-laranja"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDeletar(selecionado)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-borda text-texto-fraco hover:border-status-cancelado/50 hover:text-status-cancelado"
                title="Excluir cliente"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setSelecionado(null)} className="ml-1 text-texto-fraco hover:text-texto">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-borda px-5 py-4">
            <div className="rounded-lg border border-borda bg-fundo p-3">
              <p className="text-xs text-texto-fraco">Total gasto</p>
              <p className="mt-1 text-base font-black text-laranja">{formatarMoeda(selecionado.totalGasto)}</p>
            </div>
            <div className="rounded-lg border border-borda bg-fundo p-3">
              <p className="text-xs text-texto-fraco">Pedidos</p>
              <p className="mt-1 text-base font-black text-texto">{historico.length}</p>
            </div>
          </div>

          {selecionado.observacao_padrao && (
            <div className="border-b border-borda px-5 py-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-texto-suave">
                <StickyNote className="h-3 w-3 text-laranja" /> Obs. permanente
              </p>
              <p className="text-xs text-yellow-300">{selecionado.observacao_padrao}</p>
            </div>
          )}

          <div className="px-5 py-4">
            <h3 className="mb-3 text-sm font-bold text-texto">Histórico de pedidos</h3>
            {historico.length === 0 ? (
              <p className="py-6 text-center text-xs text-texto-fraco">Sem pedidos registrados</p>
            ) : (
              <ul className="space-y-3">
                {historico.map((h) => (
                  <li key={h.id} className="rounded-lg border border-borda bg-fundo p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-laranja">#{h.id}</span>
                      <Badge status={h.status} />
                    </div>
                    <p className="mt-1.5 text-xs text-texto-suave">{h.itens}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-texto-fraco">{formatarData(h.data)}</span>
                      <span className="text-sm font-bold text-texto">{formatarMoeda(h.total)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {modal && (
        <FormCliente
          titulo={modal === "novo" ? "Novo Cliente" : "Editar Cliente"}
          inicial={modal === "novo" ? null : modal}
          onSalvar={salvar}
          onFechar={() => setModal(null)}
        />
      )}
    </div>
  )
}
