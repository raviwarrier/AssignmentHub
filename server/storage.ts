import { type User, type InsertUser, type File, type InsertFile, type AssignmentSettings, type InsertAssignmentSettings } from "@shared/schema";
import { randomUUID } from "crypto";

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

export const storage = new MemStorage();
