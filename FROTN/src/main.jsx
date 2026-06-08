import React from "react"
import ReactDOM from "react-dom/client"
import { HashRouter } from "react-router-dom"
import App from "./App.jsx"
import { ToastProvider } from "./context/ToastContext.jsx"
import { AuthProvider } from "./context/AuthContext.jsx"
import { PedidosProvider } from "./context/PedidosContext.jsx"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <PedidosProvider>
            <App />
          </PedidosProvider>
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  </React.StrictMode>,
)
