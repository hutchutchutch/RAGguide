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
    themePlugin({
      theme: path.resolve(__dirname, 'theme.json')
    }),
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
    host: true, // Listen on all addresses and enable access from other devices
    hmr: {
      host: process.env.REPL_SLUG ? `${process.env.REPL_SLUG}.replit.dev` : undefined,
      clientPort: 443, // Use the HTTPS port for websocket connections
      protocol: 'wss'
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    cors: true,
    strictPort: true,
    port: 5173,
    fs: {
      allow: ['..'],
      strict: false
    },
    origin: 'https://ce63078d-8f4c-407a-8675-a2dd392b4e50-00-1d1n9u6e7evt7.spock.replit.dev',
    allowedHosts: [
      'localhost',
      '*.replit.dev',
      '*.repl.co',
      '*.replit.app',
      'ce63078d-8f4c-407a-8675-a2dd392b4e50-00-1d1n9u6e7evt7.spock.replit.dev'
    ],
  },
});
