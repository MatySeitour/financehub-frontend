import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

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

// Exponer variables de entorno
contextBridge.exposeInMainWorld("env", {
  API_URL: process.env.VITE_API_URL,
  SECRET_KEY: process.env.ELECTRON_SECRET_KEY,
});

// Exponer API de cookies
contextBridge.exposeInMainWorld("electronCookies", electronCookies);

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
}
