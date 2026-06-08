import { useState, useEffect, useCallback } from "react"
import { Plus, ArrowUpCircle, ArrowDownCircle, Wallet, CalendarDays, Download, Trash2, Banknote, CreditCard, QrCode, HandCoins } from "lucide-react"
import Modal from "../../components/Modal.jsx"
import LoadingSpinner from "../../components/LoadingSpinner.jsx"
import { Campo, Botao } from "../../components/Form.jsx"
import { useToast } from "../../context/ToastContext.jsx"
import { formatarMoeda } from "../../utils/format.js"
import { financeiroService } from "../../services/financeiroService.js"

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

function semanaISO() {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1))
  return d.toISOString().slice(0, 10)
}

function mesISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
}

const ATALHOS = [
  { label: "Hoje", inicio: hojeISO, fim: hojeISO },
  { label: "Esta semana", inicio: semanaISO, fim: hojeISO },
  { label: "Este mês", inicio: mesISO, fim: hojeISO },
]

export default function Caixa() {
  const { mostrar } = useToast()
  const [lancamentos, setLancamentos] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({ tipo: "entrada", valor: "", descricao: "" })
  const [salvando, setSalvando] = useState(false)
  const [dataInicio, setDataInicio] = useState(hojeISO)
  const [dataFim, setDataFim] = useState(hojeISO)

  const carregar = useCallback(async () => {
    try {
      const params = { data_inicio: dataInicio, data_fim: dataFim }
      const [lancs, pags] = await Promise.all([
        financeiroService.listar(params),
        financeiroService.pagamentos(params),
      ])
      setLancamentos(lancs)
      setPagamentos(pags)
    } catch {
      mostrar("Erro ao carregar lançamentos", "erro")
    } finally {
      setCarregando(false)
    }
  }, [mostrar, dataInicio, dataFim])

  useEffect(() => {
    setCarregando(true)
    carregar()
  }, [carregar])

  useEffect(() => {
    const intervalo = setInterval(carregar, 15000)
    return () => clearInterval(intervalo)
  }, [carregar])

  const totalEntradas = lancamentos.filter((l) => l.tipo === "entrada").reduce((s, l) => s + l.valor, 0)
  const totalSaidas = lancamentos.filter((l) => l.tipo === "saida").reduce((s, l) => s + l.valor, 0)
  const saldo = totalEntradas - totalSaidas

  const aplicarAtalho = (atalho) => {
    setDataInicio(atalho.inicio())
    setDataFim(atalho.fim())
  }

  const atalhoAtivo = ATALHOS.find(
    (a) => a.inicio() === dataInicio && a.fim() === dataFim
  )?.label ?? null

  const exportarCSV = () => {
    const cab = ["Data", "Hora", "Tipo", "Descrição", "Valor"].join(",")
    const linhas = lancamentos.map((l) => [
      l.data,
      l.hora,
      l.tipo === "entrada" ? "Entrada" : "Saída",
      `"${String(l.descricao).replace(/"/g, '""')}"`,
      l.tipo === "entrada" ? l.valor.toFixed(2) : `-${l.valor.toFixed(2)}`,
    ].join(","))
    const rodape = [
      "",
      `,,,"Total Entradas",${totalEntradas.toFixed(2)}`,
      `,,,"Total Saídas",${totalSaidas.toFixed(2)}`,
      `,,,"Saldo",${saldo.toFixed(2)}`,
    ]
    const csv = [cab, ...linhas, ...rodape].join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `burgeros-${dataInicio}-a-${dataFim}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const deletarLancamento = async (id) => {
    if (!confirm("Excluir este lançamento?")) return
    try {
      await financeiroService.deletar(id)
      setLancamentos((ls) => ls.filter((l) => l.id !== id))
      mostrar("Lançamento removido", "sucesso")
    } catch {
      mostrar("Erro ao excluir lançamento", "erro")
    }
  }

  const salvar = async (e) => {
    e.preventDefault()
    const valorNum = Number.parseFloat(form.valor)
    if (Number.isNaN(valorNum) || valorNum <= 0) return mostrar("Valor deve ser maior que zero", "erro")
    if (!form.descricao.trim()) return mostrar("Preencha a descrição", "erro")

    if (form.tipo === "saida" && valorNum > saldo) {
      return mostrar(`Saldo insuficiente — disponível: ${formatarMoeda(saldo)}`, "erro")
    }

    setSalvando(true)
    try {
      const novo = await financeiroService.criar({ ...form, valor: valorNum })
      setLancamentos((ls) => [novo, ...ls])
      mostrar("Lançamento registrado", "sucesso")
      setForm({ tipo: "entrada", valor: "", descricao: "" })
      setModalAberto(false)
    } catch {
      mostrar("Erro ao registrar lançamento", "erro")
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <LoadingSpinner texto="Carregando caixa..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-borda bg-card p-6">
        <div className="flex items-center gap-4">
          <span className={`flex h-14 w-14 items-center justify-center rounded-xl ${saldo >= 0 ? "bg-positivo/15 text-positivo" : "bg-negativo/15 text-negativo"}`}>
            <Wallet className="h-7 w-7" />
          </span>
          <div>
            <p className="text-sm text-texto-suave">Saldo do período</p>
            <p className={`text-3xl font-black ${saldo >= 0 ? "text-positivo" : "text-negativo"}`}>
              {formatarMoeda(saldo)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportarCSV}
            disabled={lancamentos.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-borda px-4 py-2 text-sm font-semibold text-texto-suave transition-colors hover:border-laranja/50 hover:text-laranja disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
          <Botao onClick={() => setModalAberto(true)}>
            <span className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Novo Lançamento
            </span>
          </Botao>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-borda bg-card px-5 py-4">
        <CalendarDays className="h-4 w-4 text-texto-fraco" />
        <div className="flex items-center gap-1.5">
          {ATALHOS.map((a) => (
            <button
              key={a.label}
              onClick={() => aplicarAtalho(a)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                atalhoAtivo === a.label
                  ? "bg-laranja/10 text-laranja"
                  : "border border-borda text-texto-suave hover:border-laranja/40 hover:text-texto"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-texto-fraco">|</span>
        <input
          type="date"
          value={dataInicio}
          max={dataFim}
          onChange={(e) => setDataInicio(e.target.value)}
          className="rounded-lg border border-borda bg-fundo px-3 py-1.5 text-sm text-texto focus:border-laranja focus:outline-none"
        />
        <span className="text-texto-fraco text-sm">até</span>
        <input
          type="date"
          value={dataFim}
          min={dataInicio}
          onChange={(e) => setDataFim(e.target.value)}
          className="rounded-lg border border-borda bg-fundo px-3 py-1.5 text-sm text-texto focus:border-laranja focus:outline-none"
        />
      </div>

      {pagamentos.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {pagamentos.map((p) => {
            const icons = { dinheiro: Banknote, cartao: CreditCard, pix: QrCode, fiado: HandCoins }
            const Icone = icons[p.forma] || Wallet
            return (
              <div key={p.forma} className="flex items-center gap-3 rounded-xl border border-borda bg-card p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-laranja/15 text-laranja">
                  <Icone className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-texto-fraco">{p.label}</p>
                  <p className="truncate text-sm font-bold text-texto">{formatarMoeda(p.total)}</p>
                  <p className="text-xs text-texto-fraco">{p.pedidos} pedido{p.pedidos > 1 ? "s" : ""}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="rounded-xl border border-borda bg-card p-5">
          <div className="flex items-center gap-2 text-positivo">
            <ArrowUpCircle className="h-5 w-5" />
            <span className="text-sm font-semibold">Total entradas</span>
          </div>
          <p className="mt-3 text-2xl font-black text-texto">{formatarMoeda(totalEntradas)}</p>
        </div>
        <div className="rounded-xl border border-borda bg-card p-5">
          <div className="flex items-center gap-2 text-negativo">
            <ArrowDownCircle className="h-5 w-5" />
            <span className="text-sm font-semibold">Total saídas</span>
          </div>
          <p className="mt-3 text-2xl font-black text-texto">{formatarMoeda(totalSaidas)}</p>
        </div>
        <div className="rounded-xl border border-borda bg-card p-5">
          <div className="flex items-center gap-2 text-texto-suave">
            <Wallet className="h-5 w-5" />
            <span className="text-sm font-semibold">Saldo</span>
          </div>
          <p className={`mt-3 text-2xl font-black ${saldo >= 0 ? "text-positivo" : "text-negativo"}`}>
            {formatarMoeda(saldo)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-borda bg-card">
        <div className="border-b border-borda px-5 py-4">
          <h2 className="text-base font-bold text-texto">
            {atalhoAtivo === "Hoje" ? "Lançamentos de hoje" : `Lançamentos — ${dataInicio} a ${dataFim}`}
          </h2>
        </div>
        <ul>
          {lancamentos.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-texto-fraco">Nenhum lançamento no período</li>
          )}
          {lancamentos.map((l) => (
            <li key={l.id} className="group flex items-center gap-4 border-b border-borda px-5 py-3.5 last:border-0 hover:bg-card-hover">
              <span className="w-20 text-xs font-medium text-texto-fraco">
                {l.data !== hojeISO() ? l.data.slice(5).replace("-", "/") + " " : ""}{l.hora}
              </span>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${l.tipo === "entrada" ? "bg-positivo/15 text-positivo" : "bg-negativo/15 text-negativo"}`}>
                {l.tipo === "entrada" ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
              </span>
              <span className="flex-1 text-sm text-texto">{l.descricao}</span>
              <span className={`text-sm font-bold ${l.tipo === "entrada" ? "text-positivo" : "text-negativo"}`}>
                {l.tipo === "entrada" ? "+" : "−"} {formatarMoeda(l.valor)}
              </span>
              <button
                onClick={() => deletarLancamento(l.id)}
                className="opacity-0 transition-opacity group-hover:opacity-100 rounded-lg p-1.5 text-texto-fraco hover:bg-fundo hover:text-status-cancelado"
                title="Excluir lançamento"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Modal aberto={modalAberto} aoFechar={() => setModalAberto(false)} titulo="Novo Lançamento">
        <form onSubmit={salvar} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { chave: "entrada", rotulo: "Entrada" },
              { chave: "saida", rotulo: "Saída" },
            ].map(({ chave, rotulo }) => (
              <button
                key={chave}
                type="button"
                onClick={() => setForm({ ...form, tipo: chave })}
                className={`rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                  form.tipo === chave
                    ? chave === "entrada"
                      ? "border-positivo bg-positivo/10 text-positivo"
                      : "border-negativo bg-negativo/10 text-negativo"
                    : "border-borda bg-fundo text-texto-suave hover:text-texto"
                }`}
              >
                {rotulo}
              </button>
            ))}
          </div>

          {form.tipo === "saida" && saldo > 0 && (
            <p className="rounded-lg border border-borda bg-fundo px-3 py-2 text-xs text-texto-fraco">
              Saldo disponível: <span className="font-bold text-positivo">{formatarMoeda(saldo)}</span>
            </p>
          )}
          {form.tipo === "saida" && saldo <= 0 && (
            <p className="rounded-lg border border-status-cancelado/30 bg-status-cancelado/5 px-3 py-2 text-xs text-status-cancelado">
              Caixa sem saldo disponível para registrar saída.
            </p>
          )}

          <Campo
            rotulo="Valor (R$)"
            type="number"
            step="0.01"
            min="0.01"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
            placeholder="0,00"
          />
          <Campo
            rotulo="Descrição"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Ex: Compra de insumos, abertura de caixa..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <Botao type="button" variante="secundario" onClick={() => setModalAberto(false)}>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={salvando || (form.tipo === "saida" && saldo <= 0)}>
              {salvando ? "Registrando..." : "Registrar"}
            </Botao>
          </div>
        </form>
      </Modal>
    </div>
  )
}
