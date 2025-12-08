import { app, shell, BrowserWindow, session, ipcMain } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { autoUpdater } from "electron-updater";
import log from "electron-log";

log.transports.file.level = "info";
autoUpdater.logger = log;

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowDowngrade = false;

app.commandLine.appendSwitch("remote-debugging-port", "9222");
app.commandLine.appendSwitch("remote-allow-origins", "http://localhost:9222");

async function parseCookieAndStore(cookieString: string, url: string) {
  try {
    const parts = cookieString.split(";");
    const [nameValue] = parts[0].split("=");
    const name = nameValue;
    const value = parts[0].substring(name.length + 1);

    let domain = new URL(url).hostname;
    let path = "/";
    let secure = false;
    let httpOnly = false;
    let expirationDate = Date.now() / 1000 + 86400;

    parts.slice(1).forEach((part) => {
      const trimmed = part.trim().toLowerCase();
      if (trimmed.startsWith("domain=")) {
        domain = part.split("=")[1].trim();
        if (domain.startsWith(".")) domain = domain.substring(1);
      } else if (trimmed.startsWith("path=")) {
        path = part.split("=")[1].trim();
      } else if (trimmed === "secure") {
        secure = true;
      } else if (trimmed === "httponly") {
        httpOnly = true;
      } else if (trimmed.startsWith("max-age=")) {
        const maxAge = parseInt(part.split("=")[1]);
        expirationDate = Date.now() / 1000 + maxAge;
      }
    });

    const cookie = {
      url: `https://${domain}${path}`,
      name: name,
      value: value,
      domain: domain,
      path: path,
      secure: secure,
      httpOnly: httpOnly,
      expirationDate: expirationDate,
    };

    await session.defaultSession.cookies.set(cookie);
  } catch (error) {
    console.error("❌ Error parseando cookie:", error);
  }
}

async function getCookiesForRequest(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url);
    const cookies = await session.defaultSession.cookies.get({
      domain: urlObj.hostname,
    });

    if (cookies.length === 0) return null;

    return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  } catch (error) {
    console.error("Error obteniendo cookies:", error);
    return null;
  }
}

function setupCookieHandlers() {
  const ses = session.defaultSession;

  ses.webRequest.onHeadersReceived((details, callback) => {
    const setCookieHeaders =
      details.responseHeaders?.["set-cookie"] ||
      details.responseHeaders?.["Set-Cookie"];

    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach(async (cookieString) => {
        await parseCookieAndStore(cookieString, details.url);
      });
    }

    callback({ responseHeaders: details.responseHeaders });
  });

  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.url.includes("api.financehub.com.ar")) {
      getCookiesForRequest(details.url).then((cookieHeader) => {
        if (cookieHeader) {
          details.requestHeaders["Cookie"] = cookieHeader;
          console.log("🍪 Enviando cookies al backend");
        }
        callback({ requestHeaders: details.requestHeaders });
      });
    } else {
      callback({ requestHeaders: details.requestHeaders });
    }
  });

  console.log("✅ Cookie handlers configurados");
}

function setupIpcHandlers() {
  ipcMain.handle("check-for-updates", async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return result;
    } catch (error) {
      log.error("Error checking for updates:", error);
      return null;
    }
  });

  ipcMain.handle("get-app-version", () => {
    return app.getVersion();
  });

  ipcMain.handle("quit-and-install", () => {
    autoUpdater.quitAndInstall(false, true);
  });

  ipcMain.handle("get-cookie", async (_, name: string) => {
    try {
      const cookies = await session.defaultSession.cookies.get({ name });

      return cookies.length > 0 ? cookies[0].value : null;
    } catch (error) {
      console.error("Error getting cookie:", error);
      return null;
    }
  });

  ipcMain.handle("get-all-cookies", async () => {
    try {
      const cookies = await session.defaultSession.cookies.get({});
      return cookies;
    } catch (error) {
      return [];
    }
  });

  ipcMain.handle("set-cookie", async (_, cookieData: any) => {
    try {
      await session.defaultSession.cookies.set(cookieData);
      return { success: true };
    } catch (error) {
      console.error("Error setting cookie:", error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle("remove-cookie", async (_, url: string, name: string) => {
    try {
      await session.defaultSession.cookies.remove(url, name);
      return { success: true };
    } catch (error) {
      console.error("Error removing cookie:", error);
      return { success: false, error: (error as Error).message };
    }
  });
}

function setupAutoUpdater(mainWindow: BrowserWindow) {
  // Solo verificar actualizaciones en producción
  if (is.dev) {
    log.info("Modo desarrollo - auto-updater desactivado");
    return;
  }

  log.info("Configurando auto-updater...");
  log.info("Versión actual:", app.getVersion());

  // Verificar actualizaciones al iniciar (después de 3 segundos)
  setTimeout(() => {
    log.info("Verificando actualizaciones...");
    autoUpdater.checkForUpdatesAndNotify();
  }, 3000);

  // Verificar cada 10 minutos
  setInterval(
    () => {
      log.info("Verificación periódica de actualizaciones...");
      autoUpdater.checkForUpdatesAndNotify();
    },
    10 * 60 * 1000,
  );

  // Eventos del auto-updater
  autoUpdater.on("checking-for-update", () => {
    log.info("🔍 Verificando actualizaciones...");
    mainWindow.webContents.send("update-status", {
      status: "checking",
      message: "Verificando actualizaciones...",
    });
  });

  autoUpdater.on("update-available", (info) => {
    log.info("✅ Actualización disponible:", info.version);
    mainWindow.webContents.send("update-status", {
      status: "available",
      message: `Nueva versión ${info.version} disponible. Descargando...`,
      version: info.version,
    });
  });

  autoUpdater.on("update-not-available", (info) => {
    log.info("ℹ️ No hay actualizaciones disponibles");
    log.info("Versión actual:", info.version);
    mainWindow.webContents.send("update-status", {
      status: "not-available",
      message: "La aplicación está actualizada",
      version: info.version,
    });
  });

  autoUpdater.on("error", (err) => {
    log.error("❌ Error en auto-updater:", err);
    mainWindow.webContents.send("update-status", {
      status: "error",
      message: "Error al verificar actualizaciones: " + err.message,
    });
  });

  autoUpdater.on("download-progress", (progressObj) => {
    const message = `Descargando: ${Math.round(progressObj.percent)}%`;
    log.info(message);
    mainWindow.webContents.send("update-status", {
      status: "downloading",
      message: message,
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info("✅ Actualización descargada:", info.version);
    mainWindow.webContents.send("update-status", {
      status: "downloaded",
      message: `Actualización ${info.version} lista. Reinicia la aplicación para instalar.`,
      version: info.version,
    });

    // Mostrar notificación
    mainWindow.webContents.send("show-update-notification", {
      version: info.version,
    });
  });
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: true,
    autoHideMenuBar: true,
    icon:
      process.platform === "win32"
        ? join(__dirname, "../../resources/icon.ico")
        : icon,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      webSecurity: true,
    },
  });

  mainWindow.maximize();

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    const filePath = app.isPackaged
      ? join(process.resourcesPath, "renderer/index.html")
      : join(__dirname, "../renderer/index.html");

    console.log("=== LOADING ===");
    console.log("File path:", filePath);
    console.log("File exists:", require("fs").existsSync(filePath));

    mainWindow
      .loadFile(filePath)
      .then(() => {
        console.log("✅ loadFile completed");

        // mainWindow.webContents.openDevTools();

        setTimeout(() => {
          mainWindow.webContents
            .executeJavaScript(
              `
        console.log("Root element:", document.getElementById('root'));
        console.log("Body children:", document.body.children.length);
        document.body.innerHTML;
      `,
            )
            .then((html) => {
              console.log("Body HTML:", html);
            });
        }, 2000);
      })
      .catch((err) => {
        console.error("❌ loadFile error:", err);
      });
  }

  mainWindow.webContents.on("did-fail-load", (_, code, desc) => {
    console.error("LOAD ERROR:", code, desc);
  });

  setupAutoUpdater(mainWindow);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  setupCookieHandlers();
  setupIpcHandlers();

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on("update-available", () => {
    console.log("Update disponible");
  });

  autoUpdater.on("update-downloaded", () => {
    autoUpdater.quitAndInstall();
  });

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
