import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  LayoutDashboard, Users, Activity, Megaphone, Settings,
  ChevronLeft, ChevronRight, Loader2, X, Plus, Pencil, Trash2,
  CheckCircle, XCircle, RefreshCw, BookOpen, CheckSquare, Bell, Languages
} from 'lucide-react';
import { apiService } from '../lib/api';
import type { AdminStats, AdminUserListItem, SystemStatus, SystemAnnouncement } from '@shared/types/api';
import { useLanguage } from '../lib/i18n';

type AdminView = 'stats' | 'users' | 'system' | 'announcements';

export default function AdminPage() {
  const navigate = useNavigate();
  const { t, toggleLanguage } = useLanguage();
  const [currentView, setCurrentView] = useState<AdminView>('stats');
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Users
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const pageSize = 10;

  // System
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // Announcements
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });

  // Reset password modal
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUserListItem | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const loadStats = useCallback(async () => {
    const res = await apiService.getAdminStats();
    if (res.success) setStats(res.data);
  }, []);

  const loadUsers = useCallback(async (page: number) => {
    const res = await apiService.getAdminUsers(page, pageSize);
    if (res.success) {
      setUsers(res.data);
      setUserTotal((res as unknown as { total: number }).total || 0);
    }
  }, []);

  const loadSystemStatus = useCallback(async () => {
    const res = await apiService.getSystemStatus();
    if (res.success) setSystemStatus(res.data);
  }, []);

  const loadAnnouncements = useCallback(async () => {
    const res = await apiService.getAnnouncements();
    if (res.success) setAnnouncements(res.data);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) { navigate('/login'); return; }
    const parsed = JSON.parse(user) as { role: string };
    if (parsed.role !== 'admin') { navigate('/'); return; }

    const init = async () => {
      try {
        await Promise.all([loadStats(), loadUsers(1), loadSystemStatus(), loadAnnouncements()]);
      } catch {
        toast.error(t.failedToLoadAdmin);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadStats, loadUsers, loadSystemStatus, loadAnnouncements, navigate, t.failedToLoadAdmin]);

  const handleUserStatus = async (user: AdminUserListItem, status: 'active' | 'disabled') => {
    try {
      const res = await apiService.updateUserStatus(user.id, status);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status } : u));
        toast.success(status === 'active' ? t.userEnabled : t.userDisabled);
      } else toast.error(res.error || '');
    } catch {
      toast.error(t.networkError);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword || newPassword.length < 6) {
      toast.error(t.passwordMinLength);
      return;
    }
    try {
      const res = await apiService.resetUserPassword(resetPasswordUser.id, newPassword);
      if (res.success) {
        toast.success(t.passwordResetSuccess);
        setResetPasswordUser(null);
        setNewPassword('');
      } else toast.error(res.error || '');
    } catch {
      toast.error(t.networkError);
    }
  };

  const openAnnouncementForm = (ann?: SystemAnnouncement) => {
    if (ann) {
      setEditingAnnouncement(ann);
      setAnnouncementForm({ title: ann.title, content: ann.content });
    } else {
      setEditingAnnouncement(null);
      setAnnouncementForm({ title: '', content: '' });
    }
    setShowAnnouncementForm(true);
  };

  const saveAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) {
      toast.error(t.titleContentRequired);
      return;
    }
    try {
      if (editingAnnouncement) {
        const res = await apiService.updateAnnouncement(editingAnnouncement.id, announcementForm);
        if (res.success) {
          setAnnouncements(prev => prev.map(a => a.id === editingAnnouncement.id ? res.data : a));
          toast.success(t.announcementUpdated);
        }
      } else {
        const res = await apiService.createAnnouncement(announcementForm);
        if (res.success) {
          setAnnouncements(prev => [...prev, res.data]);
          toast.success(t.announcementCreated);
        }
      }
      setShowAnnouncementForm(false);
    } catch {
      toast.error(t.networkError);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm(t.deleteAnnouncementConfirm)) return;
    try {
      const res = await apiService.deleteAnnouncement(id);
      if (res.success) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        toast.success(t.announcementDeleted);
      }
    } catch {
      toast.error(t.networkError);
    }
  };

  const navItems: { id: AdminView; label: string; icon: React.ReactNode }[] = [
    { id: 'stats', label: t.overview, icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'users', label: t.users, icon: <Users className="w-5 h-5" /> },
    { id: 'system', label: t.system, icon: <Activity className="w-5 h-5" /> },
    { id: 'announcements', label: t.announcements, icon: <Megaphone className="w-5 h-5" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex-col hidden lg:flex">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-foreground">{t.adminPanel}</p>
              <p className="text-xs text-muted-foreground">{t.appTagline}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === item.id
                  ? 'bg-purple-600 text-white'
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            <Languages className="w-5 h-5" />
            {t.switchLanguage}
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            {t.backToApp}
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              currentView === item.id ? 'text-purple-600' : 'text-muted-foreground'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 lg:px-6 h-14 flex items-center justify-between">
          <h1 className="font-semibold text-foreground">
            {navItems.find(n => n.id === currentView)?.label}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Languages className="w-3.5 h-3.5" />
              {t.switchLanguage}
            </button>
            <button
              onClick={() => navigate('/')}
              className="lg:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
              {t.backToApp}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto pb-20 lg:pb-6">
          {/* STATS VIEW */}
          {currentView === 'stats' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: t.totalUsers, value: stats.totalUsers, icon: <Users className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-100' },
                  { label: t.activeUsers, value: stats.activeUsers, icon: <CheckCircle className="w-5 h-5 text-green-600" />, bg: 'bg-green-100' },
                  { label: t.totalExamsAdmin, value: stats.totalExams, icon: <BookOpen className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-100' },
                  { label: t.upcomingExamsAdmin, value: stats.upcomingExams, icon: <Bell className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-100' },
                  { label: t.totalTasksAdmin, value: stats.totalTasks, icon: <CheckSquare className="w-5 h-5 text-yellow-600" />, bg: 'bg-yellow-100' },
                  { label: t.completedTasks, value: stats.completedTasks, icon: <CheckCircle className="w-5 h-5 text-teal-600" />, bg: 'bg-teal-100' },
                  { label: t.remindersSent, value: stats.remindersSent, icon: <Bell className="w-5 h-5 text-pink-600" />, bg: 'bg-pink-100' },
                  { label: t.taskRate, value: `${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%`, icon: <Activity className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-100' },
                ].map((item, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-9 h-9 ${item.bg} rounded-lg flex items-center justify-center`}>
                        {item.icon}
                      </div>
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* USERS VIEW */}
          {currentView === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t.usersTotal(userTotal)}</p>
              </div>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t.user}</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t.role}</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t.status}</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t.joined}</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-primary font-semibold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {user.role === 'admin' ? t.administrator : t.student}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {user.status === 'active' ? t.active : t.inactive}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleUserStatus(user, user.status === 'active' ? 'disabled' : 'active')}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  user.status === 'active'
                                    ? 'hover:bg-red-100 text-muted-foreground hover:text-red-600'
                                    : 'hover:bg-green-100 text-muted-foreground hover:text-green-600'
                                }`}
                                title={user.status === 'active' ? t.disableUser : t.enableUser}
                              >
                                {user.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => { setResetPasswordUser(user); setNewPassword(''); }}
                                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                title={t.resetPassword}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {userTotal > pageSize && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {userPage} / {Math.ceil(userTotal / pageSize)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { const p = userPage - 1; setUserPage(p); loadUsers(p); }}
                      disabled={userPage === 1}
                      className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { const p = userPage + 1; setUserPage(p); loadUsers(p); }}
                      disabled={userPage >= Math.ceil(userTotal / pageSize)}
                      className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SYSTEM VIEW */}
          {currentView === 'system' && systemStatus && (
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-3 h-3 rounded-full ${
                    systemStatus.status === 'healthy' ? 'bg-green-500' :
                    systemStatus.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <h3 className="font-semibold text-foreground">{t.systemStatus}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    systemStatus.status === 'healthy' ? 'bg-green-100 text-green-700' :
                    systemStatus.status === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {systemStatus.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">{t.uptime}</p>
                    <p className="font-semibold text-foreground">
                      {Math.floor(systemStatus.uptime / 3600)}h {Math.floor((systemStatus.uptime % 3600) / 60)}m
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">{t.memoryUsage}</p>
                    <p className="font-semibold text-foreground">{systemStatus.memoryUsage}%</p>
                    <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          systemStatus.memoryUsage > 80 ? 'bg-red-500' :
                          systemStatus.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${systemStatus.memoryUsage}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">{t.database}</p>
                    <p className={`font-semibold ${
                      systemStatus.dbConnected ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {systemStatus.dbConnected ? t.connected : t.disconnected}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">{t.lastChecked}</p>
                    <p className="font-semibold text-foreground text-xs">
                      {new Date(systemStatus.lastChecked).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={loadSystemStatus}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {t.refreshStatus}
              </button>
            </div>
          )}

          {/* ANNOUNCEMENTS VIEW */}
          {currentView === 'announcements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t.announcementsCount(announcements.length)}</p>
                <button
                  onClick={() => openAnnouncementForm()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t.newAnnouncement}
                </button>
              </div>

              {announcements.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                  <Megaphone className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{t.noAnnouncements}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map(ann => (
                    <div key={ann.id} className="bg-card rounded-xl border border-border p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{ann.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              ann.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {ann.isActive ? t.active : t.inactive}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{ann.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => openAnnouncementForm(ann)}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteAnnouncement(ann.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Announcement Form Modal */}
      {showAnnouncementForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-semibold text-foreground">
                {editingAnnouncement ? t.editAnnouncement : t.newAnnouncement}
              </h2>
              <button onClick={() => setShowAnnouncementForm(false)} className="p-2 rounded-lg hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t.announcementTitle}</label>
                <input
                  type="text" value={announcementForm.title}
                  onChange={e => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t.announcementTitlePlaceholder}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t.announcementContent}</label>
                <textarea
                  value={announcementForm.content}
                  onChange={e => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={t.announcementContentPlaceholder}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAnnouncementForm(false)}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={saveAnnouncement}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {editingAnnouncement ? t.update : t.create}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl border border-border w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-semibold text-foreground">{t.resetPassword}</h2>
              <button onClick={() => setResetPasswordUser(null)} className="p-2 rounded-lg hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t.resetPasswordFor(resetPasswordUser.name)}
              </p>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t.newPasswordLabel}</label>
                <input
                  type="password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder=""
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setResetPasswordUser(null)}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleResetPassword}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {t.reset}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
