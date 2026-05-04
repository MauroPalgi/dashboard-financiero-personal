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
  win.webContents.on('did-finish-load', () => {
    console.log("Ventana cargada. Pidiendo datos iniciales...");
    
    // Un pequeño delay de 500ms ayuda a que el bridge de Preload esté 100% listo
    setTimeout(() => {
        const pythonGet = spawn(pythonCmd, [path.join(__dirname, '../backend/get_total_data.py')]);

        pythonGet.stdout.on('data', (data) => {
            try {
                const response = JSON.parse(data.toString());
                if (response.status === "ok") {
                    // Enviamos los datos al canal que ya configuramos
                    win.webContents.send('update-graph-total', response.datos);
                    console.log(`Enviados ${response.datos.length} registros iniciales.`);
                }
            } catch (e) {
                console.error("Error al parsear datos iniciales:", e);
            }
        });

        pythonGet.stderr.on('data', (data) => {
            console.error("Error en Python (Init):", data.toString());
        });
    }, 500); 
});
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

ipcMain.on('save-to-db', (event, datos) => {
  const pythonSave = spawn(pythonCmd, [path.join(__dirname, '../backend/save_db.py'), JSON.stringify(datos)]);

  pythonSave.on('close', () => {
      // Una vez guardado, pedimos el TOTAL de la base de datos
      const pythonGet = spawn(pythonCmd, [path.join(__dirname, '../backend/get_total_data.py')]);
      
      pythonGet.stdout.on('data', (data) => {
          const response = JSON.parse(data.toString());
          // Enviamos el TOTAL al renderer para que refresque el gráfico
          event.reply('update-graph-total', response.datos);
      });
  });
});



app.whenReady().then(createWindow);