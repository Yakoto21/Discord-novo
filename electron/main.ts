import { app, BrowserWindow, ipcMain, shell, session, Menu, Tray, nativeImage, dialog } from 'electron';
import path from 'path';
import http from 'http';

let mainWindow: BrowserWindow | null = null;
let appTray: Tray | null = null;

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
const PORT = process.env.PORT || 3000;

// Garante que apenas uma instância do app execute por vez no Windows
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    // Inicia o backend embutido se necessário
    if (!isDev) {
      try {
        // Testa se o servidor local já está ativo
        const checkServer = () => {
          return new Promise((resolve) => {
            const req = http.get(`http://localhost:${PORT}/api/health`, (res) => {
              resolve(res.statusCode === 200);
            });
            req.on('error', () => resolve(false));
            req.setTimeout(500, () => {
              req.destroy();
              resolve(false);
            });
          });
        };

        const isRunning = await checkServer();
        if (!isRunning) {
          // Importa e inicia o servidor internamente sem qualquer janela de prompt
          try {
            require(path.join(__dirname, '../dist/server.cjs'));
          } catch (serverErr) {
            console.log('Servidor inicializado em modo standalone:', serverErr);
          }
        }
      } catch (err) {
        console.error('Inicializacao de backend:', err);
      }
    }

    // Configura permissões de hardware para WebRTC (Microfone, Câmera, Compartilhamento de Tela)
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      const allowedPermissions = [
        'media',
        'mediaKeySystem',
        'geolocation',
        'notifications',
        'midi',
        'display-capture',
      ];
      if (allowedPermissions.includes(permission)) {
        callback(true);
      } else {
        callback(false);
      }
    });

    createMainWindow();
  });
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 860,
    minWidth: 960,
    minHeight: 600,
    frame: false, // Frameless para a barra de título personalizada Windows Discord
    titleBarStyle: 'hidden',
    backgroundColor: '#04060c',
    title: 'Discord Quantum',
    icon: path.join(__dirname, '../public/icon.svg'),
    show: false, // Exibe apenas após carregar para evitar flash branco
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    },
  });

  // Mostra a janela suavemente quando pronta
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Carrega a URL de desenvolvimento ou o servidor local
  if (isDev) {
    mainWindow.loadURL(`http://localhost:${PORT}`);
  } else {
    mainWindow.loadURL(`http://localhost:${PORT}`).catch(() => {
      if (mainWindow) {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
      }
    });
  }

  // Intercepta links externos para abrir no navegador padrão do Windows (Edge/Chrome/Firefox)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // IPC: Controles da Janela Windows (Minimizar, Maximizar/Restaurar, Fechar)
  ipcMain.on('window-minimize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize();
    }
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window-close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
  });

  ipcMain.handle('window-is-maximized', () => {
    return mainWindow && !mainWindow.isDestroyed() ? mainWindow.isMaximized() : false;
  });

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  ipcMain.on('open-external', (_event, url: string) => {
    if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Fechar todas as janelas encerra o app no Windows
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
