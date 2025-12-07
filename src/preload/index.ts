import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electronUpdater?: {
      checkForUpdates: () => Promise<any>;
      getAppVersion: () => Promise<string>;
      quitAndInstall: () => Promise<void>;
      onUpdateStatus: (callback: (status: any) => void) => void;
      onUpdateNotification: (callback: (info: any) => void) => void;
    };
  }
}
// Custom APIs for renderer
const api = {};

// API de cookies para el renderer
const electronCookies = {
  get: (name: string) => ipcRenderer.invoke("get-cookie", name),
  getAll: () => ipcRenderer.invoke("get-all-cookies"),
  set: (cookieData: any) => ipcRenderer.invoke("set-cookie", cookieData),
  remove: (url: string, name: string) =>
    ipcRenderer.invoke("remove-cookie", url, name),
};

const electronUpdater = {
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  quitAndInstall: () => ipcRenderer.invoke("quit-and-install"),
  onUpdateStatus: (callback: (status: any) => void) => {
    ipcRenderer.on("update-status", (_, status) => callback(status));
  },
  onUpdateNotification: (callback: (info: any) => void) => {
    ipcRenderer.on("show-update-notification", (_, info) => callback(info));
  },
};

// Exponer variables de entorno
contextBridge.exposeInMainWorld("env", {
  API_URL: process.env.VITE_API_URL,
  SECRET_KEY: process.env.ELECTRON_SECRET_KEY,
});

contextBridge.exposeInMainWorld("electronCookies", electronCookies);
contextBridge.exposeInMainWorld("electronUpdater", electronUpdater);
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
  // @ts-ignore (define in dts)
  window.electronCookies = electronCookies;

  window.electronUpdater = electronUpdater;
}
