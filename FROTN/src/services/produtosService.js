import api from './api'

export const produtosService = {
  async listar() {
    const { data } = await api.get('/api/produtos')
    return data
  },

  async criar(produto) {
    const { data } = await api.post('/api/produtos', produto)
    return data
  },

  async atualizar(id, produto) {
    const { data } = await api.put(`/api/produtos/${id}`, produto)
    return data
  },

  async remover(id) {
    await api.delete(`/api/produtos/${id}`)
  },

  async alternarDisponivel(id) {
    const { data } = await api.patch(`/api/produtos/${id}/disponivel`)
    return data
  },
}
