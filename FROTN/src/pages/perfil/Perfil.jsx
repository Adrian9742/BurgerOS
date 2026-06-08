import { useState } from "react"
import { Save } from "lucide-react"
import { useAuth } from "../../context/AuthContext.jsx"
import { useToast } from "../../context/ToastContext.jsx"
import { Campo, Botao } from "../../components/Form.jsx"
import { usuariosService } from "../../services/usuariosService.js"

function iniciais(nome = "") {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase()
}

export default function Perfil() {
  const { usuario, atualizarPerfil } = useAuth()
  const { mostrar } = useToast()

  const [nome, setNome] = useState(usuario?.nome || "")
  const [email, setEmail] = useState(usuario?.email || "")
  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [salvando, setSalvando] = useState(false)

  const salvar = async (e) => {
    e.preventDefault()
    if (novaSenha && !senhaAtual) return mostrar("Informe a senha atual", "erro")

    setSalvando(true)
    try {
      const atualizado = await usuariosService.atualizarPerfil({ nome, email })
      atualizarPerfil({ nome: atualizado.nome, email: atualizado.email })

      if (novaSenha) {
        await usuariosService.alterarSenha({ senha_atual: senhaAtual, nova_senha: novaSenha })
        setSenhaAtual("")
        setNovaSenha("")
      }

      mostrar("Perfil atualizado com sucesso", "sucesso")
    } catch (err) {
      mostrar(err.response?.data?.detail || "Erro ao salvar", "erro")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-5 rounded-xl border border-borda bg-card p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-laranja text-2xl font-black text-fundo">
          {iniciais(nome)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-texto">{nome}</h2>
          <span className="mt-1 inline-flex rounded-full bg-laranja/15 px-3 py-1 text-xs font-semibold text-laranja">
            {usuario?.cargo}
          </span>
        </div>
      </div>

      <form onSubmit={salvar} className="space-y-6">
        <div className="rounded-xl border border-borda bg-card p-6">
          <h3 className="mb-4 text-base font-bold text-texto">Dados pessoais</h3>
          <div className="space-y-4">
            <Campo rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            <Campo rotulo="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div>
              <span className="mb-1.5 block text-sm font-medium text-texto-suave">Cargo</span>
              <div className="rounded-lg border border-borda bg-fundo/60 px-3 py-2.5 text-sm text-texto-fraco">
                {usuario?.cargo} (não editável)
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-borda bg-card p-6">
          <h3 className="mb-1 text-base font-bold text-texto">Alterar senha</h3>
          <p className="mb-4 text-sm text-texto-suave">Deixe em branco para manter a senha atual.</p>
          <div className="grid grid-cols-2 gap-4">
            <Campo
              rotulo="Senha atual"
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              placeholder="••••••"
            />
            <Campo
              rotulo="Nova senha"
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="••••••"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Botao type="submit" disabled={salvando}>
            <span className="flex items-center gap-1.5">
              <Save className="h-4 w-4" />
              {salvando ? "Salvando..." : "Salvar alterações"}
            </span>
          </Botao>
        </div>
      </form>
    </div>
  )
}
