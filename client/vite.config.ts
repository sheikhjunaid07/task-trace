import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

const getBackendTarget = (): string => {
  if (process.env.VITE_BACKEND_URL) return process.env.VITE_BACKEND_URL;
  if (process.env.BACKEND_PORT)
    return `http://localhost:${process.env.BACKEND_PORT}`;

  try {
    const serverEnvPath = path.resolve(process.cwd(), "../server/.env");
    if (fs.existsSync(serverEnvPath)) {
      const envContent = fs.readFileSync(serverEnvPath, "utf-8");
      const match = envContent.match(/^PORT\s*=\s*(\d+)/m);
      if (match && match[1]) {
        return `http://localhost:${match[1]}`;
      }
    }
  } catch {
    // fallback
  }

  return "http://localhost:5010";
};

const backendTarget = getBackendTarget();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/react-router/') ||
              id.includes('/node_modules/react-router-dom/') ||
              id.includes('/node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('@tiptap') || id.includes('prosemirror')) {
              return 'vendor-editor';
            }
            if (id.includes('@dnd-kit')) {
              return 'vendor-dnd';
            }
            if (id.includes('socket.io-client')) {
              return 'vendor-socket';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('@reduxjs') || id.includes('react-redux')) {
              return 'vendor-redux';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true,
      },
      "/socket.io": {
        target: backendTarget,
        ws: true,
      },
    },
  },
});
