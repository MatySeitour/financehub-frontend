import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    assetsInclude: "src/renderer/assets/**",
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@components": resolve("src/renderer/src/components"),
        "@utils": resolve("src/renderer/src/utils"),
        "@hooks": resolve("src/renderer/src/hooks"),
      },
    },
    plugins: [react()],
  },
});
