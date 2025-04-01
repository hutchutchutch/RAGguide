import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(), // Using default theme path (root/theme.json)
    // Cartographer plugin disabled due to compatibility issues
    // ...(process.env.NODE_ENV !== "production" &&
    // process.env.REPL_ID !== undefined
    //   ? [
    //       await import("@replit/vite-plugin-cartographer").then((m) =>
    //         m.cartographer(),
    //       ),
    //     ]
    //   : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(rootDir, "shared"),
      "@assets": path.resolve(rootDir, "attached_assets"),
    },
  },
  build: {
    outDir: path.resolve(rootDir, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0', // Listen on all addresses
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    fs: {
      allow: ['..'],
      strict: false
    },
    hmr: {
      // Using in-memory HMR server without relying on WebSockets
      server: false, // Disable WebSocket server
      overlay: false, // Disable error overlay to prevent connection errors
    },
    // Set the open flag to false to prevent Vite from opening a browser window
    open: false,
    // Add allowedHosts to enable external access
    allowedHosts: [
      'localhost',
      '*.replit.dev',
      '*.repl.co',
      '*.replit.app',
      'ce63078d-8f4c-407a-8675-a2dd392b4e50-00-1d1n9u6e7evt7.spock.replit.dev'
    ],
  },
});
