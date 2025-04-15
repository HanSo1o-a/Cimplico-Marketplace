import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';

interface LanguageState {
  language: string;
  setLanguage: (language: string) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: i18n.language || 'zh',
      setLanguage: (language: string) => {
        i18n.changeLanguage(language);
        set({ language });
      },
    }),
    {
      name: 'cimplico-language-storage',
      getStorage: () => localStorage,
    }
  )
);
