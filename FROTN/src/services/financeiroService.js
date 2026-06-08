import api from './api'

export const financeiroService = {
  async listar(params = {}) {
    const { data } = await api.get('/api/financeiro/lancamentos', { params })
    return data
  },

  async listarHoje() {
    return this.listar()
  },

  async criar(lancamento) {
    const { data } = await api.post('/api/financeiro/lancamentos', lancamento)
    return data
  },
}
