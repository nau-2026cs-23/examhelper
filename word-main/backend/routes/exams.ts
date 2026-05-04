import express from 'express';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { examsRepository } from '../repositories/exams';

const router = express.Router();

const createExamSchema = z.object({
  userId: z.string().optional(),
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
const updateExamSchema = createExamSchema.partial();

// GET /api/exams
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const exams = await examsRepository.findByUserId(userId);
    return res.json({ success: true, data: exams });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/exams
router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const validated = createExamSchema.parse({ ...req.body, userId });
    const exam = await examsRepository.create(validated);
    return res.status(201).json({ success: true, data: exam });
  } catch (error) {
    console.error('Error creating exam:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/exams/:id
router.put('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;
    const validated = updateExamSchema.parse(req.body);
    const exam = await examsRepository.update(id, userId, validated);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found' });
    }
    return res.json({ success: true, data: exam });
  } catch (error) {
    console.error('Error updating exam:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/exams/:id
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const id = req.params.id as string;
    const deleted = await examsRepository.delete(id, userId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Exam not found' });
    }
    return res.json({ success: true, data: null });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
