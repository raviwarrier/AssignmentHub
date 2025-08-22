import { type User, type InsertUser, type File, type InsertFile, type AssignmentSettings, type InsertAssignmentSettings, files, users, assignmentSettings } from "@shared/schema";
import { randomUUID } from "crypto";
// Note: DB import moved inside DBStorage class to avoid connection issues in dev
import { eq, like, or, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByTeam(teamNumber: number): Promise<User | undefined>;
  getUserByTeamName(teamName: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLogin(teamNumber: number): Promise<void>;
  updateUserPassword(teamNumber: number, passwordHash: string): Promise<void>;
  checkTeamNameAvailable(teamName: string, excludeTeamNumber?: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  deleteUser(teamNumber: number): Promise<boolean>;
  
  // File operations
  createFile(file: InsertFile & { fileName: string }): Promise<File>;
  getAllFiles(): Promise<File[]>;
  getFileById(id: string): Promise<File | undefined>;
  getFilesByTeam(teamNumber: number): Promise<File[]>;
  getFilesByType(fileType: string): Promise<File[]>;
  getFilesByAssignment(assignment: string): Promise<File[]>;
  searchFiles(query: string): Promise<File[]>;
  deleteFile(id: string): Promise<boolean>;
  updateFileVisibility(id: string, isVisible: string): Promise<File | undefined>;
  updateFileDetails(id: string, updates: { label?: string; description?: string; tags?: string[] }): Promise<File | undefined>;
  
  // Assignment settings operations
  getAssignmentSettings(): Promise<AssignmentSettings[]>;
  getAllAssignmentSettings(): Promise<AssignmentSettings[]>;
  getAssignmentSetting(assignment: string): Promise<AssignmentSettings | undefined>;
  updateAssignmentSetting(assignment: string, isOpenView: boolean): Promise<AssignmentSettings>;
  initializeDefaultAssignmentSettings(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private files: Map<string, File>;
  private assignmentSettings: Map<string, AssignmentSettings>;

  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.assignmentSettings = new Map();
    
    // Initialize default assignment settings
    const assignments = [
      "Assignment 1 - Segmentation and Personas",
      "Assignment 2 - Positioning", 
      "Assignment 3 - Journey Mapping",
      "Assignment 4 - Marketing Channels",
      "Assignment 5 - Pricing",
      "Assignment 6 - Distribution Channels",
      "Assignment 7 - Acquisition",
      "Assignment 8 - Customer Discovery",
      "Assignment 9 - Product Validation"
    ];
    
    assignments.forEach(assignment => {
      const setting: AssignmentSettings = {
        id: randomUUID(),
        assignment,
        isOpenView: "false",
        updatedAt: new Date()
      };
      this.assignmentSettings.set(assignment, setting);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByTeam(teamNumber: number): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.teamNumber === teamNumber,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      teamNumber: insertUser.teamNumber,
      teamName: insertUser.teamName || null,
      passwordHash: insertUser.passwordHash || null,
      isAdmin: insertUser.isAdmin || "false",
      isActive: insertUser.isActive || "true",
      createdAt: new Date(),
      lastLogin: new Date(),
      passwordResetToken: null,
      tokenExpiry: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserLogin(teamNumber: number): Promise<void> {
    const user = await this.getUserByTeam(teamNumber);
    if (user) {
      user.lastLogin = new Date();
      this.users.set(user.id, user);
    }
  }

  async getUserByTeamName(teamName: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.teamName === teamName,
    );
  }

  async updateUserPassword(teamNumber: number, passwordHash: string): Promise<void> {
    const user = await this.getUserByTeam(teamNumber);
    if (user) {
      user.passwordHash = passwordHash;
      this.users.set(user.id, user);
    }
  }

  async checkTeamNameAvailable(teamName: string, excludeTeamNumber?: number): Promise<boolean> {
    const existingUser = Array.from(this.users.values()).find(
      (user) => user.teamName?.toLowerCase() === teamName.toLowerCase() && user.teamNumber !== excludeTeamNumber
    );
    return !existingUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => a.teamNumber - b.teamNumber);
  }

  async deleteUser(teamNumber: number): Promise<boolean> {
    const user = await this.getUserByTeam(teamNumber);
    if (user) {
      return this.users.delete(user.id);
    }
    return false;
  }

  async createFile(fileData: InsertFile & { fileName: string }): Promise<File> {
    const id = randomUUID();
    const file: File = {
      id,
      ...fileData,
      description: fileData.description ?? null,
      tags: fileData.tags ?? [],
      isVisible: fileData.isVisible ?? "true",
      uploadedAt: new Date(),
    };
    this.files.set(id, file);
    return file;
  }

  async getAllFiles(): Promise<File[]> {
    return Array.from(this.files.values()).sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  async getFileById(id: string): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFilesByTeam(teamNumber: number): Promise<File[]> {
    return Array.from(this.files.values())
      .filter(file => file.teamNumber === teamNumber)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  async getFilesByType(fileType: string): Promise<File[]> {
    return Array.from(this.files.values())
      .filter(file => file.fileType.toLowerCase().includes(fileType.toLowerCase()))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  async getFilesByAssignment(assignment: string): Promise<File[]> {
    return Array.from(this.files.values())
      .filter(file => file.assignment === assignment)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  async searchFiles(query: string): Promise<File[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.files.values())
      .filter(file => 
        file.label.toLowerCase().includes(lowerQuery) ||
        file.originalName.toLowerCase().includes(lowerQuery) ||
        file.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        (file.description && file.description.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  async deleteFile(id: string): Promise<boolean> {
    return this.files.delete(id);
  }

  async updateFileVisibility(id: string, isVisible: string): Promise<File | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;
    
    const updatedFile = { ...file, isVisible };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async updateFileDetails(id: string, updates: { label?: string; description?: string; tags?: string[] }): Promise<File | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;
    
    const updatedFile = {
      ...file,
      ...(updates.label && { label: updates.label }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.tags && { tags: updates.tags })
    };
    this.files.set(id, updatedFile);
    return updatedFile;
  }
  
  // Assignment settings operations
  async getAssignmentSettings(): Promise<AssignmentSettings[]> {
    return Array.from(this.assignmentSettings.values()).sort((a, b) => a.assignment.localeCompare(b.assignment));
  }

  async getAllAssignmentSettings(): Promise<AssignmentSettings[]> {
    return this.getAssignmentSettings();
  }

  async getAssignmentSetting(assignment: string): Promise<AssignmentSettings | undefined> {
    return this.assignmentSettings.get(assignment);
  }

  async updateAssignmentSetting(assignment: string, isOpenView: boolean): Promise<AssignmentSettings> {
    let setting = this.assignmentSettings.get(assignment);
    if (!setting) {
      setting = {
        id: randomUUID(),
        assignment,
        isOpenView: isOpenView.toString(),
        updatedAt: new Date()
      };
    } else {
      setting = {
        ...setting,
        isOpenView: isOpenView.toString(),
        updatedAt: new Date()
      };
    }
    this.assignmentSettings.set(assignment, setting);
    return setting;
  }

  async initializeDefaultAssignmentSettings(): Promise<void> {
    // Only initialize if empty
    if (this.assignmentSettings.size === 0) {
      const defaultAssignments = [
        "Assignment 1 - Segmentation and Personas",
        "Assignment 2 - Positioning", 
        "Assignment 3 - Journey Mapping",
        "Assignment 4 - Marketing Channels",
        "Assignment 5 - Pricing",
        "Assignment 6 - Distribution Channels",
        "Assignment 7 - Acquisition",
        "Assignment 8 - Customer Discovery",
        "Assignment 9 - Product Validation"
      ];
      
      for (const assignment of defaultAssignments) {
        await this.updateAssignmentSetting(assignment, false);
      }
    }
  }
}

class DBStorage implements IStorage {
  private db: any;
  
  constructor() {
    // Import db inside constructor to avoid connection issues in dev
    try {
      const dbModule = require("./db");
      this.db = dbModule.db;
    } catch (error) {
      console.error("Database connection failed, falling back to memory storage");
      throw error;
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByTeam(teamNumber: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.teamNumber, teamNumber)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values({
      id: randomUUID(),
      ...user
    }).returning();
    return result[0];
  }

  async updateUserLogin(teamNumber: number): Promise<void> {
    await this.db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.teamNumber, teamNumber));
  }

  async getUserByTeamName(teamName: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.teamName, teamName)).limit(1);
    return result[0];
  }

  async updateUserPassword(teamNumber: number, passwordHash: string): Promise<void> {
    await this.db.update(users)
      .set({ passwordHash })
      .where(eq(users.teamNumber, teamNumber));
  }

  async checkTeamNameAvailable(teamName: string, excludeTeamNumber?: number): Promise<boolean> {
    let query = this.db.select().from(users).where(eq(users.teamName, teamName));
    
    if (excludeTeamNumber !== undefined) {
      const { and, ne } = await import("drizzle-orm");
      query = this.db.select().from(users).where(
        and(
          eq(users.teamName, teamName),
          ne(users.teamNumber, excludeTeamNumber)
        )
      );
    }
    
    const result = await query.limit(1);
    return result.length === 0;
  }

  async getAllUsers(): Promise<User[]> {
    const { asc } = await import("drizzle-orm");
    return await this.db.select().from(users).orderBy(asc(users.teamNumber));
  }

  async deleteUser(teamNumber: number): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.teamNumber, teamNumber)).returning();
    return result.length > 0;
  }

  // File operations
  async createFile(file: InsertFile & { fileName: string }): Promise<File> {
    const result = await this.db.insert(files).values({
      id: randomUUID(),
      ...file
    }).returning();
    return result[0];
  }

  async getAllFiles(): Promise<File[]> {
    return await this.db.select().from(files);
  }

  async getFileById(id: string): Promise<File | undefined> {
    const result = await this.db.select().from(files).where(eq(files.id, id)).limit(1);
    return result[0];
  }

  async getFilesByTeam(teamNumber: number): Promise<File[]> {
    return await this.db.select().from(files).where(eq(files.teamNumber, teamNumber));
  }

  async getFilesByType(fileType: string): Promise<File[]> {
    return await this.db.select().from(files).where(eq(files.fileType, fileType));
  }

  async getFilesByAssignment(assignment: string): Promise<File[]> {
    return await this.db.select().from(files).where(eq(files.assignment, assignment));
  }

  async searchFiles(query: string): Promise<File[]> {
    return await this.db.select().from(files).where(
      or(
        like(files.label, `%${query}%`),
        like(files.originalName, `%${query}%`),
        like(files.description, `%${query}%`)
      )
    );
  }

  async deleteFile(id: string): Promise<boolean> {
    const result = await this.db.delete(files).where(eq(files.id, id)).returning();
    return result.length > 0;
  }

  async updateFileVisibility(id: string, isVisible: string): Promise<File | undefined> {
    const result = await this.db.update(files)
      .set({ isVisible })
      .where(eq(files.id, id))
      .returning();
    return result[0];
  }

  async updateFileDetails(id: string, updates: { label?: string; description?: string; tags?: string[] }): Promise<File | undefined> {
    const updateData: any = {};
    if (updates.label) updateData.label = updates.label;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.tags) updateData.tags = updates.tags;
    
    const result = await this.db.update(files)
      .set(updateData)
      .where(eq(files.id, id))
      .returning();
    return result[0];
  }

  // Assignment settings operations
  async getAssignmentSettings(): Promise<AssignmentSettings[]> {
    return await this.db.select().from(assignmentSettings).orderBy(asc(assignmentSettings.assignment));
  }

  async getAllAssignmentSettings(): Promise<AssignmentSettings[]> {
    return this.getAssignmentSettings();
  }

  async getAssignmentSetting(assignment: string): Promise<AssignmentSettings | undefined> {
    const result = await this.db.select().from(assignmentSettings).where(eq(assignmentSettings.assignment, assignment)).limit(1);
    return result[0];
  }

  async updateAssignmentSetting(assignment: string, isOpenView: boolean): Promise<AssignmentSettings> {
    const existing = await this.getAssignmentSetting(assignment);
    
    if (existing) {
      const result = await this.db.update(assignmentSettings)
        .set({ 
          isOpenView: isOpenView.toString(),
          updatedAt: new Date()
        })
        .where(eq(assignmentSettings.assignment, assignment))
        .returning();
      return result[0];
    } else {
      const result = await this.db.insert(assignmentSettings).values({
        id: randomUUID(),
        assignment,
        isOpenView: isOpenView.toString(),
        updatedAt: new Date()
      }).returning();
      return result[0];
    }
  }

  async initializeDefaultAssignmentSettings(): Promise<void> {
    // Only initialize if table is empty
    const existing = await this.getAssignmentSettings();
    if (existing.length === 0) {
      const defaultAssignments = [
        "Assignment 1 - Segmentation and Personas",
        "Assignment 2 - Positioning", 
        "Assignment 3 - Journey Mapping",
        "Assignment 4 - Marketing Channels",
        "Assignment 5 - Pricing",
        "Assignment 6 - Distribution Channels",
        "Assignment 7 - Acquisition",
        "Assignment 8 - Customer Discovery",
        "Assignment 9 - Product Validation"
      ];
      
      for (const assignment of defaultAssignments) {
        await this.updateAssignmentSetting(assignment, false);
      }
    }
  }
}

// Initialize storage with fallback mechanism
async function createStorage(): Promise<IStorage> {
  let storageInstance: IStorage;
  
  try {
    storageInstance = new DBStorage();
  } catch (error) {
    console.log("🔄 Using memory storage for development (database not accessible)");
    console.log("📝 DEPLOYMENT NOTE: This will automatically use PostgreSQL when deployed on server");
    storageInstance = new MemStorage();
  }
  
  // Initialize default assignment settings on first run
  try {
    await storageInstance.initializeDefaultAssignmentSettings();
  } catch (error) {
    console.log("Note: Could not initialize assignment settings:", (error as Error).message);
  }
  
  return storageInstance;
}

// Create storage instance (async initialization will happen when first used)
let storageInstance: IStorage | null = null;
export const storage = new Proxy({} as IStorage, {
  get: function(target, prop, receiver) {
    if (!storageInstance) {
      // Initialize synchronously for first access, but log a warning
      try {
        storageInstance = new DBStorage();
        // Queue async initialization
        storageInstance.initializeDefaultAssignmentSettings().catch(err => 
          console.log("Note: Could not initialize assignment settings:", err.message)
        );
      } catch (error) {
        console.log("🔄 Using memory storage for development (database not accessible)");
        console.log("📝 DEPLOYMENT NOTE: This will automatically use PostgreSQL when deployed on server");
        storageInstance = new MemStorage();
        // Queue async initialization
        storageInstance.initializeDefaultAssignmentSettings().catch(err => 
          console.log("Note: Could not initialize assignment settings:", err.message)
        );
      }
    }
    return (storageInstance as any)[prop];
  }
});
