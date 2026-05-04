import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import DashboardPage from './DashboardPage';
import AdminPage from './AdminPage';
import { LanguageProvider } from '../lib/LanguageProvider';

export default function Index() {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<DashboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </LanguageProvider>
  );
}
