"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Clock, ShieldCheck, Loader2 } from "lucide-react";
import { useI18n } from "../../lib/i18n";

interface L7CheckingProps {
  onComplete: () => void;
}

export const L7Checking: React.FC<L7CheckingProps> = ({ onComplete }) => {
  const { t, speak } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    t("l7_checking.step_extract"),
    t("l7_checking.step_sebi"),
    t("l7_checking.step_rules"),
    t("l7_checking.step_upi"),
    t("l7_checking.step_done"),
  ];

  useEffect(() => {
    speak(t("l7_checking.title"));

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 600);
          return prev;
        }
      });
    }, 700);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] p-4 bg-cream">
      {/* Animated Center Icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-teal-light text-teal-deep flex items-center justify-center shadow-card animate-pulse">
          <ShieldCheck size={52} strokeWidth={2.2} />
        </div>
      </div>

      <h2 className="text-title text-charcoal mb-2 text-center">
        {t("l7_checking.title")}
      </h2>

      {/* Progress check steps ticking in */}
      <div className="w-full max-w-sm bg-white rounded-card p-5 border border-border shadow-card mt-4 flex flex-col gap-3">
        {steps.map((stepText, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                isDone
                  ? "text-teal-deep font-semibold"
                  : isCurrent
                  ? "text-charcoal font-bold bg-cream"
                  : "text-charcoal-secondary opacity-40"
              }`}
            >
              <div className="flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 size={24} className="text-verdict-no_signs-text" />
                ) : isCurrent ? (
                  <Loader2 size={24} className="text-teal-deep animate-spin" />
                ) : (
                  <Clock size={24} />
                )}
              </div>
              <span className="text-[16px]">{stepText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
