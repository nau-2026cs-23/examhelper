// Shared API types between frontend and backend

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// User types
export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'disabled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

// Exam types
export type ExamType = 'midterm' | 'final' | 'quiz' | 'certification' | 'other';
export type ExamStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Exam {
  id: string;
  userId: string;
  title: string;
  subject: string;
  examType: ExamType;
  examDate: string;
  examTime: string;
  location: string;
  description?: string;
  reviewProgress: number;
  status: ExamStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExamRequest {
  title: string;
  subject: string;
  examType: ExamType;
  examDate: string;
  examTime: string;
  location: string;
  description?: string;
}

export interface UpdateExamRequest {
  title?: string;
  subject?: string;
  examType?: ExamType;
  examDate?: string;
  examTime?: string;
  location?: string;
  description?: string;
  reviewProgress?: number;
  status?: ExamStatus;
}

// Task types
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed';

export interface Task {
  id: string;
  userId: string;
  examId?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  examTitle?: string;
}

export interface CreateTaskRequest {
  examId?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
}

// Reminder/Notification types
export type ReminderChannel = 'system' | 'browser' | 'email';
export type ReminderInterval = '7days' | '3days' | '1day' | 'sameday';

export interface NotificationSettings {
  id: string;
  userId: string;
  channels: ReminderChannel[];
  intervals: ReminderInterval[];
  customIntervalDays?: number;
  emailEnabled: boolean;
  browserEnabled: boolean;
  systemEnabled: boolean;
  updatedAt: string;
}

export interface UpdateNotificationSettingsRequest {
  channels?: ReminderChannel[];
  intervals?: ReminderInterval[];
  customIntervalDays?: number;
  emailEnabled?: boolean;
  browserEnabled?: boolean;
  systemEnabled?: boolean;
}

// Admin types
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalExams: number;
  upcomingExams: number;
  totalTasks: number;
  completedTasks: number;
  remindersSent: number;
}

export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  dbConnected: boolean;
  lastChecked: string;
}

export interface AdminUserListItem extends User {
  examCount: number;
  taskCount: number;
}

export interface ExamTypeConfig {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
