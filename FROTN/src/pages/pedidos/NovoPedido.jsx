import { useState, useEffect, useMemo, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Search, Plus, Minus, Trash2, ShoppingCart, ArrowLeft, User, MapPin, UserPlus, X, Loader2, Settings2, Check } from "lucide-react"
import { CATEGORIAS } from "../../utils/constants.js"
import { produtosService } from "../../services/produtosService.js"
import { clientesService } from "../../services/clientesService.js"
import { usePedidos } from "../../context/PedidosContext.jsx"
import { useToast } from "../../context/ToastContext.jsx"
import { formatarMoeda } from "../../utils/format.js"
import LoadingSpinner from "../../components/LoadingSpinner.jsx"

function ModalNovoClienteRapido({ nomeInicial, onCriado, onFechar }) {
  const [form, setForm] = useState({ nome: nomeInicial || "", telefone: "" })
  const [salvando, setSalvando] = useState(false)
  const { mostrar } = useToast()

  const submit = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) return
    setSalvando(true)
    try {
      const novo = await clientesService.criar(form)
      mostrar(`Cliente "${novo.nome}" cadastrado`, "sucesso")
      onCriado(novo)
    } catch {
      mostrar("Erro ao cadastrar cliente", "erro")
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onFechar}>
      <div className="w-full max-w-sm rounded-2xl border border-borda bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-texto">Cadastrar novo cliente</h2>
          <button onClick={onFechar} className="text-texto-fraco hover:text-texto"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-texto-suave">Nome *</span>
            <input required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="w-full rounded-lg border border-borda bg-fundo px-3 py-2 text-sm text-texto focus:border-laranja focus:outline-none" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-texto-suave">Telefone</span>
            <input value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
              placeholder="(11) 90000-0000"
              className="w-full rounded-lg border border-borda bg-fundo px-3 py-2 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none" />
          </label>
          <p className="text-xs text-texto-fraco">Endereço e detalhes podem ser adicionados depois em Clientes.</p>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onFechar} className="flex-1 rounded-lg border border-borda py-2 text-sm text-texto-suave hover:bg-fundo">Cancelar</button>
            <button type="submit" disabled={salvando}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-laranja py-2 text-sm font-bold text-fundo hover:bg-laranja-hover disabled:opacity-60">
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalVariacoes({ produto, onAdicionar, onFechar }) {
  const [selecionadas, setSelecionadas] = useState({})

  const selecionar = (nomeGrupo, opcao) =>
    setSelecionadas((s) => ({ ...s, [nomeGrupo]: opcao }))

  const confirmar = () => {
    const grupos = produto.variacoes || []
    const partes = grupos
      .map((g) => (selecionadas[g.nome] ? `${g.nome}: ${selecionadas[g.nome]}` : null))
      .filter(Boolean)
    onAdicionar(produto, partes.join(" · "))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onFechar}>
      <div className="w-full max-w-sm rounded-2xl border border-borda bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-texto">{produto.nome}</h2>
            <p className="text-xs text-texto-fraco">Escolha as opções</p>
          </div>
          <button onClick={onFechar} className="text-texto-fraco hover:text-texto"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4">
          {(produto.variacoes || []).map((grupo) => (
            <div key={grupo.nome}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-texto-suave">
                {grupo.nome}
              </p>
              <div className="flex flex-wrap gap-2">
                {grupo.opcoes.map((opcao) => {
                  const sel = selecionadas[grupo.nome] === opcao
                  return (
                    <button
                      key={opcao}
                      type="button"
                      onClick={() => selecionar(grupo.nome, opcao)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                        sel
                          ? "border-laranja bg-laranja/15 text-laranja"
                          : "border-borda bg-fundo text-texto-suave hover:border-laranja/50 hover:text-texto"
                      }`}
                    >
                      {sel && <Check className="h-3 w-3" />}
                      {opcao}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 rounded-lg border border-borda py-2.5 text-sm text-texto-suave hover:bg-fundo"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-laranja py-2.5 text-sm font-bold text-fundo hover:bg-laranja-hover"
          >
            <Plus className="h-4 w-4" />
            Adicionar ao carrinho
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NovoPedido() {
  const navigate = useNavigate()
  const location = useLocation()
  const { adicionarPedido } = usePedidos()
  const { mostrar } = useToast()

  const [produtos, setProdutos] = useState([])
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(true)

  const mesaInicial = location.state?.mesa ? String(location.state.mesa) : ""
  const [modoCliente, setModoCliente] = useState(mesaInicial ? "mesa" : "cliente")
  const [buscaCliente, setBuscaCliente] = useState("")
  const [clienteSel, setClienteSel] = useState(null)
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [modalNovoCliente, setModalNovoCliente] = useState(false)
  const [mesa, setMesa] = useState(mesaInicial)
  const [carrinho, setCarrinho] = useState([])
  const [confirmando, setConfirmando] = useState(false)
  const [modalVariacoes, setModalVariacoes] = useState(null)
  const inputClienteRef = useRef(null)
  const itemKeyRef = useRef(0)

  const gerarKey = () => String(++itemKeyRef.current)

  useEffect(() => {
    Promise.all([produtosService.listar(), clientesService.listar()])
      .then(([prods, clts]) => { setProdutos(prods); setClientes(clts) })
      .catch(() => mostrar("Erro ao carregar dados", "erro"))
      .finally(() => setCarregando(false))
  }, [mostrar])

  const disponiveis = produtos.filter((p) => p.disponivel)

  const clientesFiltrados = useMemo(() => {
    if (!buscaCliente.trim()) return clientes.slice(0, 6)
    return clientes.filter((c) => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())).slice(0, 6)
  }, [buscaCliente, clientes])

  const selecionarCliente = (c) => {
    setClienteSel(c)
    setBuscaCliente(c.nome)
    setDropdownAberto(false)
  }

  const limparCliente = () => {
    setClienteSel(null)
    setBuscaCliente("")
    setDropdownAberto(false)
    setTimeout(() => inputClienteRef.current?.focus(), 50)
  }

  const clienteCriado = (novo) => {
    setClientes((cs) => [...cs, novo])
    selecionarCliente(novo)
    setModalNovoCliente(false)
  }

  const adicionarItemSimples = (produto) => {
    setCarrinho((c) => {
      const existe = c.find((i) => i.key === String(produto.id))
      if (existe) return c.map((i) => (i.key === String(produto.id) ? { ...i, qtd: i.qtd + 1 } : i))
      return [...c, { key: String(produto.id), produto, qtd: 1, obs: "" }]
    })
  }

  const adicionarItemComVariacoes = (produto, obs) => {
    setCarrinho((c) => [...c, { key: gerarKey(), produto, qtd: 1, obs }])
    setModalVariacoes(null)
  }

  const clicarProduto = (produto) => {
    if (produto.variacoes && produto.variacoes.length > 0) {
      setModalVariacoes(produto)
    } else {
      adicionarItemSimples(produto)
    }
  }

  const mudarQtd = (key, delta) =>
    setCarrinho((c) => c.map((i) => (i.key === key ? { ...i, qtd: i.qtd + delta } : i)).filter((i) => i.qtd > 0))

  const mudarObs = (key, obs) =>
    setCarrinho((c) => c.map((i) => (i.key === key ? { ...i, obs } : i)))

  const removerItem = (key) => setCarrinho((c) => c.filter((i) => i.key !== key))

  const total = carrinho.reduce((s, i) => s + i.produto.valor * i.qtd, 0)

  const confirmar = async () => {
    if (carrinho.length === 0) return mostrar("Adicione ao menos um item", "erro")
    if (modoCliente === "cliente" && !clienteSel) return mostrar("Selecione um cliente", "erro")
    if (modoCliente === "mesa" && !mesa.trim()) return mostrar("Informe o número da mesa", "erro")

    setConfirmando(true)
    try {
      await adicionarPedido({
        cliente_id: modoCliente === "cliente" ? clienteSel.id : null,
        mesa: modoCliente === "mesa" ? `Mesa ${mesa}` : null,
        itens: carrinho.map((i) => ({
          produto_id: i.produto.id,
          quantidade: i.qtd,
          observacao: i.obs || null,
        })),
      })
      mostrar("Pedido criado com sucesso!", "sucesso")
      navigate("/pedidos")
    } catch {
      mostrar("Erro ao criar pedido", "erro")
    } finally {
      setConfirmando(false)
    }
  }

  if (carregando) return <LoadingSpinner texto="Carregando..." />

  return (
    <div className="flex gap-6" onClick={() => setDropdownAberto(false)}>
      <div className="min-w-0 flex-1">
        <button
          onClick={() => navigate("/pedidos")}
          className="mb-4 flex items-center gap-1.5 text-sm text-texto-suave transition-colors hover:text-texto"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a fila
        </button>

        <div className="mb-6 rounded-xl border border-borda bg-card p-5">
          <div className="mb-4 flex gap-2">
            {[
              { chave: "cliente", rotulo: "Cliente", icone: User },
              { chave: "mesa", rotulo: "Mesa", icone: MapPin },
            ].map(({ chave, rotulo, icone: Icone }) => (
              <button
                key={chave}
                onClick={() => setModoCliente(chave)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  modoCliente === chave
                    ? "bg-laranja text-fundo"
                    : "border border-borda bg-fundo text-texto-suave hover:text-texto"
                }`}
              >
                <Icone className="h-4 w-4" />
                {rotulo}
              </button>
            ))}
          </div>

          {modoCliente === "cliente" ? (
            <div className="relative">
              {clienteSel ? (
                <div className="flex items-center gap-3 rounded-lg border border-laranja bg-laranja/5 px-3 py-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-laranja text-xs font-bold text-fundo">
                    {clienteSel.nome.split(" ").slice(0, 2).map((p) => p[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-texto">{clienteSel.nome}</p>
                    {clienteSel.telefone && <p className="text-xs text-texto-fraco">{clienteSel.telefone}</p>}
                  </div>
                  <button onClick={limparCliente} className="text-texto-fraco hover:text-texto">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-fraco" />
                    <input
                      ref={inputClienteRef}
                      value={buscaCliente}
                      onChange={(e) => { setBuscaCliente(e.target.value); setDropdownAberto(true) }}
                      onFocus={() => setDropdownAberto(true)}
                      placeholder="Digite o nome do cliente..."
                      className="w-full rounded-lg border border-borda bg-fundo py-2.5 pl-10 pr-3 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
                    />
                  </div>
                  {dropdownAberto && (
                    <div className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-xl border border-borda bg-card shadow-xl">
                      {clientesFiltrados.map((c) => (
                        <button
                          key={c.id}
                          onMouseDown={() => selecionarCliente(c)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-card-hover"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-laranja/15 text-xs font-bold text-laranja">
                            {c.nome[0]}
                          </div>
                          <span className="font-medium text-texto">{c.nome}</span>
                          {c.telefone && <span className="ml-auto text-xs text-texto-fraco">{c.telefone}</span>}
                        </button>
                      ))}
                      <button
                        onMouseDown={() => { setModalNovoCliente(true); setDropdownAberto(false) }}
                        className="flex w-full items-center gap-3 border-t border-borda px-4 py-2.5 text-sm text-laranja hover:bg-laranja/5"
                      >
                        <UserPlus className="h-4 w-4" />
                        {buscaCliente.trim()
                          ? `Cadastrar "${buscaCliente}" como novo cliente`
                          : "Cadastrar novo cliente"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="relative max-w-xs">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-fraco" />
              <input
                value={mesa}
                onChange={(e) => setMesa(e.target.value)}
                placeholder="Número da mesa"
                className="w-full rounded-lg border border-borda bg-fundo py-2.5 pl-10 pr-3 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          {CATEGORIAS.map((cat) => {
            const itensCat = disponiveis.filter((p) => p.categoria === cat)
            if (itensCat.length === 0) return null
            return (
              <div key={cat}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-texto-suave">{cat}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {itensCat.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => clicarProduto(p)}
                      className="group flex flex-col rounded-xl border border-borda bg-card p-4 text-left transition-colors hover:border-laranja/50"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-sm font-semibold text-texto">{p.nome}</span>
                        {p.variacoes && p.variacoes.length > 0 && (
                          <Settings2 className="h-3.5 w-3.5 shrink-0 text-laranja/60" />
                        )}
                      </div>
                      <span className="mt-1 line-clamp-2 text-xs text-texto-fraco">{p.descricao}</span>
                      <span className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-laranja">{formatarMoeda(p.valor)}</span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-fundo text-texto-suave transition-colors group-hover:bg-laranja group-hover:text-fundo">
                          <Plus className="h-4 w-4" />
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="sticky top-0 flex h-fit max-h-[calc(100vh-8rem)] w-80 shrink-0 flex-col rounded-xl border border-borda bg-card">
        <div className="flex items-center gap-2 border-b border-borda px-5 py-4">
          <ShoppingCart className="h-5 w-5 text-laranja" />
          <h2 className="text-base font-bold text-texto">Carrinho</h2>
          <span className="ml-auto rounded-full bg-fundo px-2 py-0.5 text-xs font-bold text-texto-suave">
            {carrinho.reduce((s, i) => s + i.qtd, 0)}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {carrinho.length === 0 ? (
            <p className="py-10 text-center text-sm text-texto-fraco">Carrinho vazio.<br />Toque nos produtos para adicionar.</p>
          ) : (
            <ul className="space-y-4">
              {carrinho.map((i) => (
                <li key={i.key} className="rounded-lg border border-borda bg-fundo p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-texto">{i.produto.nome}</span>
                    <button onClick={() => removerItem(i.key)} className="text-texto-fraco hover:text-status-cancelado">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => mudarQtd(i.key, -1)} className="flex h-6 w-6 items-center justify-center rounded bg-card text-texto-suave hover:text-texto">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-texto">{i.qtd}</span>
                      <button onClick={() => mudarQtd(i.key, 1)} className="flex h-6 w-6 items-center justify-center rounded bg-card text-texto-suave hover:text-texto">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-laranja">{formatarMoeda(i.produto.valor * i.qtd)}</span>
                  </div>
                  <input
                    value={i.obs}
                    onChange={(e) => mudarObs(i.key, e.target.value)}
                    placeholder="Observação..."
                    className="mt-2 w-full rounded border border-borda bg-card px-2 py-1.5 text-xs text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-borda px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-texto-suave">Total</span>
            <span className="text-xl font-black text-texto">{formatarMoeda(total)}</span>
          </div>
          <button
            onClick={confirmar}
            disabled={confirmando}
            className="w-full rounded-lg bg-laranja py-3 text-sm font-bold text-fundo transition-colors hover:bg-laranja-hover disabled:opacity-60"
          >
            {confirmando ? "Criando pedido..." : "Confirmar Pedido"}
          </button>
        </div>
      </div>

      {modalNovoCliente && (
        <ModalNovoClienteRapido
          nomeInicial={buscaCliente}
          onCriado={clienteCriado}
          onFechar={() => setModalNovoCliente(false)}
        />
      )}

      {modalVariacoes && (
        <ModalVariacoes
          produto={modalVariacoes}
          onAdicionar={adicionarItemComVariacoes}
          onFechar={() => setModalVariacoes(null)}
        />
      )}
    </div>
  )
}
