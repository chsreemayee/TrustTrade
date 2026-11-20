"use client";

import React, { useEffect } from "react";
import {
  ArrowLeft,
  Volume2,
  BookOpen,
  ShieldAlert,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { TrustButton } from "../TrustButton";

interface L19BigMicAnswerProps {
  question: string;
  onLearnMoreLesson: (lessonId: string) => void;
  onRouteToScamCheck: (text: string) => void;
  onBack: () => void;
}

export const L19BigMicAnswer: React.FC<L19BigMicAnswerProps> = ({
  question,
  onLearnMoreLesson,
  onRouteToScamCheck,
  onBack,
}) => {
  const { t, speak, lang } = useI18n();

  const qLower = question.toLowerCase();

  let answerText = "";
  let isStockPick = false;
  let isTipOrScam = false;
  let recommendedLessonId = "lesson_1";

  if (
    qLower.includes("which share") ||
    qLower.includes("what stock") ||
    qLower.includes("buy share") ||
    qLower.includes("ఏ షేరు కొనాలి") ||
    qLower.includes("कौन सा शेयर")
  ) {
    isStockPick = true;
    answerText = t("l19_big_mic.stock_refusal");
    recommendedLessonId = "lesson_2";
  } else if (
    qLower.includes("double") ||
    qLower.includes("whatsapp") ||
    qLower.includes("telegram") ||
    qLower.includes("tip") ||
    qLower.includes("మోసం") ||
    qLower.includes("ఫ్రాడ్") ||
    qLower.includes("स्कैम")
  ) {
    isTipOrScam = true;
    answerText =
      lang === "te"
        ? "మీరు ఇన్వెస్ట్‌మెంట్ టిప్ గురించి అడుగుతున్నట్లు అనిపిస్తోంది. దయచేసి పూర్తి వివరాలను స్కామ్ చెక్ ద్వారా తనిఖీ చేయండి."
        : "You seem to be asking about an investment tip. Let's run a Scam Check on it to stay safe.";
  } else if (
    qLower.includes("weather") ||
    qLower.includes("cricket") ||
    qLower.includes("movie") ||
    qLower.includes("సినిమా")
  ) {
    answerText = t("l19_big_mic.offtopic_refusal");
  } else {
    // Money basics answer (<= 40 words)
    answerText =
      lang === "te"
        ? "డబ్బును ఇంట్లో ఉంచితే ధరలు పెరిగి దాని విలువ తగ్గుతుంది. కంపెనీలలో చిన్న భాగాన్ని షేర్ అంటారు. లైసెన్స్ ఉన్న అధికారిక బ్రోకర్ ద్వారా మాత్రమే కొనుగోలు చేయాలి."
        : lang === "hi"
        ? "महंगाई के कारण नकद पैसे की खरीदारी क्षमता कम होती है। किसी कंपनी के छोटे हिस्से को शेयर कहते हैं। हमेशा सेबी पंजीकृत ब्रोकर के साथ ही शुरुआत करें।"
        : "Cash idle in a box loses purchasing power to inflation. Owning a tiny part of a company is called a share. Always start safely through SEBI-registered brokers.";
  }

  useEffect(() => {
    speak(`${t("l19_big_mic.question_heard")}: ${question}. ${answerText}`);
  }, []);

  return (
    <div className="flex flex-col justify-between min-h-screen p-4 pb-20 bg-cream">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pt-1 mb-2">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-white border border-border text-charcoal hover:bg-cream-dark"
          >
            <ArrowLeft size={22} />
          </button>

          <h2 className="text-heading text-charcoal">
            {t("l19_big_mic.title")}
          </h2>

          <button
            onClick={() => speak(answerText)}
            className="p-2 rounded-full bg-white border border-border text-teal-deep shadow-sm"
          >
            <Volume2 size={22} />
          </button>
        </div>

        <p className="text-body text-charcoal-secondary">
          {t("l19_big_mic.sub")}
        </p>
      </div>

      {/* Answer & Question Content */}
      <div className="my-auto flex flex-col gap-4">
        {/* Question Heard Card */}
        <div className="bg-white rounded-card p-4 border border-border shadow-card">
          <span className="text-[14px] font-bold text-charcoal-secondary uppercase">
            {t("l19_big_mic.question_heard")}
          </span>
          <div className="text-[18px] font-bold text-charcoal mt-1 italic">
            "{question}"
          </div>
        </div>

        {/* Spoken Answer Card (<= 40 words) */}
        <div className="bg-teal-light/50 rounded-card p-5 border-2 border-teal-deep/30 shadow-card flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[16px] text-teal-deep flex items-center gap-1.5">
              <Sparkles size={20} />
              <span>{t("l19_big_mic.spoken_answer")}</span>
            </span>
            <button
              onClick={() => speak(answerText)}
              className="p-1 rounded-full text-teal-deep hover:bg-white"
            >
              <Volume2 size={20} />
            </button>
          </div>

          <p className="text-body text-charcoal font-medium leading-relaxed">
            {answerText}
          </p>
        </div>

        {/* Dynamic Route: If scam tip detected */}
        {isTipOrScam && (
          <div className="p-4 bg-verdict-scam-bg border border-verdict-scam-border rounded-card">
            <TrustButton
              variant="danger"
              label="Check this tip now"
              icon={<ShieldAlert size={24} />}
              onClick={() => onRouteToScamCheck(question)}
            />
          </div>
        )}
      </div>

      {/* Learn more in lesson button */}
      <div className="flex flex-col gap-3">
        <TrustButton
          variant="primary"
          label={t("l19_big_mic.learn_more_btn")}
          icon={<BookOpen size={24} />}
          onClick={() => onLearnMoreLesson(recommendedLessonId)}
          speechText={t("l19_big_mic.learn_more_btn")}
        />

        <TrustButton
          variant="ghost"
          label={t("common.back")}
          onClick={onBack}
        />
      </div>
    </div>
  );
};
