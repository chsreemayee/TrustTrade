"use client";

import React from "react";
import { Volume2, CheckCircle2, ShieldCheck } from "lucide-react";
import { useI18n, SUPPORTED_LANGUAGES, LanguageCode } from "../../lib/i18n";

interface L1LanguagePickerProps {
  onLanguageSelected: (langCode: LanguageCode) => void;
}

export const L1LanguagePicker: React.FC<L1LanguagePickerProps> = ({
  onLanguageSelected,
}) => {
  const { lang, setLang, t, speak } = useI18n();

  const handleSpeakerClick = (e: React.MouseEvent, code: LanguageCode, nativeName: string) => {
    e.stopPropagation();
    // Speak greeting in that language
    const welcome = code === "te"
      ? "ట్రస్ట్‌ట్రేడ్‌కు స్వాగతం. తెలుగును ఎంచుకోవడానికి నొక్కండి."
      : code === "hi"
      ? "ट्रस्टट्रेड में आपका स्वागत है। हिन्दी चुनने के लिए टैप करें।"
      : code === "kn"
      ? "ಟ್ರಸ್ಟ್‌ಟ್ರೇಡ್‌ಗೆ ಸುಸ್ವಾಗತ. ಕನ್ನಡವನ್ನು ಆಯ್ಕೆ ಮಾಡಲು ಒತ್ತಿ."
      : code === "ta"
      ? "ட்ரஸ்ட்ரேட்டிற்கு நல்வரவு. தமிழை தேர்ந்தெடுக்க தொடவும்."
      : code === "ml"
      ? "ട്രസ്റ്റ്‌ട്രേഡിലേക്ക് സ്വാഗതം. മലയാളം തിരഞ്ഞെടുക്കാൻ തൊടുക."
      : "Welcome to TrustTrade. Tap to choose English.";

    speak(welcome);
  };

  const handleSelect = (code: LanguageCode) => {
    setLang(code);
    onLanguageSelected(code);
  };

  return (
    <div className="flex flex-col min-h-[720px] justify-between p-4 bg-cream">
      {/* Header section */}
      <div className="text-center pt-4 pb-2">
        <div className="w-16 h-16 rounded-full bg-teal-deep text-marigold flex items-center justify-center mx-auto mb-4 shadow-card">
          <ShieldCheck size={36} strokeWidth={2.5} />
        </div>
        <h1 className="text-title text-charcoal">{t("l1_picker.title")}</h1>
        <p className="text-body text-charcoal-secondary mt-1">
          {t("l1_picker.subtitle")}
        </p>
      </div>

      {/* 6 Big Language Buttons (each in its own script + speaker button) */}
      <div className="flex flex-col gap-3 my-4">
        {SUPPORTED_LANGUAGES.map((item) => {
          const isSelected = item.code === lang;

          return (
            <button
              key={item.code}
              type="button"
              onClick={() => handleSelect(item.code)}
              className={`flex items-center justify-between min-h-[64px] px-5 py-3 rounded-btn transition-all duration-150 border-2 active:scale-[0.98] ${
                isSelected
                  ? "bg-teal-deep text-white border-teal-deep shadow-md"
                  : "bg-white text-charcoal border-border hover:border-teal-deep/50 shadow-card"
              }`}
            >
              <div className="flex items-center gap-3">
                {isSelected ? (
                  <CheckCircle2 size={26} className="text-marigold flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-border flex-shrink-0" />
                )}
                <div className="text-left">
                  <div className="text-[22px] font-bold leading-tight">
                    {item.name}
                  </div>
                  <div
                    className={`text-[14px] ${
                      isSelected ? "text-white/80" : "text-charcoal-secondary"
                    }`}
                  >
                    {item.englishName}
                  </div>
                </div>
              </div>

              {/* Speaker button to read greeting in that language */}
              <button
                type="button"
                onClick={(e) => handleSpeakerClick(e, item.code, item.name)}
                aria-label={`Listen in ${item.englishName}`}
                className={`p-2.5 rounded-full transition-transform active:scale-90 ${
                  isSelected
                    ? "bg-white/20 text-white hover:bg-white/30"
                    : "bg-cream text-teal-deep hover:bg-cream-dark"
                }`}
              >
                <Volume2 size={24} strokeWidth={2} />
              </button>
            </button>
          );
        })}
      </div>

      {/* Primary Continue Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => handleSelect(lang)}
          className="w-full min-h-[56px] rounded-btn bg-teal-deep hover:bg-teal-hover text-white font-bold text-[18px] flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
        >
          <span>{t("common.confirm")}</span>
        </button>
      </div>
    </div>
  );
};
