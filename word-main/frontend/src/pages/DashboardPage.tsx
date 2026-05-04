import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  LayoutDashboard, BookOpen, Calendar, CheckSquare, Bell, User, LogOut,
  Menu, X, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2,
  TrendingUp, Clock, AlertCircle, CheckCircle2, Languages
} from 'lucide-react';
import { apiService } from '../lib/api';
import type { Exam, Task, User as UserType, ExamType, TaskPriority } from '@shared/types/api';
import { useLanguage } from '../lib/i18n';

type View = 'dashboard' | 'exams' | 'calendar' | 'tasks' | 'notifications' | 'profile';

const EXAM_TYPE_COLORS: Record<ExamType, string> = {
  midterm: 'bg-blue-100 text-blue-700',
  final: 'bg-red-100 text-red-700',
  quiz: 'bg-green-100 text-green-700',
  certification: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-700',
};

const EXAM_TYPE_DOT_COLORS: Record<ExamType, string> = {
  midterm: 'bg-blue-500',
  final: 'bg-red-500',
  quiz: 'bg-green-500',
  certification: 'bg-purple-500',
  other: 'bg-gray-500',
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(dateStr);
  examDate.setHours(0, 0, 0, 0);
  return Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string, lang: string): string {
  return new Date(dateStr).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t, lang, toggleLanguage } = useLanguage();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? (JSON.parse(stored) as UserType) : null;
  });
  const [exams, setExams] = useState<Exam[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<import('@shared/types/api').SystemAnnouncement[]>([]);

  // Exam form state
  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState({
    title: '', subject: '', examType: 'other' as ExamType,
    examDate: '', examTime: '09:00', location: '', description: ''
  });

  // Task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', priority: 'medium' as TaskPriority,
    examId: '', dueDate: ''
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({ name: '', currentPassword: '', newPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Notification settings
  const [notifSettings, setNotifSettings] = useState({
    systemEnabled: true, emailEnabled: false, browserEnabled: false,
    intervals: ['7days', '1day'] as string[]
  });

  const loadData = useCallback(async () => {
    try {
      const [examsRes, tasksRes, announcementsRes] = await Promise.all([
        apiService.getExams(),
        apiService.getTasks(),
        apiService.getPublicAnnouncements(),
      ]);
      if (examsRes.success) setExams(examsRes.data);
      if (tasksRes.success) setTasks(tasksRes.data);
      if (announcementsRes.success) setAnnouncements(announcementsRes.data);
    } catch {
      toast.error(t.failedToLoad);
    } finally {
      setLoading(false);
    }
  }, [t.failedToLoad]);

  const loadNotifSettings = useCallback(async () => {
    try {
      const res = await apiService.getNotificationSettings();
      if (res.success && res.data) {
        setNotifSettings({
          systemEnabled: res.data.systemEnabled,
          emailEnabled: res.data.emailEnabled,
          browserEnabled: res.data.browserEnabled,
          intervals: Array.isArray(res.data.intervals) ? res.data.intervals as string[] : ['7days', '1day'],
        });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadData();
    loadNotifSettings();
  }, [loadData, loadNotifSettings, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Exam CRUD
  const openExamForm = (exam?: Exam) => {
    if (exam) {
      setEditingExam(exam);
      setExamForm({
        title: exam.title, subject: exam.subject, examType: exam.examType,
        examDate: exam.examDate, examTime: exam.examTime,
        location: exam.location, description: exam.description || ''
      });
    } else {
      setEditingExam(null);
      setExamForm({ title: '', subject: '', examType: 'other', examDate: '', examTime: '09:00', location: '', description: '' });
    }
    setShowExamForm(true);
  };

  const saveExam = async () => {
    if (!examForm.title || !examForm.subject || !examForm.examDate || !examForm.location) {
      toast.error(t.fillRequired);
      return;
    }
    try {
      if (editingExam) {
        const res = await apiService.updateExam(editingExam.id, examForm);
        if (res.success) {
          setExams(prev => prev.map(e => e.id === editingExam.id ? res.data : e));
          toast.success(t.examUpdated);
        } else toast.error(res.error || t.examUpdated);
      } else {
        const res = await apiService.createExam(examForm);
        if (res.success) {
          setExams(prev => [...prev, res.data]);
          toast.success(t.examCreated);
        } else toast.error(res.error || t.examCreated);
      }
      setShowExamForm(false);
    } catch {
      toast.error(t.networkError);
    }
  };

  const deleteExam = async (id: string) => {
    if (!confirm(t.deleteExamConfirm)) return;
    try {
      const res = await apiService.deleteExam(id);
      if (res.success) {
        setExams(prev => prev.filter(e => e.id !== id));
        toast.success(t.examDeleted);
      }
    } catch {
      toast.error(t.networkError);
    }
  };

  const updateProgress = async (exam: Exam, progress: number) => {
    try {
      const res = await apiService.updateExam(exam.id, { reviewProgress: progress });
      if (res.success) setExams(prev => prev.map(e => e.id === exam.id ? res.data : e));
    } catch {
      toast.error(t.networkError);
    }
  };

  // Task CRUD
  const openTaskForm = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title, description: task.description || '',
        priority: task.priority, examId: task.examId || '', dueDate: task.dueDate || ''
      });
    } else {
      setEditingTask(null);
      setTaskForm({ title: '', description: '', priority: 'medium', examId: '', dueDate: '' });
    }
    setShowTaskForm(true);
  };

  const saveTask = async () => {
    if (!taskForm.title) {
      toast.error(t.taskTitleRequired);
      return;
    }
    try {
      const body = {
        title: taskForm.title,
        description: taskForm.description || undefined,
        priority: taskForm.priority,
        examId: taskForm.examId || undefined,
        dueDate: taskForm.dueDate || undefined,
      };
      if (editingTask) {
        const res = await apiService.updateTask(editingTask.id, body);
        if (res.success) {
          setTasks(prev => prev.map(t2 => t2.id === editingTask.id ? res.data : t2));
          toast.success(t.taskUpdated);
        } else toast.error(res.error || t.taskUpdated);
      } else {
        const res = await apiService.createTask(body);
        if (res.success) {
          setTasks(prev => [...prev, res.data]);
          toast.success(t.taskCreated);
        } else toast.error(res.error || t.taskCreated);
      }
      setShowTaskForm(false);
    } catch {
      toast.error(t.networkError);
    }
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await apiService.updateTask(task.id, { status: newStatus });
      if (res.success) setTasks(prev => prev.map(t2 => t2.id === task.id ? res.data : t2));
    } catch {
      toast.error(t.networkError);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm(t.deleteTaskConfirm)) return;
    try {
      const res = await apiService.deleteTask(id);
      if (res.success) {
        setTasks(prev => prev.filter(t2 => t2.id !== id));
        toast.success(t.taskDeleted);
      }
    } catch {
      toast.error(t.networkError);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const body: { name?: string; currentPassword?: string; newPassword?: string } = {};
      if (profileForm.name) body.name = profileForm.name;
      if (profileForm.newPassword) {
        body.currentPassword = profileForm.currentPassword;
        body.newPassword = profileForm.newPassword;
      }
      const res = await apiService.updateProfile(body);
      if (res.success) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        toast.success(t.profileUpdated);
        setProfileForm({ name: '', currentPassword: '', newPassword: '' });
      } else toast.error(res.error || t.profileUpdated);
    } catch {
      toast.error(t.networkError);
    } finally {
      setSavingProfile(false);
    }
  };

  const saveNotifSettings = async () => {
    try {
      const res = await apiService.updateNotificationSettings({
        systemEnabled: notifSettings.systemEnabled,
        emailEnabled: notifSettings.emailEnabled,
        browserEnabled: notifSettings.browserEnabled,
        intervals: notifSettings.intervals as ('7days' | '3days' | '1day' | 'sameday')[],
      });
      if (res.success) toast.success(t.settingsSaved);
      else toast.error(res.error || t.settingsSaved);
    } catch {
      toast.error(t.networkError);
    }
  };

  const toggleInterval = (interval: string) => {
    setNotifSettings(prev => ({
      ...prev,
      intervals: prev.intervals.includes(interval)
        ? prev.intervals.filter(i => i !== interval)
        : [...prev.intervals, interval]
    }));
  };

  // Calendar helpers
  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getExamsForDay = (day: number) => {
    const year = calendarDate.getFullYear();
    const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    return exams.filter(e => e.examDate === dateStr);
  };

  const upcomingExams = exams
    .filter(e => e.status === 'upcoming' && getDaysUntil(e.examDate) >= 0)
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

  const pendingTasks = tasks.filter(t2 => t2.status === 'pending');
  const completedTasks = tasks.filter(t2 => t2.status === 'completed');

  const examTypeLabels: Record<ExamType, string> = {
    midterm: t.midterm,
    final: t.final,
    quiz: t.quiz,
    certification: t.certification,
    other: t.other,
  };

  const priorityLabels: Record<TaskPriority, string> = {
    low: t.low,
    medium: t.medium,
    high: t.high,
  };

  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'exams', label: t.myExams, icon: <BookOpen className="w-5 h-5" /> },
    { id: 'calendar', label: t.calendar, icon: <Calendar className="w-5 h-5" /> },
    { id: 'tasks', label: t.tasks, icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'notifications', label: t.reminders, icon: <Bell className="w-5 h-5" /> },
    { id: 'profile', label: t.profile, icon: <User className="w-5 h-5" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:flex`}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-foreground">{t.appName}</p>
              <p className="text-xs text-muted-foreground">{t.appTagline}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-1">
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Languages className="w-5 h-5" />
            {t.switchLanguage}
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
              {t.adminPanel}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t.signOut}
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-accent"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="font-semibold text-foreground">
              {navItems.find(n => n.id === currentView)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Languages className="w-3.5 h-3.5" />
              {t.switchLanguage}
            </button>
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">{user?.name}</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* DASHBOARD VIEW */}
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              {/* Announcements Banner */}
              {announcements.length > 0 && (
                <div className="space-y-2">
                  {announcements.map(ann => (
                    <div key={ann.id} className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 flex items-start gap-3">
                      <Bell className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{ann.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{ann.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm text-muted-foreground">{t.totalExams}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{exams.length}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-sm text-muted-foreground">{t.upcoming}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{upcomingExams.length}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <span className="text-sm text-muted-foreground">{t.pendingTasks}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{pendingTasks.length}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm text-muted-foreground">{t.completed}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{completedTasks.length}</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">{t.upcomingExams}</h3>
                    <button onClick={() => setCurrentView('exams')} className="text-xs text-primary hover:underline">{t.viewAll}</button>
                  </div>
                  {upcomingExams.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t.noUpcomingExams}</p>
                      <button onClick={() => openExamForm()} className="mt-3 text-xs text-primary hover:underline">{t.addFirstExam}</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingExams.slice(0, 4).map(exam => {
                        const days = getDaysUntil(exam.examDate);
                        return (
                          <div key={exam.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${EXAM_TYPE_DOT_COLORS[exam.examType]}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{exam.title}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(exam.examDate, lang)} · {exam.location}</p>
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                              days <= 1 ? 'bg-red-100 text-red-700' :
                              days <= 3 ? 'bg-orange-100 text-orange-700' :
                              days <= 7 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {days === 0 ? t.today : days === 1 ? t.tomorrow : `${days}${t.daysAbbr}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">{t.reviewProgress}</h3>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  </div>
                  {upcomingExams.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t.noExamsToTrack}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingExams.slice(0, 4).map(exam => (
                        <div key={exam.id}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-foreground truncate max-w-[60%]">{exam.subject}</p>
                            <span className="text-sm text-muted-foreground">{exam.reviewProgress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${exam.reviewProgress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">{t.recentTasks}</h3>
                  <button onClick={() => setCurrentView('tasks')} className="text-xs text-primary hover:underline">{t.viewAll}</button>
                </div>
                {pendingTasks.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t.noPendingTasks}</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pendingTasks.slice(0, 6).map(task => (
                      <div key={task.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <button onClick={() => toggleTask(task)} className="mt-0.5 flex-shrink-0">
                          <div className="w-4 h-4 rounded border-2 border-muted-foreground/40 hover:border-primary transition-colors" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                          {task.dueDate && <p className="text-xs text-muted-foreground">{formatDate(task.dueDate, lang)}</p>}
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
                          {priorityLabels[task.priority]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EXAMS VIEW */}
          {currentView === 'exams' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t.examsTotal(exams.length)}</p>
                <button
                  onClick={() => openExamForm()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t.addExam}
                </button>
              </div>

              {exams.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                  <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">{t.noExamsYet}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t.addFirstExamDesc}</p>
                  <button onClick={() => openExamForm()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                    {t.addExam}
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exams.map(exam => {
                    const days = getDaysUntil(exam.examDate);
                    return (
                      <div key={exam.id} className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{exam.title}</h3>
                            <p className="text-sm text-muted-foreground">{exam.subject}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${EXAM_TYPE_COLORS[exam.examType]}`}>
                            {examTypeLabels[exam.examType]}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(exam.examDate, lang)} {exam.examTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 text-center text-xs">📍</span>
                            <span className="truncate">{exam.location}</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{t.reviewProgress}</span>
                            <span className="text-xs font-medium text-foreground">{exam.reviewProgress}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${exam.reviewProgress}%` }} />
                          </div>
                          <input
                            type="range" min="0" max="100" value={exam.reviewProgress}
                            onChange={e => updateProgress(exam, parseInt(e.target.value))}
                            className="w-full mt-1 accent-primary"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            exam.status === 'completed' ? 'bg-green-100 text-green-700' :
                            exam.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                            days <= 1 ? 'bg-red-100 text-red-700' :
                            days <= 3 ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {exam.status === 'completed' ? t.examCompleted :
                             exam.status === 'cancelled' ? t.examCancelled :
                             days < 0 ? t.examPast :
                             days === 0 ? t.today :
                             days === 1 ? t.tomorrow : `${days}${t.daysAbbr}`}
                          </span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openExamForm(exam)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteExam(exam.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CALENDAR VIEW */}
          {currentView === 'calendar' && (
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-foreground text-lg">
                    {calendarDate.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                      className="p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCalendarDate(new Date())}
                      className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      {t.calendarToday}
                    </button>
                    <button
                      onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                      className="p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {t.weekdays.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {getCalendarDays().map((day, idx) => {
                    if (!day) return <div key={idx} />;
                    const dayExams = getExamsForDay(day);
                    const today = new Date();
                    const isToday = today.getDate() === day &&
                      today.getMonth() === calendarDate.getMonth() &&
                      today.getFullYear() === calendarDate.getFullYear();
                    const year = calendarDate.getFullYear();
                    const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
                    const dayStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
                    const isSelected = selectedCalendarDay === dayStr;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedCalendarDay(isSelected ? null : dayStr)}
                        className={`relative min-h-[60px] p-1 rounded-lg text-sm transition-colors ${
                          isToday ? 'bg-primary text-primary-foreground' :
                          isSelected ? 'bg-primary/10 ring-1 ring-primary' :
                          dayExams.length > 0 ? 'bg-accent hover:bg-accent/80' :
                          'hover:bg-muted'
                        }`}
                      >
                        <span className="block text-center font-medium mb-1">{day}</span>
                        <div className="flex flex-wrap gap-0.5 justify-center">
                          {dayExams.slice(0, 3).map(exam => (
                            <div
                              key={exam.id}
                              className={`w-1.5 h-1.5 rounded-full ${EXAM_TYPE_DOT_COLORS[exam.examType]}`}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedCalendarDay && (() => {
                const dayExams = exams.filter(e => e.examDate === selectedCalendarDay);
                return dayExams.length > 0 ? (
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="font-semibold text-foreground mb-3">
                      {t.examsOn(formatDate(selectedCalendarDay, lang))}
                    </h3>
                    <div className="space-y-3">
                      {dayExams.map(exam => (
                        <div key={exam.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${EXAM_TYPE_DOT_COLORS[exam.examType]}`} />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{exam.title}</p>
                            <p className="text-sm text-muted-foreground">{exam.subject} · {exam.examTime} · {exam.location}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${EXAM_TYPE_COLORS[exam.examType]}`}>
                            {examTypeLabels[exam.examType]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="flex flex-wrap gap-3">
                {(Object.entries(examTypeLabels) as [ExamType, string][]).map(([type, label]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${EXAM_TYPE_DOT_COLORS[type]}`} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TASKS VIEW */}
          {currentView === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {t.pendingCompleted(pendingTasks.length, completedTasks.length)}
                </p>
                <button
                  onClick={() => openTaskForm()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t.addTask}
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                  <CheckSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">{t.noTasksYet}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t.createTasksDesc}</p>
                  <button onClick={() => openTaskForm()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                    {t.addTask}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className={`bg-card rounded-xl border border-border p-4 flex items-start gap-3 transition-opacity ${
                      task.status === 'completed' ? 'opacity-60' : ''
                    }`}>
                      <button
                        onClick={() => toggleTask(task)}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          task.status === 'completed'
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground/40 hover:border-primary'
                        }`}
                      >
                        {task.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-foreground ${task.status === 'completed' ? 'line-through' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>}
                        <div className="flex items-center gap-3 mt-1.5">
                          {task.examTitle && (
                            <span className="text-xs text-muted-foreground">📚 {task.examTitle}</span>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground">📅 {formatDate(task.dueDate, lang)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                          {priorityLabels[task.priority]}
                        </span>
                        <button onClick={() => openTaskForm(task)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS VIEW */}
          {currentView === 'notifications' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">{t.notificationChannels}</h3>
                <div className="space-y-4">
                  {[
                    { key: 'systemEnabled', label: t.systemNotifications, desc: t.systemNotificationsDesc },
                    { key: 'emailEnabled', label: t.emailNotifications, desc: t.emailNotificationsDesc },
                    { key: 'browserEnabled', label: t.browserPush, desc: t.browserPushDesc },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifSettings(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          notifSettings[item.key as keyof typeof notifSettings] ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          notifSettings[item.key as keyof typeof notifSettings] ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">{t.reminderIntervals}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t.reminderIntervalsDesc}</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: '7days', label: t.sevenDaysBefore },
                    { value: '3days', label: t.threeDaysBefore },
                    { value: '1day', label: t.oneDayBefore },
                    { value: 'sameday', label: t.sameDay },
                  ].map(item => (
                    <button
                      key={item.value}
                      onClick={() => toggleInterval(item.value)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        notifSettings.intervals.includes(item.value)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={saveNotifSettings}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                {t.saveSettings}
              </button>
            </div>
          )}

          {/* PROFILE VIEW */}
          {currentView === 'profile' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold text-2xl">{user?.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                      user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user?.role === 'admin' ? t.administrator : t.student}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{t.displayName}</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={user?.name}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{t.currentPassword}</label>
                    <input
                      type="password"
                      value={profileForm.currentPassword}
                      onChange={e => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder={t.currentPasswordPlaceholder}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{t.newPassword}</label>
                    <input
                      type="password"
                      value={profileForm.newPassword}
                      onChange={e => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder={t.newPasswordPlaceholder}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                  <button
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t.saveChanges}
                  </button>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">{t.accountStats}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{exams.length}</p>
                    <p className="text-xs text-muted-foreground">{t.totalExams}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
                    <p className="text-xs text-muted-foreground">{t.totalTasks}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">{t.completion}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Exam Form Modal */}
      {showExamForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-semibold text-foreground">{editingExam ? t.editExam : t.addNewExam}</h2>
              <button onClick={() => setShowExamForm(false)} className="p-2 rounded-lg hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t.examTitle} *</label>
                  <input
                    type="text" value={examForm.title}
                    onChange={e => setExamForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={t.examTitlePlaceholder}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t.subject} *</label>
                  <input
                    type="text" value={examForm.subject}
                    onChange={e => setExamForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder={t.subjectPlaceholder}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t.type}</label>
                  <select
                    value={examForm.examType}
                    onChange={e => setExamForm(prev => ({ ...prev, examType: e.target.value as ExamType }))}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="midterm">{t.midterm}</option>
                    <option value="final">{t.final}</option>
                    <option value="quiz">{t.quiz}</option>
                    <option value="certification">{t.certification}</option>
                    <option value="other">{t.other}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t.date} *</label>
                  <input
                    type="date" value={examForm.examDate}
                    onChange={e => setExamForm(prev => ({ ...prev, examDate: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t.time}</label>
                  <input
                    type="time" value={examForm.examTime}
                    onChange={e => setExamForm(prev => ({ ...prev, examTime: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t.location} *</label>
                  <input
                    type="text" value={examForm.location}
                    onChange={e => setExamForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={t.locationPlaceholder}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t.notes}</label>
                  <textarea
                    value={examForm.description}
                    onChange={e => setExamForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t.notesPlaceholder}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowExamForm(false)}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={saveExam}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {editingExam ? t.update : t.create}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-semibold text-foreground">{editingTask ? t.editTask : t.addNewTask}</h2>
              <button onClick={() => setShowTaskForm(false)} className="p-2 rounded-lg hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t.taskTitle} *</label>
                <input
                  type="text" value={taskForm.title}
                  onChange={e => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t.taskTitlePlaceholder}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t.description}</label>
                <textarea
                  value={taskForm.description}
                  onChange={e => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t.descriptionPlaceholder}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t.priority}</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="low">{t.low}</option>
                    <option value="medium">{t.medium}</option>
                    <option value="high">{t.high}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t.dueDate}</label>
                  <input
                    type="date" value={taskForm.dueDate}
                    onChange={e => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t.relatedExam}</label>
                <select
                  value={taskForm.examId}
                  onChange={e => setTaskForm(prev => ({ ...prev, examId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="">{t.none}</option>
                  {exams.map(exam => (
                    <option key={exam.id} value={exam.id}>{exam.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowTaskForm(false)}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={saveTask}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {editingTask ? t.update : t.create}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
