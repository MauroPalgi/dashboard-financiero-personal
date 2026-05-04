const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000, height: 800,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  win.loadFile('frontend/index.html');
}

// Escuchar cuando el usuario suelta un archivo en el Front
ipcMain.on('upload-file', (event, filePath) => {
  // Ejecutar Python (ajusta 'python3' para Linux o 'python' para Windows)
  const python = spawn('python3', [path.join(__dirname, '../backend/engine.py'), filePath]);
  
  python.stdout.on('data', (data) => {
    event.reply('python-output', JSON.parse(data.toString()));
  });
});

app.whenReady().then(createWindow);