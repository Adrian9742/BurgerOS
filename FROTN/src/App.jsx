import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext.jsx"
import Layout from "./components/Layout.jsx"
import Login from "./pages/auth/Login.jsx"
import Dashboard from "./pages/dashboard/Dashboard.jsx"
import FilaPedidos from "./pages/pedidos/FilaPedidos.jsx"
import NovoPedido from "./pages/pedidos/NovoPedido.jsx"
import Cardapio from "./pages/cardapio/Cardapio.jsx"
import Caixa from "./pages/financeiro/Caixa.jsx"
import Clientes from "./pages/clientes/Clientes.jsx"
import Agenda from "./pages/agenda/Agenda.jsx"
import Perfil from "./pages/perfil/Perfil.jsx"
import Sistema from "./pages/sistema/Sistema.jsx"
import Turno from "./pages/turno/Turno.jsx"
import Mesas from "./pages/mesas/Mesas.jsx"
import Cozinha from "./pages/cozinha/Cozinha.jsx"
import Ingredientes from "./pages/ingredientes/Ingredientes.jsx"

function RotaProtegida({ children }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { usuario } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <RotaProtegida>
            <Layout />
          </RotaProtegida>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/pedidos" element={<FilaPedidos />} />
        <Route path="/pedidos/novo" element={<NovoPedido />} />
        <Route path="/cardapio" element={<Cardapio />} />
        <Route path="/financeiro" element={<Caixa />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/sistema" element={<Sistema />} />
        <Route path="/turno" element={<Turno />} />
        <Route path="/mesas" element={<Mesas />} />
        <Route path="/cozinha" element={<Cozinha />} />
        <Route path="/ingredientes" element={<Ingredientes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
