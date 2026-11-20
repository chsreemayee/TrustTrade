"use client";

import React from "react";
import {
  BookOpen,
  PlayCircle,
  CheckCircle2,
  Volume2,
  Clock,
  Sparkles,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { Lesson, MOCK_LESSONS } from "../../mocks/lessons";
import { TrustButton } from "../TrustButton";

interface L11LearnHomeProps {
  onSelectLesson: (lessonId: string) => void;
}

export const L11LearnHome: React.FC<L11LearnHomeProps> = ({ onSelectLesson }) => {
  const { t, speak, lang } = useI18n();

  const mainLessons = MOCK_LESSONS.filter((l) => !l.is_micro);
  const microLessons = MOCK_LESSONS.filter((l) => l.is_micro);
  const todaysLesson = mainLessons[0]; // Tutor pick

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 bg-cream min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-title text-charcoal">{t("l11_learn.title")}</h1>
          <p className="text-body text-charcoal-secondary">{t("l11_learn.sub")}</p>
        </div>
        <button
          onClick={() =>
            speak(`${t("l11_learn.title")}. ${t("l11_learn.sub")}`)
          }
          className="p-2 rounded-full bg-white border border-border text-teal-deep shadow-sm"
        >
          <Volume2 size={22} />
        </button>
      </div>

      {/* Progress summary banner */}
      <div className="bg-white rounded-card p-3.5 border border-border shadow-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-marigold" />
          <span className="text-[15px] font-bold text-charcoal">
            {t("l11_learn.progress_dots", { completed: 1, total: 6 })}
          </span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i === 1 ? "bg-teal-deep" : "bg-border-dark"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Hero: Today's Pick Card */}
      <div className="bg-marigold/15 rounded-card p-5 border-2 border-marigold/60 shadow-card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-marigold text-charcoal font-bold text-chip">
            {t("l11_learn.todays_pick")}
          </span>
          <span className="flex items-center gap-1 text-[14px] text-charcoal-secondary font-medium">
            <Clock size={16} />
            <span>{todaysLesson.estimated_time}</span>
          </span>
        </div>

        <div>
          <h3 className="text-[22px] font-bold text-charcoal leading-tight">
            {todaysLesson.title[lang] || todaysLesson.title.en}
          </h3>
          <p className="text-body text-charcoal-secondary mt-1">
            {todaysLesson.core_idea[lang] || todaysLesson.core_idea.en}
          </p>
        </div>

        <TrustButton
          variant="primary"
          label={t("l11_learn.start_lesson")}
          icon={<PlayCircle size={26} />}
          onClick={() => onSelectLesson(todaysLesson.id)}
          speechText={todaysLesson.title[lang] || todaysLesson.title.en}
        />
      </div>

      {/* 6 Foundational Topic Cards */}
      <div className="flex flex-col gap-2.5">
        <h2 className="text-heading text-charcoal">{t("l11_learn.all_topics")}</h2>

        <div className="flex flex-col gap-3">
          {mainLessons.map((item, idx) => {
            const title = item.title[lang] || item.title.en;
            const core = item.core_idea[lang] || item.core_idea.en;

            return (
              <div
                key={item.id}
                onClick={() => onSelectLesson(item.id)}
                className="bg-white rounded-card p-4 border border-border hover:border-teal-deep shadow-card cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between gap-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-light text-teal-deep flex items-center justify-center font-bold text-[18px] flex-shrink-0">
                  {idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[18px] font-bold text-charcoal leading-snug">
                    {title}
                  </div>
                  <div className="text-[14px] text-charcoal-secondary truncate mt-0.5">
                    {core}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(`${title}. ${core}`);
                  }}
                  className="p-1.5 rounded-full text-charcoal-secondary hover:text-teal-deep flex-shrink-0"
                >
                  <Volume2 size={22} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5 Scam Micro-lessons (30s) */}
      <div className="flex flex-col gap-2.5 mt-2">
        <h2 className="text-heading text-charcoal">
          {lang === "te"
            ? "స్కామ్ రక్షణ సూక్ష్మ పాఠాలు (30 సె)"
            : lang === "hi"
            ? "स्कैम सुरक्षा माइक्रो-पाठ (30 सेकंड)"
            : "Scam Protection Micro-lessons (30s)"}
        </h2>

        <div className="flex flex-col gap-2.5">
          {microLessons.map((micro) => {
            const title = micro.title[lang] || micro.title.en;
            return (
              <div
                key={micro.id}
                onClick={() => onSelectLesson(micro.id)}
                className="bg-white rounded-card p-3.5 border border-border hover:border-marigold shadow-card cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-marigold" />
                  <span className="font-bold text-[16px] text-charcoal">{title}</span>
                </div>
                <PlayCircle size={22} className="text-teal-deep" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
