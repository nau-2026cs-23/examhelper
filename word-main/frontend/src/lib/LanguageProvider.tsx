import { useState, useCallback } from 'react';
import { LanguageContext, translations, type Language } from './i18n';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const stored = localStorage.getItem('lang');
    return (stored === 'en' || stored === 'zh') ? stored : 'zh';
  });

  const toggleLanguage = useCallback(() => {
    setLang(prev => {
      const next = prev === 'zh' ? 'en' : 'zh';
      localStorage.setItem('lang', next);
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
