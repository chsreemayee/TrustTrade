"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  BookOpen,
  TrendingUp,
  Target,
  ArrowRight,
  Volume2,
  CheckCircle2,
} from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { TrustButton } from "../TrustButton";

interface L2SpokenTourProps {
  onFinishTour: () => void;
}

export const L2SpokenTour: React.FC<L2SpokenTourProps> = ({ onFinishTour }) => {
  const { t, speak, isSpeaking } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps = [
    {
      title: t("l2_tour.step1_title"),
      desc: t("l2_tour.step1_desc"),
      icon: <ShieldAlert size={40} className="text-teal-deep" />,
      colorClass: "border-teal-deep bg-teal-light/40",
    },
    {
      title: t("l2_tour.step2_title"),
      desc: t("l2_tour.step2_desc"),
      icon: <BookOpen size={40} className="text-teal-deep" />,
      colorClass: "border-teal-deep bg-teal-light/40",
    },
    {
      title: t("l2_tour.step3_title"),
      desc: t("l2_tour.step3_desc"),
      icon: <TrendingUp size={40} className="text-marigold" />,
      colorClass: "border-marigold bg-marigold-light",
    },
    {
      title: t("l2_tour.step4_title"),
      desc: t("l2_tour.step4_desc"),
      icon: <Target size={40} className="text-teal-deep" />,
      colorClass: "border-teal-deep bg-teal-light/40",
    },
  ];

  const current = tourSteps[currentStep];

  useEffect(() => {
    // Speak the current step aloud
    speak(`${current.title}. ${current.desc}`);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onFinishTour();
    }
  };

  return (
    <div className="flex flex-col justify-between min-h-[720px] p-4 bg-cream">
      {/* Top Bar with Skip Tour */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[15px] font-bold text-charcoal-secondary">
          {currentStep + 1} / {tourSteps.length}
        </span>
        <button
          onClick={onFinishTour}
          className="text-[16px] font-semibold text-teal-deep px-3 py-1.5 rounded-full hover:bg-cream-dark"
        >
          {t("l2_tour.skip")}
        </button>
      </div>

      {/* Main Highlighted Step Card */}
      <div className="my-auto flex flex-col items-center text-center">
        <div
          className={`w-28 h-28 rounded-full border-4 flex items-center justify-center mb-6 shadow-card transition-all ${current.colorClass}`}
        >
          {current.icon}
        </div>

        <h2 className="text-title text-charcoal mb-2 font-bold">{current.title}</h2>
        <p className="text-body text-charcoal-secondary max-w-[300px] leading-relaxed">
          {current.desc}
        </p>

        {/* Listen again button */}
        <button
          onClick={() => speak(`${current.title}. ${current.desc}`)}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border text-teal-deep font-semibold text-[15px] shadow-sm hover:bg-cream-dark"
        >
          <Volume2 size={20} />
          <span>{t("common.listen")}</span>
        </button>
      </div>

      {/* Step Indicators & Actions */}
      <div className="flex flex-col gap-4 pb-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {tourSteps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2.5 rounded-full transition-all ${
                idx === currentStep
                  ? "w-8 bg-teal-deep"
                  : "w-2.5 bg-border-dark"
              }`}
            />
          ))}
        </div>

        <TrustButton
          variant="primary"
          label={
            currentStep === tourSteps.length - 1
              ? t("l2_tour.finish")
              : t("common.next")
          }
          icon={
            currentStep === tourSteps.length - 1 ? (
              <CheckCircle2 size={24} />
            ) : (
              <ArrowRight size={24} />
            )
          }
          onClick={handleNext}
          speechText={
            currentStep === tourSteps.length - 1
              ? t("l2_tour.finish")
              : t("common.next")
          }
        />
      </div>
    </div>
  );
};
