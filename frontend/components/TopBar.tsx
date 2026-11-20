"use client";

import React, { useState } from "react";
import { Volume2, Globe, Check, ShieldCheck, X } from "lucide-react";
import { useI18n, SUPPORTED_LANGUAGES, LanguageCode } from "../lib/i18n";

interface TopBarProps {
  screenTitle?: string;
  readAloudText?: string;
  onLanguageChangeRequested?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  screenTitle,
  readAloudText,
}) => {
  const { lang, setLang, t, speak, isSpeaking, stopSpeak } = useI18n();
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const handleReadScreen = () => {
    if (isSpeaking) {
      stopSpeak();
    } else {
      const textToRead = readAloudText || screenTitle || t("common.app_name");
      speak(textToRead);
    }
  };

  const currentLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-teal-deep text-white px-4 py-3 flex items-center justify-between shadow-md">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-marigold flex items-center justify-center text-charcoal font-bold text-lg">
            <ShieldCheck size={22} strokeWidth={2.5} className="text-teal-deep" />
          </div>
          <span className="font-bold text-[20px] tracking-tight">{t("common.app_name")}</span>
        </div>

        {/* Action Controls: Read Aloud & Language Selector */}
        <div className="flex items-center gap-2">
          {/* Read aloud screen button */}
          <button
            onClick={handleReadScreen}
            aria-label={t("common.listen")}
            className={`p-2 rounded-full transition-all ${
              isSpeaking
                ? "bg-marigold text-charcoal animate-pulse shadow-sm"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Volume2 size={24} strokeWidth={2} />
          </button>

          {/* Language Switcher Button */}
          <button
            onClick={() => setIsLangModalOpen(true)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full border border-white/20 text-[15px] font-medium transition-colors"
          >
            <Globe size={18} strokeWidth={2} />
            <span className="font-semibold">{currentLangInfo?.name || "English"}</span>
          </button>
        </div>
      </header>

      {/* Language Selection Modal */}
      {isLangModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-card w-full max-w-sm p-5 shadow-2xl border border-border">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Globe size={22} className="text-teal-deep" />
                <h3 className="text-heading text-charcoal">{t("l1_picker.title")}</h3>
              </div>
              <button
                onClick={() => setIsLangModalOpen(false)}
                className="p-1 rounded-full hover:bg-cream-dark text-charcoal-secondary"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-[15px] text-charcoal-secondary mb-4">
              {t("l1_picker.subtitle")}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {SUPPORTED_LANGUAGES.map((item) => {
                const isSelected = item.code === lang;
                return (
                  <button
                    key={item.code}
                    onClick={() => {
                      setLang(item.code);
                      setIsLangModalOpen(false);
                      // Welcome audio in that language
                      speak(item.name);
                    }}
                    className={`flex items-center justify-between p-3 rounded-btn border text-left transition-all ${
                      isSelected
                        ? "bg-teal-light border-teal-deep text-teal-deep font-bold"
                        : "bg-white border-border hover:bg-cream text-charcoal font-medium"
                    }`}
                  >
                    <div>
                      <div className="text-[18px]">{item.name}</div>
                      <div className="text-[13px] text-charcoal-secondary">{item.englishName}</div>
                    </div>
                    {isSelected && <Check size={20} className="text-teal-deep" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsLangModalOpen(false)}
              className="w-full py-2.5 rounded-btn bg-cream-dark text-charcoal font-semibold text-[16px] hover:bg-border transition-colors"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
