import { contextBridge, ipcRenderer } from "electron";

if (!process.contextIsolated) {
  throw new Error("FinanceHub requires Electron context isolation");
}

// Expose only the application capability currently required by the renderer.
contextBridge.exposeInMainWorld("financeHub", {
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke("app:get-version"),
  },
});
