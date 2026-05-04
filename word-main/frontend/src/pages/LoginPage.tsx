import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen, Eye, EyeOff, Loader2, Languages } from 'lucide-react';
import { apiService } from '../lib/api';
import type { AuthUser } from '@shared/types/api';
import { useLanguage } from '../lib/i18n';

export default function LoginPage() {
  const navigate = useNavigate();
  const { t, toggleLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t.fillRequired);
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.login({ email, password });
      if (res.success) {
        const authUser = res.data as AuthUser;
        localStorage.setItem('token', authUser.token);
        localStorage.setItem('user', JSON.stringify(authUser));
        toast.success(t.signIn);
        navigate('/');
      } else {
        toast.error(res.error || t.signIn);
      }
    } catch {
      toast.error(t.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/70" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl">{t.appName}</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4 whitespace-pre-line">
            {t.heroTitle}
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            {t.heroDesc}
          </p>
        </div>
        <div className="relative z-10">
          <img
            src="https://images.unsplash.com/photo-1758525861622-f4e7ac86a2d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80"
            alt="Student studying"
            className="rounded-2xl w-full object-cover h-64 opacity-80"
          />
          <p className="text-white/60 text-xs mt-3">Photo by Vitaly Gariev on Unsplash</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">{t.appName}</span>
            </div>
            <div className="hidden lg:block" />
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Languages className="w-4 h-4" />
              {t.switchLanguage}
            </button>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">{t.welcomeBack}</h2>
          <p className="text-muted-foreground mb-8">{t.signInToContinue}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.email}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.password}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full h-10 px-3 pr-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t.signIn}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t.noAccount}{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              {t.registerNow}
            </Link>
          </p>

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-medium mb-2">{t.demoAccounts}</p>
            <p className="text-xs text-muted-foreground">{t.adminDemo}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
