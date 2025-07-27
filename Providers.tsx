'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Language {
  code: 'fr' | 'en' | 'ar';
  name: string;
  dir: 'ltr' | 'rtl';
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translations: Record<string, any>;
  isLoading: boolean;
}

const languages: Language[] = [
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export function Providers({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(languages[0]);
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await import(`@/locales/${language.code}.json`);
        setTranslations(response.default);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to French if loading fails
        const fallback = await import('@/locales/fr.json');
        setTranslations(fallback.default);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  useEffect(() => {
    // Set document direction based on language
    document.documentElement.dir = language.dir;
    document.documentElement.lang = language.code;
  }, [language]);

  const value: AppContextType = {
    language,
    setLanguage,
    translations,
    isLoading,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Helper function to get nested translation
export function useTranslation() {
  const { translations } = useApp();
  
  const t = (key: string): string => {
    const keys = key.split('.');
    let result = translations;
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof result === 'string' ? result : key;
  };

  return { t };
}
