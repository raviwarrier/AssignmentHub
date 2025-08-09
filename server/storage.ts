import { type User, type InsertUser, type File, type InsertFile, type AssignmentSettings, type InsertAssignmentSettings, files, users, assignmentSettings } from "@shared/schema";
import { randomUUID } from "crypto";
// Note: DB import moved inside DBStorage class to avoid connection issues in dev
import { eq, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByTeam(teamNumber: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLogin(teamNumber: number): Promise<void>;
  
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
  getAssignmentSetting(assignment: string): Promise<AssignmentSettings | undefined>;
  updateAssignmentSetting(assignment: string, isOpenView: boolean): Promise<AssignmentSettings>;
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
      ...insertUser, 
      id, 
      isAdmin: insertUser.isAdmin || "false",
      lastLogin: new Date() 
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

  async createFile(fileData: InsertFile & { fileName: string }): Promise<File> {
    const id = randomUUID();
    const file: File = {
      id,
      ...fileData,
      description: fileData.description ?? null,
      tags: fileData.tags ?? [],
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
    return Array.from(this.assignmentSettings.values());
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
    return await this.db.select().from(assignmentSettings);
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
}

// Initialize storage with fallback mechanism
function createStorage(): IStorage {
  try {
    return new DBStorage();
  } catch (error) {
    console.log("🔄 Using memory storage for development (database not accessible)");
    console.log("📝 DEPLOYMENT NOTE: This will automatically use PostgreSQL when deployed on server");
    return new MemStorage();
  }
}

export const storage = createStorage();
