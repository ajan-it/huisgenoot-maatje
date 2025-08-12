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
  const [lang, setLangState] = useState<Lang>("nl");

  useEffect(() => {
    const stored = localStorage.getItem("lang");
    if (stored === "nl" || stored === "en") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  const t = useMemo(() => {
    return (key: string) => {
      const dict = dictionaries[lang] || dictionaries.nl;
      return key.split(".").reduce<any>((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), dict) ?? key;
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
