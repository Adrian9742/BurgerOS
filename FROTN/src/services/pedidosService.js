import api from './api'

export const pedidosService = {
  async listar() {
    const { data } = await api.get('/api/pedidos')
    return data
  },

  async criar(dados) {
    const { data } = await api.post('/api/pedidos', dados)
    return data
  },

  async mudarStatus(id, status) {
    const { data } = await api.patch(`/api/pedidos/${id}/status`, { status })
    return data
  },

  async buscar(id) {
    const { data } = await api.get(`/api/pedidos/${id}`)
    return data
  },
}
