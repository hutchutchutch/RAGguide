import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import { nanoid } from "nanoid";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  try {
    // We need to conditionally import Vite to handle ESM issues
    let vite;

    try {
      // Try the regular import first
      const viteModule = await import('vite');
      
      if (typeof viteModule.createServer === 'function') {
        vite = viteModule;
      } else {
        throw new Error('Vite imported but createServer not found');
      }
    } catch (err) {
      console.warn('Error importing vite:', err);
      // Fallback to a common path pattern
      const viteModule = await import('../node_modules/vite/dist/node/index.js');
      
      if (typeof viteModule.createServer === 'function') {
        vite = viteModule;
      } else {
        throw new Error('Vite could not be imported properly');
      }
    }

    const viteServer = await vite.createServer({
      configFile: path.resolve(__dirname, '..', 'client', 'vite.config.ts'),
      root: path.resolve(__dirname, '..', 'client'),
      server: {
        middlewareMode: true,
        hmr: { server },
      },
      appType: "custom",
    });

    app.use(viteServer.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const clientTemplate = path.resolve(
          __dirname,
          "..",
          "client",
          "index.html",
        );

        if (!fs.existsSync(clientTemplate)) {
          console.error(`Client template not found: ${clientTemplate}`);
          return next();
        }

        // Always reload the index.html file from disk in case it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        
        const page = await viteServer.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        const error = e as Error;
        console.error(`Error processing ${url}:`, error);
        next(error);
      }
    });
  } catch (error) {
    console.error("Failed to set up Vite dev server:", error);
    
    // Fallback to serving static files
    const clientDir = path.resolve(__dirname, '..', 'client');
    
    if (fs.existsSync(path.join(clientDir, 'index.html'))) {
      console.log("Falling back to static file serving from client directory");
      app.use(express.static(clientDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(clientDir, 'index.html'));
      });
    } else {
      console.error("No client files found to serve");
      app.get('*', (_req, res) => {
        res.status(500).send('Server Error: Development server could not be started');
      });
    }
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    console.warn(`Build directory not found: ${distPath}`);
    
    // Try to serve from client directory instead
    const clientDir = path.resolve(__dirname, '..', 'client');
    if (fs.existsSync(path.join(clientDir, 'index.html'))) {
      console.log("Serving static files from client directory");
      app.use(express.static(clientDir));
      app.use("*", (_req, res) => {
        res.sendFile(path.join(clientDir, 'index.html'));
      });
      return;
    }
    
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}