import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db';
import { tasks, exams, insertTaskSchema } from '../db/schema';
import { z } from 'zod';
import type { InsertTask } from '../db/schema';

export const tasksRepository = {
  async findByUserId(userId: string) {
    const result = await db
      .select({
        id: tasks.id,
        userId: tasks.userId,
        examId: tasks.examId,
        title: tasks.title,
        description: tasks.description,
        priority: tasks.priority,
        status: tasks.status,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        examTitle: exams.title,
      })
      .from(tasks)
      .leftJoin(exams, eq(tasks.examId, exams.id))
      .where(eq(tasks.userId, userId));
    return result;
  },

  async findById(id: string, userId: string) {
    const result = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);
    return result[0] || null;
  },

  async create(taskData: z.infer<typeof insertTaskSchema>) {
    const result = await db.insert(tasks).values(taskData as InsertTask).returning();
    return result[0];
  },

  async update(id: string, userId: string, data: Partial<z.infer<typeof insertTaskSchema>>) {
    const result = await db
      .update(tasks)
      .set({ ...(data as Partial<InsertTask>), updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return result[0] || null;
  },

  async delete(id: string, userId: string) {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return result.length > 0;
  },

  async countAll() {
    const result = await db.select({ count: sql<number>`count(*)` }).from(tasks);
    return Number(result[0].count);
  },

  async countCompleted() {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(eq(tasks.status, 'completed'));
    return Number(result[0].count);
  },
};
