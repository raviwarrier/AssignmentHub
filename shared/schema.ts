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
  isAdmin: text("is_admin").notNull().default("false"),
  lastLogin: timestamp("last_login"),
});

export const assignmentSettings = pgTable("assignment_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignment: text("assignment").notNull().unique(),
  isOpenView: text("is_open_view").notNull().default("false"),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  teamNumber: true,
  isAdmin: true,
});

export const insertAssignmentSettingsSchema = createInsertSchema(assignmentSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAssignmentSettings = z.infer<typeof insertAssignmentSettingsSchema>;
export type AssignmentSettings = typeof assignmentSettings.$inferSelect;
