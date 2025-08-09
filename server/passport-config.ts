import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { storage } from './storage';
import { AuthService } from './auth';

// Configure Passport Local Strategy for team login
passport.use('team-login', new LocalStrategy(
  {
    usernameField: 'teamNumber',
    passwordField: 'password'
  },
  async (teamNumber, password, done) => {
    try {
      const teamNum = parseInt(teamNumber);
      if (isNaN(teamNum) || teamNum < 1 || teamNum > 9) {
        return done(null, false, { message: 'Invalid team number' });
      }

      // Try database authentication first
      const user = await storage.getUserByTeam(teamNum);
      
      if (user && user.passwordHash) {
        // Database authentication
        const isValid = await AuthService.verifyPassword(password, user.passwordHash);
        if (isValid && user.isActive === "true") {
          // Update last login
          await storage.updateUserLogin(teamNum);
          return done(null, { teamNumber: user.teamNumber, isAdmin: false, teamName: user.teamName });
        }
      } else if (teamNum) {
        // Fallback to environment variable authentication
        const teamPasswordKey = `TEAM_${teamNum}_PASSWORD`;
        const expectedPassword = process.env[teamPasswordKey];
        
        if (expectedPassword && password === expectedPassword) {
          // Create user if doesn't exist
          let envUser = user;
          if (!envUser) {
            envUser = await storage.createUser({
              teamNumber: teamNum,
              isAdmin: "false",
              isActive: "true"
            });
          }
          
          await storage.updateUserLogin(teamNum);
          return done(null, { teamNumber: envUser.teamNumber, isAdmin: false, teamName: envUser.teamName });
        }
      }
      
      return done(null, false, { message: 'Invalid team number or password' });
    } catch (error) {
      return done(error);
    }
  }
));

// Configure Passport Local Strategy for admin login
passport.use('admin-login', new LocalStrategy(
  {
    usernameField: 'password',
    passwordField: 'password'
  },
  async (password, _, done) => {
    try {
      const expectedPassword = process.env.ADMIN_PASSWORD;
      if (expectedPassword && password === expectedPassword) {
        return done(null, { teamNumber: 0, isAdmin: true, teamName: "Admin" });
      }
      return done(null, false, { message: 'Invalid admin password' });
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;