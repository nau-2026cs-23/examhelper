import { pgTable, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(1).max(100),
  email: z.string().email(),
  passwordHash: z.string().min(1),
  role: z.enum(['user', 'admin']).default('user'),
  status: z.enum(['active', 'disabled']).default('active'),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Exams table
export const exams = pgTable('exams', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  examType: text('exam_type').notNull().default('other'),
  examDate: text('exam_date').notNull(),
  examTime: text('exam_time').notNull(),
  location: text('location').notNull(),
  description: text('description'),
  reviewProgress: integer('review_progress').notNull().default(0),
  status: text('status').notNull().default('upcoming'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insertExamSchema = createInsertSchema(exams, {
  title: z.string().min(1).max(200),
  subject: z.string().min(1).max(100),
  examType: z.enum(['midterm', 'final', 'quiz', 'certification', 'other']).default('other'),
  examDate: z.string().min(1),
  examTime: z.string().min(1),
  location: z.string().min(1).max(200),
  description: z.string().optional(),
  reviewProgress: z.number().int().min(0).max(100).default(0),
  status: z.enum(['upcoming', 'completed', 'cancelled']).default('upcoming'),
});

export type Exam = typeof exams.$inferSelect;
export type InsertExam = typeof exams.$inferInsert;

// Tasks table
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  examId: text('exam_id').references(() => exams.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority').notNull().default('medium'),
  status: text('status').notNull().default('pending'),
  dueDate: text('due_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks, {
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['pending', 'completed']).default('pending'),
  dueDate: z.string().optional(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// Notification settings table
export const notificationSettings = pgTable('notification_settings', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  channels: jsonb('channels').notNull().default(sql`'["system"]'::jsonb`),
  intervals: jsonb('intervals').notNull().default(sql`'["7days","1day"]'::jsonb`),
  customIntervalDays: integer('custom_interval_days'),
  emailEnabled: boolean('email_enabled').notNull().default(false),
  browserEnabled: boolean('browser_enabled').notNull().default(false),
  systemEnabled: boolean('system_enabled').notNull().default(true),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = typeof notificationSettings.$inferInsert;

// Announcements table
export const announcements = pgTable('announcements', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  content: text('content').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;
