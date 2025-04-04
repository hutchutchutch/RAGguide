import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "../storage";
import { User } from "../../../shared/schema";
import { log } from "../../vite";

declare global {
  namespace Express {
    // Define User interface for passport
    interface User {
      id: string;
      username: string;
      email: string;
      password: string | null;
      avatar_url: string | null;
      google_id: string | null;
      google_access_token: string | null;
      google_refresh_token: string | null;
      last_login: Date | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "keyboard_cat",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for username/password login
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByEmail(username);
        if (!user || !user.password || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } 
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Get the current app URL
    const appUrl = process.env.APP_URL || 
      `https://rag.guide`;
    
    // Create a function to determine the full callback URL
    const callbackURL = `${appUrl}/api/auth/google/callback`;
    
    log("[auth] Using Google OAuth callback URL: " + callbackURL);
    
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: callbackURL,
          // Ensure proxy is true to trust the Replit/custom domain proxy
          proxy: true,
          scope: [
            "profile", 
            "email", 
            "https://www.googleapis.com/auth/drive.file" // More limited scope, access to files created/opened by app
          ],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            // Check if user exists
            let user = await storage.getUserByGoogleId(profile.id);
            
            // Update the access token even if user exists
            if (user) {
              user = await storage.updateUser(user.id, { 
                google_access_token: accessToken,
                google_refresh_token: refreshToken || user.google_refresh_token,
                last_login: new Date()
              });
              return done(null, user);
            }
            
            // Create a new user if they don't exist
            const newUser = await storage.createUser({
              username: profile.displayName,
              email: profile.emails?.[0]?.value || `${profile.id}@gmail.com`,
              password: null, // No password for OAuth users
              avatar_url: profile.photos?.[0]?.value || null,
              google_id: profile.id,
              google_access_token: accessToken,
              google_refresh_token: refreshToken || null,
            });
            
            return done(null, newUser);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  } else {
    log("Google OAuth credentials not provided. Google login will not be available.", "auth");
  }

  // Serialize and deserialize user for sessions
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Create user with hashed password
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        avatar_url: null,
        google_id: null,
        google_access_token: null,
        google_refresh_token: null,
      });
      
      // Remove password from response
      const userResponse = { ...user };
      delete userResponse.password;
      
      // Log user in
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userResponse);
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Registration failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      req.login(user, async (err) => {
        if (err) return next(err);
        
        // Update last login time
        await storage.updateUser(user.id, { last_login: new Date() });
        
        // Remove password from response
        const userResponse = { ...user };
        delete userResponse.password;
        
        res.json(userResponse);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed", error: err.message });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Remove password from response
    const userResponse = { ...req.user };
    delete userResponse.password;
    
    res.json(userResponse);
  });

  // Google OAuth routes
  app.get("/api/auth/google", passport.authenticate("google"));
  
  app.get(
    "/api/auth/google/callback",
    (req: Request, res: Response, next: NextFunction) => {
      log(`[auth] Processing callback - raw URL: ${req.url}`);
      log(`[auth] Processing callback - headers: ${JSON.stringify(req.headers)}`);
      log(`[auth] Processing callback - query params: ${JSON.stringify(req.query)}`);
      next();
    },
    passport.authenticate("google", { 
      failureRedirect: "/auth",
      failWithError: true,
      session: true
    }),
    (req: Request, res: Response) => {
      log(`[auth] Authentication successful, redirecting to dashboard...`);
      log(`[auth] User data: ${JSON.stringify(req.user)}`);
      log(`[auth] Session ID: ${req.sessionID}`);
      
      // Make sure the session is properly saved before redirecting
      // This helps ensure the session cookie is set correctly
      req.session.save((err) => {
        if (err) {
          log(`[auth] Error saving session: ${err.message}`);
        }
        
        // Redirect to the frontend dashboard
        res.redirect("/");
      });
    },
    (err: any, req: Request, res: Response, next: NextFunction) => {
      // Error handler
      log(`[auth] OAuth error: ${err.message || 'Unknown error'}`);
      log(`[auth] Full error object: ${JSON.stringify(err)}`);
      res.redirect("/auth?error=oauth_failed");
    }
  );
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}

// Middleware to check if user has Google Drive access
export function hasGoogleDriveAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = req.user as any;
  if (!user.google_access_token) {
    return res.status(403).json({ 
      message: "Google Drive access not authorized",
      loginUrl: "/api/auth/google"
    });
  }
  
  next();
}