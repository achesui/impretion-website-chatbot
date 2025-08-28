// vite.config.ts

import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import path from "path";
import monkey from "vite-plugin-monkey";

export default defineConfig({
  plugins: [
    preact(),
    /*
    monkey({
      entry: "src/widget.tsx",
      userscript: {
        name: "Mi Chatbot Widget",
        match: [
          "https://impretion-test.myshopify.com/*", // Cambia por tu sitio
        ],
        grant: ["GM_addStyle"],
        // IMPORTANTE: URLs para auto-actualización
        updateURL: "http://localhost:5173/dist/mi-chatbot.user.js",
        downloadURL: "http://localhost:5173/dist/mi-chatbot.user.js",
      },
      build: {
        fileName: "mi-chatbot.user.js", // Nombre fijo del archivo
      },
      server: {
        open: false,
      },
    }),
     */
  ],

  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom/client": "preact/compat",
      "react-dom": "preact/compat",
    },
  },

  build: {
    outDir: "dist",
    rollupOptions: {
      input: path.resolve(__dirname, "src/widget.tsx"),
      output: {
        format: "es", // Cambiar a ES modules
        entryFileNames: "chatbot.js",

        manualChunks: {
          "vad-chunk": ["@ricky0123/vad-web"],
          "realtime-chunk": ["@cloudflare/realtimekit"],
        },
        chunkFileNames: "[name].js",
      },
    },
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },

  // Configuración para desarrollo
  esbuild: {
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
    target: "esnext",
  },
});
