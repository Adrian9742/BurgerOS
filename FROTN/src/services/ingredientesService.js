import api from './api'

export const ingredientesService = {
  async listar() {
    const { data } = await api.get('/api/ingredientes')
    return data
  },

  async listarEstoqueBaixo() {
    const { data } = await api.get('/api/ingredientes/estoque-baixo')
    return data
  },

  async criar(dados) {
    const { data } = await api.post('/api/ingredientes', dados)
    return data
  },

  async atualizar(id, dados) {
    const { data } = await api.put(`/api/ingredientes/${id}`, dados)
    return data
  },

  async remover(id) {
    await api.delete(`/api/ingredientes/${id}`)
  },

  async ajustarEstoque(id, delta) {
    const { data } = await api.patch(`/api/ingredientes/${id}/estoque`, { delta })
    return data
  },

  async listarProdutosCriticos() {
    const { data } = await api.get('/api/ingredientes/produtos-criticos')
    return data
  },

  async getFicha(produtoId) {
    const { data } = await api.get(`/api/ingredientes/ficha/${produtoId}`)
    return data
  },

  async salvarFicha(produtoId, itens) {
    const { data } = await api.put(`/api/ingredientes/ficha/${produtoId}`, itens)
    return data
  },
}
