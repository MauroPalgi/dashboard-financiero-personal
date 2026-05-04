const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Función para enviar la ruta del Excel al proceso principal
  uploadFile: (filePath) => {
    ipcRenderer.send('upload-file', filePath)
  },
  saveToDatabase: (datos) => ipcRenderer.send('save-to-db', datos),
  // Función para recibir la respuesta de Python (ej: estadísticas)
  onPythonOutput: (callback) => ipcRenderer.on('python-output', (event, data) => callback(data)),
  // Esta es la función que te está dando el error:
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
});