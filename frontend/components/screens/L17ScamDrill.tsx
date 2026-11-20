"use client";

import React, { useState, useEffect } from "react";
import {
  XCircle,
  CheckCircle2,
  Volume2,
  ArrowRight,
  Sparkles,
  Flame,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { ScamDrill, MOCK_DRILLS } from "../../mocks/drills";
import { api } from "../../lib/api";
import { TrustButton } from "../TrustButton";

export const L17ScamDrill: React.FC = () => {
  const { t, speak, lang } = useI18n();
  const [drillIndex, setDrillIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<"scam" | "real" | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [badgeNotice, setBadgeNotice] = useState<string | null>(null);

  const currentDrill = MOCK_DRILLS[drillIndex % MOCK_DRILLS.length];
  const sender = currentDrill.sender_name[lang] || currentDrill.sender_name.en;
  const message = currentDrill.message[lang] || currentDrill.message.en;

  const playDrillAudio = () => {
    speak(`${t("l17_drill.sender_label")} ${sender}. ${message}`);
  };

  useEffect(() => {
    setUserAnswer(null);
    setBadgeNotice(null);
    playDrillAudio();
  }, [drillIndex]);

  const handleAnswer = async (answer: "scam" | "real") => {
    if (userAnswer !== null) return; // already answered

    setUserAnswer(answer);
    const isCorrect = answer === currentDrill.correct_answer;

    if (isCorrect) {
      const newStreak = streak + 1;
      const newTotal = totalCorrect + 1;
      setStreak(newStreak);
      setTotalCorrect(newTotal);

      // Check badges (PRD 7.4)
      if (newTotal === 5) {
        await api.unlockBadge("scam_spotter");
        setBadgeNotice("Badge Unlocked: Scam Spotter (5 drills right)!");
      }
      if (newStreak === 5) {
        await api.unlockBadge("sharp_eye");
        setBadgeNotice("Badge Unlocked: Sharp Eye (5 in a row)!");
      }

      speak(
        answer === "scam"
          ? t("l17_drill.correct_scam")
          : t("l17_drill.correct_real")
      );
    } else {
      setStreak(0);
      speak(t("l17_drill.wrong_feedback"));
    }
  };

  const handleNextDrill = () => {
    setDrillIndex((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col justify-between min-h-screen p-4 pb-24 bg-cream">
      {/* Top Bar with Streak */}
      <div>
        <div className="flex items-center justify-between pt-1 mb-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-bold text-[14px]">
            <Flame size={18} className="text-orange-600" />
            <span>{t("l17_drill.streak_label", { streak })}</span>
          </div>

          <span className="text-[14px] text-charcoal-secondary font-bold">
            Drill #{drillIndex + 1}
          </span>

          <button
            onClick={playDrillAudio}
            className="p-2 rounded-full bg-white border border-border text-teal-deep shadow-sm"
          >
            <Volume2 size={22} />
          </button>
        </div>

        <h1 className="text-title text-charcoal">{t("l17_drill.title")}</h1>
        <p className="text-body text-charcoal-secondary mt-0.5">
          {t("l17_drill.sub")}
        </p>
      </div>

      {/* WhatsApp-style Chat Bubble Message */}
      <div className="my-auto flex flex-col gap-3">
        <div className="bg-[#EFEAE2] p-4 rounded-3xl border border-[#D5CDBD] shadow-card flex flex-col gap-2">
          {/* Sender header */}
          <div className="flex items-center justify-between border-b border-[#D5CDBD]/60 pb-2">
            <span className="font-bold text-[15px] text-teal-deep">
              {sender}
            </span>
            <span className="text-[12px] text-charcoal-secondary">10:42 AM</span>
          </div>

          {/* Chat text bubble */}
          <div className="bg-white p-3.5 rounded-2xl rounded-tl-sm text-[17px] text-charcoal leading-relaxed shadow-sm">
            {message}
          </div>
        </div>

        {/* Feedback / Highlighted tricks when answered */}
        {userAnswer !== null && (
          <div
            className={`p-4 rounded-card border shadow-card animate-fade-in ${
              userAnswer === currentDrill.correct_answer
                ? "bg-verdict-no_signs-bg border-verdict-no_signs-border text-charcoal"
                : "bg-verdict-scam-bg border-verdict-scam-border text-charcoal"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-[18px] mb-2">
              {userAnswer === currentDrill.correct_answer ? (
                <>
                  <CheckCircle2 size={24} className="text-verdict-no_signs-text" />
                  <span className="text-verdict-no_signs-text">
                    {currentDrill.correct_answer === "scam"
                      ? t("l17_drill.correct_scam")
                      : t("l17_drill.correct_real")}
                  </span>
                </>
              ) : (
                <>
                  <XCircle size={24} className="text-verdict-scam-text" />
                  <span className="text-verdict-scam-text">
                    {t("l17_drill.wrong_feedback")}
                  </span>
                </>
              )}
            </div>

            {/* Explanation & Tricks used */}
            {currentDrill.tricks && currentDrill.tricks.length > 0 && (
              <div className="mt-2 pt-2 border-t border-black/10 flex flex-col gap-1.5">
                <span className="font-bold text-[15px] text-charcoal">
                  {t("l17_drill.tricks_used")}
                </span>
                {currentDrill.tricks.map((trick, idx) => (
                  <div key={idx} className="text-[15px]">
                    <span className="font-bold bg-marigold/30 px-1.5 py-0.5 rounded">
                      "{trick.highlight}"
                    </span>
                    <span className="ml-1 text-charcoal-secondary">
                      — {trick.explanation[lang] || trick.explanation.en}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {badgeNotice && (
              <div className="mt-3 p-2 rounded-lg bg-marigold text-charcoal font-bold text-[14px] flex items-center gap-2">
                <Sparkles size={18} />
                <span>{badgeNotice}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Real / Scam Choice Buttons */}
      <div className="flex flex-col gap-3">
        {userAnswer === null ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAnswer("scam")}
              className="min-h-[64px] rounded-btn bg-verdict-scam-bg hover:bg-[#fed7d7] text-verdict-scam-text border-2 border-verdict-scam-border font-bold text-[20px] flex items-center justify-center gap-2 shadow-card active:scale-95 transition-transform"
            >
              <XCircle size={28} strokeWidth={2.5} />
              <span>{t("l17_drill.btn_scam")}</span>
            </button>

            <button
              onClick={() => handleAnswer("real")}
              className="min-h-[64px] rounded-btn bg-verdict-no_signs-bg hover:bg-[#cbf2d3] text-verdict-no_signs-text border-2 border-verdict-no_signs-border font-bold text-[20px] flex items-center justify-center gap-2 shadow-card active:scale-95 transition-transform"
            >
              <CheckCircle2 size={28} strokeWidth={2.5} />
              <span>{t("l17_drill.btn_real")}</span>
            </button>
          </div>
        ) : (
          <TrustButton
            variant="primary"
            label={t("l17_drill.next_drill")}
            icon={<ArrowRight size={24} />}
            onClick={handleNextDrill}
          />
        )}
      </div>
    </div>
  );
};
