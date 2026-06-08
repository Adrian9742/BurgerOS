import api from './api.js'

const agendaService = {
  listar: (params = {}) => api.get('/api/agenda', { params }).then(r => r.data),
  criar: (dados) => api.post('/api/agenda', dados).then(r => r.data),
  atualizar: (id, dados) => api.put(`/api/agenda/${id}`, dados).then(r => r.data),
  deletar: (id) => api.delete(`/api/agenda/${id}`),
}

export default agendaService
