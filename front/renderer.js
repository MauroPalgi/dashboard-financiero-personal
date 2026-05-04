const dropZone = document.getElementById('drop-zone');

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  // Enviamos la ruta del archivo al proceso principal de Electron
  window.electronAPI.uploadFile(file.path);
});

dropZone.addEventListener('dragover', (e) => e.preventDefault());