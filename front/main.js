const { app, BrowserWindow, ipcMain, Notification, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const isWin = process.platform === "win32";
const pythonCmd = isWin ? 'python' : 'python3';

function createWindow() {
  const win = new BrowserWindow({
    width: 1000, height: 800,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  win.loadFile('index.html');
  win.webContents.openDevTools();
}

ipcMain.on('upload-file', (event, filePath) => {
  const scriptPath = path.join(__dirname, '../backend/engine.py');
  
  console.log("--- DEBUG INFO ---");
  console.log("Comando Python:", pythonCmd);
  console.log("Ruta Script:", scriptPath);
  console.log("Archivo a procesar:", filePath);

  const python = spawn(pythonCmd, [scriptPath, filePath]);

  // 1. Capturar la salida normal
  python.stdout.on('data', (data) => {
    const rawData = data.toString();
    console.log("Python stdout:", rawData);
    try {
      event.reply('python-output', JSON.parse(rawData));
    } catch (e) {
      console.error("Error parseando JSON de Python:", e);
    }
  });

  // 2. CAPTURAR ERRORES DE PYTHON (Crucial)
  python.stderr.on('data', (data) => {
    console.error(`PYTHON ERROR: ${data.toString()}`);
  });

  // 3. Ver si el proceso directamente no puede arrancar
  python.on('error', (err) => {
    console.error('Fallo al iniciar el proceso de Python:', err);
  });

  // 4. Ver cómo termina el proceso
  python.on('close', (code) => {
    console.log(`Proceso de Python finalizado con código: ${code}`);
  });
});

ipcMain.on('save-to-db', (event, datos) => {
  // Ejecutamos un script de Python (o el mismo engine.py con otra bandera)
  // que tome este JSON y haga: INSERT INTO movimientos VALUES (...)
  const python = spawn(pythonCmd, [path.join(__dirname, '../backend/save_db.py'), JSON.stringify(datos)]);
  
  python.on('close', () => {
    console.log("Base de datos actualizada.");
  });
});

ipcMain.handle('open-file-dialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Reportes BROU', extensions: ['xlsx', 'xls', 'csv'] }
    ]
  });

  if (canceled) return null;
  return filePaths[0]; // Retorna la ruta del archivo seleccionado
});

app.whenReady().then(createWindow);