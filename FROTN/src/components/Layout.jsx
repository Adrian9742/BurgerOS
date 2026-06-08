import { Outlet, useLocation } from "react-router-dom"
import Sidebar from "./Sidebar.jsx"
import Header from "./Header.jsx"

const titulos = {
  "/": { titulo: "Dashboard", subtitulo: "Visão geral do seu negócio" },
  "/pedidos": { titulo: "Fila de Pedidos", subtitulo: "Acompanhe os pedidos em tempo real" },
  "/pedidos/novo": { titulo: "Novo Pedido", subtitulo: "Monte o pedido do cliente" },
  "/cardapio": { titulo: "Cardápio", subtitulo: "Gerencie os produtos da casa" },
  "/financeiro": { titulo: "Financeiro", subtitulo: "Caixa do dia" },
  "/clientes": { titulo: "Clientes", subtitulo: "Base de clientes cadastrados" },
  "/agenda": { titulo: "Agenda", subtitulo: "Compromissos e reservas" },
  "/perfil": { titulo: "Meu Perfil", subtitulo: "Dados da sua conta" },
}

export default function Layout() {
  const { pathname } = useLocation()
  const info = titulos[pathname] || { titulo: "BurgerOS", subtitulo: "" }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-fundo">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header titulo={info.titulo} subtitulo={info.subtitulo} />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="min-w-[960px] p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
