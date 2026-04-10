import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { cpSync, existsSync, readFileSync } from "fs";

type ConnectNext = (err?: unknown) => void;

const repoRoot = resolve(__dirname, "..");

/** dev 時にリポジトリ直下の data/ と scripts/config.json を配信する */
function devRepoStaticPlugin() {
  return {
    name: "dev-repo-static",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: ConnectNext) => {
        const raw = req.url?.split("?")[0] ?? "";
        if (raw.startsWith("/data/")) {
          const file = raw.slice("/data/".length);
          if (!/^[a-zA-Z0-9_-]+\.json$/.test(file)) return next();
          const p = resolve(repoRoot, "data", file);
          if (existsSync(p)) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(readFileSync(p));
            return;
          }
        }
        if (raw === "/config.json") {
          const p = resolve(repoRoot, "scripts", "config.json");
          if (existsSync(p)) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(readFileSync(p));
            return;
          }
        }
        next();
      });
    },
  };
}

// ビルド時に ../data/ と ../scripts/config.json を dist/ にコピーするプラグイン
function copyDataPlugin() {
  return {
    name: "copy-data",
    closeBundle() {
      const dataSrc = resolve(__dirname, "..", "data");
      const dataDest = resolve(__dirname, "dist", "data");
      if (existsSync(dataSrc)) {
        cpSync(dataSrc, dataDest, { recursive: true });
      }

      const configSrc = resolve(__dirname, "..", "scripts", "config.json");
      const configDest = resolve(__dirname, "dist", "config.json");
      if (existsSync(configSrc)) {
        cpSync(configSrc, configDest);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyDataPlugin(), devRepoStaticPlugin()],
  server: {
    fs: { allow: [repoRoot] },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/recharts")) return "recharts";
          if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) {
            return "react";
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
