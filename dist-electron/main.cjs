var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron = require("electron");
var import_path = __toESM(require("path"), 1);
var import_http = __toESM(require("http"), 1);
var mainWindow = null;
var isDev = process.env.NODE_ENV !== "production" && !import_electron.app.isPackaged;
var PORT = process.env.PORT || 3e3;
var gotTheLock = import_electron.app.requestSingleInstanceLock();
if (!gotTheLock) {
  import_electron.app.quit();
} else {
  import_electron.app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  import_electron.app.whenReady().then(async () => {
    if (!isDev) {
      try {
        const checkServer = () => {
          return new Promise((resolve) => {
            const req = import_http.default.get(`http://localhost:${PORT}/api/health`, (res) => {
              resolve(res.statusCode === 200);
            });
            req.on("error", () => resolve(false));
            req.setTimeout(500, () => {
              req.destroy();
              resolve(false);
            });
          });
        };
        const isRunning = await checkServer();
        if (!isRunning) {
          try {
            require(import_path.default.join(__dirname, "../dist/server.cjs"));
          } catch (serverErr) {
            console.log("Servidor inicializado em modo standalone:", serverErr);
          }
        }
      } catch (err) {
        console.error("Inicializacao de backend:", err);
      }
    }
    import_electron.session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      const allowedPermissions = [
        "media",
        "mediaKeySystem",
        "geolocation",
        "notifications",
        "midi",
        "display-capture"
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
function createMainWindow() {
  mainWindow = new import_electron.BrowserWindow({
    width: 1400,
    height: 860,
    minWidth: 960,
    minHeight: 600,
    frame: false,
    // Frameless para a barra de título personalizada Windows Discord
    titleBarStyle: "hidden",
    backgroundColor: "#04060c",
    title: "Discord Quantum",
    icon: import_path.default.join(__dirname, "../public/icon.svg"),
    show: false,
    // Exibe apenas após carregar para evitar flash branco
    webPreferences: {
      preload: import_path.default.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true
    }
  });
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  if (isDev) {
    mainWindow.loadURL(`http://localhost:${PORT}`);
  } else {
    mainWindow.loadURL(`http://localhost:${PORT}`).catch(() => {
      if (mainWindow) {
        mainWindow.loadFile(import_path.default.join(__dirname, "../dist/index.html"));
      }
    });
  }
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:") || url.startsWith("mailto:")) {
      import_electron.shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });
  import_electron.ipcMain.on("window-minimize", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize();
    }
  });
  import_electron.ipcMain.on("window-maximize", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });
  import_electron.ipcMain.on("window-close", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
  });
  import_electron.ipcMain.handle("window-is-maximized", () => {
    return mainWindow && !mainWindow.isDestroyed() ? mainWindow.isMaximized() : false;
  });
  import_electron.ipcMain.handle("get-app-version", () => {
    return import_electron.app.getVersion();
  });
  import_electron.ipcMain.on("open-external", (_event, url) => {
    if (typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))) {
      import_electron.shell.openExternal(url);
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
import_electron.app.on("activate", () => {
  if (import_electron.BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
