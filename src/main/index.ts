import { app, shell, BrowserWindow, session, ipcMain } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { autoUpdater } from "electron-updater";

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

        mainWindow.webContents.openDevTools();

        // Ejecuta código en el renderer para ver si React carga
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
