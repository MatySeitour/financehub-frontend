import { app, shell, BrowserWindow } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { autoUpdater } from "electron-updater";

app.commandLine.appendSwitch("remote-debugging-port", "9222");
app.commandLine.appendSwitch("remote-allow-origins", "http://localhost:9222");

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

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
