import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticateJWT, requireAdmin, AuthRequest } from '../middleware/auth';
import { usersRepository } from '../repositories/users';
import { examsRepository } from '../repositories/exams';
import { tasksRepository } from '../repositories/tasks';
import { db } from '../db';
import { announcements } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticateJWT);
router.use(requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (_req, res) => {
  try {
    const { total: totalUsers } = await usersRepository.findAll(1, 1);
    const { users: allUsers } = await usersRepository.findAll(1, 10000);
    const activeUsers = allUsers.filter(u => u.status === 'active').length;
    const totalExams = await examsRepository.countAll();
    const upcomingExams = await examsRepository.countUpcoming();
    const totalTasks = await tasksRepository.countAll();
    const completedTasks = await tasksRepository.countCompleted();
    return res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalExams,
        upcomingExams,
        totalTasks,
        completedTasks,
        remindersSent: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const { users, total } = await usersRepository.findAll(page, pageSize);
    return res.json({
      success: true,
      data: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        examCount: 0,
        taskCount: 0,
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', async (req, res) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body as { status: string };
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const updated = await usersRepository.update(id, { status: status as 'active' | 'disabled' });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/admin/users/:id/reset-password
router.put('/users/:id/reset-password', async (req, res) => {
  try {
    const id = req.params.id as string;
    const { newPassword } = req.body as { newPassword: string };
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await usersRepository.update(id, { passwordHash });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.json({ success: true, data: null, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/admin/system-status
router.get('/system-status', async (_req, res) => {
  try {
    let dbConnected = false;
    try {
      await usersRepository.findAll(1, 1);
      dbConnected = true;
    } catch {
      dbConnected = false;
    }
    const memUsage = process.memoryUsage();
    return res.json({
      success: true,
      data: {
        status: dbConnected ? 'healthy' : 'degraded',
        uptime: process.uptime(),
        memoryUsage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
        cpuUsage: 0,
        dbConnected,
        lastChecked: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/admin/announcements
router.get('/announcements', async (_req, res) => {
  try {
    const result = await db.select().from(announcements);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/admin/announcements
router.post('/announcements', async (req, res) => {
  try {
    const { title, content } = req.body as { title: string; content: string };
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content required' });
    }
    const result = await db.insert(announcements).values({ title, content }).returning();
    return res.status(201).json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/admin/announcements/:id
router.put('/announcements/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    const { title, content, isActive } = req.body as { title?: string; content?: string; isActive?: boolean };
    const result = await db
      .update(announcements)
      .set({ title, content, isActive, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    if (result.length === 0) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    return res.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/admin/announcements/:id
router.delete('/announcements/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    const result = await db.delete(announcements).where(eq(announcements.id, id)).returning();
    if (result.length === 0) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    return res.json({ success: true, data: null });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
