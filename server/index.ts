import 'dotenv/config'; // Load environment variables from .env file
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./lib/db";
import session from "express-session";
import { setupAuth } from "./lib/auth";
import ConnectPgSimple from "connect-pg-simple";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from 'ws';

// Configure Neon to use the ws package for WebSocket connections
// This is required for connecting through custom domains
neonConfig.webSocketConstructor = ws;

const app = express();

// Trust the proxy to get proper IP and protocol information
// This is crucial for OAuth to work correctly with custom domains
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session
const sessionSecret = process.env.SESSION_SECRET || 'ragexplorer-secret';

// Use PostgreSQL session store if DATABASE_URL is provided
if (process.env.DATABASE_URL) {
  const PgSession = ConnectPgSimple(session);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  app.use(session({
    store: new PgSession({
      pool: pool,
      tableName: 'user_sessions', // Custom session table name
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Allow cross-site requests for OAuth flow
    }
  }));
} else {
  // Use memory store for development
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax', // Allow cross-site requests for OAuth flow
    }
  }));
}

// Set up authentication
setupAuth(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database
  try {
    await initializeDatabase();
    log("Database initialized successfully", "db");
  } catch (e) {
    const error = e as Error;
    log(`Error initializing database: ${error.message || 'Unknown error'}`, "db");
    // Continue even if database initialization fails
    // This allows using memory storage as fallback
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  
  // Setup client access with better prioritization of the Vite dev server
  try {
    const fs = await import('fs');
    const path = await import('path');
    const url = await import('url');
    const fileURLToPath = url.fileURLToPath;
    const dirname = path.dirname;
    const http = await import('http');
    
    // Using import.meta.url instead of __dirname for ESM modules
    const currentFilePath = fileURLToPath(import.meta.url);
    const currentDirPath = dirname(currentFilePath);
    
    // Define paths for static files and client 
    const staticPath = path.resolve(currentDirPath, 'static');
    const clientPath = path.resolve(currentDirPath, '../client');
    
    // Try to setup Vite middleware for development - FIRST PRIORITY
    if (app.get("env") === "development") {
      try {
        await setupVite(app, server);
        log("Vite middleware setup successfully", "vite");
        
        // Setup proxy to client dev server as a fallback
        const viteProxyMiddleware = async (req: any, res: any, next: any) => {
          try {
            if (req.path.startsWith('/api')) {
              return next();
            }
            
            // Check if the client dev server is running on port 5173
            const testClientServer = async () => {
              return new Promise((resolve) => {
                const clientReq = http.get('http://localhost:5173/', (clientRes) => {
                  resolve(clientRes.statusCode === 200);
                  clientReq.abort();
                });
                
                clientReq.on('error', () => {
                  resolve(false);
                });
                
                clientReq.setTimeout(500, () => {
                  clientReq.abort();
                  resolve(false);
                });
              });
            };
            
            const isClientServerRunning = await testClientServer();
            
            if (isClientServerRunning) {
              // Forward the request to the client dev server
              log(`Proxying request to client dev server: ${req.path}`, "express");
              res.redirect(`http://localhost:5173${req.path}`);
              return;
            }
            
            // If no client server is available, continue to next middleware
            next();
          } catch (e) {
            next();
          }
        };
        
        // Add the proxy middleware
        app.use(viteProxyMiddleware);
      } catch (e) {
        const error = e as Error;
        log(`Error setting up Vite: ${error.message}`, "vite");
      }
    } else {
      serveStatic(app);
    }
    
    // Static file serving - SECOND PRIORITY
    if (fs.existsSync(staticPath)) {
      log(`Serving static files from ${staticPath}`, "express");
      
      // Serve static files
      app.use(express.static(staticPath, {
        setHeaders: (res) => {
          res.set('Cache-Control', 'no-store');
        }
      }));
      
      // Explicitly serve client static assets folder
      const clientStaticDir = path.resolve(staticPath, 'client');
      if (fs.existsSync(clientStaticDir)) {
        log(`Serving client static directory from ${clientStaticDir}`, "express");
        app.use('/client-assets', express.static(clientStaticDir, {
          setHeaders: (res) => {
            res.set('Cache-Control', 'no-store');
          }
        }));
      }
    }
    
    // Add a root redirect to access the React app directly
    app.get('/', (req, res) => {
      log('Accessing root path - serving React app', "express");
      
      // Forward to either the React dev server or a static file
      if (process.env.NODE_ENV === 'development') {
        // In development, redirect to the Vite dev server
        res.redirect('http://localhost:5173/');
      } else {
        // In production or if Vite dev server is not available, serve our static page
        res.redirect('/client');
      }
    });
    
    // Add a specific route for the /client path to serve the static client page
    app.get('/client', (req, res) => {
      // Try multiple potential locations for the client HTML
      const locations = [
        path.resolve(staticPath, 'client/index.html'),
        path.resolve('server/public/index.html'),
        path.resolve('client/index.html')
      ];
      
      // Log all location attempts
      console.log('Attempting to serve client from these locations:');
      locations.forEach(loc => console.log(' - ' + loc + ' exists: ' + fs.existsSync(loc)));
      
      // Find the first location that exists
      const clientStaticPath = locations.find(loc => fs.existsSync(loc));
      
      if (clientStaticPath) {
        log(`Serving static client from: ${clientStaticPath}`, "express");
        
        // Set headers for no caching
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Send the file
        res.sendFile(clientStaticPath);
      } else {
        console.error('Client page not found in any location');
        res.status(404).send('Client page not found - tried all potential locations');
      }
    });
    
    // Add a catch-all route for the client-side SPA - THIRD PRIORITY
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      
      // First try Vite client index.html
      const clientIndexPath = path.resolve(clientPath, 'index.html');
      const staticIndexPath = path.resolve(staticPath, 'index.html');
      
      if (fs.existsSync(clientIndexPath)) {
        log(`Serving client index.html: ${clientIndexPath}`, "express");
        res.sendFile(clientIndexPath, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store'
          }
        });
      } else if (fs.existsSync(staticIndexPath)) {
        log(`Serving static index.html: ${staticIndexPath}`, "express");
        res.sendFile(staticIndexPath, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store'
          }
        });
      } else {
        next();
      }
    });
    
  } catch (error) {
    log(`Error setting up static file serving: ${error}`, "express");
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
