const R = (v) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`

const linha = (esq, dir, total = 32) => {
  const esq2 = String(esq)
  const dir2 = String(dir)
  const espacos = Math.max(1, total - esq2.length - dir2.length)
  return esq2 + " ".repeat(espacos) + dir2
}

export function gerarHtmlNotinha(pedido) {
  const agora = new Date()
  const dataStr = agora.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  const horaStr = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  const divisor = "─".repeat(32)

  const linhasItens = pedido.itens.map((item) => {
    const label = `${item.quantidade}x ${item.nome}`
    const truncated = label.length > 20 ? label.slice(0, 19) + "…" : label
    return linha(truncated, R(item.subtotal))
  }).join("\n")

  const obsLinhas = pedido.itens
    .filter((i) => i.observacao)
    .map((i) => `  ↳ ${i.nome}: ${i.observacao}`)
    .join("\n")

  const identificacao = pedido.cliente
    ? `Cliente: ${pedido.cliente}`
    : `Mesa: ${pedido.mesa || "—"}`

  const labelPagamento = {
    dinheiro: "Dinheiro",
    cartao: "Cartão",
    pix: "PIX",
    fiado: "Fiado",
  }
  const linhaPagamento = pedido.forma_pagamento
    ? `${linha("Pagamento", labelPagamento[pedido.forma_pagamento] ?? pedido.forma_pagamento)}\n`
    : ""

  const texto = `
        B U R G E R O S
     Sistema de Gestão
${divisor}
${dataStr}  ${horaStr}
Pedido #${pedido.id}
${identificacao}
${divisor}
ITENS
${divisor}
${linhasItens}
${obsLinhas ? obsLinhas + "\n" : ""}${divisor}
${linha("TOTAL", R(pedido.total))}
${linhaPagamento}${divisor}
  Obrigado pela preferência!
   Volte sempre! 🍔
${divisor}`.trim()

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Notinha #${pedido.id}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Courier New", Courier, monospace;
    font-size: 12px;
    line-height: 1.5;
    background: #fff;
    color: #000;
    padding: 8px;
    width: 80mm;
  }
  pre {
    white-space: pre-wrap;
    word-break: break-all;
  }
  @media print {
    @page { margin: 4mm; size: 80mm auto; }
    body { width: 100%; padding: 0; }
  }
</style>
</head>
<body>
<pre>${texto}</pre>
<script>
  window.onload = function() {
    window.print();
    setTimeout(() => window.close(), 500);
  };
</script>
</body>
</html>`
}

export async function imprimirNotinha(pedido) {
  const html = gerarHtmlNotinha(pedido)
  const janela = window.open("", "_blank", "width=400,height=600,scrollbars=yes")
  if (!janela) {
    alert("Permita pop-ups para imprimir a notinha.")
    return
  }
  janela.document.write(html)
  janela.document.close()
}
