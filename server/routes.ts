import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFileSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import session from "express-session";
import MemoryStore from "memorystore";

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
  
  // Authentication helper
  function requireAuth(req: Request, res: Response, next: Function) {
    if (req.session.user) {
      next();
    } else {
      res.status(401).json({ message: "Authentication required" });
    }
  }
  
  function requireAdmin(req: Request, res: Response, next: Function) {
    if (req.session.user && req.session.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "Admin access required" });
    }
  }
  
  // Team login
  app.post("/api/login", async (req, res) => {
    try {
      const { teamNumber, password } = req.body;
      
      if (!teamNumber || !password) {
        return res.status(400).json({ message: "Team number and password required" });
      }
      
      // Get team password from environment
      const teamPasswordKey = `TEAM_${teamNumber}_PASSWORD`;
      const expectedPassword = process.env[teamPasswordKey];
      
      if (!expectedPassword) {
        return res.status(401).json({ message: "Invalid team number" });
      }
      
      if (password !== expectedPassword) {
        return res.status(401).json({ message: "Invalid password" });
      }
      
      // Check if user exists, create if not
      let user = await storage.getUserByTeam(parseInt(teamNumber));
      if (!user) {
        user = await storage.createUser({
          teamNumber: parseInt(teamNumber),
          isAdmin: "false"
        });
      }
      
      // Update login time
      await storage.updateUserLogin(parseInt(teamNumber));
      
      // Set session
      req.session.user = {
        teamNumber: parseInt(teamNumber),
        isAdmin: user.isAdmin === "true"
      };
      
      res.json({ 
        message: "Login successful", 
        user: { 
          teamNumber: user.teamNumber, 
          isAdmin: user.isAdmin === "true" 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  // Admin login (separate endpoint for instructor access)
  app.post("/api/admin-login", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password required" });
      }
      
      const expectedPassword = process.env.ADMIN_PASSWORD;
      if (!expectedPassword || password !== expectedPassword) {
        return res.status(401).json({ message: "Invalid admin password" });
      }
      
      // Set admin session
      req.session.user = {
        teamNumber: 0, // Admin has special team number 0
        isAdmin: true
      };
      
      res.json({ 
        message: "Admin login successful", 
        user: { 
          teamNumber: 0, 
          isAdmin: true 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Admin login failed" });
    }
  });
  
  // Get current user
  app.get("/api/user", (req, res) => {
    if (req.session.user) {
      res.json(req.session.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
  
  // Logout
  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logout successful" });
    });
  });
  
  // Assignment settings routes
  app.get("/api/assignment-settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAssignmentSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve assignment settings" });
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
      const user = req.session.user!;
      
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
          
        files = files.filter(file => 
          file.teamNumber === user.teamNumber || // Own team's files
          openAssignments.includes(file.assignment) // Open view assignments
        );
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

      const { label, assignment, tags, description } = req.body;
      const user = req.session.user!;
      
      // Use logged-in user's team number
      const teamNumber = user.teamNumber;
      
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
      
      const user = req.session.user!;
      
      // Check permission to download file
      if (!user.isAdmin) {
        const assignmentSetting = await storage.getAssignmentSetting(file.assignment);
        const isOpenView = assignmentSetting && assignmentSetting.isOpenView === "true";
        
        if (file.teamNumber !== user.teamNumber && !isOpenView) {
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