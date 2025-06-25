import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail } from "./email-service";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
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
    secret: process.env.SESSION_SECRET || 'dermascan-session-secret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("Auth attempt:", username, "password length:", password.length);
        const user = await storage.getUserByUsername(username);
        console.log("Found user:", user ? `${user.username} (${user.role})` : "null");
        
        if (!user) {
          console.log("User not found");
          return done(null, false);
        }
        
        // For demo users, check plain text passwords first
        let isValidPassword = false;
        if (user.password.includes('.')) {
          // Hashed password
          console.log("Checking hashed password");
          isValidPassword = await comparePasswords(password, user.password);
        } else {
          // Plain text password for demo users
          console.log("Checking plain text password");
          isValidPassword = password === user.password;
        }
        
        console.log("Password valid:", isValidPassword);
        
        if (!isValidPassword) {
          return done(null, false);
        }
        
        return done(null, user);
      } catch (error) {
        console.error("Auth error:", error);
        return done(error);
      }
    }),
  );

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const name = profile.displayName;
            const googleId = profile.id;

            if (!email) {
              return done(new Error("No email found from Google profile"));
            }

            // Check if user exists by email
            let user = await storage.getUserByEmail(email);
            
            if (!user) {
              // Create new user
              const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
              user = await storage.createUser({
                username,
                email,
                password: '', // No password for OAuth users
                role: 'patient',
                emailVerified: true,
                authProvider: 'google',
                authProviderId: googleId,
              });
            } else if (!user.authProvider) {
              // Link existing account to Google
              await storage.updateUser(user.id, {
                authProvider: 'google',
                authProviderId: googleId,
                emailVerified: true,
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  // Facebook OAuth Strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: "/api/auth/facebook/callback",
          profileFields: ['id', 'emails', 'name'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const name = profile.name ? `${profile.name.givenName} ${profile.name.familyName}` : profile.displayName;
            const facebookId = profile.id;

            if (!email) {
              return done(new Error("No email found from Facebook profile"));
            }

            // Check if user exists by email
            let user = await storage.getUserByEmail(email);
            
            if (!user) {
              // Create new user
              const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
              user = await storage.createUser({
                username,
                email,
                password: '', // No password for OAuth users
                role: 'patient',
                emailVerified: true,
                authProvider: 'facebook',
                authProviderId: facebookId,
              });
            } else if (!user.authProvider) {
              // Link existing account to Facebook
              await storage.updateUser(user.id, {
                authProvider: 'facebook',
                authProviderId: facebookId,
                emailVerified: true,
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Single session enforcement middleware - only for protected routes
  app.use('/api', async (req, res, next) => {
    // Skip for auth routes
    if (['/login', '/register', '/logout'].includes(req.path)) {
      return next();
    }

    if (req.isAuthenticated() && req.user && req.sessionID) {
      try {
        const isValidSession = await storage.validateUserSession(req.user.id, req.sessionID);
        
        if (!isValidSession) {
          await storage.logoutUserSession(req.sessionID);
          req.logout((err) => {
            if (err) console.error("Session logout error:", err);
          });
          
          return res.status(401).json({ 
            message: "Session expired - logged in from another device",
            forceLogout: true 
          });
        }
        
        await storage.updateSessionActivity(req.sessionID);
      } catch (error) {
        console.error("Session validation error:", error);
      }
    }
    next();
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Define authorized roles and their access codes
      const AUTHORIZED_ROLES: Record<string, string> = {
        doctor: process.env.DOCTOR_AUTH_CODE || "doctor-auth-2025",
        assistant: process.env.ASSISTANT_AUTH_CODE || "assistant-auth-2025",
        expert: process.env.EXPERT_AUTH_CODE || "expert-auth-2025"
      };
      
      // Get requested role (default to patient) and ensure it's a valid role
      let requestedRole = ((req.body.role || "patient") as string).toLowerCase();
      
      // Validate the role is one of our allowed roles
      if (requestedRole !== "patient" && requestedRole !== "doctor" && requestedRole !== "assistant" && requestedRole !== "expert") {
        console.log(`Invalid role requested: ${requestedRole}. Defaulting to patient role.`);
        requestedRole = "patient";
      }
      
      // Check if role requires authorization
      if (requestedRole !== "patient") {
        const providedAuthCode = req.body.authorizationCode as string | undefined;
        
        // If trying to register as a privileged role but no auth code provided
        if (!providedAuthCode) {
          return res.status(403).json({ 
            message: "Authorization code required for this role",
            requiredField: "authorizationCode" 
          });
        }
        
        // Explicitly check against the known roles that require auth
        if (requestedRole === "doctor") {
          if (providedAuthCode !== AUTHORIZED_ROLES.doctor) {
            console.log(`Invalid doctor auth code provided: ${providedAuthCode}`);
            return res.status(403).json({ 
              message: "Invalid authorization code for doctor role",
              requiredField: "authorizationCode" 
            });
          }
        } else if (requestedRole === "assistant") {
          if (providedAuthCode !== AUTHORIZED_ROLES.assistant) {
            console.log(`Invalid assistant auth code provided: ${providedAuthCode}`);
            return res.status(403).json({ 
              message: "Invalid authorization code for assistant role",
              requiredField: "authorizationCode" 
            });
          }
        }
      }
      
      // Generate email verification token if email is provided
      let verificationToken = null;
      if (req.body.email) {
        verificationToken = generateVerificationToken();
      }

      // Create user with email verification fields
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        active: true,
        role: requestedRole,
        email: req.body.email || null,
        emailVerified: req.body.email ? false : true, // Auto-verify if no email provided
        emailVerificationToken: verificationToken
      });

      // If user is a patient, automatically create their patient profile
      if (requestedRole === "patient") {
        try {
          const patientData = {
            pid: `DRM${Math.floor(1000 + Math.random() * 9000)}`,
            userId: user.id,
            name: req.body.name || req.body.username,
            age: req.body.age || 25,
            gender: req.body.gender || "other",
            email: req.body.email || `${req.body.username}@example.com`,
            phone: req.body.phone || "000-000-0000",
            address: req.body.address || "",
            allergies: req.body.allergies || "",
            lastVisitDate: null,
            nextVisitDate: null,
            profileImage: null
          };
          
          await storage.createPatient(patientData);
          console.log(`Auto-created patient profile for user: ${user.username} (ID: ${user.id})`);
        } catch (patientError) {
          console.error("Failed to create patient profile:", patientError);
          // Continue with user creation even if patient profile creation fails
        }
      }

      // Send verification email if email is provided
      if (req.body.email && verificationToken) {
        try {
          await sendVerificationEmail({
            email: req.body.email,
            username: user.username,
            verificationToken: verificationToken
          });
          console.log(`Verification email sent to ${req.body.email}`);
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
          // Continue with registration even if email fails
        }
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          ...user,
          emailVerificationSent: !!req.body.email
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      if (!user.active) return res.status(403).json({ message: "Account is disabled" });
      
      console.log(`User login successful - Username: ${user.username}, ID: ${user.id}, Role: ${user.role}`);
      
      req.login(user, async (err) => {
        if (err) return next(err);
        
        // Implement single session enforcement
        try {
          const sessionId = req.sessionID;
          const userAgent = req.get('User-Agent') || 'Unknown';
          const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
          
          // FORCE LOGOUT all other sessions for this user
          console.log(`INVALIDATING all sessions for user ${user.id} except ${sessionId}`);
          await storage.invalidateUserSessions(user.id, sessionId);
          
          // Create new session record
          await storage.createUserSession({
            userId: user.id,
            sessionId: sessionId,
            userAgent: userAgent,
            ipAddress: ipAddress,
            isActive: true
          });
          
          // Update user's current session ID to this new one
          await storage.updateUserCurrentSession(user.id, sessionId);
          
          console.log(`Single session enforced for user ${user.username} - Session: ${sessionId}`);
        } catch (sessionError) {
          console.error("Session management error:", sessionError);
          // Continue with login even if session tracking fails
        }
        
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", async (req, res, next) => {
    const sessionId = req.sessionID;
    
    // Mark session as inactive in database
    if (sessionId) {
      try {
        await storage.logoutUserSession(sessionId);
        console.log(`Session ${sessionId} marked as logged out`);
      } catch (sessionError) {
        console.error("Error logging out session:", sessionError);
      }
    }
    
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((destroyErr) => {
        if (destroyErr) return next(destroyErr);
        res.clearCookie('connect.sid');
        res.sendStatus(200);
      });
    });
  });

  app.post("/api/force-logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ error: 'Failed to destroy session' });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Session forcefully cleared' });
    });
  });

  // Google OAuth routes
  app.get("/api/auth/google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth?error=google_auth_failed" }),
    (req, res) => {
      // Successful authentication, redirect to dashboard
      res.redirect("/");
    }
  );

  // Facebook OAuth routes
  app.get("/api/auth/facebook",
    passport.authenticate("facebook", { scope: ["email"] })
  );

  app.get("/api/auth/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/auth?error=facebook_auth_failed" }),
    (req, res) => {
      // Successful authentication, redirect to dashboard
      res.redirect("/");
    }
  );

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("GET /api/user - Not authenticated");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    console.log(`GET /api/user - Authenticated user: ${req.user?.username}, ID: ${req.user?.id}, Role: ${req.user?.role}`);
    res.json(req.user);
  });

  // Email verification endpoint
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ 
          message: "Invalid verification token" 
        });
      }

      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ 
          message: "Invalid or expired verification token" 
        });
      }

      if (user.emailVerified) {
        return res.status(200).json({ 
          message: "Email already verified",
          alreadyVerified: true 
        });
      }

      // Update user to mark email as verified
      await storage.verifyUserEmail(user.id);
      
      // Send welcome email
      if (user.email) {
        try {
          await sendWelcomeEmail(user.email, user.username);
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }
      }

      res.status(200).json({ 
        message: "Email verified successfully",
        verified: true 
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ 
        message: "Internal server error during verification" 
      });
    }
  });

  // Resend verification email endpoint
  app.post("/api/resend-verification", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user as SelectUser;
      
      if (!user.email) {
        return res.status(400).json({ 
          message: "No email address associated with account" 
        });
      }

      if (user.emailVerified) {
        return res.status(400).json({ 
          message: "Email already verified" 
        });
      }

      // Generate new verification token
      const newToken = generateVerificationToken();
      await storage.updateUserVerificationToken(user.id, newToken);

      // Send verification email
      await sendVerificationEmail({
        email: user.email,
        username: user.username,
        verificationToken: newToken
      });

      res.status(200).json({ 
        message: "Verification email sent successfully" 
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ 
        message: "Failed to resend verification email" 
      });
    }
  });
}

// Role-based authorization middleware
export function requireRole(role: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = req.user as SelectUser;
    
    // Allow doctor (super user) to access everything
    if (user.role === "doctor") {
      return next();
    }
    
    // Convert single role to array for consistency
    const allowedRoles = Array.isArray(role) ? role : [role];
    
    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    next();
  };
}

// Middleware to restrict access to only patient data that belongs to the logged-in patient
export function requireOwnPatientData() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = req.user as SelectUser;
    
    // Doctors and assistants can access any patient data
    if (user.role === "doctor" || user.role === "assistant") {
      return next();
    }
    
    // For patients, we need to ensure they're only accessing their own data
    if (user.role === "patient") {
      try {
        // Find the patient record for this user
        const patientRecord = await storage.getPatientByUserId(user.id);
        
        if (!patientRecord) {
          return res.status(404).json({ message: "Patient record not found for this user" });
        }
        
        // Check if the requested patient ID matches their own patient ID
        const requestedPatientId = parseInt(req.params.id || req.params.patientId || '0');
        
        if (requestedPatientId && requestedPatientId !== patientRecord.id) {
          return res.status(403).json({ message: "You can only access your own patient data" });
        }
        
        // Add the patient record to the request for convenience
        (req as any).patientRecord = patientRecord;
        
        return next();
      } catch (error) {
        console.error("Error in requireOwnPatientData middleware:", error);
        return res.status(500).json({ message: "Server error" });
      }
    }
    
    // Fallback deny
    return res.status(403).json({ message: "Access denied" });
  };
}