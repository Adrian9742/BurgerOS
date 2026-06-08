import api from './api'

const TOKEN_KEY = 'burgeros_token'

export const authService = {
  async login(usuario, senha) {
    const { data } = await api.post('/api/auth/login', { usuario, senha })
    setToken(data.access_token)
    return data.usuario
  },

  async logout() {
    try {
      await api.post('/api/auth/logout')
    } finally {
      removeToken()
    }
  },

  async getMe() {
    const { data } = await api.get('/api/auth/me')
    return data
  },
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}
