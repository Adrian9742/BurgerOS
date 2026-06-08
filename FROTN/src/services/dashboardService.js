import api from './api'

export const dashboardService = {
  async getMetricas() {
    const { data } = await api.get('/api/dashboard')
    return data
  },

  async topProdutos() {
    const { data } = await api.get('/api/dashboard/top-produtos')
    return data
  },
}
