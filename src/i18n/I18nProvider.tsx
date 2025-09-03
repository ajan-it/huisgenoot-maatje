import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { dictionaries } from "./dictionaries";

export type Lang = "nl" | "en";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("lang");
    if (stored === "nl" || stored === "en") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useMemo(() => {
    return (key: string) => {
      const primaryDict = dictionaries[lang] || dictionaries.nl;
      const fallbackDict = dictionaries[lang === "nl" ? "en" : "nl"];
      
      // Try primary language first
      const primaryResult = key.split(".").reduce<any>((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), primaryDict);
      
      if (primaryResult !== undefined) {
        return primaryResult;
      }
      
      // Try fallback language
      const fallbackResult = key.split(".").reduce<any>((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), fallbackDict);
      
      if (fallbackResult !== undefined) {
        return fallbackResult;
      }
      
      // Development warning for missing translations
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation for key: ${key} in both ${lang} and fallback language`);
      }
      
      // Last resort: return the key
      return key;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
