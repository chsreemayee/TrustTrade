"use client";

import React from "react";
import {
  ShieldAlert,
  BookOpen,
  TrendingUp,
  Target,
  AlertTriangle,
  PlayCircle,
  Volume2,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { BigMicButton } from "../BigMicButton";
import { TrustButton } from "../TrustButton";

interface L3HomeProps {
  onNavigate: (screen: string, params?: any) => void;
  onMicTranscript: (text: string) => void;
}

export const L3Home: React.FC<L3HomeProps> = ({
  onNavigate,
  onMicTranscript,
}) => {
  const { t, speak, lang } = useI18n();

  const handleTileSpeaker = (e: React.MouseEvent, title: string, sub: string) => {
    e.stopPropagation();
    speak(`${title}. ${sub}`);
  };

  const handleAlertClick = () => {
    // Navigate directly to Scam Check with the alert's sample text
    onNavigate("scam_check", {
      prefillText:
        lang === "te"
          ? "యూట్యూబ్ వీడియోలను లైక్ చేసి రోజూ ₹3,000 సంపాదించండి. ₹299 రిజిస్ట్రేషన్ ఫీజు చెల్లించండి."
          : lang === "hi"
          ? "यूट्यूब वीडियो लाइक करके रोज ₹3,000 कमाएं। ₹299 रजिस्ट्रेशन फीस तुरंत भेजें।"
          : "Earn ₹3,000 daily liking YouTube videos. Pay ₹299 registration fee.",
    });
  };

  const handlePlayLesson = () => {
    onNavigate("lesson_player", { lessonId: "lesson_1" });
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 bg-cream min-h-screen">
      {/* Warm Greeting Header */}
      <div className="pt-1 flex items-center justify-between">
        <div>
          <h1 className="text-title text-charcoal">{t("l3_home.header_greeting")}</h1>
          <p className="text-body text-charcoal-secondary">{t("l3_home.header_sub")}</p>
        </div>
        <button
          onClick={() =>
            speak(`${t("l3_home.header_greeting")}. ${t("l3_home.header_sub")}`)
          }
          className="p-2 rounded-full bg-white border border-border text-teal-deep shadow-sm"
          aria-label="Listen greeting"
        >
          <Volume2 size={22} />
        </button>
      </div>

      {/* Hero: 88px Round Big Mic "Tap and Speak" */}
      <div className="bg-white rounded-card p-5 border border-border shadow-card flex flex-col items-center">
        <BigMicButton
          onTranscript={onMicTranscript}
          label={t("l3_home.mic_main_title")}
          subLabel={t("l3_home.mic_main_sub")}
        />
      </div>

      {/* Safety Alert Card */}
      <div className="bg-verdict-careful-bg rounded-card p-4 border border-verdict-careful-border shadow-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-marigold text-charcoal font-bold text-chip">
              <AlertTriangle size={18} strokeWidth={2.5} />
              {t("l3_home.alert_badge")}
            </span>
          </div>
          <button
            onClick={() =>
              speak(
                lang === "te"
                  ? "ముఖ్యమైన భద్రతా హెచ్చరిక. వాట్సాప్ పార్ట్‌టైమ్ జాబ్ మోసాల పట్ల జాగ్రత్తగా ఉండండి."
                  : "Safety alert. Beware of WhatsApp part-time job fraud."
              )
            }
            className="p-1.5 rounded-full text-charcoal-secondary hover:text-charcoal"
          >
            <Volume2 size={20} />
          </button>
        </div>

        <h3 className="text-heading text-charcoal mt-1">
          {lang === "te"
            ? "వాట్సాప్ పార్ట్‌టైమ్ జాబ్ మోసం"
            : lang === "hi"
            ? "व्हाट्सएप पार्ट-टाइम जॉब फ्रॉड"
            : "WhatsApp Part-time Job Scam"}
        </h3>
        <p className="text-body text-charcoal-secondary mt-1">
          {lang === "te"
            ? "యూట్యూబ్ వీడియోలు లైక్ చేసి రోజుకు ₹3,000 ఇస్తామని ఫీజు అడిగితే నమ్మవద్దు."
            : lang === "hi"
            ? "वीडियो लाइक करके रोज ₹3,000 कमाने के नाम पर कोई रजिस्ट्रेशन फीस मांगे तो न दें।"
            : "Do not pay any registration fee for YouTube like or review tasks."}
        </p>

        <div className="mt-3">
          <TrustButton
            variant="accent"
            label={t("l3_home.alert_action")}
            icon={<ShieldAlert size={24} strokeWidth={2} />}
            onClick={handleAlertClick}
            speechText={t("l3_home.alert_action")}
            size="sm"
          />
        </div>
      </div>

      {/* 4 Main Action Tiles (Scam Check, Learn, Practice, Scam Drill) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Tile 1: Scam Check */}
        <div
          onClick={() => onNavigate("scam_check")}
          className="bg-white rounded-card p-4 border-2 border-teal-deep/30 hover:border-teal-deep shadow-card cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-teal-light text-teal-deep flex items-center justify-center">
              <ShieldAlert size={28} strokeWidth={2} />
            </div>
            <button
              onClick={(e) =>
                handleTileSpeaker(
                  e,
                  t("l3_home.tile_check_title"),
                  t("l3_home.tile_check_sub")
                )
              }
              className="p-1 rounded-full text-charcoal-secondary hover:text-teal-deep"
            >
              <Volume2 size={20} />
            </button>
          </div>
          <div className="mt-2">
            <div className="text-[18px] font-bold text-charcoal leading-tight">
              {t("l3_home.tile_check_title")}
            </div>
            <div className="text-[14px] text-charcoal-secondary mt-0.5">
              {t("l3_home.tile_check_sub")}
            </div>
          </div>
        </div>

        {/* Tile 2: Learn */}
        <div
          onClick={() => onNavigate("learn")}
          className="bg-white rounded-card p-4 border border-border hover:border-teal-deep/50 shadow-card cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-teal-light text-teal-deep flex items-center justify-center">
              <BookOpen size={28} strokeWidth={2} />
            </div>
            <button
              onClick={(e) =>
                handleTileSpeaker(
                  e,
                  t("l3_home.tile_learn_title"),
                  t("l3_home.tile_learn_sub")
                )
              }
              className="p-1 rounded-full text-charcoal-secondary hover:text-teal-deep"
            >
              <Volume2 size={20} />
            </button>
          </div>
          <div className="mt-2">
            <div className="text-[18px] font-bold text-charcoal leading-tight">
              {t("l3_home.tile_learn_title")}
            </div>
            <div className="text-[14px] text-charcoal-secondary mt-0.5">
              {t("l3_home.tile_learn_sub")}
            </div>
          </div>
        </div>

        {/* Tile 3: Practice */}
        <div
          onClick={() => onNavigate("practice")}
          className="bg-white rounded-card p-4 border border-border hover:border-teal-deep/50 shadow-card cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-marigold/20 text-charcoal flex items-center justify-center">
              <TrendingUp size={28} strokeWidth={2} className="text-teal-deep" />
            </div>
            <button
              onClick={(e) =>
                handleTileSpeaker(
                  e,
                  t("l3_home.tile_practice_title"),
                  t("l3_home.tile_practice_sub")
                )
              }
              className="p-1 rounded-full text-charcoal-secondary hover:text-teal-deep"
            >
              <Volume2 size={20} />
            </button>
          </div>
          <div className="mt-2">
            <div className="text-[18px] font-bold text-charcoal leading-tight">
              {t("l3_home.tile_practice_title")}
            </div>
            <div className="text-[14px] text-charcoal-secondary mt-0.5">
              {t("l3_home.tile_practice_sub")}
            </div>
          </div>
        </div>

        {/* Tile 4: Scam Drill */}
        <div
          onClick={() => onNavigate("drill")}
          className="bg-white rounded-card p-4 border border-border hover:border-teal-deep/50 shadow-card cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-teal-light text-teal-deep flex items-center justify-center">
              <Target size={28} strokeWidth={2} />
            </div>
            <button
              onClick={(e) =>
                handleTileSpeaker(
                  e,
                  t("l3_home.tile_drill_title"),
                  t("l3_home.tile_drill_sub")
                )
              }
              className="p-1 rounded-full text-charcoal-secondary hover:text-teal-deep"
            >
              <Volume2 size={20} />
            </button>
          </div>
          <div className="mt-2">
            <div className="text-[18px] font-bold text-charcoal leading-tight">
              {t("l3_home.tile_drill_title")}
            </div>
            <div className="text-[14px] text-charcoal-secondary mt-0.5">
              {t("l3_home.tile_drill_sub")}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Lesson Card */}
      <div className="bg-white rounded-card p-4 border border-border shadow-card flex items-center justify-between">
        <div className="flex-1 pr-3">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-marigold/30 text-charcoal font-bold text-[13px] mb-1">
            {t("l3_home.todays_lesson_badge")}
          </span>
          <h4 className="text-[18px] font-bold text-charcoal leading-snug">
            {lang === "te"
              ? "ధరలు ఎందుకు పెరుగుతాయి, తగ్గుతాయి?"
              : lang === "hi"
              ? "दाम क्यों घटते और बढ़ते हैं?"
              : "Why prices go up and down"}
          </h4>
          <span className="text-[14px] text-charcoal-secondary">
            {lang === "te" ? "2 నిమిషాల కథ" : lang === "hi" ? "2 मिनट की कहानी" : "2-min story"}
          </span>
        </div>

        <button
          onClick={handlePlayLesson}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-deep hover:bg-teal-hover active:scale-95 text-white flex items-center justify-center shadow-md"
          aria-label={t("l3_home.todays_lesson_play")}
        >
          <PlayCircle size={28} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};
