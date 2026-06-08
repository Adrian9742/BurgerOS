import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, X, Settings2 } from "lucide-react"
import { CATEGORIAS } from "../../utils/constants.js"
import Modal from "../../components/Modal.jsx"
import LoadingSpinner from "../../components/LoadingSpinner.jsx"
import { Campo, AreaTexto, Selecao, Botao, Toggle } from "../../components/Form.jsx"
import { useToast } from "../../context/ToastContext.jsx"
import { formatarMoeda } from "../../utils/format.js"
import { produtosService } from "../../services/produtosService.js"

const vazio = {
  nome: "", descricao: "", categoria: CATEGORIAS[0], valor: "",
  disponivel: true, estoque: "", estoque_minimo: "", variacoes: [],
}

function BadgeEstoque({ estoque, minimo }) {
  if (estoque == null) return <span className="text-xs text-texto-fraco">—</span>
  const baixo = minimo != null && estoque <= minimo
  const zerado = estoque <= 0
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
      zerado ? "bg-status-cancelado/15 text-status-cancelado" :
      baixo  ? "bg-yellow-500/15 text-yellow-400" :
               "bg-status-entregue/15 text-status-entregue"
    }`}>
      {zerado ? "Zerado" : baixo ? `${estoque} ⚠` : estoque}
    </span>
  )
}

function EditorVariacoes({ variacoes, onChange }) {
  const [novaOpcao, setNovaOpcao] = useState({})

  const adicionarGrupo = () =>
    onChange([...variacoes, { nome: "", opcoes: [] }])

  const removerGrupo = (idx) =>
    onChange(variacoes.filter((_, i) => i !== idx))

  const mudarNomeGrupo = (idx, nome) =>
    onChange(variacoes.map((v, i) => (i === idx ? { ...v, nome } : v)))

  const adicionarOpcao = (idx) => {
    const texto = (novaOpcao[idx] || "").trim()
    if (!texto) return
    onChange(variacoes.map((v, i) => (i === idx ? { ...v, opcoes: [...v.opcoes, texto] } : v)))
    setNovaOpcao((p) => ({ ...p, [idx]: "" }))
  }

  const removerOpcao = (gIdx, oIdx) =>
    onChange(variacoes.map((v, i) => (i === gIdx ? { ...v, opcoes: v.opcoes.filter((_, j) => j !== oIdx) } : v)))

  const onKey = (e, idx) => {
    if (e.key === "Enter") { e.preventDefault(); adicionarOpcao(idx) }
  }

  return (
    <div className="space-y-3 rounded-xl border border-borda bg-fundo p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-texto-suave" />
          <span className="text-sm font-semibold text-texto">Variações</span>
          <span className="text-xs text-texto-fraco">(ex: ponto da carne, tamanho)</span>
        </div>
        <button
          type="button"
          onClick={adicionarGrupo}
          className="flex items-center gap-1 rounded-lg border border-borda bg-card px-3 py-1.5 text-xs font-medium text-texto-suave transition-colors hover:border-laranja/50 hover:text-laranja"
        >
          <Plus className="h-3.5 w-3.5" /> Grupo
        </button>
      </div>

      {variacoes.length === 0 && (
        <p className="py-2 text-center text-xs text-texto-fraco">
          Nenhuma variação — clique em "+ Grupo" para adicionar
        </p>
      )}

      {variacoes.map((grupo, gIdx) => (
        <div key={gIdx} className="rounded-lg border border-borda bg-card p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={grupo.nome}
              onChange={(e) => mudarNomeGrupo(gIdx, e.target.value)}
              placeholder="Nome do grupo (ex: Ponto da carne)"
              className="flex-1 rounded-lg border border-borda bg-fundo px-3 py-1.5 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removerGrupo(gIdx)}
              className="rounded-lg p-1.5 text-texto-fraco transition-colors hover:bg-fundo hover:text-status-cancelado"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {grupo.opcoes.map((op, oIdx) => (
              <span
                key={oIdx}
                className="flex items-center gap-1 rounded-full border border-laranja/30 bg-laranja/10 px-2.5 py-1 text-xs font-medium text-laranja"
              >
                {op}
                <button type="button" onClick={() => removerOpcao(gIdx, oIdx)} className="hover:text-status-cancelado">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            <div className="flex items-center gap-1">
              <input
                value={novaOpcao[gIdx] || ""}
                onChange={(e) => setNovaOpcao((p) => ({ ...p, [gIdx]: e.target.value }))}
                onKeyDown={(e) => onKey(e, gIdx)}
                placeholder="Nova opção..."
                className="w-28 rounded-full border border-dashed border-borda bg-fundo px-2.5 py-1 text-xs text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
              />
              <button
                type="button"
                onClick={() => adicionarOpcao(gIdx)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-laranja/10 text-laranja transition-colors hover:bg-laranja/20"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Cardapio() {
  const { mostrar } = useToast()
  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState("Todas")
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(vazio)
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const data = await produtosService.listar()
      setProdutos(data)
    } catch {
      mostrar("Erro ao carregar cardápio", "erro")
    } finally {
      setCarregando(false)
    }
  }, [mostrar])

  useEffect(() => { carregar() }, [carregar])

  const filtrados = filtro === "Todas" ? produtos : produtos.filter((p) => p.categoria === filtro)

  const abrirNovo = () => {
    setEditando(null)
    setForm(vazio)
    setModalAberto(true)
  }

  const abrirEdicao = (p) => {
    setEditando(p.id)
    setForm({
      ...p,
      valor: String(p.valor),
      estoque: p.estoque ?? "",
      estoque_minimo: p.estoque_minimo ?? "",
      variacoes: p.variacoes || [],
    })
    setModalAberto(true)
  }

  const alternarDisponivel = async (id) => {
    try {
      const atualizado = await produtosService.alternarDisponivel(id)
      setProdutos((ps) => ps.map((p) => (p.id === id ? atualizado : p)))
    } catch {
      mostrar("Erro ao atualizar disponibilidade", "erro")
    }
  }

  const remover = async (id) => {
    try {
      await produtosService.remover(id)
      setProdutos((ps) => ps.filter((p) => p.id !== id))
      mostrar("Produto removido", "sucesso")
    } catch {
      mostrar("Erro ao remover produto", "erro")
    }
  }

  const salvar = async (e) => {
    e.preventDefault()
    const valorNum = Number.parseFloat(form.valor)
    if (!form.nome.trim() || Number.isNaN(valorNum)) return mostrar("Preencha nome e valor", "erro")

    const variacoesLimpas = (form.variacoes || [])
      .filter((v) => v.nome.trim() && v.opcoes.length > 0)

    setSalvando(true)
    const payload = {
      ...form,
      valor: valorNum,
      estoque: form.estoque === "" ? null : Number(form.estoque),
      estoque_minimo: form.estoque_minimo === "" ? null : Number(form.estoque_minimo),
      variacoes: variacoesLimpas.length > 0 ? variacoesLimpas : null,
    }
    try {
      if (editando) {
        const atualizado = await produtosService.atualizar(editando, payload)
        setProdutos((ps) => ps.map((p) => (p.id === editando ? atualizado : p)))
        mostrar("Produto atualizado", "sucesso")
      } else {
        const novo = await produtosService.criar(payload)
        setProdutos((ps) => [...ps, novo])
        mostrar("Produto adicionado", "sucesso")
      }
      setModalAberto(false)
    } catch {
      mostrar("Erro ao salvar produto", "erro")
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <LoadingSpinner texto="Carregando cardápio..." />

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {["Todas", ...CATEGORIAS].map((c) => (
            <button
              key={c}
              onClick={() => setFiltro(c)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                filtro === c
                  ? "border-laranja bg-laranja/10 text-laranja"
                  : "border-borda bg-card text-texto-suave hover:text-texto"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <Botao onClick={abrirNovo}>
          <span className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Novo Produto
          </span>
        </Botao>
      </div>

      <div className="overflow-hidden rounded-xl border border-borda bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borda text-left text-xs uppercase tracking-wide text-texto-fraco">
              <th className="px-5 py-3 font-semibold">Nome</th>
              <th className="px-5 py-3 font-semibold">Categoria</th>
              <th className="px-5 py-3 font-semibold">Valor</th>
              <th className="px-5 py-3 font-semibold">Estoque</th>
              <th className="px-5 py-3 font-semibold">Variações</th>
              <th className="px-5 py-3 font-semibold">Disponível</th>
              <th className="px-5 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-texto-fraco">
                  Nenhum produto encontrado
                </td>
              </tr>
            )}
            {filtrados.map((p) => (
              <tr key={p.id} className="border-b border-borda last:border-0 hover:bg-card-hover">
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-texto">{p.nome}</p>
                  <p className="text-xs text-texto-fraco">{p.descricao}</p>
                </td>
                <td className="px-5 py-3.5 text-texto-suave">{p.categoria}</td>
                <td className="px-5 py-3.5 font-bold text-texto">{formatarMoeda(p.valor)}</td>
                <td className="px-5 py-3.5">
                  <BadgeEstoque estoque={p.estoque} minimo={p.estoque_minimo} />
                </td>
                <td className="px-5 py-3.5">
                  {p.variacoes && p.variacoes.length > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-laranja/10 px-2.5 py-0.5 text-xs font-medium text-laranja">
                      <Settings2 className="h-3 w-3" />
                      {p.variacoes.length} grupo{p.variacoes.length > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-texto-fraco">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <Toggle ativo={p.disponivel} aoMudar={() => alternarDisponivel(p.id)} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => abrirEdicao(p)}
                      className="rounded-lg p-2 text-texto-suave transition-colors hover:bg-fundo hover:text-laranja"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remover(p.id)}
                      className="rounded-lg p-2 text-texto-suave transition-colors hover:bg-fundo hover:text-status-cancelado"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal aberto={modalAberto} aoFechar={() => setModalAberto(false)} titulo={editando ? "Editar Produto" : "Novo Produto"}>
        <form onSubmit={salvar} className="space-y-4">
          <Campo
            rotulo="Nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Ex: X-Tudo da Casa"
          />
          <AreaTexto
            rotulo="Descrição"
            rows={2}
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Ingredientes e detalhes"
          />
          <div className="grid grid-cols-2 gap-4">
            <Selecao
              rotulo="Categoria"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Selecao>
            <Campo
              rotulo="Valor base (R$)"
              type="number"
              step="0.01"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              placeholder="0,00"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Campo
              rotulo="Estoque atual"
              type="number"
              min="0"
              value={form.estoque}
              onChange={(e) => setForm({ ...form, estoque: e.target.value })}
              placeholder="Deixe vazio p/ não controlar"
            />
            <Campo
              rotulo="Alerta abaixo de"
              type="number"
              min="0"
              value={form.estoque_minimo}
              onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })}
              placeholder="Ex: 5"
            />
          </div>

          <EditorVariacoes
            variacoes={form.variacoes || []}
            onChange={(v) => setForm({ ...form, variacoes: v })}
          />

          <div className="flex items-center justify-between rounded-lg border border-borda bg-fundo px-4 py-3">
            <span className="text-sm font-medium text-texto">Produto ativo</span>
            <Toggle ativo={form.disponivel} aoMudar={(v) => setForm({ ...form, disponivel: v })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Botao type="button" variante="secundario" onClick={() => setModalAberto(false)}>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Botao>
          </div>
        </form>
      </Modal>
    </div>
  )
}
