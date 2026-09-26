"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type BilingualText = { th: string; en: string };
type Language = "th" | "en";
type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (value: BilingualText) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("th");

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: (next) => {
        setLanguage(next);
        document.documentElement.lang = next;
      },
      // Fallback to Thai prevents empty UI when English content has not been entered yet.
      t: ({ th, en }) => (language === "en" && en.trim() ? en : th),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used inside LanguageProvider");
  return context;
}

export function T({ th, en }: BilingualText) {
  const { t } = useTranslation();
  return <>{t({ th, en })}</>;
}

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation();
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5 text-[0.7rem] font-extrabold text-slate-500">
      {(["th", "en"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLanguage(item)}
          aria-pressed={language === item}
          className={`rounded-full px-2 py-1 transition ${language === item ? "bg-brand-primary text-white shadow-sm" : "hover:text-brand-primary"}`}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
