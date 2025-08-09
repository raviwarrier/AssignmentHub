import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  label: text("label").notNull(),
  originalName: text("original_name").notNull(),
  fileName: text("file_name").notNull(), // stored filename
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  teamNumber: integer("team_number").notNull(),
  assignment: text("assignment").notNull(),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  description: text("description"),
  isVisible: text("is_visible").notNull().default("true"), // for admin files visibility control
  uploadedAt: timestamp("uploaded_at").notNull().default(sql`now()`),
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  fileName: true,
  uploadedAt: true,
});

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamNumber: integer("team_number").notNull().unique(),
  teamName: varchar("team_name", { length: 100 }),
  passwordHash: text("password_hash"),
  isAdmin: text("is_admin").notNull().default("false"),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  lastLogin: timestamp("last_login"),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  tokenExpiry: timestamp("token_expiry"),
});

export const assignmentSettings = pgTable("assignment_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignment: text("assignment").notNull().unique(),
  isOpenView: text("is_open_view").notNull().default("false"),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  teamNumber: true,
  teamName: true,
  passwordHash: true,
  isAdmin: true,
  isActive: true,
});

export const registerUserSchema = createInsertSchema(users).pick({
  teamNumber: true,
  teamName: true,
}).extend({
  teamNumber: z.number().int().min(1, "Team number must be at least 1").max(9, "Team number must be at most 9"),
  teamName: z.string().optional(),
  password: z.string().min(12, "Password must be at least 12 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain uppercase, lowercase, number and special character"),
});

export const insertAssignmentSettingsSchema = createInsertSchema(assignmentSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAssignmentSettings = z.infer<typeof insertAssignmentSettingsSchema>;
export type AssignmentSettings = typeof assignmentSettings.$inferSelect;
