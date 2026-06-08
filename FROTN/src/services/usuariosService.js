import api from './api'

export const usuariosService = {
  async atualizarPerfil(dados) {
    const { data } = await api.put('/api/usuarios/me', dados)
    return data
  },

  async alterarSenha(dados) {
    await api.patch('/api/usuarios/me/senha', dados)
  },
}
