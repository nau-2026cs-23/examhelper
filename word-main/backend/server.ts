import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import authRouter from './routes/auth';
import examsRouter from './routes/exams';
import tasksRouter from './routes/tasks';
import profileRouter from './routes/profile';
import adminRouter from './routes/admin';
import { db } from './db';
import { announcements } from './db/schema';
import { eq } from 'drizzle-orm';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Public announcements endpoint (no auth required)
app.get('/api/announcements', async (_req, res) => {
  try {
    const result = await db.select().from(announcements).where(eq(announcements.isActive, true));
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching public announcements:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/exams', examsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/profile', profileRouter);
app.use('/api/admin', adminRouter);

// Serve frontend in production
const REACT_BUILD_FOLDER = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(REACT_BUILD_FOLDER));
app.get('*', (_req, res) => {
  res.sendFile(path.join(REACT_BUILD_FOLDER, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
