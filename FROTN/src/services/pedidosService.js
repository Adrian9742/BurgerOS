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

  async mudarStatus(id, status, forma_pagamento = null) {
    const body = { status }
    if (forma_pagamento) body.forma_pagamento = forma_pagamento
    const { data } = await api.patch(`/api/pedidos/${id}/status`, body)
    return data
  },

  async buscar(id) {
    const { data } = await api.get(`/api/pedidos/${id}`)
    return data
  },
}
