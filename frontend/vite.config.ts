import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { cpSync, existsSync } from "fs";

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
  plugins: [react(), copyDataPlugin()],
});
