import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";

const CSP_PLACEHOLDER = "__FINANCEHUB_CSP__";

function getBackendOrigin(backendUrl: string | undefined): string {
  if (!backendUrl) {
    throw new Error(
      "VITE_API_BACKEND_URL is required to create the renderer Content Security Policy.",
    );
  }

  const url = new URL(backendUrl);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(
      "VITE_API_BACKEND_URL must use the http or https protocol.",
    );
  }

  return url.origin;
}

function createRendererCsp(
  backendOrigin: string,
  isDevelopment: boolean,
): string {
  const connectSources = ["'self'", backendOrigin];

  // Vite's development client needs a local WebSocket for hot module replacement.
  if (isDevelopment) {
    connectSources.push("ws://localhost:*", "ws://127.0.0.1:*");
  }

  return [
    "default-src 'self'",
    "script-src 'self'",
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    `connect-src ${connectSources.join(" ")}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-src 'none'",
  ].join("; ");
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const rendererCsp = createRendererCsp(
    getBackendOrigin(env.VITE_API_BACKEND_URL),
    command === "serve",
  );

  return {
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
      plugins: [
        react(),
        {
          name: "financehub-renderer-csp",
          transformIndexHtml(html) {
            return html.replace(CSP_PLACEHOLDER, rendererCsp);
          },
        },
      ],
    },
  };
});
