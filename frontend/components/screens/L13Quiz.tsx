"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { QuizQuestion } from "../../mocks/lessons";
import { TrustButton } from "../TrustButton";
import { api } from "../../lib/api";

interface L13QuizProps {
  questions: QuizQuestion[];
  onFinish: () => void;
  onRetakeLesson: () => void;
}

export const L13Quiz: React.FC<L13QuizProps> = ({
  questions,
  onFinish,
  onRetakeLesson,
}) => {
  const { t, speak, lang } = useI18n();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [badgeUnlocked, setBadgeUnlocked] = useState(false);

  const currentQ = questions[currentIdx];

  const handleSelectOption = (option: any) => {
    if (selectedOptionId !== null) return; // already answered

    setSelectedOptionId(option.id);
    const isCorrect = option.is_correct;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    const feedback =
      option.feedback[lang] || option.feedback.en || (isCorrect ? "Correct!" : "Incorrect.");
    speak(feedback);
  };

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOptionId(null);
    } else {
      // Quiz complete
      setIsFinished(true);

      // Unlock "First Lesson" badge
      await api.unlockBadge("first_lesson");
      setBadgeUnlocked(true);
      speak(t("l13_quiz.badge_earned"));
    }
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-between min-h-[720px] p-4 bg-cream pb-12">
        <div className="my-auto flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-marigold text-charcoal flex items-center justify-center mb-4 shadow-card animate-bounce">
            <Award size={52} />
          </div>

          <h2 className="text-title text-charcoal mb-1">
            {badgeUnlocked ? t("l13_quiz.badge_earned") : "Quiz Complete!"}
          </h2>

          <p className="text-body text-charcoal-secondary mt-1 max-w-[280px]">
            You scored {score} out of {questions.length} questions correctly.
          </p>

          <div className="mt-4 p-3 bg-white rounded-xl border border-border shadow-sm flex items-center gap-2">
            <CheckCircle2 size={24} className="text-verdict-no_signs-text" />
            <span className="font-bold text-[16px] text-charcoal">
              Badge: First Lesson Unlocked!
            </span>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <TrustButton
            variant="primary"
            label={t("l13_quiz.finish_quiz")}
            icon={<CheckCircle2 size={24} />}
            onClick={onFinish}
            speechText={t("l13_quiz.finish_quiz")}
          />
          <TrustButton
            variant="ghost"
            label={t("l13_quiz.retake_lesson")}
            icon={<RotateCcw size={22} />}
            onClick={onRetakeLesson}
            speechText={t("l13_quiz.retake_lesson")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between min-h-screen p-4 pb-20 bg-cream">
      {/* Question Header */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[14px] font-bold text-teal-deep px-3 py-1 bg-teal-light rounded-full">
            {t("l13_quiz.question_counter", {
              current: currentIdx + 1,
              total: questions.length,
            })}
          </span>
          <button
            onClick={() =>
              speak(currentQ.question[lang] || currentQ.question.en)
            }
            className="p-1.5 rounded-full text-teal-deep hover:bg-cream-dark"
          >
            <Volume2 size={22} />
          </button>
        </div>

        <h2 className="text-heading text-charcoal leading-snug mt-2">
          {currentQ.question[lang] || currentQ.question.en}
        </h2>
      </div>

      {/* Answer Options */}
      <div className="flex flex-col gap-3 my-auto">
        {currentQ.options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          const showResult = selectedOptionId !== null;

          let btnClass = "bg-white border-border hover:border-teal-deep text-charcoal";
          if (showResult) {
            if (opt.is_correct) {
              btnClass = "bg-verdict-no_signs-bg border-verdict-no_signs-border text-verdict-no_signs-text font-bold";
            } else if (isSelected) {
              btnClass = "bg-verdict-scam-bg border-verdict-scam-border text-verdict-scam-text font-bold";
            }
          }

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectOption(opt)}
              disabled={selectedOptionId !== null}
              className={`min-h-[64px] p-4 rounded-btn border-2 text-left flex items-center justify-between transition-all shadow-card active:scale-[0.98] ${btnClass}`}
            >
              <span className="text-[17px] leading-snug pr-2">
                {opt.text[lang] || opt.text.en}
              </span>

              {showResult && opt.is_correct && (
                <CheckCircle2 size={26} className="text-verdict-no_signs-text flex-shrink-0" />
              )}
              {showResult && isSelected && !opt.is_correct && (
                <XCircle size={26} className="text-verdict-scam-text flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Next Question Button */}
      {selectedOptionId !== null && (
        <div className="pt-2">
          <TrustButton
            variant="primary"
            label={
              currentIdx === questions.length - 1
                ? t("l13_quiz.finish_quiz")
                : t("l13_quiz.next_question")
            }
            icon={<ArrowRight size={24} />}
            onClick={handleNext}
          />
        </div>
      )}
    </div>
  );
};
