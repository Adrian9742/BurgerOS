import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { CATEGORIAS } from "../../utils/constants.js"
import Modal from "../../components/Modal.jsx"
import LoadingSpinner from "../../components/LoadingSpinner.jsx"
import { Campo, AreaTexto, Selecao, Botao, Toggle } from "../../components/Form.jsx"
import { useToast } from "../../context/ToastContext.jsx"
import { formatarMoeda } from "../../utils/format.js"
import { produtosService } from "../../services/produtosService.js"

const vazio = { nome: "", descricao: "", categoria: CATEGORIAS[0], valor: "", disponivel: true }

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

  useEffect(() => {
    carregar()
  }, [carregar])

  const filtrados = filtro === "Todas" ? produtos : produtos.filter((p) => p.categoria === filtro)

  const abrirNovo = () => {
    setEditando(null)
    setForm(vazio)
    setModalAberto(true)
  }

  const abrirEdicao = (p) => {
    setEditando(p.id)
    setForm({ ...p, valor: String(p.valor) })
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

    setSalvando(true)
    try {
      if (editando) {
        const atualizado = await produtosService.atualizar(editando, { ...form, valor: valorNum })
        setProdutos((ps) => ps.map((p) => (p.id === editando ? atualizado : p)))
        mostrar("Produto atualizado", "sucesso")
      } else {
        const novo = await produtosService.criar({ ...form, valor: valorNum })
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
              <th className="px-5 py-3 font-semibold">Disponível</th>
              <th className="px-5 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-texto-fraco">
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
                <option key={c} value={c}>
                  {c}
                </option>
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
