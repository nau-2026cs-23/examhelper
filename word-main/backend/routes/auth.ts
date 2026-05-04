import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { usersRepository } from '../repositories/users';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'exam-reminder-secret-key-2024';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const validated = registerSchema.parse(req.body);
    const existing = await usersRepository.findByEmail(validated.email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(validated.password, 10);
    const user = await usersRepository.create({
      name: validated.name,
      email: validated.email,
      passwordHash,
      role: 'user',
      status: 'active',
    });
    await usersRepository.initNotificationSettings(user.id);
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        token,
      },
    });
  } catch (error) {
    console.error('Error in register:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const validated = loginSchema.parse(req.body);
    const user = await usersRepository.findByEmail(validated.email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    if (user.status === 'disabled') {
      return res.status(403).json({ success: false, error: 'Account has been disabled' });
    }
    const valid = await bcrypt.compare(validated.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        token,
      },
    });
  } catch (error) {
    console.error('Error in login:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
