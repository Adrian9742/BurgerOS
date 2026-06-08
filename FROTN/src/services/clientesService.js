import api from './api'

export const clientesService = {
  async listar() {
    const { data } = await api.get('/api/clientes')
    return data
  },

  async criar(cliente) {
    const { data } = await api.post('/api/clientes', cliente)
    return data
  },

  async atualizar(id, dados) {
    const { data } = await api.put(`/api/clientes/${id}`, dados)
    return data
  },

  async deletar(id) {
    await api.delete(`/api/clientes/${id}`)
  },

  async historico(id) {
    const { data } = await api.get(`/api/clientes/${id}/historico`)
    return data
  },
}
