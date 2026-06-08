import api from './api'

export const turnosService = {
  async atual() {
    const { data } = await api.get('/api/turnos/atual')
    return data
  },

  async listar() {
    const { data } = await api.get('/api/turnos')
    return data
  },

  async abrir(observacao = null) {
    const { data } = await api.post('/api/turnos', { observacao })
    return data
  },

  async fechar(id, observacao = null) {
    const { data } = await api.patch(`/api/turnos/${id}/fechar`, { observacao })
    return data
  },
}
