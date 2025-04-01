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
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
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
