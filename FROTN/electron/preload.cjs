const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("burgeros", {
  backup: {
    executar: () => ipcRenderer.invoke("backup:executar"),
    listar: () => ipcRenderer.invoke("backup:listar"),
  },
})
