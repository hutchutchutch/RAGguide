import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Initialize passport and set up serialization/deserialization
export function setupAuth(app: any) {
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Set up Google OAuth2 strategy
  const googleConfig = {
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: '/auth/google/callback',
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.readonly']
  };

  passport.use(
    new GoogleStrategy(
      googleConfig,
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists by Google ID
          let user = await storage.getUserByGoogleId(profile.id);
          
          if (!user) {
            // If user doesn't exist by Google ID, check by email
            const email = profile.emails?.[0]?.value;
            if (email) {
              user = await storage.getUserByEmail(email);
            }
            
            // Create a new user if not found
            if (!user) {
              const newUser = await storage.createUser({
                email: email || `${profile.id}@google.com`,
                display_name: profile.displayName || 'Google User',
                avatar_url: profile.photos?.[0]?.value || null,
                google_id: profile.id,
                google_access_token: accessToken,
                google_refresh_token: refreshToken
              });
              return done(null, newUser);
            } else {
              // Update existing user with Google credentials
              const updatedUser = await storage.updateUser(user.id, {
                google_id: profile.id,
                google_access_token: accessToken,
                google_refresh_token: refreshToken,
                last_login: new Date()
              });
              return done(null, updatedUser);
            }
          } else {
            // Update credentials for existing user
            const updatedUser = await storage.updateUser(user.id, {
              google_access_token: accessToken,
              google_refresh_token: refreshToken,
              last_login: new Date()
            });
            return done(null, updatedUser);
          }
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  // Set up authentication routes
  app.get('/auth/google',
    passport.authenticate('google', { 
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.readonly'] 
    })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', { 
      failureRedirect: '/login-error' 
    }),
    (req: Request, res: Response) => {
      // Successful authentication, redirect to dashboard
      res.redirect('/');
    }
  );

  app.get('/auth/logout', (req: Request, res: Response) => {
    req.logout(() => {
      res.redirect('/');
    });
  });

  app.get('/api/user', 
    isAuthenticated,
    (req: Request, res: Response) => {
      res.json(req.user);
    }
  );
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
}

// Middleware to check if user has Google Drive access
export function hasGoogleDriveAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const user = req.user as any;
  if (!user.google_access_token) {
    return res.status(403).json({ error: 'No Google Drive access' });
  }
  
  next();
}