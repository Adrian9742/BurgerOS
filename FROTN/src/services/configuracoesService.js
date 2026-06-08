import api from './api.js'

const configuracoesService = {
  getMeta: () => api.get('/api/configuracoes/meta').then(r => r.data),
  setMeta: (valor) => api.put('/api/configuracoes/meta', { valor }).then(r => r.data),
}

export default configuracoesService
