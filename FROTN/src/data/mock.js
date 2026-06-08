// Dados mockados realistas de uma hamburgueria brasileira.
// Futuramente substituídos por chamadas axios com baseURL http://localhost:8000

export const usuarios = [
  { id: 1, nome: "Ricardo Mendes", email: "ricardo@burgerhouse.com.br", usuario: "ricardo", senha: "123456", cargo: "Proprietário" },
  { id: 2, nome: "Juliana Alves", email: "juliana@burgerhouse.com.br", usuario: "caixa", senha: "123456", cargo: "Caixa" },
  { id: 3, nome: "Pedro Santos", email: "pedro@burgerhouse.com.br", usuario: "garcom", senha: "123456", cargo: "Garçom" },
]

export const categorias = [
  "Hambúrgueres",
  "Acompanhamentos",
  "Bebidas s/ álcool",
  "Bebidas c/ álcool",
]

export const produtos = [
  { id: 1, nome: "X-Burger Clássico", descricao: "Pão brioche, hambúrguer 160g, queijo, alface e tomate", categoria: "Hambúrgueres", valor: 28.9, disponivel: true },
  { id: 2, nome: "X-Bacon Duplo", descricao: "Pão brioche, dois hambúrgueres 160g, bacon crocante e cheddar", categoria: "Hambúrgueres", valor: 39.9, disponivel: true },
  { id: 3, nome: "X-Salada Especial", descricao: "Hambúrguer 180g, queijo prato, alface, tomate, cebola roxa e maionese da casa", categoria: "Hambúrgueres", valor: 32.5, disponivel: true },
  { id: 4, nome: "Smash Triplo", descricao: "Três smash burgers 90g, muito cheddar e cebola caramelizada", categoria: "Hambúrgueres", valor: 44.9, disponivel: true },
  { id: 5, nome: "Veggie Burger", descricao: "Hambúrguer de grão-de-bico, queijo vegano e rúcula", categoria: "Hambúrgueres", valor: 30.0, disponivel: false },
  { id: 6, nome: "Batata Frita Rústica", descricao: "Porção 300g com alecrim e parmesão", categoria: "Acompanhamentos", valor: 18.9, disponivel: true },
  { id: 7, nome: "Onion Rings", descricao: "Anéis de cebola empanados, 10 unidades", categoria: "Acompanhamentos", valor: 16.5, disponivel: true },
  { id: 8, nome: "Nuggets da Casa", descricao: "12 unidades com molho barbecue", categoria: "Acompanhamentos", valor: 22.0, disponivel: true },
  { id: 9, nome: "Coca-Cola Lata", descricao: "350ml gelada", categoria: "Bebidas s/ álcool", valor: 6.5, disponivel: true },
  { id: 10, nome: "Guaraná Antarctica", descricao: "350ml gelada", categoria: "Bebidas s/ álcool", valor: 6.0, disponivel: true },
  { id: 11, nome: "Suco de Laranja Natural", descricao: "Copo 500ml", categoria: "Bebidas s/ álcool", valor: 9.9, disponivel: true },
  { id: 12, nome: "Heineken Long Neck", descricao: "330ml", categoria: "Bebidas c/ álcool", valor: 11.9, disponivel: true },
  { id: 13, nome: "Chopp Artesanal IPA", descricao: "Copo 500ml", categoria: "Bebidas c/ álcool", valor: 16.0, disponivel: true },
  { id: 14, nome: "Caipirinha de Limão", descricao: "Cachaça artesanal", categoria: "Bebidas c/ álcool", valor: 18.0, disponivel: true },
]

export const clientes = [
  { id: 1, nome: "Marina Costa", telefone: "(11) 98765-4321", totalGasto: 487.3, ultimoPedido: "2026-06-07" },
  { id: 2, nome: "Carlos Eduardo", telefone: "(11) 99123-4567", totalGasto: 312.5, ultimoPedido: "2026-06-08" },
  { id: 3, nome: "Fernanda Lima", telefone: "(11) 98888-1234", totalGasto: 156.9, ultimoPedido: "2026-06-05" },
  { id: 4, nome: "João Pedro", telefone: "(11) 97777-9876", totalGasto: 689.0, ultimoPedido: "2026-06-08" },
  { id: 5, nome: "Beatriz Souza", telefone: "(11) 96543-2109", totalGasto: 98.4, ultimoPedido: "2026-06-02" },
  { id: 6, nome: "Rafael Oliveira", telefone: "(11) 95432-1098", totalGasto: 274.6, ultimoPedido: "2026-06-06" },
]

export const historicoPedidosCliente = {
  1: [
    { id: 1042, data: "2026-06-07", itens: "X-Bacon Duplo, Batata Frita, Coca-Cola", total: 65.3, status: "entregue" },
    { id: 1021, data: "2026-06-01", itens: "X-Burger Clássico, Guaraná", total: 35.4, status: "entregue" },
    { id: 998, data: "2026-05-28", itens: "Smash Triplo, Onion Rings, Chopp IPA", total: 77.9, status: "entregue" },
  ],
  2: [
    { id: 1050, data: "2026-06-08", itens: "X-Salada Especial, Suco de Laranja", total: 42.4, status: "preparo" },
    { id: 1010, data: "2026-05-30", itens: "X-Burger Clássico", total: 28.9, status: "entregue" },
  ],
  4: [
    { id: 1051, data: "2026-06-08", itens: "Smash Triplo, Batata Frita, Heineken x2", total: 87.7, status: "preparo" },
    { id: 1033, data: "2026-06-04", itens: "X-Bacon Duplo, Nuggets, Coca-Cola", total: 68.4, status: "entregue" },
  ],
}

// Status: aguardando, preparo, pronto, entregue, cancelado
export const pedidosIniciais = [
  { id: 1051, cliente: "João Pedro", mesa: null, itens: ["1x Smash Triplo", "1x Batata Frita", "2x Heineken"], total: 87.7, status: "aguardando", abertoEm: Date.now() - 1000 * 60 * 3 },
  { id: 1052, cliente: null, mesa: "Mesa 4", itens: ["2x X-Burger Clássico", "2x Coca-Cola"], total: 70.8, status: "aguardando", abertoEm: Date.now() - 1000 * 60 * 6 },
  { id: 1050, cliente: "Carlos Eduardo", mesa: null, itens: ["1x X-Salada Especial", "1x Suco de Laranja"], total: 42.4, status: "preparo", abertoEm: Date.now() - 1000 * 60 * 12 },
  { id: 1049, cliente: null, mesa: "Mesa 7", itens: ["1x X-Bacon Duplo", "1x Onion Rings"], total: 56.4, status: "preparo", abertoEm: Date.now() - 1000 * 60 * 18 },
  { id: 1048, cliente: "Marina Costa", mesa: null, itens: ["1x Veggie Burger", "1x Batata Frita"], total: 48.9, status: "pronto", abertoEm: Date.now() - 1000 * 60 * 9 },
  { id: 1047, cliente: null, mesa: "Mesa 2", itens: ["3x X-Burger Clássico", "3x Guaraná"], total: 103.5, status: "pronto", abertoEm: Date.now() - 1000 * 60 * 14 },
  { id: 1046, cliente: "Fernanda Lima", mesa: null, itens: ["1x Smash Triplo", "1x Caipirinha"], total: 62.9, status: "entregue", abertoEm: Date.now() - 1000 * 60 * 35 },
]

export const lancamentosIniciais = [
  { id: 1, hora: "08:30", descricao: "Abertura de caixa", tipo: "entrada", valor: 200.0 },
  { id: 2, hora: "11:15", descricao: "Pedido #1042", tipo: "entrada", valor: 65.3 },
  { id: 3, hora: "11:40", descricao: "Compra de gelo", tipo: "saida", valor: 35.0 },
  { id: 4, hora: "12:20", descricao: "Pedido #1046", tipo: "entrada", valor: 62.9 },
  { id: 5, hora: "13:05", descricao: "Pedido #1047", tipo: "entrada", valor: 103.5 },
  { id: 6, hora: "13:30", descricao: "Pagamento entregador", tipo: "saida", valor: 50.0 },
  { id: 7, hora: "14:10", descricao: "Pedido #1048", tipo: "entrada", valor: 48.9 },
]

export const vendasSemana = [
  { dia: "Seg", vendas: 1240, meta: 1500 },
  { dia: "Ter", vendas: 1680, meta: 1500 },
  { dia: "Qua", vendas: 1420, meta: 1500 },
  { dia: "Qui", vendas: 1980, meta: 1500 },
  { dia: "Sex", vendas: 2840, meta: 1500 },
  { dia: "Sáb", vendas: 3560, meta: 1500 },
  { dia: "Dom", vendas: 2310, meta: 1500 },
]

export const lembretesIniciais = [
  { id: 1, texto: "Repor estoque de pão brioche até quinta", feito: false },
  { id: 2, texto: "Confirmar fornecedor de bacon", feito: true },
  { id: 3, texto: "Treinar novo garçom no sistema", feito: false },
]
