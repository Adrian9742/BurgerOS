import { useState, useEffect, useRef } from "react"
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, BarChart,
} from "recharts"
import { TrendingUp, DollarSign, CheckCircle2, Target, Plus, Trash2, Pencil, Check, X, AlertTriangle, Trophy } from "lucide-react"
import { formatarMoeda } from "../../utils/format.js"
import { dashboardService } from "../../services/dashboardService.js"
import configuracoesService from "../../services/configuracoesService.js"
import { produtosService } from "../../services/produtosService.js"
import { useAuth } from "../../context/AuthContext.jsx"
import { useToast } from "../../context/ToastContext.jsx"
import LoadingSpinner from "../../components/LoadingSpinner.jsx"

const _META_FALLBACK = { vendasSemana: [], totalVendas: 0, pedidosConcluidos: 0, pedidosHoje: 0, ticketMedio: 0, metaAtingida: 0, totalMeta: 10500 }

function CardMetrica({ icone: Icone, rotulo, valor, detalhe, cor }) {
  return (
    <div className="rounded-xl border border-borda bg-card p-5">
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${cor}`}>
          <Icone className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-black text-texto">{valor}</p>
      <p className="mt-1 text-sm text-texto-suave">{rotulo}</p>
      {detalhe && <p className="mt-2 text-xs text-texto-fraco">{detalhe}</p>}
    </div>
  )
}

function CardMeta({ metaAtingida, totalMeta, metaDiaria, onSalvar, isAdmin }) {
  const [editando, setEditando] = useState(false)
  const [valorStr, setValorStr] = useState("")
  const [salvando, setSalvando] = useState(false)
  const inputRef = useRef(null)

  const abrirEdit = () => {
    setValorStr(String(metaDiaria))
    setEditando(true)
    setTimeout(() => inputRef.current?.select(), 50)
  }

  const cancelar = () => setEditando(false)

  const salvar = async () => {
    const val = parseFloat(valorStr.replace(",", "."))
    if (!val || val <= 0) return
    setSalvando(true)
    await onSalvar(val)
    setSalvando(false)
    setEditando(false)
  }

  const onKey = (e) => {
    if (e.key === "Enter") salvar()
    if (e.key === "Escape") cancelar()
  }

  return (
    <div className="rounded-xl border border-borda bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-preparo/15 text-status-preparo">
          <Target className="h-5 w-5" />
        </span>
        {isAdmin && !editando && (
          <button
            onClick={abrirEdit}
            title="Alterar meta diária"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-borda text-texto-fraco transition-colors hover:border-laranja/50 hover:text-laranja"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {editando && (
          <div className="flex gap-1">
            <button
              onClick={salvar}
              disabled={salvando}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-status-entregue/15 text-status-entregue hover:bg-status-entregue/25"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={cancelar}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-status-cancelado/15 text-status-cancelado hover:bg-status-cancelado/25"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 text-2xl font-black text-texto">{metaAtingida}%</p>
      <p className="mt-1 text-sm text-texto-suave">Meta atingida</p>

      {editando ? (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-xs text-texto-fraco">R$</span>
          <input
            ref={inputRef}
            type="number"
            value={valorStr}
            onChange={(e) => setValorStr(e.target.value)}
            onKeyDown={onKey}
            min="1"
            step="50"
            className="w-full rounded border border-laranja bg-fundo px-2 py-1 text-xs font-bold text-texto focus:outline-none"
          />
          <span className="text-xs text-texto-fraco">/semana</span>
        </div>
      ) : (
        <p className="mt-2 text-xs text-texto-fraco">
          Meta: {formatarMoeda(totalMeta)}/semana
          {isAdmin && <span className="ml-1 text-texto-fraco/60">· ✏️ editar</span>}
        </p>
      )}
    </div>
  )
}

function DicaGrafico({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-borda bg-fundo px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs font-semibold text-texto">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
          {p.dataKey === "vendas" ? "Vendas" : "Meta"}: {formatarMoeda(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const { mostrar } = useToast()
  const [metricas, setMetricas] = useState(_META_FALLBACK)
  const [metaDiaria, setMetaDiaria] = useState(1500)
  const [carregando, setCarregando] = useState(true)
  const [estoqueBaixo, setEstoqueBaixo] = useState([])
  const [topProdutos, setTopProdutos] = useState([])
  const [faturamentoHoras, setFaturamentoHoras] = useState([])
  const [lembretes, setLembretes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("flameos_lembretes") || "[]") } catch { return [] }
  })
  const [novoLembrete, setNovoLembrete] = useState("")

  const isAdmin = usuario?.cargo === "Proprietário"

  const carregarDados = () =>
    Promise.allSettled([
      dashboardService.getMetricas(),
      configuracoesService.getMeta(),
      produtosService.listarEstoqueBaixo(),
      dashboardService.topProdutos(),
      dashboardService.faturamentoHoras(),
    ]).then(([m, cfg, eb, tp, fh]) => {
      if (m.status === "fulfilled") setMetricas(m.value)
      if (cfg.status === "fulfilled") setMetaDiaria(cfg.value.valor)
      if (eb.status === "fulfilled") setEstoqueBaixo(eb.value)
      if (tp.status === "fulfilled") setTopProdutos(tp.value)
      if (fh.status === "fulfilled") setFaturamentoHoras(fh.value)
    }).finally(() => setCarregando(false))

  useEffect(() => { carregarDados() }, [])

  const salvarMeta = async (novoValor) => {
    try {
      await configuracoesService.setMeta(novoValor)
      setMetaDiaria(novoValor)
      mostrar(`Meta semanal atualizada para ${formatarMoeda(novoValor)}`, "sucesso")
      carregarDados()
    } catch {
      mostrar("Erro ao salvar meta", "erro")
    }
  }

  const salvarLembretes = (lista) => {
    setLembretes(lista)
    localStorage.setItem("flameos_lembretes", JSON.stringify(lista))
  }

  const adicionarLembrete = (e) => {
    e.preventDefault()
    if (!novoLembrete.trim()) return
    salvarLembretes([...lembretes, { id: Date.now(), texto: novoLembrete.trim(), feito: false }])
    setNovoLembrete("")
  }

  const alternar = (id) => salvarLembretes(lembretes.map((x) => (x.id === id ? { ...x, feito: !x.feito } : x)))
  const remover = (id) => salvarLembretes(lembretes.filter((x) => x.id !== id))

  if (carregando) return <LoadingSpinner texto="Carregando dashboard..." />

  const { vendasSemana, totalVendas, pedidosConcluidos, pedidosHoje, ticketMedio, metaAtingida, totalMeta } = metricas

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-5">
        <CardMetrica
          icone={DollarSign}
          rotulo="Vendas da semana"
          valor={formatarMoeda(totalVendas)}
          detalhe="Últimos 7 dias"
          cor="bg-laranja/15 text-laranja"
        />
        <CardMetrica
          icone={TrendingUp}
          rotulo="Ticket médio"
          valor={formatarMoeda(ticketMedio)}
          detalhe={`${pedidosConcluidos} pedidos no período`}
          cor="bg-status-entregue/15 text-status-entregue"
        />
        <CardMetrica
          icone={CheckCircle2}
          rotulo="Pedidos concluídos"
          valor={pedidosConcluidos}
          detalhe={`${pedidosHoje} pedidos hoje`}
          cor="bg-status-pronto/15 text-status-pronto"
        />
        <CardMeta
          metaAtingida={metaAtingida}
          totalMeta={totalMeta}
          metaDiaria={metaDiaria}
          onSalvar={salvarMeta}
          isAdmin={isAdmin}
        />
      </div>

      {estoqueBaixo.length > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <h2 className="text-sm font-bold text-texto">Estoque Baixo — {estoqueBaixo.length} produto{estoqueBaixo.length > 1 ? "s" : ""}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {estoqueBaixo.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-fundo px-3 py-1.5">
                <span className="text-sm font-medium text-texto">{p.nome}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.estoque <= 0 ? "bg-status-cancelado/15 text-status-cancelado" : "bg-yellow-500/15 text-yellow-400"}`}>
                  {p.estoque <= 0 ? "Zerado" : `${p.estoque} un`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topProdutos.length > 0 && (
        <div className="rounded-xl border border-borda bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-laranja" />
            <h2 className="text-base font-bold text-texto">Top produtos — últimos 7 dias</h2>
          </div>
          <div className="space-y-3">
            {topProdutos.map((p, i) => {
              const max = topProdutos[0].quantidade
              const pct = Math.round((p.quantidade / max) * 100)
              return (
                <div key={p.nome} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs font-bold text-texto-fraco">{i + 1}</span>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-texto">{p.nome}</span>
                      <span className="text-xs text-texto-fraco">{p.quantidade} un · {formatarMoeda(p.receita)}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-borda">
                      <div
                        className="h-full rounded-full bg-laranja transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {faturamentoHoras.some(h => h.vendas > 0) && (
        <div className="rounded-xl border border-borda bg-card p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-texto">Faturamento por hora — hoje</h2>
            <p className="text-sm text-texto-suave">Distribuição de vendas ao longo do dia</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={faturamentoHoras.filter(h => h.vendas > 0 || (faturamentoHoras.findIndex(x => x.hora === h.hora) > faturamentoHoras.findIndex(x => x.vendas > 0) - 1 && faturamentoHoras.findIndex(x => x.hora === h.hora) < faturamentoHoras.map(x => x.vendas).lastIndexOf(faturamentoHoras.filter(x => x.vendas > 0).at(-1)?.vendas) + 2))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="hora" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => v > 0 ? `R$${(v/1000).toFixed(1)}k` : ''} />
              <Tooltip formatter={(v) => [`R$ ${v.toFixed(2)}`, "Vendas"]} contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="vendas" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-xl border border-borda bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-texto">Vendas dos últimos 7 dias</h2>
              <p className="text-sm text-texto-suave">Barras de vendas com linha de meta</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-texto-suave">
                <span className="h-3 w-3 rounded-sm bg-laranja" /> Vendas
              </span>
              <span className="flex items-center gap-1.5 text-texto-suave">
                <span className="h-0.5 w-4 bg-status-entregue" /> Meta
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={vendasSemana} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="dia" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`} />
              <Tooltip content={<DicaGrafico />} cursor={{ fill: "rgba(249,115,22,0.08)" }} />
              <Bar dataKey="vendas" fill="#f97316" radius={[6, 6, 0, 0]} barSize={36} />
              <Line type="monotone" dataKey="meta" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-borda bg-card p-6">
          <h2 className="text-base font-bold text-texto">Lembretes do dia</h2>
          <p className="mb-4 text-sm text-texto-suave">Anotações rápidas</p>

          <form onSubmit={adicionarLembrete} className="mb-4 flex gap-2">
            <input
              value={novoLembrete}
              onChange={(e) => setNovoLembrete(e.target.value)}
              placeholder="Nova anotação..."
              className="min-w-0 flex-1 rounded-lg border border-borda bg-fundo px-3 py-2 text-sm text-texto placeholder:text-texto-fraco focus:border-laranja focus:outline-none"
            />
            <button type="submit" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-laranja text-fundo transition-colors hover:bg-laranja-hover">
              <Plus className="h-4 w-4" />
            </button>
          </form>

          <ul className="space-y-2">
            {lembretes.map((l) => (
              <li key={l.id} className="group flex items-center gap-3 rounded-lg border border-borda bg-fundo px-3 py-2.5">
                <input type="checkbox" checked={l.feito} onChange={() => alternar(l.id)} className="h-4 w-4 shrink-0 accent-laranja" />
                <span className={`flex-1 text-sm ${l.feito ? "text-texto-fraco line-through" : "text-texto"}`}>{l.texto}</span>
                <button onClick={() => remover(l.id)} className="text-texto-fraco opacity-0 transition-opacity hover:text-status-cancelado group-hover:opacity-100">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
            {lembretes.length === 0 && <li className="py-6 text-center text-sm text-texto-fraco">Sem lembretes hoje</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
