"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import en from "@/locales/en.json";
import tr from "@/locales/tr.json";

type Language = "en" | "tr";
type Dictionary = typeof en;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_STORAGE_KEY = "nexopost-language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("tr");
  const translations = useMemo(() => ({ en, tr }), []);
  const t = translations[lang];

  useEffect(() => {
    const savedLang = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLang === "en" || savedLang === "tr") {
      queueMicrotask(() => setLang(savedLang));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
