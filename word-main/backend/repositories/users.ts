import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { users, insertUserSchema, notificationSettings } from '../db/schema';
import { z } from 'zod';
import type { InsertUser } from '../db/schema';

export const usersRepository = {
  async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  },

  async findById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  },

  async create(userData: z.infer<typeof insertUserSchema>) {
    const result = await db.insert(users).values(userData as InsertUser).returning();
    return result[0];
  },

  async update(id: string, data: Partial<z.infer<typeof insertUserSchema>>) {
    const result = await db
      .update(users)
      .set({ ...(data as Partial<InsertUser>), updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0] || null;
  },

  async findAll(page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const result = await db.select().from(users).limit(pageSize).offset(offset);
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    return { users: result, total: Number(countResult[0].count) };
  },

  async initNotificationSettings(userId: string) {
    const existing = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(notificationSettings).values({ userId });
    }
  },

  async getNotificationSettings(userId: string) {
    const result = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId))
      .limit(1);
    return result[0] || null;
  },

  async updateNotificationSettings(userId: string, data: Record<string, unknown>) {
    const existing = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(notificationSettings).values({ userId, ...data });
    } else {
      await db
        .update(notificationSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(notificationSettings.userId, userId));
    }
    return this.getNotificationSettings(userId);
  },
};
