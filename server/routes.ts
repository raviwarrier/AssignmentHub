import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFileSchema, registerUserSchema } from "@shared/schema";
import { AuthService } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from './passport-config';

// Configure session store
const MemoryStoreConstructor = MemoryStore(session);

// Extend Request type to include user session
declare module "express-session" {
  interface SessionData {
    user?: {
      teamNumber: number;
      isAdmin: boolean;
    };
  }
}

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

const storage_multer = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported. Only JPG, PNG, PDF, DOCX, and PPTX files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreConstructor({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: false, // set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Authentication helper
  function requireAuth(req: Request, res: Response, next: Function) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).json({ message: "Authentication required" });
    }
  }
  
  function requireAdmin(req: Request, res: Response, next: Function) {
    if (req.isAuthenticated() && req.user && (req.user as any).isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "Admin access required" });
    }
  }
  
  // Team registration
  app.post("/api/register", async (req, res) => {
    try {
      const result = registerUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid registration data", 
          errors: result.error.issues.map(issue => issue.message)
        });
      }

      const { teamNumber, teamName, password } = result.data;

      // Check if team number is already taken
      const existingUser = await storage.getUserByTeam(teamNumber);
      if (existingUser && existingUser.passwordHash) {
        return res.status(409).json({ message: "Team number already registered" });
      }

      // Check if team name is available (only if team name is provided)
      if (teamName && teamName.trim()) {
        const isTeamNameAvailable = await storage.checkTeamNameAvailable(teamName);
        if (!isTeamNameAvailable) {
          return res.status(409).json({ message: "Team name already taken" });
        }
      }

      // Validate password strength
      const passwordValidation = AuthService.validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: "Password does not meet requirements", 
          errors: passwordValidation.errors 
        });
      }

      // Validate team name (only if provided)
      if (teamName && teamName.trim()) {
        const teamNameValidation = AuthService.validateTeamName(teamName);
        if (!teamNameValidation.isValid) {
          return res.status(400).json({ 
            message: "Invalid team name", 
            errors: teamNameValidation.errors 
          });
        }
      }

      // Hash password
      const passwordHash = await AuthService.hashPassword(password);

      // Create or update user
      let user;
      if (existingUser) {
        // Update existing user with new registration data
        await storage.updateUserPassword(teamNumber, passwordHash);
        user = await storage.getUserByTeam(teamNumber);
      } else {
        // Create new user
        user = await storage.createUser({
          teamNumber,
          teamName: teamName?.trim() || null,
          passwordHash,
          isAdmin: "false",
          isActive: "true"
        });
      }

      res.status(201).json({ 
        message: "Team registered successfully",
        team: {
          teamNumber: user?.teamNumber,
          teamName: user?.teamName
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Team login using Passport.js
  app.post("/api/login", (req, res, next) => {
    passport.authenticate('team-login', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login error" });
        }
        return res.json({ 
          message: "Login successful", 
          user: user
        });
      });
    })(req, res, next);
  });
  
  // Admin login using Passport.js
  app.post("/api/admin-login", (req, res, next) => {
    passport.authenticate('admin-login', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Admin login error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid admin password" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login error" });
        }
        return res.json({ 
          message: "Admin login successful", 
          user: user
        });
      });
    })(req, res, next);
  });
  
  // Get current user
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });


  // Get all teams (admin only)
  app.get("/api/admin/teams", requireAdmin, async (req, res) => {
    console.log('DEBUG: Teams endpoint called');
    try {
      console.log('DEBUG: About to call storage.getAllUsers()');
      let users = [];
      
      try {
        users = await storage.getAllUsers();
        console.log('DEBUG: Raw users from storage:', users);
        console.log('DEBUG: Users is array?', Array.isArray(users));
      } catch (error) {
        console.log('DEBUG: No users found, returning empty array:', error.message);
        return res.json([]);
      }
      
      if (!Array.isArray(users)) {
        console.error('DEBUG: Users is not an array!');
        return res.json([]);
      }
      
      const teams = users
        .filter(user => user.teamNumber !== 0) // Exclude admin
        .map(user => ({
          teamNumber: user.teamNumber,
          teamName: user.teamName || `Team ${user.teamNumber}`,
          hasPassword: !!user.passwordHash,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          isActive: user.isActive === true || user.isActive === "true"
        }));
      console.log('DEBUG: Processed teams:', teams);
      res.json(teams);
    } catch (error) {
      console.error('DEBUG: Teams endpoint error:', error);
      res.status(500).json({ message: "Failed to retrieve teams", error: error.message });
    }
  });

  // Delete all files for a specific team (admin only)
  app.delete("/api/admin/teams/:teamNumber/files", requireAdmin, async (req, res) => {
    try {
      const { adminPassword } = req.body;
      const teamNumber = parseInt(req.params.teamNumber);
      const expectedPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_DELETE_PASSWORD;
      
      if (!expectedPassword) {
        return res.status(500).json({ message: "Admin password not configured" });
      }

      if (adminPassword !== expectedPassword) {
        return res.status(401).json({ message: "Invalid admin password" });
      }

      if (isNaN(teamNumber)) {
        return res.status(400).json({ message: "Invalid team number" });
      }

      // Get all files for the team
      const teamFiles = await storage.getFilesByTeam(teamNumber);
      
      // Delete files from disk and database
      const uploadDir = path.join(process.cwd(), 'uploads');
      let deletedCount = 0;
      
      for (const file of teamFiles) {
        const filePath = path.join(uploadDir, file.fileName);
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.error(`Failed to delete file from disk: ${file.fileName}`, error);
        }
        
        const deleted = await storage.deleteFile(file.id);
        if (deleted) deletedCount++;
      }

      res.json({ 
        message: `Deleted ${deletedCount} files for Team ${teamNumber}`,
        deletedCount
      });
    } catch (error) {
      console.error('Delete team files error:', error);
      res.status(500).json({ message: "Failed to delete team files" });
    }
  });

  // Delete team (admin only)
  app.delete("/api/admin/teams/:teamNumber", requireAdmin, async (req, res) => {
    try {
      const { adminPassword } = req.body;
      const teamNumber = parseInt(req.params.teamNumber);
      const expectedPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_DELETE_PASSWORD;
      
      if (!expectedPassword) {
        return res.status(500).json({ message: "Admin password not configured" });
      }

      if (adminPassword !== expectedPassword) {
        return res.status(401).json({ message: "Invalid admin password" });
      }

      if (isNaN(teamNumber) || teamNumber === 0) {
        return res.status(400).json({ message: "Invalid team number" });
      }

      // First delete all team files
      const teamFiles = await storage.getFilesByTeam(teamNumber);
      const uploadDir = path.join(process.cwd(), 'uploads');
      
      for (const file of teamFiles) {
        const filePath = path.join(uploadDir, file.fileName);
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.error(`Failed to delete file from disk: ${file.fileName}`, error);
        }
        await storage.deleteFile(file.id);
      }

      // Delete team user (if exists in database)
      await storage.deleteUser(teamNumber);

      res.json({ 
        message: `Team ${teamNumber} deleted successfully`,
        filesDeleted: teamFiles.length
      });
    } catch (error) {
      console.error('Delete team error:', error);
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Reset server for new semester (admin only)
  app.post("/api/admin/reset-server", requireAdmin, async (req, res) => {
    try {
      const { adminPassword, confirmText } = req.body;
      const expectedPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_DELETE_PASSWORD;
      
      if (!expectedPassword) {
        return res.status(500).json({ message: "Admin password not configured" });
      }

      if (adminPassword !== expectedPassword) {
        return res.status(401).json({ message: "Invalid admin password" });
      }

      if (confirmText !== "RESET ALL DATA") {
        return res.status(400).json({ message: "Confirmation text incorrect" });
      }

      // Check what data exists first
      let allFiles = [];
      let allUsers = [];
      let hasAssignments = false;

      try {
        allFiles = await storage.getAllFiles();
      } catch (error) {
        console.log('No files to delete or error fetching files:', error.message);
        allFiles = [];
      }

      try {
        allUsers = await storage.getAllUsers();
        // Filter out admin from count
        allUsers = allUsers.filter(user => user.teamNumber !== 0);
      } catch (error) {
        console.log('No users to delete or error fetching users:', error.message);
        allUsers = [];
      }

      // Check if assignment settings exist
      try {
        const assignments = await storage.getAllAssignmentSettings();
        hasAssignments = assignments && assignments.length > 0;
      } catch (error) {
        console.log('No assignment settings to reset or error fetching settings:', error.message);
        hasAssignments = false;
      }

      // If everything is empty, return early with appropriate message
      if (allFiles.length === 0 && allUsers.length === 0 && !hasAssignments) {
        return res.json({ 
          message: "No data to reset - server is already clean",
          filesDeleted: 0,
          usersDeleted: 0,
          assignmentsReset: 0,
          details: "No files, users, or assignment settings found in the database."
        });
      }

      let filesDeleted = 0;
      let usersDeleted = 0;
      let assignmentsReset = 0;

      // Delete files if any exist
      if (allFiles.length > 0) {
        const uploadDir = path.join(process.cwd(), 'uploads');
        
        for (const file of allFiles) {
          const filePath = path.join(uploadDir, file.fileName);
          try {
            await fs.unlink(filePath);
            filesDeleted++;
          } catch (error) {
            console.error(`Failed to delete file from disk: ${file.fileName}`, error);
          }
          try {
            await storage.deleteFile(file.id);
          } catch (error) {
            console.error(`Failed to delete file from database: ${file.id}`, error);
          }
        }
      }

      // Delete users if any exist (except admin)
      if (allUsers.length > 0) {
        for (const user of allUsers) {
          try {
            const deleted = await storage.deleteUser(user.teamNumber);
            if (deleted) usersDeleted++;
          } catch (error) {
            console.error(`Failed to delete user ${user.teamNumber}:`, error);
          }
        }
      }

      // Reset assignment settings to closed (preserve the settings, just reset flags)
      if (hasAssignments) {
        const existingAssignments = await storage.getAllAssignmentSettings();
        
        for (const setting of existingAssignments) {
          try {
            await storage.updateAssignmentSetting(setting.assignment, false);
            assignmentsReset++;
          } catch (error) {
            console.error(`Failed to reset assignment setting: ${setting.assignment}`, error);
          }
        }
      }

      // Prepare response message
      const actions = [];
      if (filesDeleted > 0) actions.push(`${filesDeleted} files deleted`);
      if (usersDeleted > 0) actions.push(`${usersDeleted} users deleted`);
      if (assignmentsReset > 0) actions.push(`${assignmentsReset} assignments reset`);

      const message = actions.length > 0 
        ? `Server reset successful: ${actions.join(', ')}`
        : "Server reset completed - no data needed to be cleared";

      res.json({ 
        message,
        filesDeleted,
        usersDeleted,
        assignmentsReset,
        details: actions.length > 0 ? `Processed: ${actions.join(', ')}` : "No data required processing"
      });
    } catch (error) {
      console.error('Server reset error:', error);
      res.status(500).json({ message: "Failed to reset server" });
    }
  });

  // Change password
  app.put("/api/user/password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user as any;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password required" });
      }

      // Get user from database
      const dbUser = await storage.getUserByTeam(user.teamNumber);
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password (support both database and environment auth)
      let currentPasswordValid = false;
      if (dbUser.passwordHash) {
        // Database authentication
        currentPasswordValid = await AuthService.verifyPassword(currentPassword, dbUser.passwordHash);
      } else {
        // Environment authentication fallback
        const teamPasswordKey = `TEAM_${user.teamNumber}_PASSWORD`;
        const expectedPassword = process.env[teamPasswordKey];
        currentPasswordValid = currentPassword === expectedPassword;
      }

      if (!currentPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Validate new password strength
      const passwordValidation = AuthService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: "New password does not meet requirements", 
          errors: passwordValidation.errors 
        });
      }

      // Hash and update password
      const newPasswordHash = await AuthService.hashPassword(newPassword);
      await storage.updateUserPassword(user.teamNumber, newPasswordHash);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });
  
  // Logout
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });
  
  // Assignment settings routes
  app.get("/api/assignment-settings", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      let settings = [];
      
      try {
        settings = await storage.getAssignmentSettings();
      } catch (error) {
        console.log('No assignment settings found, returning empty array:', error.message);
        settings = [];
      }
      
      if (user.isAdmin) {
        // Admin gets all settings
        res.json(settings);
      } else {
        // Students only get the assignment names and open view status (not edit capabilities)
        res.json(settings.map(setting => ({
          assignment: setting.assignment,
          isOpenView: setting.isOpenView
        })));
      }
    } catch (error) {
      console.error('Assignment settings error:', error);
      res.status(500).json({ message: "Failed to retrieve assignment settings", error: error.message });
    }
  });
  
  app.put("/api/assignment-settings", requireAdmin, async (req, res) => {
    try {
      const { assignment, isOpenView } = req.body;
      
      if (!assignment || typeof isOpenView !== "boolean") {
        return res.status(400).json({ message: "Assignment and isOpenView required" });
      }
      
      const setting = await storage.updateAssignmentSetting(assignment, isOpenView);
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to update assignment setting" });
    }
  });

  // Get all files (with permission checks)
  app.get("/api/files", requireAuth, async (req, res) => {
    try {
      const { team, type, assignment, search } = req.query;
      const user = req.user as any;
      
      let files;
      if (search) {
        files = await storage.searchFiles(search as string);
      } else if (team) {
        files = await storage.getFilesByTeam(parseInt(team as string));
      } else if (type) {
        files = await storage.getFilesByType(type as string);
      } else if (assignment) {
        files = await storage.getFilesByAssignment(assignment as string);
      } else {
        files = await storage.getAllFiles();
      }
      
      // Filter files based on permissions
      if (!user.isAdmin) {
        // Students can only see files from assignments marked as "open view" or their own team's files
        const assignmentSettings = await storage.getAssignmentSettings();
        const openAssignments = assignmentSettings
          .filter(setting => setting.isOpenView === "true")
          .map(setting => setting.assignment);
        
        files = files.filter(file => {
          const isOwnFile = file.teamNumber === user.teamNumber;
          
          // For admin files (team 0): ONLY check individual visibility, ignore assignment settings
          if (file.teamNumber === 0) {
            const shouldShow = file.isVisible === "true";
            console.log(`DEBUG: Admin file ${file.id} visibility=${file.isVisible} -> ${shouldShow ? 'SHOW' : 'HIDE'}`);
            return shouldShow;
          }
          
          // For other team files: check if assignment is open
          const isOtherTeamInOpenAssignment = openAssignments.includes(file.assignment);
          const shouldShow = isOwnFile || isOtherTeamInOpenAssignment;
          console.log(`DEBUG: Team ${file.teamNumber} file ${file.id} -> ${shouldShow ? 'SHOW' : 'HIDE'}`);
          return shouldShow;
        });
        
        console.log(`DEBUG: Final files for team ${user.teamNumber}:`, files.map(f => ({ id: f.id, team: f.teamNumber, visible: f.isVisible })));
      }
      
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve files" });
    }
  });

  // Upload files (require authentication)
  app.post("/api/files/upload", requireAuth, upload.array('files', 10), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const { label, assignment, tags, description, isVisible } = req.body;
      const user = req.user as any;
      
      // Admin users get assigned to Team 0, others use their actual team number
      const teamNumber = user.isAdmin ? 0 : user.teamNumber;
      
      // Parse tags if it's a string
      let parsedTags = [];
      if (tags) {
        parsedTags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags;
      }

      const files = req.files as Express.Multer.File[];
      const uploadedFiles = [];

      for (const file of files) {
        const fileData = {
          label,
          originalName: file.originalname,
          fileName: file.filename,
          fileType: path.extname(file.originalname),
          fileSize: file.size,
          teamNumber: teamNumber,
          assignment,
          tags: parsedTags,
          description: description || null,
          isVisible: user.isAdmin ? (isVisible || "true") : "true",
        };

        const result = insertFileSchema.safeParse(fileData);
        if (!result.success) {
          // Clean up uploaded file on validation error
          await fs.unlink(file.path).catch(console.error);
          return res.status(400).json({ message: "Invalid file data", errors: result.error.issues });
        }

        const savedFile = await storage.createFile({ ...result.data, fileName: file.filename });
        uploadedFiles.push(savedFile);
      }

      res.json({ message: "Files uploaded successfully", files: uploadedFiles });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  // Serve uploaded files (with permission check)
  app.get("/api/files/:id/download", requireAuth, async (req, res) => {
    try {
      const file = await storage.getFileById(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      const user = req.user as any;
      
      // Check permission to download file
      if (!user.isAdmin) {
        const assignmentSetting = await storage.getAssignmentSetting(file.assignment);
        const isOpenView = assignmentSetting && assignmentSetting.isOpenView === "true";
        
        if (file.teamNumber !== user.teamNumber && !isOpenView && !(file.teamNumber === 0 && file.isVisible === "true")) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const filePath = path.join(uploadsDir, file.fileName);
      
      // Check if file exists on disk
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ message: "File not found on disk" });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.sendFile(filePath);
    } catch (error) {
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Admin delete all files
  app.delete("/api/files/all", requireAdmin, async (req, res) => {
    try {
      const files = await storage.getAllFiles();
      
      // Delete all files from disk
      for (const file of files) {
        const filePath = path.join(uploadsDir, file.fileName);
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.error(`Failed to delete file from disk: ${file.fileName}`, error);
        }
      }
      
      // Clear all files from storage
      for (const file of files) {
        await storage.deleteFile(file.id);
      }
      
      res.json({ 
        message: "All files deleted successfully", 
        deletedCount: files.length 
      });
    } catch (error) {
      console.error('Delete all files error:', error);
      res.status(500).json({ message: "Failed to delete all files" });
    }
  });

  // Update file visibility (admin only)
  app.put("/api/files/:id/visibility", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { isVisible } = req.body;
      const file = await storage.getFileById(req.params.id);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Only allow admin to modify their own files (team 0)
      if (file.teamNumber !== 0) {
        return res.status(403).json({ message: "Can only modify your own files" });
      }

      // Update file visibility using the storage method we'll need to add
      const updated = await storage.updateFileVisibility(req.params.id, isVisible);
      if (!updated) {
        return res.status(404).json({ message: "File not found" });
      }

      res.json({ message: "File visibility updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update file visibility" });
    }
  });

  // Update file details (admin only for their files)
  app.put("/api/files/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { label, description, tags } = req.body;
      const file = await storage.getFileById(req.params.id);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Only allow admin to modify their own files (team 0) or let users modify their own files
      if (file.teamNumber !== user.teamNumber && !(user.isAdmin && file.teamNumber === 0)) {
        return res.status(403).json({ message: "Can only modify your own files" });
      }

      const updated = await storage.updateFileDetails(req.params.id, { label, description, tags });
      if (!updated) {
        return res.status(404).json({ message: "File not found" });
      }

      res.json({ message: "File updated successfully", file: updated });
    } catch (error) {
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  // Admin delete file
  app.delete("/api/files/:id", async (req, res) => {
    try {
      const { adminPassword } = req.body;
      const expectedPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_DELETE_PASSWORD;
      
      if (!expectedPassword) {
        return res.status(500).json({ message: "Admin password not configured" });
      }

      if (adminPassword !== expectedPassword) {
        return res.status(401).json({ message: "Invalid admin password" });
      }

      const file = await storage.getFileById(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Delete file from disk
      const filePath = path.join(uploadsDir, file.fileName);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Failed to delete file from disk:', error);
      }

      // Delete from storage
      const deleted = await storage.deleteFile(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "File not found" });
      }

      res.json({ message: "File deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}