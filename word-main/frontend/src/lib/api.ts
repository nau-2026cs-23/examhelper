import { API_BASE_URL } from '../config/constants';
import type {
  ApiResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  User,
  Exam,
  CreateExamRequest,
  UpdateExamRequest,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  NotificationSettings,
  UpdateNotificationSettingsRequest,
  AdminStats,
  SystemStatus,
  AdminUserListItem,
  SystemAnnouncement,
} from '@shared/types/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();
  return data as ApiResponse<T>;
}

export const apiService = {
  // Auth
  async login(body: LoginRequest): Promise<ApiResponse<AuthUser>> {
    return request<AuthUser>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) });
  },
  async register(body: RegisterRequest): Promise<ApiResponse<AuthUser>> {
    return request<AuthUser>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) });
  },

  // Profile
  async getProfile(): Promise<ApiResponse<User>> {
    return request<User>('/api/profile');
  },
  async updateProfile(body: UpdateProfileRequest): Promise<ApiResponse<User>> {
    return request<User>('/api/profile', { method: 'PUT', body: JSON.stringify(body) });
  },
  async getNotificationSettings(): Promise<ApiResponse<NotificationSettings>> {
    return request<NotificationSettings>('/api/profile/notifications');
  },
  async updateNotificationSettings(body: UpdateNotificationSettingsRequest): Promise<ApiResponse<NotificationSettings>> {
    return request<NotificationSettings>('/api/profile/notifications', { method: 'PUT', body: JSON.stringify(body) });
  },

  // Exams
  async getExams(): Promise<ApiResponse<Exam[]>> {
    return request<Exam[]>('/api/exams');
  },
  async createExam(body: CreateExamRequest): Promise<ApiResponse<Exam>> {
    return request<Exam>('/api/exams', { method: 'POST', body: JSON.stringify(body) });
  },
  async updateExam(id: string, body: UpdateExamRequest): Promise<ApiResponse<Exam>> {
    return request<Exam>(`/api/exams/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  async deleteExam(id: string): Promise<ApiResponse<null>> {
    return request<null>(`/api/exams/${id}`, { method: 'DELETE' });
  },

  // Tasks
  async getTasks(): Promise<ApiResponse<Task[]>> {
    return request<Task[]>('/api/tasks');
  },
  async createTask(body: CreateTaskRequest): Promise<ApiResponse<Task>> {
    return request<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(body) });
  },
  async updateTask(id: string, body: UpdateTaskRequest): Promise<ApiResponse<Task>> {
    return request<Task>(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  async deleteTask(id: string): Promise<ApiResponse<null>> {
    return request<null>(`/api/tasks/${id}`, { method: 'DELETE' });
  },

  // Public
  async getPublicAnnouncements(): Promise<ApiResponse<SystemAnnouncement[]>> {
    return request<SystemAnnouncement[]>('/api/announcements');
  },

  // Admin
  async getAdminStats(): Promise<ApiResponse<AdminStats>> {
    return request<AdminStats>('/api/admin/stats');
  },
  async getAdminUsers(page = 1, pageSize = 20): Promise<ApiResponse<AdminUserListItem[]>> {
    return request<AdminUserListItem[]>(`/api/admin/users?page=${page}&pageSize=${pageSize}`);
  },
  async updateUserStatus(id: string, status: 'active' | 'disabled'): Promise<ApiResponse<User>> {
    return request<User>(`/api/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  },
  async resetUserPassword(id: string, newPassword: string): Promise<ApiResponse<null>> {
    return request<null>(`/api/admin/users/${id}/reset-password`, { method: 'PUT', body: JSON.stringify({ newPassword }) });
  },
  async getSystemStatus(): Promise<ApiResponse<SystemStatus>> {
    return request<SystemStatus>('/api/admin/system-status');
  },
  async getAnnouncements(): Promise<ApiResponse<SystemAnnouncement[]>> {
    return request<SystemAnnouncement[]>('/api/admin/announcements');
  },
  async createAnnouncement(body: { title: string; content: string }): Promise<ApiResponse<SystemAnnouncement>> {
    return request<SystemAnnouncement>('/api/admin/announcements', { method: 'POST', body: JSON.stringify(body) });
  },
  async updateAnnouncement(id: string, body: Partial<SystemAnnouncement>): Promise<ApiResponse<SystemAnnouncement>> {
    return request<SystemAnnouncement>(`/api/admin/announcements/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  async deleteAnnouncement(id: string): Promise<ApiResponse<null>> {
    return request<null>(`/api/admin/announcements/${id}`, { method: 'DELETE' });
  },
};
