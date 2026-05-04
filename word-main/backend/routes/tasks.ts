import express from 'express';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { tasksRepository } from '../repositories/tasks';

const router = express.Router();

const createTaskSchema = z.object({
  userId: z.string().optional(),
  examId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['pending', 'completed']).default('pending'),
  dueDate: z.string().optional(),
});
const updateTaskSchema = createTaskSchema.partial();

// GET /api/tasks
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const tasks = await tasksRepository.findByUserId(userId);
    return res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/tasks
router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const validated = createTaskSchema.parse({ ...req.body, userId });
    const task = await tasksRepository.create(validated);
    return res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('Error creating task:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;
    const validated = updateTaskSchema.parse(req.body);
    const task = await tasksRepository.update(id, userId, validated);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    return res.json({ success: true, data: task });
  } catch (error) {
    console.error('Error updating task:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;
    const deleted = await tasksRepository.delete(id, userId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    return res.json({ success: true, data: null });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
