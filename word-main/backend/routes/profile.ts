import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { usersRepository } from '../repositories/users';

const router = express.Router();

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

// GET /api/profile
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const user = await usersRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
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
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/profile
router.put('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const validated = updateProfileSchema.parse(req.body);
    const user = await usersRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const updateData: Record<string, unknown> = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.newPassword) {
      if (!validated.currentPassword) {
        return res.status(400).json({ success: false, error: 'Current password required' });
      }
      const valid = await bcrypt.compare(validated.currentPassword, user.passwordHash);
      if (!valid) {
        return res.status(400).json({ success: false, error: 'Current password incorrect' });
      }
      updateData.passwordHash = await bcrypt.hash(validated.newPassword, 10);
    }
    const updated = await usersRepository.update(userId, updateData);
    return res.json({
      success: true,
      data: {
        id: updated!.id,
        name: updated!.name,
        email: updated!.email,
        role: updated!.role,
        status: updated!.status,
        createdAt: updated!.createdAt,
        updatedAt: updated!.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/profile/notifications
router.get('/notifications', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    let settings = await usersRepository.getNotificationSettings(userId);
    if (!settings) {
      await usersRepository.initNotificationSettings(userId);
      settings = await usersRepository.getNotificationSettings(userId);
    }
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/profile/notifications
router.put('/notifications', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const settings = await usersRepository.updateNotificationSettings(userId, req.body);
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
