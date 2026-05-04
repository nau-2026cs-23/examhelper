import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db';
import { exams, tasks, insertExamSchema } from '../db/schema';
import { z } from 'zod';
import type { InsertExam } from '../db/schema';

export const examsRepository = {
  async findByUserId(userId: string) {
    return db.select().from(exams).where(eq(exams.userId, userId));
  },

  async findById(id: string, userId: string) {
    const result = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, id), eq(exams.userId, userId)))
      .limit(1);
    return result[0] || null;
  },

  async create(examData: z.infer<typeof insertExamSchema>) {
    const result = await db.insert(exams).values(examData as InsertExam).returning();
    return result[0];
  },

  async update(id: string, userId: string, data: Partial<z.infer<typeof insertExamSchema>>) {
    const result = await db
      .update(exams)
      .set({ ...(data as Partial<InsertExam>), updatedAt: new Date() })
      .where(and(eq(exams.id, id), eq(exams.userId, userId)))
      .returning();
    return result[0] || null;
  },

  async delete(id: string, userId: string) {
    const result = await db
      .delete(exams)
      .where(and(eq(exams.id, id), eq(exams.userId, userId)))
      .returning();
    return result.length > 0;
  },

  async countAll() {
    const result = await db.select({ count: sql<number>`count(*)` }).from(exams);
    return Number(result[0].count);
  },

  async countUpcoming() {
    const today = new Date().toISOString().split('T')[0];
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(exams)
      .where(and(eq(exams.status, 'upcoming'), sql`${exams.examDate} >= ${today}`));
    return Number(result[0].count);
  },

  async getTasksForExam(examId: string, userId: string) {
    return db
      .select()
      .from(tasks)
      .where(and(eq(tasks.examId, examId), eq(tasks.userId, userId)));
  },
};
