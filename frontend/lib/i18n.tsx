"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import enLocale from "../locales/en.json";
import teLocale from "../locales/te.json";
import hiLocale from "../locales/hi.json";
import knLocale from "../locales/kn.json";
import taLocale from "../locales/ta.json";
import mlLocale from "../locales/ml.json";
import { speakText, stopSpeaking } from "./speech";

export type LanguageCode = "te" | "hi" | "en" | "kn" | "ta" | "ml";

export interface LanguageInfo {
  code: LanguageCode;
  name: string; // in its own script
  englishName: string;
  fontClass: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "te", name: "తెలుగు", englishName: "Telugu", fontClass: "font-telugu" },
  { code: "hi", name: "हिन्दी", englishName: "Hindi", fontClass: "font-devanagari" },
  { code: "en", name: "English", englishName: "English", fontClass: "font-sans" },
  { code: "kn", name: "ಕನ್ನಡ", englishName: "Kannada", fontClass: "font-kannada" },
  { code: "ta", name: "தமிழ்", englishName: "Tamil", fontClass: "font-tamil" },
  { code: "ml", name: "മലയാളം", englishName: "Malayalam", fontClass: "font-malayalam" },
];

const LOCALES: Record<LanguageCode, any> = {
  en: enLocale,
  te: teLocale,
  hi: hiLocale,
  kn: knLocale,
  ta: taLocale,
  ml: mlLocale,
};

interface I18nContextType {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  speak: (text: string) => void;
  stopSpeak: () => void;
  isSpeaking: boolean;
  voiceSpeed: number;
  setVoiceSpeed: (speed: number) => void;
  fontClass: string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>("te");
  const [voiceSpeed, setVoiceSpeedState] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("trusttrade_lang") as LanguageCode;
      if (savedLang && LOCALES[savedLang]) {
        setLangState(savedLang);
      }
      const savedSpeed = localStorage.getItem("trusttrade_voice_speed");
      if (savedSpeed) {
        setVoiceSpeedState(parseFloat(savedSpeed));
      }
    }
  }, []);

  const setLang = (newLang: LanguageCode) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("trusttrade_lang", newLang);
    }
    stopSpeaking();
    setIsSpeaking(false);
  };

  const setVoiceSpeed = (speed: number) => {
    setVoiceSpeedState(speed);
    if (typeof window !== "undefined") {
      localStorage.setItem("trusttrade_voice_speed", speed.toString());
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let current: any = LOCALES[lang];

    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        // Fallback to English
        let fallback: any = LOCALES.en;
        for (const fbK of keys) {
          if (fallback && typeof fallback === "object" && fbK in fallback) {
            fallback = fallback[fbK];
          } else {
            fallback = key;
            break;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== "string") {
      return key;
    }

    let text = current;
    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(val));
      });
    }

    return text;
  };

  const speak = (text: string) => {
    setIsSpeaking(true);
    speakText(
      text,
      lang,
      voiceSpeed,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const stopSpeak = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
  const fontClass = langInfo?.fontClass || "font-sans";

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        t,
        speak,
        stopSpeak,
        isSpeaking,
        voiceSpeed,
        setVoiceSpeed,
        fontClass,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
