import { app, BrowserWindow, ipcMain, session, shell } from "electron";
import type { IpcMainInvokeEvent } from "electron";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { autoUpdater } from "electron-updater";
import log from "electron-log";

const ALLOWED_EXTERNAL_URLS = new Set([
  "https://www.linkedin.com/company/sintelia/",
]);

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let updaterInitialized = false;

log.transports.file.level = is.dev ? "debug" : "info";
autoUpdater.logger = log;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowDowngrade = false;

function getRendererEntryPath() {
  return app.isPackaged
    ? join(process.resourcesPath, "renderer/index.html")
    : join(__dirname, "../renderer/index.html");
}

function normalizePath(path: string) {
  const normalized = resolve(path);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function isTrustedRendererUrl(rawUrl: string) {
  try {
    const parsedUrl = new URL(rawUrl);

    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      return (
        parsedUrl.origin === new URL(process.env.ELECTRON_RENDERER_URL).origin
      );
    }

    if (parsedUrl.protocol !== "file:") return false;

    parsedUrl.hash = "";
    parsedUrl.search = "";

    return (
      normalizePath(fileURLToPath(parsedUrl)) ===
      normalizePath(getRendererEntryPath())
    );
  } catch {
    return false;
  }
}

function isTrustedRenderer(event: IpcMainInvokeEvent) {
  const senderUrl = event.senderFrame?.url;
  return senderUrl ? isTrustedRendererUrl(senderUrl) : false;
}

function isAllowedExternalUrl(rawUrl: string) {
  try {
    const parsedUrl = new URL(rawUrl);
    return (
      parsedUrl.protocol === "https:" &&
      !parsedUrl.username &&
      !parsedUrl.password &&
      ALLOWED_EXTERNAL_URLS.has(parsedUrl.href)
    );
  } catch {
    return false;
  }
}

async function openAllowedExternalUrl(rawUrl: string) {
  if (!isAllowedExternalUrl(rawUrl)) {
    log.warn("Blocked an external URL that is not allowlisted");
    return;
  }

  try {
    await shell.openExternal(rawUrl);
  } catch {
    log.error("Failed to open an allowlisted external URL");
  }
}

function protectNavigation(window: BrowserWindow) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    void openAllowedExternalUrl(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (isTrustedRendererUrl(url)) return;

    event.preventDefault();
    void openAllowedExternalUrl(url);
  });
}

function setupIpcHandlers() {
  ipcMain.handle("app:get-version", (event) => {
    if (!isTrustedRenderer(event)) {
      throw new Error("Unauthorized IPC sender");
    }

    return app.getVersion();
  });
}

function setupSessionPermissions() {
  // FinanceHub does not need Chromium device, media, geolocation, or notification permissions.
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false),
  );
}

function getUpdaterErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return "unknown";
}

function setupAutoUpdater() {
  if (is.dev || !app.isPackaged || updaterInitialized) return;
  updaterInitialized = true;

  autoUpdater.on("checking-for-update", () => {
    log.info("Checking for application updates");
  });

  autoUpdater.on("update-available", (info) => {
    log.info("Application update available", { version: info.version });
  });

  autoUpdater.on("update-not-available", (info) => {
    log.info("Application is up to date", { version: info.version });
  });

  autoUpdater.on("download-progress", ({ percent }) => {
    log.info("Downloading application update", {
      percent: Math.round(percent),
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info("Application update will be installed on exit", {
      version: info.version,
    });
  });

  autoUpdater.on("error", (error) => {
    log.error("Application update failed", {
      code: getUpdaterErrorCode(error),
    });
  });

  // Update checks never block window creation or offline application startup.
  void autoUpdater.checkForUpdates().catch((error: unknown) => {
    log.error("Application update check failed", {
      code: getUpdaterErrorCode(error),
    });
  });
}

function createSplashWindow() {
  if (!is.dev || !process.env.ELECTRON_RENDERER_URL) return;

  splashWindow = new BrowserWindow({
    width: 600,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: false,
    resizable: false,
    show: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  protectNavigation(splashWindow);
  void splashWindow.loadURL(
    `${process.env.ELECTRON_RENDERER_URL}/splash/index.html`,
  );
}

function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon:
      process.platform === "win32"
        ? join(__dirname, "../../resources/icon.ico")
        : icon,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  protectNavigation(mainWindow);

  mainWindow.on("ready-to-show", () => {
    splashWindow?.close();
    splashWindow = null;

    mainWindow?.maximize();
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode) => {
    log.error("Renderer failed to load", { errorCode });
  });

  const rendererLoad =
    is.dev && process.env.ELECTRON_RENDERER_URL
      ? mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
      : mainWindow.loadFile(getRendererEntryPath());

  void rendererLoad.catch(() => {
    log.error("Renderer entry point could not be loaded");
  });
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.financehub.app");

  setupSessionPermissions();
  setupIpcHandlers();

  app.on("browser-window-created", (_event, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createSplashWindow();
  createWindow();
  setupAutoUpdater();

  app.on("activate", createWindow);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
