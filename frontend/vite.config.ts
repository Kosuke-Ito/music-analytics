import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { cpSync, existsSync } from "fs";

// ビルド時に ../data/ を dist/data/ にコピーするプラグイン
function copyDataPlugin() {
  return {
    name: "copy-data",
    closeBundle() {
      const src = resolve(__dirname, "..", "data");
      const dest = resolve(__dirname, "dist", "data");
      if (existsSync(src)) {
        cpSync(src, dest, { recursive: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyDataPlugin()],
});
