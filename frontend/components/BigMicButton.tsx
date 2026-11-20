"use client";

import React, { useState } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { startSpeechRecognition } from "../lib/speech";

interface BigMicButtonProps {
  onTranscript: (text: string) => void;
  label?: string;
  subLabel?: string;
  className?: string;
}

export const BigMicButton: React.FC<BigMicButtonProps> = ({
  onTranscript,
  label,
  subLabel,
  className = "",
}) => {
  const { lang, t, speak } = useI18n();
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startListening = () => {
    setErrorMessage(null);
    setIsListening(true);

    const controller = startSpeechRecognition(lang, {
      onResult: (transcript) => {
        setIsListening(false);
        if (transcript && transcript.trim()) {
          onTranscript(transcript.trim());
        } else {
          setErrorMessage(t("common.voice_error"));
        }
      },
      onError: (err) => {
        setIsListening(false);
        setErrorMessage(t("common.voice_error"));
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (!controller) {
      setIsListening(false);
      setErrorMessage(t("common.voice_error"));
    }
  };

  const handleSpeakerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const spoken = `${label || t("l3_home.mic_main_title")}. ${
      subLabel || t("l3_home.mic_main_sub")
    }`;
    speak(spoken);
  };

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {/* 88px round primary teal mic button */}
      <div className="relative flex items-center justify-center">
        {/* Animated pulse wave when listening */}
        {isListening && (
          <span className="absolute w-[110px] h-[110px] rounded-full bg-teal-deep/30 animate-ping pointer-events-none" />
        )}

        <button
          type="button"
          onClick={startListening}
          aria-label={label || t("l3_home.mic_main_title")}
          className={`w-[88px] h-[88px] rounded-full bg-teal-deep hover:bg-teal-hover active:scale-95 text-white flex items-center justify-center shadow-lg transition-transform border-4 border-white ${
            isListening ? "ring-4 ring-marigold animate-pulse" : ""
          }`}
        >
          {isListening ? (
            <MicOff size={40} strokeWidth={2.2} className="text-marigold" />
          ) : (
            <Mic size={40} strokeWidth={2.2} />
          )}
        </button>

        {/* Small audio read button next to mic */}
        <button
          type="button"
          onClick={handleSpeakerClick}
          aria-label="Listen instructions"
          className="absolute -right-8 top-1 p-2 rounded-full bg-white border border-border text-charcoal shadow-sm hover:bg-cream-dark active:scale-90"
        >
          <Volume2 size={20} strokeWidth={2} className="text-teal-deep" />
        </button>
      </div>

      {/* Button labels */}
      <div className="mt-3">
        <div className="text-[20px] font-bold text-charcoal">
          {isListening ? t("common.listening") : label || t("l3_home.mic_main_title")}
        </div>
        <div className="text-[15px] text-charcoal-secondary mt-0.5 max-w-[280px]">
          {subLabel || t("l3_home.mic_main_sub")}
        </div>
      </div>

      {/* Voice error fallback message */}
      {errorMessage && (
        <div className="mt-2 text-[14px] text-verdict-scam-text bg-verdict-scam-bg px-3 py-1.5 rounded-lg border border-verdict-scam-border animate-fade-in">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
